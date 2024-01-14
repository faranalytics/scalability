import * as stream from "node:stream";
import { Service, ServiceOptions, MuxOptions, ServiceAPIOptions, Async } from "network-services";
import { WorkerPort } from "./worker_port";
import { UUIDIdentifierGenerator } from "./uuid_identifier_generator";

export class WorkerService extends Service {

    constructor(stream: stream.Duplex, options?: ServiceOptions & MuxOptions) {
        super(stream, options);
    }

    public createServiceAPI<T extends object>(options?: ServiceAPIOptions): Async<T> {
        return super.createServiceAPI({ ...options, ...{ identifierGenerator: new UUIDIdentifierGenerator() } });
    }
}

export function createWorkerService(options?: ServiceOptions & MuxOptions): Service {
    const workerPort = new WorkerPort();
    return new WorkerService(workerPort, options);
}