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
    sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

const server = new Server(new ServiceImpl());
server.listen(3000);
const client = getRpcClient<Service>('http://localhost:3000');

async function start() {
    const date = await client.getCurrentDate();
    console.log(date);

    const upper = await client.toUpper("hello");
    console.log(upper);

    const foo = await client.multiply(2, 3);
    console.log(foo);

    const a = await client.sleep(1000);
    console.log('done waiting');
}

start();