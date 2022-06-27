import getRpcClient from "../client";
import { Server } from "../server";
import { Service } from "./service";

class ServiceImpl implements Service {
    getCurrentDate(): Date {
        return new Date();
    }
    toUpper(data: string): string {
        return data.toUpperCase();
    }
    multiply(a: number, b: number): number {
        return a * b;
    }
    sleep(ms: number): Promise<{start: number, end: number}> {
        return new Promise(resolve => {
            const start = new Date().valueOf();
            setTimeout(() => {
                resolve({ start, end: new Date().valueOf() });
            }, ms);
        });
    }
}

const server = new Server(new ServiceImpl());
server.listen(3000, {
    middleware: [
        (req, res, next) => {
            console.log(req.url);
            next();
        },
        (req, res, next) => {
            if (req.headers['authorization'] !== 'secret') {
                return next('Unauthorized');
            }

            next();
        },
        (req, res, next) => {
            console.log('Last middleware');
            next();
        }
    ]
});

const client = getRpcClient<Service>('http://localhost:3000');
client.setHeader('Authorization', 'secret');

async function start() {
    const date = await client.getCurrentDate();
    // ISSUE: date is a string :/
    console.log(typeof date, date);

    const upper = await client.toUpper("hello");
    console.log(typeof upper, upper);

    const foo = await client.multiply(2, 3);
    console.log(typeof foo, foo);

    const a = await client.sleep(1000);
    console.log(typeof a, a);
}

start().catch(err => {
    console.error(err.message);
});