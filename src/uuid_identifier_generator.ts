import * as crypto from "node:crypto";
import { IdentifierGenerator } from "network-services";

export class UUIDIdentifierGenerator implements IdentifierGenerator {
    getIdentifier(): string {
        return crypto.randomUUID();
    }
}