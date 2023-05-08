export interface RpcClient {
    call<T>(method: string, params?: any[]): Promise<T>
    call<T>(priority: number, method: string, params?: any[]): Promise<T>
}
