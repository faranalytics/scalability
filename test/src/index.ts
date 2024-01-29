import { createService, WorkerPoolStreamAdapter } from 'scalability';
import { Greeter } from './service.js';

export class MainThreadApp {
    public n: number = 1;
    getNumber(): number {
        return this.n++;
    }
}

const workerPoolStream = new WorkerPoolStreamAdapter({
    workerCount: 1,
    workerURL: './dist/service.js'
});

const app = new MainThreadApp();
const service = createService(workerPoolStream);
service.createServiceApp<MainThreadApp>(app);

// eslint-disable-next-line @typescript-eslint/no-misused-promises
workerPoolStream.on('ready', async () => {

    const greeter = service.createServiceAPI<Greeter>();

    const results = [];
    for (let i = 0; i < 1; i++) {
        results.push(greeter.greet('happy'));
    }

    console.time('test');
    const result = await Promise.all(results);
    console.log(result);
    console.timeEnd('test');


});




