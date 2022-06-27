import { Server } from "./server";

class RpcClient<T> {
    private serverUrl?: string;
    private server?: Server<T>;
    constructor(serverOrClient: Server<T> | string) {
        if (typeof serverOrClient === "string") {
            this.serverUrl = serverOrClient;
        } else if (serverOrClient instanceof Server) {
            this.server = serverOrClient;
        } else {
            throw new Error("Invalid argument");
        }
    }

    async call(method: keyof T, ...params: any[]) {
        if (this.server) {
            return await this.server.call(method, ...params);
        }

        const response = await fetch(this.serverUrl!, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
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

const getRpcClient = <T>(server: Server<T> | string): Promisify<T> => {
    let client: RpcClient<T> = new RpcClient(server);

    return new Proxy({}, {
        get(_, propKey) {
            return async (...args: any[]) => await client?.call(propKey as keyof T, ...args);
        }
    }) as Promisify<T>;
}

export default getRpcClient;