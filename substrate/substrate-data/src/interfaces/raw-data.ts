import {Bytes, Hash} from './misc'
import {RuntimeVersion} from './rpc-data'


export interface RawBlockHeader {
    hash: Hash
    height: number
    parentHash: Hash
    stateRoot: Hash
    extrinsicsRoot: Hash
    digest: {logs: Bytes[]}
}


export interface RawBlock0 {
    header: RawBlockHeader
    extrinsics: Bytes[]
}


export interface PartialRawBlock {
    header: RawBlockHeader
    runtimeVersion?: RuntimeVersion
    extrinsics?: Bytes[]
    events?: Bytes
    sessionIndex?: Bytes
    validators?: Bytes
}


export interface RawBlock extends PartialRawBlock {
    runtimeVersion: RuntimeVersion
}


export interface RawDataRequest {
    extrinsics?: boolean
    events?: boolean
    validators?: boolean
}
