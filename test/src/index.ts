import { once } from 'node:events';
import { createService, createWorkerPool } from 'scalability';
import { Greeter } from './service.js';

export class MainThreadApp {
    public n: number = 1;
    getNumber(): number {
        return this.n++;
    }
}

const workerPool = createWorkerPool({
    workerCount: 10,
    workerURL: './dist/service.js'
});

await once (workerPool, 'ready');

const app = new MainThreadApp();
const service = createService(workerPool);
service.createServiceApp<MainThreadApp>(app);

const greeter = service.createServiceAPI<Greeter>();

const results = [];
for (let i = 0; i < 10; i++) {
    results.push(greeter.greet('happy'));
}

console.time('test');
const result = await Promise.all(results);
console.log(result);
console.timeEnd('test');




