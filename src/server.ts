import {createServer} from 'http';

export class Server<T> {
    constructor(private implementation: T) {

    }

    async call(method: keyof T, ...params: any[]) {
        const property = this.implementation[method];

        if (typeof property === "function") {
            return await property.apply(this.implementation, params);
        }

        return await this.implementation[method];
    }

    listen(port: number) {
        const server = createServer((req, res) => {


        });
        server.listen(port);
    }
}