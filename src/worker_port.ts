import * as threads from "node:worker_threads";
import * as stream from "node:stream";
import { CallMessage, ResultMessage } from "network-services";

export class WorkerPort extends stream.Duplex {
    static $data = Symbol('data');

    public port?: threads.MessagePort;
    public messageQueue: Array<CallMessage | ResultMessage> = [];
    
    constructor(options?: stream.DuplexOptions) {
        super({ ...options, ...{ objectMode: true } });
        if (threads.parentPort) {
            this.port = threads.parentPort;
            this.port.on('message', (message: CallMessage | ResultMessage) => {
                this.messageQueue.push(message);
                this.emit(WorkerPort.$data);
            });
        }
    }

    async _write(chunk: CallMessage | ResultMessage, encoding: BufferEncoding, callback: (error?: Error | null) => void): Promise<void> {
        try {
            await new Promise<null>((r, j) => {
                this.port?.once('messageerror', j);
                this.port?.postMessage(chunk);
                this.port?.removeListener('messageerror', j);
                r(null);
            });
            callback();
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
            this.once(WorkerPort.$data, () => {
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