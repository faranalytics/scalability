import { Async, Service, ServiceAPIOptions } from "network-services";
import { UUIDIdentifierGenerator } from "./uuid_identifier_generator.js";
import { WorkerPool } from "./worker_pool.js";
import { PortStream } from "./port_stream.js";

export class ScalableService extends Service {

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public createServiceAPI<T extends object>(options?: ServiceAPIOptions): Async<T> {
        return super.createServiceAPI<T>({...options, ...{ identifierGenerator: new UUIDIdentifierGenerator() }});
    }
}
export function createService(stream: WorkerPool | PortStream): Service {
    return new ScalableService(stream);
}