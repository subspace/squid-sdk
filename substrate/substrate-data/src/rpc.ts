import assert from 'assert'
import {Bytes, Hash} from './interfaces/misc'
import {RawBlock0, RawBlockHeader} from './interfaces/raw-data'
import {RpcClient} from './interfaces/rpc-client'
import * as rpc from './interfaces/rpc-data'
import {STORAGE} from './storage'
import {qty2Int} from './util/util'


export type StorageQuery = {
    [K in keyof typeof STORAGE]?: boolean
}


export type StorageQueryResult<Q extends StorageQuery> = {
    [K in keyof Q as Q[K] extends true ? K extends keyof typeof STORAGE ? K : never : never]: Bytes
}


export interface RpcOptions {
    client: RpcClient
    priority?: number
}


export class Rpc {
    private client: RpcClient
    private priority: number

    constructor(options: RpcOptions) {
        this.client = options.client
        this.priority = options.priority ?? 0
    }

    withPriority(priority: number): Rpc {
        return new Rpc({client: this.client, priority})
    }

    async getBlock(blockHash: Hash): Promise<RawBlock0> {
        let block: rpc.SignedBlock = await this.client.call(
            this.priority,
            'chain_getBlock',
            [blockHash]
        )
        return {
            header: mapBlockHeader(blockHash, block.block.header),
            extrinsics: block.block.extrinsics
        }
    }

    async getBlockHeader(blockHash: Hash): Promise<RawBlockHeader> {
        let header: rpc.BlockHeader = await this.client.call(
            this.priority,
            'chain_getBlockHeader',
            [blockHash]
        )
        return mapBlockHeader(blockHash, header)
    }

    getFinalizedHead(): Promise<Hash> {
        return this.client.call(this.priority, 'chain_getFinalizedHead')
    }

    getRuntimeVersion(blockHash: Hash): Promise<rpc.RuntimeVersion> {
        return this.client.call(this.priority, 'state_getRuntimeVersion', [blockHash])
    }

    getMetadata(blockHash: Hash): Promise<Bytes> {
        return this.client.call(this.priority, 'state_getMetadata', [blockHash])
    }

    getBlockHash(height?: number): Promise<Hash> {
        return this.client.call(
            this.priority,
            'chain_getBlockHash',
            height == null ? undefined : [height]
        )
    }

    getStorage(blockHash: Hash, key: Bytes): Promise<Bytes> {
        return this.client.call(this.priority, 'state_getStorage', [key, blockHash])
    }

    async getManyStorage(blockHash: Hash, keys: Bytes[]): Promise<Bytes[]> {
        if (keys.length == 0) return []
        if (keys.length == 1) return [
            await this.client.call(
                this.priority,
                'state_getStorage',
                [[keys[0]], blockHash]
            )
        ]
        let res: {changes: [key: string, value: string][]}[] = await this.client.call(
            this.priority,
            'state_queryStorageAt',
            [keys, blockHash]
        )
        assert(res.length == 1)
        let changes = res[0].changes
        assert(changes.length == keys.length)
        let values = new Array(keys.length)
        for (let i = 0; i < values.length; i++) {
            let [k, v] = changes[i]
            assert(k == keys[i])
            values[i] = v
        }
        return values
    }

    async queryStorage<Q extends StorageQuery>(
        blockHash: Hash,
        query: Q
    ): Promise<StorageQueryResult<Q>> {
        let props: (keyof Q)[] = []
        let keys: Bytes[] = []

        let prop: keyof Q
        for (prop in query) {
            if (query[prop]) {
                props.push(prop)
                keys.push(STORAGE[prop as keyof typeof STORAGE])
            }
        }

        let values = await this.getManyStorage(blockHash, keys)

        let result: any = {}
        for (let i = 0; i < keys.length; i++) {
            result[props[i]] = values[i]
        }
        return result
    }
}


function mapBlockHeader(hash: Hash, header: rpc.BlockHeader): RawBlockHeader {
    return {
        hash,
        height: qty2Int(header.number),
        parentHash: header.parentHash,
        stateRoot: header.stateRoot,
        extrinsicsRoot: header.extrinsicsRoot,
        digest: header.digest
    }
}
