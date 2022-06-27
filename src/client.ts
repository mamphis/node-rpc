import { Server } from "./server";

class RpcClient<T> {
    private serverUrl?: string;
    private server?: Server<T>;
    constructor(serverOrClient: Server<T> | string) {
        if (typeof serverOrClient === "string") {
            this.serverUrl = serverOrClient;
        }
        else {
            this.server = serverOrClient;
        }
    }
    async call(method: keyof T, ...params: any[]) {
        if (this.server) {
            return await this.server.call(method, ...params);
        }
        return method;
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