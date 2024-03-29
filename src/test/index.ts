import { Server, getRpcClient } from "..";
import { Archive } from "./archive";
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
    sleep(ms: number): Promise<{ start: number, end: number }> {
        return new Promise(resolve => {
            const start = new Date().valueOf();
            setTimeout(() => {
                resolve({ start, end: new Date().valueOf() });
            }, ms);
        });
    }
    createArchive(name: string): Archive {
        return new Archive(name);
    }
    createArchives(name: string): [Archive, Archive, Archive] {
        return [new Archive(name + 1), new Archive(name + 2), new Archive(name + 3)];
    }
    addDocument(archive: Archive, document: string): Archive {
        archive.addDocument(document);
        return archive;
    }
}

const server = new Server(new ServiceImpl());
server.listen(3000, {
    middleware: [
        (req, res, next) => {
            if (req.headers['authorization'] !== 'secret') {
                return next('Unauthorized');
            }

            next();
        }
    ]
});

const client = getRpcClient<Service>('http://localhost:3000');
client.setHeader('Authorization', 'secret');

async function start() {
    const archives = await client.createArchives('bar');
    console.log(typeof archives, archives.constructor.name, archives);
    console.log(archives[0].getName(), archives[1].getName(), archives[2].getName());

    const date = await client.getCurrentDate();
    console.log(typeof date, date.constructor.name, date);
    console.log(date.getFullYear());

    const upper = await client.toUpper("hello");
    console.log(typeof upper, upper.constructor.name, upper);
    console.log(upper.startsWith("HELLO"));

    const foo = await client.multiply(2, 3);
    console.log(typeof foo, foo.constructor.name, foo);
    console.log(foo.toFixed(2));

    const a = await client.sleep(1000);
    console.log(typeof a, a.constructor.name, a);
    console.log(a.start, a.end);

    const archive = await client.createArchive('foo');
    console.log(typeof archive, archive.constructor.name, archive);
    console.log(archive.getName());

    const mutedArchive = await client.addDocument(archive, 'muted');
    console.log(typeof mutedArchive, mutedArchive.constructor.name, mutedArchive);
    console.log(mutedArchive.getName());
    console.log(mutedArchive.has('muted'));
}
start().catch(err => {
    console.error(err.message);
}).finally(() => {
    server.close();
});