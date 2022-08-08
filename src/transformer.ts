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

            if (type === 'object') {
                obj.value = Object.keys(param).map(key => ({ key, value: serialize([param[key]]) }));
            }
        }

        result.push(obj);
    }


    return result;
}

function getPushableParam(param: SerializedParam): any {
    const obj: any = {};
    if (param.type === 'object') {
        for (const { key, value } of param.value) {
            obj[key] = deserialize(value)[0];
        }

        return obj;
    }
}

export function deserialize(params: SerializedParam[]): any[] {
    const result: any[] = [];

    for (const param of params) {
        if (param.type === 'function' || param.type === 'object') {
            if (param.ctr in global) {
                result.push(Object.assign(new (global as any)[param.ctr](), getPushableParam(param)));
                continue;
            }

            module: for (const modName in require.cache) {
                const module = require.cache[modName];

                for (const modCtrName in module?.exports) {
                    const mod = module?.exports[modCtrName];
                    if (mod.name === param.ctr) {
                        result.push(Object.assign(new mod(), getPushableParam(param)));
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