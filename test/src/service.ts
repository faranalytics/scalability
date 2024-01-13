/* eslint-disable @typescript-eslint/no-unused-vars */
import { createWorkerService } from 'scalability';
import { Test } from './index.js';

export class Greeter { // Create a friendly Greeter Application.
    greet(kind: string) {
        for (let now = Date.now(), then = now + 100; now < then; now = Date.now()); // Block for 100 milliseconds.
        return `Hello, ${kind} world!`;
    }
}

const service = createWorkerService();

service.createServiceApp(new Greeter());

const test = service.createServiceAPI<Test>();

console.log(await test.getN());