import * as stream from "node:stream";
import { Service, ServiceAPIOptions, Async } from "network-services";
import { WorkerPort } from "./worker_port";
import { UUIDIdentifierGenerator } from "./uuid_identifier_generator";

export class WorkerService extends Service {

    constructor(stream: stream.Duplex) {
        super(stream, {});
    }

    public createServiceAPI<T extends object>(options?: ServiceAPIOptions): Async<T> {
        return super.createServiceAPI({ ...options, ...{ identifierGenerator: new UUIDIdentifierGenerator() } });
    }
}

export function createWorkerService(): Service {
    const workerPort = new WorkerPort();
    return new WorkerService(workerPort);
}