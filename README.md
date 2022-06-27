# node-rpc

This project is a small solution for remote procedure calls in typescript projects.

The project comes with a server and a client implementation, which can be customized. The contract is a typescript interface.

The advantages of this project are:
- Service definition is done in typescript without generation of code
- No need to install any dependencies (you may use it with `express`)

Because of its lightweight nature, the project comes with some disadvantages too:
- Currently only HTTP as transfer protocol is supported
- No typechecking at runtime

## Usage

### The service contract

```typescript
// file: service.ts

export interface Service {
  toUpper(data: string): string;
  multiply(a: number, b: number): number;
  sleep(ms: number): Promise<void>;
}
```

### The server

```typescript
// file: server.ts
import { Server } from 'node-rpc';
import { Service } from './service';

// create a new service instance
class ServiceImpl implements Service {
    toUpper(data: string): string {
        return data.toUpperCase();
    }
    multiply(a: number, b: number): number {
        return a * b;
    }
    sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Create a new server with the given service implementation
const server = new Server(new ServiceImpl());

// Start the server and listen on port 3000
// You can add middleware to the server to handle requests
server.listen(3000, {
    middleware: [
        (req, res, next) => {
            console.log(req.url);
            next();
        },
        (req, res, next) => {
            if (req.headers['authorization'] !== 'secret') {
                // Do not forward to the implementation. Instead end the request.                
                return next('Unauthorized');
            }

            next();
        }
    ]
});
```
### The client

```typescript
// file: client.ts
import { getRpcClient } from 'node-rpc';
import { Service } from './service';

const client = getRpcClient<Service>('http://localhost:3000');

const result = await client.toUpper('hello');
console.log(result); // HELLO

await client.sleep(1000); // wait 1 second

const result2 = await client.multiply(2, 3);
console.log(result2); // 6
```

## Some notes
As you can see in the example, the client resolves all promises and wraps the result in a promise.

So even if you have a promise as a result, you dont need to wait for the second promise.
