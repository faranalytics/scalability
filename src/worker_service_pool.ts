import * as threads from "node:worker_threads";
import * as stream from "node:stream";
import { CallMessage, ResultMessage, Service, createService } from "network-services";

export interface WorkerServicePoolOptions {
    workerCount: number;
    workerURL: string | URL;
    workerOptions?: threads.WorkerOptions;
    duplexOptions?: stream.DuplexOptions;
}

export const $data = Symbol('data');
export const $ready = Symbol('ready');
export const $messageQueue = Symbol('messageQueue');
export const $workers = Symbol('workers');
export const $callRegistrar = Symbol('callRegistrar ');

export class WorkerServicePool extends stream.Duplex {

    public [$ready]: Promise<Array<threads.Worker>>;
    public [$messageQueue]: Array<CallMessage | ResultMessage> = [];
    public [$workers]: Array<threads.Worker> = [];
    public [$callRegistrar]: Map<string, threads.Worker>;

    constructor(workerPoolOptions: WorkerServicePoolOptions) {
        super({ ...workerPoolOptions.duplexOptions, ...{ objectMode: true } });

        this[$callRegistrar] = new Map<string, threads.Worker>();

        const workers: Array<Promise<threads.Worker>> = [];
        for (let i = 0; i < workerPoolOptions.workerCount; i++) {
            workers.push(new Promise<threads.Worker>((r, e) => {
                const worker = new threads.Worker(workerPoolOptions.workerURL, workerPoolOptions.workerOptions);
                worker.on('message', (message: CallMessage | ResultMessage) => {
                    if (message.type === 0) { // A CallMessage was sent by a Worker.
                        this[$callRegistrar].set(message.id, worker);
                    }
                    this[$messageQueue].push(message);
                    this.emit($data);
                });
                worker.once('error', e);
                worker.once('online', () => {
                    worker.removeListener('error', e);
                    r(worker);
                });
                this[$workers].push(worker);
            }));
        }
        this[$ready] = Promise.all(workers);
    }

    async _write(chunk: CallMessage | ResultMessage, encoding: BufferEncoding, callback: (error?: Error | null) => void): Promise<void> {
        // The Mux writes data to the stream.Duplex.
        try {
            let worker: threads.Worker | undefined;

            if (chunk.type == 1 || chunk.type == 2) { // A ResultMessage returned to a Worker.
                worker = this[$callRegistrar].get(chunk.id);
                this[$callRegistrar].delete(chunk.id);
            }
            else {
                worker = this[$workers].shift();
            }

            if (worker) {
                this[$workers].push(worker);
                await new Promise<null>((r, j) => {
                    if (worker) {
                        worker.once('messageerror', j);
                        worker.postMessage(chunk);
                        worker.removeListener('messageerror', j);
                    }
                    r(null);
                });
                callback();
            }
        }
        catch (err) {
            callback(err instanceof Error ? err : undefined);
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _read(size: number): void {
        // The Mux listens for `data` events and reads data from the stream.Duplex.
        if (this[$messageQueue].length) {
            while (this[$messageQueue].length) {
                const message = this[$messageQueue].shift();
                if (!this.push(message)) { // Push the message to the Mux.
                    break;
                }
            }
        }
        else {
            this.once($data, () => {
                while (this[$messageQueue].length) {
                    const message = this[$messageQueue].shift();
                    if (!this.push(message)) {
                        break;
                    }
                }
            });
        }
    }
}

export async function createServicePool(workerPoolOptions: WorkerServicePoolOptions): Promise<Service> {
    const pool = new WorkerServicePool(workerPoolOptions);
    await pool[$ready];
    return createService(pool);
}
