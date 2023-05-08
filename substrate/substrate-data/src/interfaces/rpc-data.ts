import {Bytes, Hash, Qty} from './misc'


export interface BlockHeader {
    number: Qty
    parentHash: Hash
    stateRoot: Hash
    extrinsicsRoot: Hash
    digest: {logs: string[]}
}


export interface Block {
    header: BlockHeader
    extrinsics: Bytes[]
}


export interface SignedBlock {
    block: Block
}


export interface RuntimeVersion {
    specName: string
    specVersion: number
    implName: string
    implVersion: number
    authoringVersion: number
}
