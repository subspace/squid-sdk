import {withErrorContext} from '@subsquid/util-internal'
import {BlockCtx, Bytes, Hash} from './interfaces/misc'
import {Rpc} from './rpc'
import {STORAGE} from './storage'
import {Magazine} from './util/shooter'


abstract class BaseMag<T> implements Magazine<T> {
    protected constructor(protected rpc: Rpc) {}

    abstract equals(a: T, b: T): boolean

    get(height: number): Promise<T> {
        let ctx: BlockCtx = {
            blockHeight: height
        }
        return this.rpc.getBlockHash(height).then(blockHash => {
            ctx.blockHash = blockHash
            return this.getByBlockHash(blockHash, height)
        }).catch(
            withErrorContext(ctx)
        )
    }

    protected abstract getByBlockHash(blockHash: Hash, blockHeight: number): Promise<T>

    getDistance(): number {
        return 1000
    }
}


// export class SpecVersionMag extends BaseMag<SpecVersion> {
//     equals(a: SpecVersion, b: SpecVersion): boolean {
//         return a.specName == b.specName && a.specVersion == b.specVersion
//     }
//
//     protected async getByBlockHash(blockHash: Hash, blockHeight: number): Promise<SpecVersion> {
//         let rtv = await this.rpc.getRuntimeVersion(blockHash)
//         return {
//             blockHeight,
//             blockHash,
//             specName: rtv.specName,
//             specVersion: rtv.specVersion
//         }
//     }
// }


// export class SessionMag extends BaseMag<Bytes> {
//     equals(a: Bytes, b: Bytes): boolean {
//         return a === b
//     }
//
//     protected getByBlockHash(blockHash: Hash, blockHeight: number): Promise<Bytes> {
//         return this.rpc.getStorage(blockHash, STORAGE.session)
//     }
// }
