import {concurrentMap, last, withErrorContext} from '@subsquid/util-internal'
import assert from 'assert'
import {BatchRequest, Bytes, ClosedRange, HashAndHeight, Range} from './interfaces/misc'
import {PartialRawBlock, RawBlock, RawDataRequest} from './interfaces/raw-data'
import {RpcClient} from './interfaces/rpc-client'
import {RuntimeVersion} from './interfaces/rpc-data'
import {Rpc} from './rpc'
import {STORAGE} from './storage'
import {splitIntoStrides} from './util/util'


export class RawSrc {
    private rpc: Rpc
    private strideSize = 20

    // cache
    private lastBlock?: RawBlock
    private lastTopBlock?: RawBlock
    private headBlock?: PartialRawBlock
    private headBlockExtrinsicsRequested = false
    private finalizedHeadBlock?: PartialRawBlock
    private finalizedHeadBlockExtrinsicsRequested = false

    constructor(client: RpcClient) {
        this.rpc = new Rpc({client})
    }

    async *getFinalizedBlocks(request: BatchRequest<RawDataRequest>): AsyncIterable<RawBlock[]> {
        for await (let blocks of concurrentMap(
            3,
            this.generateStrides(request.range),
            range => this.fetchStride(range.from, range.to, request.request)
        )) {
            await this.processStride(blocks, request.request)
            yield blocks as RawBlock[]
        }
    }

    private async fetchStride(
        firstBlock: number,
        lastBlock: number,
        req: RawDataRequest
    ): Promise<PartialRawBlock[]> {
        assert(firstBlock <= lastBlock)
        let rpc = this.rpc.withPriority(firstBlock)
        let count = lastBlock - firstBlock + 1
        let blocks = new Array<PartialRawBlock>(count)

        let eventsPromises: Promise<Bytes | Error>[] | undefined
        if (req.events) {
            eventsPromises = new Array(count)
        }

        let head
        if (this.finalizedHeadBlock?.header.height === lastBlock) {
            head = this.finalizedHeadBlock.header.hash
        } else{
            head = await rpc.getBlockHash(lastBlock)
        }

        for (let i = count - 1; i >= 0; i--) {
            let ctx = {blockHash: head, blockHeight: firstBlock + i}

            if (eventsPromises) {
                eventsPromises[i] = rpc.getStorage(head, STORAGE.events).catch(withErrorContext(ctx))
            }

            blocks[i] = await this.loadBlock(
                rpc,
                head,
                !!req.extrinsics
            ).catch(
                withErrorContext(ctx)
            )

            head = blocks[i].header.parentHash
        }

        if (eventsPromises) {
            for (let i = 0; i < eventsPromises.length; i++) {
                let events = await eventsPromises[i]
                if (events instanceof Error) throw events
                blocks[i].events = events
            }
        }

        return blocks
    }

    private async processStride(blocks: PartialRawBlock[], req: RawDataRequest): Promise<void> {
        if (blocks.length == 0) return
        let tasks: Promise<void>[] = [
            this.setRuntimeVersions(blocks)
        ]
        if (req.validators) {
            tasks.push(this.setValidators(blocks))
        }
        await Promise.all(tasks)
        this.setLastBlock(last(blocks) as RawBlock)
    }

    private async setRuntimeVersions(blocks: PartialRawBlock[]): Promise<void> {
        if (blocks.length == 0) return
        let prev = this.lastBlock
        let last = blocks.length - 1

        let lastVersion = await this.rpc.getRuntimeVersion(blocks[last].header.hash)
        blocks[last].runtimeVersion = lastVersion

        for (let i = 0; i < last; i++) {
            if (
                prev?.header.hash === blocks[i].header.parentHash &&
                runtimeVersionEquals(prev.runtimeVersion, lastVersion)
            ) {
                blocks[i].runtimeVersion = prev.runtimeVersion
            } else {
                blocks[i].runtimeVersion = await this.rpc.getRuntimeVersion(blocks[i].header.hash)
            }
            prev = blocks[i] as RawBlock
        }
    }

    private async setValidators(blocks: PartialRawBlock[]): Promise<void> {
        if (blocks.length == 0) return
        let prev: PartialRawBlock | undefined = this.lastBlock
        let last = blocks.length - 1

        // first set sessions, like we do with runtime versions
        let lastSession = await this.rpc.getStorage(blocks[last].header.hash, STORAGE.sessionIndex)
        blocks[last].sessionIndex = lastSession

        for (let i = 0; i < last; i++) {
            if (
                prev?.header.hash === blocks[i].header.parentHash &&
                prev.sessionIndex === lastSession
            ) {
                blocks[i].sessionIndex = prev.sessionIndex
            } else {
                blocks[i].sessionIndex = await this.rpc.getStorage(blocks[i].header.hash, STORAGE.sessionIndex)
            }
            prev = blocks[i]
        }

        let cached: PartialRawBlock | undefined = this.lastBlock

        // now set validators
        for (let block of blocks) {
            await this.setValidator(block, cached)
            cached = block
        }
    }

    private async *generateStrides(range: Range): AsyncIterable<ClosedRange> {
        let head = await this.getFinalizedHead()
        if (head.height < range.from) return

        let r = {
            from: range.from,
            to: range.to ?? Number.MAX_SAFE_INTEGER
        }

        let from = r.from
        do {
            let to = Math.min(head.height, r.to)
            yield* splitIntoStrides(this.strideSize, {from, to})
            from = to + 1
        } while (
            from <= r.to && (head.height < (head = await this.getFinalizedHead()).height)
        )
    }

    async getBlock(blockHash: string, req: RawDataRequest): Promise<RawBlock> {
        type StorageQuery = {
            events?: true
            sessionIndex?: true
        }

        let storageQuery: StorageQuery = {}
        if (req.events) {
            storageQuery.events = true
        }
        if (req.validators) {
            storageQuery.sessionIndex = true
        }

        let [partialBlock, runtimeVersion, storage] = await Promise.all([
            this.loadBlock(this.rpc, blockHash, !!req.extrinsics),
            this.rpc.getRuntimeVersion(blockHash),
            this.rpc.queryStorage(blockHash, storageQuery)
        ])

        let block: RawBlock = {
            ...partialBlock,
            runtimeVersion,
            ...storage
        }

        if (req.validators) {
            await this.setValidator(block, this.lastBlock)
        }

        return this.setLastBlock(block)
    }

    private async setValidator(block: PartialRawBlock, prev?: PartialRawBlock): Promise<void> {
        for (let cached of this.getLastBlocks(prev)) {
            if (
                (cached.header.hash === block.header.parentHash || cached.header.parentHash === block.header.hash) &&
                cached.sessionIndex === block.sessionIndex &&
                cached.validators
            ) {
                block.validators = cached.validators
                return
            }
        }
        block.validators = await this.rpc.getStorage(block.header.hash, STORAGE.validators)
    }

    private *getLastBlocks(last?: PartialRawBlock): Iterable<PartialRawBlock> {
        if (last) yield last
        if (this.lastTopBlock) yield this.lastTopBlock
    }

    private setLastBlock(block: RawBlock): RawBlock {
        this.lastBlock = block
        if (this.lastTopBlock == null || this.lastTopBlock.header.height <= block.header.height) {
            this.lastTopBlock = block
        }
        return block
    }

    private async loadBlock(
        rpc: Rpc,
        blockHash: string,
        withExtrinsics: boolean
    ): Promise<PartialRawBlock> {
        for (let cache of ['finalizedHeadBlock', 'headBlock'] as const) {
            let block = this[cache]
            if (block?.header.hash === blockHash) {
                this[`${cache}ExtrinsicsRequested`] = withExtrinsics
                if (withExtrinsics) {
                    if (block.extrinsics) return block
                } else if (block.extrinsics) {
                    let {extrinsics, ...newBlock} = block
                    return newBlock
                } else {
                    return block
                }
            }
        }
        return getBlock(rpc, blockHash, withExtrinsics)
    }

    async getFinalizedHead(): Promise<HashAndHeight> {
        let hash = await this.rpc.getFinalizedHead()

        if (this.finalizedHeadBlock?.header.hash !== hash) {
            this.finalizedHeadBlock = await getBlock(
                this.rpc,
                hash,
                this.finalizedHeadBlockExtrinsicsRequested
            )
            this.finalizedHeadBlockExtrinsicsRequested = false
        }

        return {
            height: this.finalizedHeadBlock.header.height,
            hash
        }
    }

    async getBestHead(): Promise<HashAndHeight> {
        let hash = await this.rpc.getBlockHash()

        if (this.headBlock?.header.hash !== hash) {
            this.headBlock = await getBlock(
                this.rpc,
                hash,
                this.headBlockExtrinsicsRequested
            )
            this.headBlockExtrinsicsRequested = false
        }

        return {
            height: this.headBlock.header.height,
            hash
        }
    }

    getBlockHash(height: number): Promise<string> {
        return this.rpc.getBlockHash(height)
    }
}


function getBlock(rpc: Rpc, blockHash: string, withExtrinsics?: boolean): Promise<PartialRawBlock> {
    if (withExtrinsics) {
        return rpc.getBlock(blockHash)
    } else {
        return rpc.getBlockHeader(blockHash).then(header => {
            return {header}
        })
    }
}


function runtimeVersionEquals(a: RuntimeVersion, b: RuntimeVersion): boolean {
    return a.specName === b.specName
        && a.specVersion === b.specVersion
        && a.implName === b.implName
        && a.implVersion === b.implVersion
        && a.authoringVersion === b.authoringVersion
}
