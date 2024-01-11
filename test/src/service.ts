/* eslint-disable @typescript-eslint/no-unused-vars */
import { createService, WorkerPort } from 'scalability';

export class Greeter { // Create a friendly Greeter Application.
    greet(kind: string) {
        return `Hello, ${kind} world!`;
    }
}

const workerPort = new WorkerPort();

const service = createService(workerPort);

service.createServiceApp(new Greeter());