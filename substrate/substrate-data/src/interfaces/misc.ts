export type Bytes = string
export type Hash = string
export type Qty = string


export interface HashAndHeight {
    hash: Hash
    height: number
}


export interface BatchRequest<R> {
    range: Range
    request: R
}


/**
 * Closed range of numbers
 */
export interface Range {
    /**
     * Start of segment (inclusive)
     */
    from: number
    /**
     * End of segment (inclusive). Defaults to infinity.
     */
    to?: number
}


export interface ClosedRange extends Range {
    to: number
}


export interface BlockCtx {
    blockHeight?: number
    blockHash?: string
}
