import { Application } from 'express';
import { createServer, IncomingMessage, ServerResponse } from 'http';

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

    private requestHandler(req: IncomingMessage, res: ServerResponse) {
        res.setHeader('Content-Type', 'application/json');
        if (req.method !== 'POST') {
            res.statusCode = 405;
            return res.end(JSON.stringify({ error: 'Method not allowed' }));
        }

        if (req.headers['content-type'] !== 'application/json') {
            res.statusCode = 415;
            return res.end(JSON.stringify({ error: 'Unsupported media type' }));
        }

        let body = '';

        req.on('data', chunk => {
            body += chunk.toString(); // convert Buffer to string
        });

        req.on('end', async () => {
            // parse body
            const request = JSON.parse(body);
            const { method, params } = request;

            // call method
            try {
                const result = await this.call(method, ...params);
                res.statusCode = 200;
                res.end(JSON.stringify({ result }));
            } catch (error: any) {
                res.statusCode = 500;
                return res.end(JSON.stringify({ error: error.message }));
            }
        });
    }

    listen(port: number) {
        const server = createServer((req, res) => {
            this.requestHandler(req, res);
        });

        server.listen(port);
    }

    mount(path: string, server: Application) {
        server.use(path, (req, res) => {
            this.requestHandler(req, res);
        });
    }
}