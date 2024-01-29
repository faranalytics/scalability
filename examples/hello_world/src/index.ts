import { createService, createWorkerPool } from 'scalability';
import { Greeter } from './service.js';

const workerPool = createWorkerPool({
    workerCount: 10,
    workerURL: './dist/service.js'
});

await new Promise((r) => workerPool.on('ready', r));

const service = createService(workerPool);

const greeter = service.createServiceAPI<Greeter>();

const results = [];
for (let i = 0; i < 10; i++) {
    results.push(greeter.greet('happy'));
}

const result = await Promise.all(results);
console.log(result);




