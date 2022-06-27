import { Application, RequestHandler } from 'express';
import { createServer, IncomingMessage, ServerResponse } from 'http';

type HttpRequestHandler = (req: IncomingMessage, res: ServerResponse, next: (value?: any) => void) => void;

type HttpOptions = {
    middleware: HttpRequestHandler[];
}

type ExpressOptions = {
    middleware: RequestHandler[];
};

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

    listen(port: number, options?: Partial<HttpOptions>) {
        const middleware = options?.middleware ?? [];
        const server = createServer((req, res) => {
            const requestMiddleware = [...middleware, this.requestHandler.bind(this)];
            const handle = (handler: HttpRequestHandler) => {
                handler(req, res, (value) => {
                    if (value) {
                        res.setHeader('Content-Type', 'application/json');
                        res.statusCode = 500;
                        res.end(JSON.stringify({ error: value }));
                    } else if (requestMiddleware.length > 0) {
                        handle(requestMiddleware.shift()!);
                    }
                });
            };

            handle(requestMiddleware.shift()!);
        });

        server.listen(port);
    }

    mount(path: string, server: Application, options?: Partial<ExpressOptions>) {
        const middleware = options?.middleware ?? [];

        server.use(path, ...middleware, (req, res) => {
            this.requestHandler(req, res);
        });
    }
}