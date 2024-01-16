import { createService } from 'scalability';
import { Greeter } from './service.js';

const service = await createService({
    workerCount: 10,
    workerURL: './dist/service.js'
});

const greeter = service.createServiceAPI<Greeter>();

export class Test {
    public n: number = 1;
    getN(): number {
        return this.n++;
    }
}

const test = new Test();

service.createServiceApp<Test>(test);

const results = [];
for (let i = 0; i < 100; i++) {
    results.push(greeter.greet('happy'));
}

console.time('test');
const result = await Promise.all(results);
console.log(result);
console.timeEnd('test');
