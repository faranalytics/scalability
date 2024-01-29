import { createPortStream, createService } from 'scalability';
import { MainThreadApp } from './index.js';

export class Greeter { // Create a friendly Greeter Application.
    greet(kind: string) {
        for (let now = Date.now(), then = now + 100; now < then; now = Date.now()); // Block for 100 milliseconds.
        return `Hello, ${kind} world!`;
    }
}

const portStream = createPortStream();

const service = createService(portStream);
service.createServiceApp(new Greeter());

const app = service.createServiceAPI<MainThreadApp>();

console.log(await app.getNumber());
