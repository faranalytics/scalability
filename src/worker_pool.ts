import * as threads from "node:worker_threads";
import * as stream from "node:stream";
import { createService, Service, CallMessage, ResultMessage } from "network-services";

export interface WorkerPoolOptions {
    workerCount: number;
    workerURL: string | URL;
    workerOptions?: threads.WorkerOptions;
}

const $data = Symbol('data');
const $ready = Symbol('ready');

export class WorkerPool extends stream.Duplex {

    public messageQueue: Array<CallMessage | ResultMessage> = [];
    public workers: Array<threads.Worker> = [];
    public [$ready]: Promise<Array<threads.Worker>>;

    constructor(workerPoolOptions: WorkerPoolOptions, workerOptions?: threads.WorkerOptions, duplexOptions?: stream.DuplexOptions) {
        super({ ...duplexOptions, ...{ objectMode: true } });

        const workers: Array<Promise<threads.Worker>> = [];
        for (let i = 0; i < workerPoolOptions.workerCount; i++) {
            workers.push(new Promise<threads.Worker>((r, e) => {
                const worker = new threads.Worker(workerPoolOptions.workerURL, workerOptions);
                worker.on('message', (message: CallMessage | ResultMessage) => {
                    this.messageQueue.push(message);
                    this.emit($data);
                });
                worker.once('error', e);
                worker.once('online', ()=>{
                    worker.removeListener('error', e);
                    r(worker);
                });
                this.workers.push(worker);
            }));
        }
        this[$ready] = Promise.all(workers);
    }

    async _write(chunk: CallMessage | ResultMessage, encoding: BufferEncoding, callback: (error?: Error | null) => void): Promise<void> {
        try {
            const worker = this.workers.shift();
            if (worker) {
                this.workers.push(worker);
                await new Promise<null>((r, j) => {
                    worker.once('messageerror', j);
                    worker.postMessage(chunk);
                    worker.removeListener('messageerror', j);
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
        if (this.messageQueue.length) {
            while (this.messageQueue.length) {
                const message = this.messageQueue.shift();
                if (!this.push(message)) { // Push the message to the Mux.
                    break;
                }
            }
        }
        else {
            this.once($data, () => {
                while (this.messageQueue.length) {
                    const message = this.messageQueue.shift();
                    if (!this.push(message)) {
                        break;
                    }
                }
            });
        }
    }
}


export async function createServicePool(workerPoolOptions: WorkerPoolOptions, workerOptions?: threads.WorkerOptions, duplexOptions?: stream.DuplexOptions): Promise<Service> {
    const pool = new WorkerPool(workerPoolOptions, workerOptions, duplexOptions);
    await pool[$ready];
    return createService(pool);
}