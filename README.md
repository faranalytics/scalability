# *Scalability*

*Scalability* is a type-safe service scaling facility built on [*Network-Services*](https://github.com/faranalytics/network-services).

## Introduction

*Scalability* provides a simple and intuitive API for scaling Node.js modules using Worker threads.  You can create a [Service App](https://github.com/faranalytics/network-services#service-app) in your scaled module and call its methods from the main thread using a [Service API](https://github.com/faranalytics/network-services#service-api).  

*Scalability* allows you to easily transform your single threaded application into a type-safe multithreaded one.

### Features
- Call methods on a Service App running in a Worker thread using a type-safe API: *code completion*, *parameter types*, and *return types*.
- Return values *and* Errors are marshalled back to the caller.
- Infinite property nesting; you can use a Service API to call *nested* properties on a Service App at any depth.
- Bi-directional asynchronous RPC - communication goes both ways - *Scalability* allows for calls from the main thread to a Worker and from a Worker to the main thread.

## Table of Contents
- [Installation](#installation)
- [Concepts](#concepts)
    - [Service](https://github.com/faranalytics/network-services#service)
    - [Service App](https://github.com/faranalytics/network-services#service-app)
    - [Service API](https://github.com/faranalytics/network-services#service-api)
- [Usage](#usage)
- [API](#api)

## Installation
```bash
npm install scalability
```
## Concepts
*Scalability* is an extension of the *Network-Services* RPC Service facility; hence, the concepts that it introduces are *Network-Services* concepts e.g., [Services](https://github.com/faranalytics/network-services#service), [Service Apps](https://github.com/faranalytics/network-services#service-app), and [Service APIs](https://github.com/faranalytics/network-services#service-api).

Please see the [*Network-Services*](https://github.com/faranalytics/network-services#concepts) documentation if you would like to learn more about these concepts. 

## Usage

A *Scalability* application consists of a main thread (e.g., `index.js`) and a scaled module (e.g., `service.js`).  In this example the module that runs in the main thread is `index.js` and the module that will be scaled is named `service.js`.

### Create `index.ts`.
This is the module that runs in the main thread.
#### Import the `createService` helper function and the ***type*** of the service application that will run in the Worker thread.
```ts
import { createService } from 'scalability';
import { Greeter } from './service.js';
```
#### Create a Service pool consisting of 10 instances of the `service.js` module, each running in a Worker thread.
```ts
const service = await createService({
    workerCount: 10,
    workerURL: './dist/service.js'
});
```
#### Create a Greeter Service API of type `Greeter`.
```ts
const greeter = service.createServiceAPI<Greeter>();
```
#### Call the `greet` method on the `Greeter` 100 times and log the results.
The `Greeter.greet` method returns a promise because it is called asynchronously using a `MessagePort`.
```ts
const results = [];
for (let i = 0; i < 100; i++) {
    results.push(greeter.greet('happy'));
}

console.log(await Promise.all(results));
```
Each call to `Greeter.greet` will run in a one of the 10 spawned Worker threads.

### Create `service.ts`.
This is the scaled module specified in the options of the `createService` helper function.  It contains the `Greeter` Service App.  The `createService` helper function will create 10 instances of `service.js`.

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
#### Use the `createWorkerService` helper function in order to create a Service.
```ts
const service = createWorkerService();
```
#### Create a Service Application using an instance of `Greeter`.
```ts
service.createServiceApp(new Greeter());
```
## API
### scalability.createService(options)
- `options` `<WorkerPoolOptions>`
    - `workerCount` `<number>` The number of worker threads to be spawned.
    - `workerURL` `<string>` or `<URL>` The URL or path to the `.js` module file.  This is the module that will be scaled according to the value specified for `workerCount`.
    - `restartWorkerOnError` `<boolean>` Optionally restart Workers that emit an `error`. **Default:** `false`
    - `workerOptions`: `<threads.WorkerOptions>` Optional `worker_threads.WorkerOptions` to be passed to the `worker_threads.Worker` constructor.
- Returns: `Promise<Service>`

Use the `createService` helper function *in the main thread* in order to create a pool of Workers.

### scalability.createWorkerService()
- Returns: `<Service>`

Use the `createWorkerService` helper function *in a Woker thread* to create a Service.

### service.createServiceApp\<T\>(app, options)
- `app` `<object>` An instance of your application.
- `options` `<ServiceAppOptions<T>>`
    - `paths` `<Array<PropPath<Async<T>>>>` An `Array` of *property paths* (i.e., dot-path `string`s).  *If defined*, only property paths in this list may be called on the Service App. Each element of the Array is a `PropPath` and a `PropPath` is simply a dot-path `string` representation of a property path.  **Default:** `undefined`.
- Returns: `<ServiceApp<T>>`

### service.createServiceAPI\<T\>(options)
- `options` `<ServiceAPIOptions>`
    - `timeout` `<number>` Optional argument in milliseconds that specifies the `timeout` for function calls. **Default:** `undefined` (i.e., no timeout).
- Returns: `<Async<T>>` A `Proxy` of type `<T>` that consists of asynchronous analogues of methods in `<T>`.