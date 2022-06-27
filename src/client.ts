import { Server } from "./server";

interface Client {
    setHeader(name: string, value: string): void;
}

class RpcClient<T> implements Client {
    private serverUrl?: string;
    private server?: Server<T>;
    private headers: { [key: string]: string } = {};

    constructor(serverOrClient: Server<T> | string) {
        if (typeof serverOrClient === "string") {
            this.serverUrl = serverOrClient;
        } else if (serverOrClient instanceof Server) {
            this.server = serverOrClient;
        } else {
            throw new Error("Invalid argument");
        }
    }

    setHeader(name: string, value: string) {
        this.headers[name] = value;
    }

    async call(method: keyof T, ...params: any[]) {
        if (this.server) {
            return await this.server.call(method, ...params);
        }

        const response = await fetch(this.serverUrl!, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...this.headers,
            },
            body: JSON.stringify({ method, params }),
        });

        const responseBody = await response.json();
        if ('error' in responseBody) {
            throw new Error(responseBody.error);
        }

        if (!response.ok) {
            throw new Error(`${response.status} ${response.statusText}`);
        }

        return responseBody.result;
    }
}

type Promisify<T> = {
    [P in keyof T]: T[P] extends (...args: any[]) => any ? (...args: Parameters<T[P]>) => Promise<Awaited<ReturnType<T[P]>>> : never;
}

const getRpcClient = <T>(server: Server<T> | string): Promisify<T> & Client => {
    let client: RpcClient<T> = new RpcClient(server);

    return new Proxy({}, {
        get(_, propKey) {
            if (propKey in client) {
                return (client as any)[propKey].bind(client);
            }

            return async (...args: any[]) => {
                const result = await client?.call(propKey as keyof T, ...args);
                
                return result;
            };
        }
    }) as Promisify<T> & Client;
}

export default getRpcClient;