import { createService, WorkerPool } from 'scalability';
import { Greeter } from './service.js';

const pool = new WorkerPool({
    workerCount: 2,
    workerURL: './dist/service.js'
});

const service = createService(pool);

const greeter = service.createServiceAPI<Greeter>();

const result = await greeter.greet('happy');

console.log(result);
