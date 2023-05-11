import {toHex} from '@subsquid/util-internal-hex'
import assert from 'assert'
import blake2b from 'blake2b'
import {Bytes, ClosedRange, Qty} from '../interfaces/misc'


export function qty2Int(val: Qty): number {
    let n = parseInt(val, 16)
    assert(Number.isSafeInteger(n))
    return n
}


interface Decorator {
    (proto: any, prop: string, d: PropertyDescriptor): PropertyDescriptor
}


export function cacheLast<T>(toKey: (val: T) => unknown = (val => val)): Decorator {
    return function cacheLastDecorator(proto: any, prop: string, d: PropertyDescriptor): PropertyDescriptor {
        let {value: fn, ...options} = d
        let keyProp = Symbol(prop + '_key')
        let valueProp = Symbol(prop + '_value')

        let value: any = function(this: any, arg: any) {
            let key = toKey(arg)
            if (this[keyProp] === key) return this[valueProp]
            let result = fn(arg)
            this[keyProp] = key
            this[valueProp] = result
            return result
        }

        return {value, ...options}
    }
}


export function* splitIntoStrides(strideSize: number, range: ClosedRange): Iterable<ClosedRange> {
    assert(strideSize > 0)
    let size = range.to - range.from + 1
    let from = range.from

    while (size > 2 * strideSize) {
        let next = from + strideSize
        yield {from, to: next - 1}
        from = next
        size -= strideSize
    }

    if (size > strideSize) {
        let middle = from + Math.floor(size / 2)
        yield {from, to: middle - 1}
        yield {from: middle, to: range.to}
    } else {
        yield range
    }
}


export function blake2bHash(bytes: Uint8Array | Bytes, len: number): Bytes {
    if (typeof bytes == 'string') {
        bytes = Buffer.from(bytes)
    }
    let hash = blake2b(len)
    hash.update(bytes)
    return toHex(hash.digest())
}
