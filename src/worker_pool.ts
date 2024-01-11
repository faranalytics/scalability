import * as threads from "node:worker_threads";
import * as stream from "node:stream";
import { CallMessage, ResultMessage } from "network-services";

export interface WorkerPoolOptions {
    workerCount: number;
    workerURL: string | URL;
    workerOptions?: threads.WorkerOptions;
}

export class WorkerPool extends stream.Duplex {
    static $data = Symbol('data');

    public messageQueue: Array<CallMessage | ResultMessage> = [];
    public workers: Array<threads.Worker> = [];

    constructor(workerPoolOptions: WorkerPoolOptions, workerOptions?: threads.WorkerOptions, duplexOptions?: stream.DuplexOptions) {
        super({ ...duplexOptions, ...{ objectMode: true } });

        for (let i = 0; i < workerPoolOptions.workerCount; i++) {
            const worker = new threads.Worker(workerPoolOptions.workerURL, workerOptions);
            worker.on('message', (message: CallMessage | ResultMessage) => {
                this.messageQueue.push(message);
                this.emit(WorkerPool.$data);
            });
            this.workers.push(worker);
        }
    }

    async _write(chunk: CallMessage | ResultMessage, encoding: BufferEncoding, callback: (error?: Error | null) => void): Promise<void> {
        try {
            const worker = this.workers.shift();
            if (worker) {
                await new Promise<null>((r, j) => {
                    worker.once('messageerror', j);
                    worker.postMessage(chunk);
                    worker.removeListener('messageerror', j);
                    r(null);
                });
                callback();
                this.workers.push(worker);
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
                if (!this.push(message)) {
                    break;
                }
            }
        }
        else {
            this.once(WorkerPool.$data, () => {
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
