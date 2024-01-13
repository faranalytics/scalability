/* eslint-disable @typescript-eslint/no-unused-vars */
import { createService, WorkerPort } from 'scalability';

export class Greeter { // Create a friendly Greeter Application.
    greet(kind: string) {
        for (let now = Date.now(), then = now + 100; now < then; now = Date.now()); // Block for 100 milliseconds.
        return `Hello, ${kind} world!`;
    }
}

const workerPort = new WorkerPort();

const service = createService(workerPort);

service.createServiceApp(new Greeter());