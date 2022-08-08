type TypeofType = "string" | "number" | "bigint" | "boolean" | "symbol" | "undefined" | "object" | "function";
type SerializedParam = { type: TypeofType, value: any, ctr: string };


export function serialize(params: any[]): SerializedParam[] {
    const result: SerializedParam[] = [];

    for (const param of params) {
        const type = typeof param;

        const obj = {
            type,
            ctr: '',
            value: param,
        }

        if (type === 'function' || type === 'object') {
            obj.ctr = param.constructor.name;
        }

        result.push(obj);
    }


    return result;
}

export function deserialize(params: SerializedParam[]): any[] {
    const result: any[] = [];

    for (const param of params) {
        if (param.type === 'function' || param.type === 'object') {
            if (param.ctr in global) {
                result.push(new (global as any)[param.ctr](param.value));
                continue;
            }

            module: for (const modName in require.cache) {
                const module = require.cache[modName];

                for (const modCtrName in module?.exports) {
                    const mod = module?.exports[modCtrName];
                    if (mod.name === param.ctr) {
                        result.push(Object.assign(new mod(), param.value));
                        break module;
                    }
                }
            }
        } else {
            result.push(param.value);
        }
    }

    return result;
}