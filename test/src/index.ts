import { createServicePool } from 'scalability';
import { Greeter } from './service.js';

const service = await createServicePool({
    workerCount: 1,
    workerURL: './dist/service.js'
});

const greeter = service.createServiceAPI<Greeter>();

const results = [];
for (let i = 0; i < 10; i++) {
    results.push(greeter.greet('happy'));
}

console.time('test');
const result = await Promise.all(results);
console.log(result);
console.timeEnd('test');
