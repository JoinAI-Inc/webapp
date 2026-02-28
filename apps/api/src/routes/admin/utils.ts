/** BigInt 序列化工具（JSON 默认不支持 BigInt） */
export function serializeBigInt<T>(data: T): T {
    return JSON.parse(JSON.stringify(data, (_, value) =>
        typeof value === 'bigint' ? value.toString() : value
    ));
}
