# *Scalability*

Scalability is a type-safe service scaling facility built on *Network-Services*.

## Introduction

*Scalability* provides a simple and intuitive API for scaling Node.js modules using Worker threads.  You can create a [Service App](https://github.com/faranalytics/network-services#service-app) in your scaled module and call its methods from the main thread using a [Service API](https://github.com/faranalytics/network-services#service-api).  Conversely, methods can be called in the main thread from scaled modules in the same way.

*Scalability* allows you to easily transform your single threaded application into a type-safe multithreaded one.

### Features
- Call methods on a Service App running in a Worker thread using a type-safe API: *code completion*, *parameter types*, and *return types*.
- Return values *and* Errors are marshalled back to the caller.
- Infinite property nesting; you can use a Service API to call *nested* properties on a Service App at any depth.
- Bi-directional asynchronous RPC - communication goes both ways - *Scalability* allows for calls from the main thread to a Worker and from a Worker to the main thread.

## Table of Contents
- [Installation](#installation)
- [Concepts](#concepts)
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

A *Scalability* application consists of a main thread (e.g., `index.js`) and a scaled module (e.g., `service.js`).  In this example the module that runs in the main thread is named `index.js` and the module that will be scaled is named `service.js`.

### Create a `index.ts` module.

This is the module that runs in the main thread.

#### Import the `createService` and `createWorkerPool` helper functions and the ***type*** of the service application (i.e., `Greeter`) that will run in the Worker thread.
```ts
import { createService, createWorkerPool } from 'scalability';
import { Greeter } from './service.js';
```

#### Create a pool of Workers consisting of 10 instances of the `service.js` module.
```ts
const workerPool = createWorkerPool({
    workerCount: 10,
    workerURL: './dist/service.js'
});
```

#### Wait for the Workers to come online.
```ts
await new Promise((r) => workerPool.on('ready', r));
```

#### Create a Service using the `WorkerPool` stream and a Service API of type `Greeter`.
The `greeter` object will support *code completion*, *parameter types*, and *return types*.
```ts
const service = createService(workerPool);
const greeter = service.createServiceAPI<Greeter>();
```

#### Call the `greet` method on the `Greeter` 100 times and log the results.
The `greeter.greet` method returns a promise because it is called asynchronously using a `MessagePort`.
```ts
const results = [];
for (let i = 0; i < 100; i++) {
    results.push(greeter.greet('happy'));
}

const result = await Promise.all(results);
console.log(result);
```

### Create a `service.ts` module.
This is the scaled module specified in the options of the `WorkerPool` constructor.  It contains the `Greeter` Service App.

#### Import the `createPortStream` and `createService` helper functions.
```ts
import { createPortStream, createService } from 'scalability';
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

#### Create a `PortStream` adapter using the `createPortStream` helper function.
This adapter will wrap the Worker thread's `parentPort` in a `stream.Duplex` in order for it be used by *Network-Services*.
```ts
const portStream = createPortStream();
```

#### Create a Service using the portStream and create a Service App using an instance of `Greeter`.
```ts
const service = createService(portStream);
service.createServiceApp(new Greeter());
```

That's all it takes to scale this `Greeter` application.

## API
### scalability.createService(stream)
- `stream` `<WorkerPool | PortStream>` An instance of a `WorkerPool` or an instance of a `PortStream`.  This is a type narrowed version of the *Network-Services* `createService` helper function.  This helper function will accept either a `WorkerPool` or a `PortStream` as an argument, both of which are `stream.Duplex`.
- Returns: `<Service>`

### service.createServiceApp\<T\>(app, options)
- `app` `<object>` An instance of your application.
- `options` `<ServiceAppOptions<T>>`
    - `paths` `<Array<PropPath<Async<T>>>>` An `Array` of *property paths* (i.e., dot-path `string`s).  *If defined*, only property paths in this list may be called on the Service App. Each element of the Array is a `PropPath` and a `PropPath` is simply a dot-path `string` representation of a property path.  **Default:** `undefined`.
- Returns: `<ServiceApp<T>>`

### service.createServiceAPI\<T\>(options)
- `options` `<ServiceAPIOptions>`
    - `timeout` `<number>` Optional argument in milliseconds that specifies the `timeout` for function calls. **Default:** `undefined` (i.e., no timeout).
- Returns: `<Async<T>>` A `Proxy` of type `<T>` that consists of asynchronous analogues of methods in `<T>`.

### scalability.createWorkerPool(options)
- `options` `<WorkerPoolOptions>`
    - `workerCount` `<number>` Optional argument that specifies the number of worker threads to be spawned.
    - `workerURL` `<string | URL>`  The URL or path to the `.js` module file. This is the module that will be scaled according to the value specified for `workerCount`.
    - `restartWorkerOnError` `<boolean>` A boolean setting specifying if Workers should be restarted on `error`. **Default**: `false`
    - `workerOptions` `<worker_threads.WorkerOptions>` Optional `worker_threads.WorkerOptions` to be passed to each Worker instance.
    - `duplexOptions` `<stream.DuplexOptions>` Optional `stream.DuplexOptions` to be passed to the `stream.Duplex` i.e., the parent class of the `WorkerPool`.
- Returns: `<WorkerPool>`

A `WorkerPool` wraps the `MessagePorts` of the Worker threads into a single `stream.Duplex`. Hence, a `WorkerPool` *is a* `stream.Duplex`, so it can be passed to the *Network-Services* `createService` helper function.  This is the stream adapter that is used in the module of the main thread.

### scalability.createPortStream(options)
- `options` `<stream.DuplexOptions>` Optional `stream.DuplexOptions` to be passed to the `stream.Duplex` i.e., the parent class of the `PortStream`.

A `PortStream` wraps the `parentPort` of the Worker thread into a `stream.Duplex`.  Hence, a `PortStream` *is a* `stream.Duplex`, so it can be passed to the *Network-Services* `createService` helper function.  This is the stream adapter that is used in the Worker module.