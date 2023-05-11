export type QualifiedName = string


/**
 * Runtime spec id formatted as `<spec_name>@<spec_version>`
 */
export type SpecId = string


export interface BlockHeader {
    /**
     * Unique block id, following the format `<block height>-<first hex digits of the hash>`
     */
    id: string
    /**
     * Block height
     */
    height: number
    /**
     * Current block hash
     */
    hash: string
    /**
     * Hash of the parent block
     */
    parentHash: string
    /**
     * Root hash of the state merkle tree
     */
    stateRoot: string
    /**
     * Root hash of the extrinsics merkle tree
     */
    extrinsicsRoot: string
    /**
     * Block timestamp as set by `timestamp.now()`
     */
    timestamp?: number
    /**
     * Account address of block validator
     */
    validator?: string
    /**
     * Runtime spec id formatted as `{spec_name}@{spec_version}`
     */
    specId: SpecId
}


export interface Event {
    /**
     * Event id, in the form <blockNumber>-<index>
     */
    id: string
    /**
     * Event name
     */
    name: QualifiedName
    /**
     * Ordinal index in the event array of the current block
     */
    indexInBlock: number
    /**
     * JSON encoded event arguments
     */
    args: any
    /**
     * Event position in a joint list of events and calls.
     */
    pos: number
    phase: 'Initialization' | 'ApplyExtrinsic' | 'Finalization'
    extrinsicIndex?: number
    extrinsicId?: string
    callId?: string
}


export interface Extrinsic {
    id: string
    /**
     * Ordinal index in the extrinsics array of the current block
     */
    indexInBlock: number
    version: number
    signature?: ExtrinsicSignature
    error?: any
    fee?: bigint
    tip?: bigint
    success: boolean
    /**
     * Blake2b 128-bit hash of the raw extrinsic
     */
    hash?: string
}


export interface ExtrinsicSignature {
    address: any
    signature: any
    signedExtensions: any
}


export interface Call {
    id: string
    name: QualifiedName
    /**
     * JSON encoded call arguments
     */
    args: any
    origin?: any
    /**
     * Call error.
     *
     * Absence of error doesn't imply that call was executed successfully,
     * check {@link success} property for that.
     */
    error?: any
    success: boolean
    extrinsicId: string
    parentId?: string
    /**
     * Position of the call in a joint list of events and calls.
     */
    pos: number
}


export interface EvmLogEvent extends Event {
    name: 'EVM.Log'
    evmTxHash: string
}


export interface ContractsContractEmittedEvent extends Event {
    name: 'Contracts.ContractEmitted',
    args: {
        contract: string,
        data: string,
    }
}


export interface SpecMetadata {
    id: SpecId
    specName: string
    specVersion: number
    blockHeight: number
    blockHash: string
    hex: string
}
