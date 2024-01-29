import { Async, MuxOptions, Service, ServiceAPIOptions, ServiceOptions } from "network-services";
import { UUIDIdentifierGenerator } from "./uuid_identifier_generator.js";
import * as stream from "stream";

export class ScalableService extends Service {

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public createServiceAPI<T extends object>(options?: ServiceAPIOptions): Async<T> {
        return super.createServiceAPI<T>({...options, ...{ identifierGenerator: new UUIDIdentifierGenerator() }});
    }
}
export function createService(stream: stream.Duplex, options?: ServiceOptions & MuxOptions): ScalableService {
    return new ScalableService(stream, options);
}