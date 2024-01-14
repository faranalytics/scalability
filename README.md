# *Scalability*

Scalability is a type-safe service scaling facility built on *[Network-Services]*(https://github.com/faranalytics/network-services).

## Introduction

Scalability provides a simple and intuitive interface for scaling Node.js modules using Worker threads.

### Features
- Call methods on a Service App running in a Worker thread using a type-safe API: *code completion*, *parameter types*, and *return types*.
- Return values *and* Errors are marshalled back to the caller.
- Infinite property nesting; you can use a Service API to call *nested* properties on a Service App at any depth.
- Bi-directional asynchronous RPC - communication goes both ways - a Worker thread can create a Service API and can call functions in the main thread.

## Usage

A Scalability application consists of a main thread (e.g., `index.js`) and a scaled module (e.g., `service.js`).  In this example the module that runs in the main thread is `index.js` and the module that will be scaled is named `service.js`.

### Create `index.ts`.
This is the module that runs in the main thread.
#### Import the `createServicePool` helper function and the type of the service application that will run in the Worker thread.
```ts
import { createServicePool } from 'scalability';
import { Greeter } from './service.js';
```
#### Create a service pool consisting of 10 instances of the `Greeter` class.
```ts
const service = await createServicePool({
    workerCount: 10,
    workerURL: './dist/service.js'
});
```
#### Create a Greeter Service API of type `Greeter`.
```ts
const greeter = service.createServiceAPI<Greeter>();
```
#### Call the `greet` method on the `Greeter` 10 times and log the results.
```ts
const results = [];
for (let i = 0; i < 10; i++) {
    results.push(greeter.greet('happy'));
}

console.log(await Promise.all(results));
```

Each call to `Greeter.greet` will run in a one of the 10 Worker thread.

### Create `service.ts`.
This is the module that will be scaled.

#### Import the `createWorkerService` helper function
```ts
import { createWorkerService } from 'scalability';
```
#### Create a `Greeter` service.
```ts
export class Greeter { // Create a friendly Greeter Application.
    greet(kind: string) {
        for (let now = Date.now(), then = now + 100; now < then; now = Date.now()); // Block for 100 milliseconds.
        return `Hello, ${kind} world!`;
    }
}
```
#### Create a use the `createWorkerService` helper function in order to create a Service.
```ts
const service = createWorkerService();
```
#### Create a Service Application using an instance of `Greeter`.
```ts
service.createServiceApp(new Greeter());
```

