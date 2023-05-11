import {assertNotNull, def} from '@subsquid/util-internal'
import {toHex} from '@subsquid/util-internal-hex'
import {Bytes} from '../interfaces/misc'
import * as parsed from '../interfaces/parsed-data'
import {RawBlock} from '../interfaces/raw-data'
import * as sub from '../interfaces/substrate'
import {RuntimeApi} from '../runtime'
import {blake2bHash} from '../util/util'
import {formatId, getExtrinsicTip, unwrapArguments} from './util'
import {getBlockValidator} from './validator'


export class BlockParser {
    public readonly warnings: string[] = []

    constructor(
        private runtime: RuntimeApi,
        private rawBlock: RawBlock,
        private options: {
            withExtrinsicHash?: boolean
        } = {}
    ) {}

    @def
    timestamp(): number | undefined {
        let extrinsics = this.extrinsics()
        if (extrinsics == null) return
        for (let {call} of extrinsics) {
            if (call.name === 'Timestamp.set') {
                return Number(call.args.now)
            }
        }
    }

    @def
    validator(): Bytes | undefined {
        if (this.rawBlock.validators == null) return

        let validators = this.runtime.decodeStorageValue(
            'Session.Validators',
            this.rawBlock.validators
        )

        let validator = getBlockValidator(this.digest(), validators)
        if (validator) {
            return toHex(validator)
        }
    }

    @def
    digest(): sub.DigestItem[] {
        return this.rawBlock.header.digest.logs.map<sub.DigestItem>(bytes => {
            return this.runtime.scaleCodec.decodeBinary(this.runtime.description.digestItem, bytes)
        })
    }

    setExtrinsicFeesFromPaidEvent(): void {
        let extrinsics = this.extrinsics()
        let events = this.events()
        if (extrinsics == null || events == null) return
        for (let e of events) {
            if (e.name == 'TransactionPayment.TransactionFeePaid') {
                let exi = extrinsics[assertNotNull(e.extrinsicIndex)]
                let actualFee = BigInt(e.args.actualFee)
                let tip = BigInt(e.args.tip ?? e.args.actualTip)
                exi.extrinsic.fee = actualFee - tip
                exi.extrinsic.tip = tip
            }
        }
    }

    @def
    events(): parsed.Event[] | undefined {
        if (this.rawBlock.events == null) return
        let records: sub.EventRecord[] = this.runtime.decodeStorageValue('System.Events', this.rawBlock.events)
        return records.map((rec, idx) => {
            let {name, args} = unwrapArguments(rec.event, this.runtime.events)
            let e: parsed.Event = {
                id: this.formatId(idx),
                indexInBlock: idx,
                name,
                args,
                phase: rec.phase.__kind,
                pos: -1
            }
            if (rec.phase.__kind == 'ApplyExtrinsic') {
                e.extrinsicIndex = rec.phase.value
            }
            return e
        })
    }

    @def
    extrinsics(): {extrinsic: parsed.Extrinsic, call: parsed.Call}[] | undefined {
        return this.rawBlock.extrinsics?.map((bytes, idx) => {
            let src = this.runtime.decodeExtrinsic(bytes)
            let {name, args} = unwrapArguments(src.call, this.runtime.calls)
            let id = this.formatId(idx)

            let extrinsic: parsed.Extrinsic = {
                id,
                indexInBlock: idx,
                version: src.version,
                success: false
            }

            if (src.signature) {
                extrinsic.signature = src.signature
            }

            let tip = getExtrinsicTip(src)
            if (tip != null) {
                extrinsic.tip = tip
            }

            if (this.options.withExtrinsicHash) {
                extrinsic.hash = blake2bHash(bytes, 32)
            }

            let call: parsed.Call = {
                id,
                name,
                args,
                extrinsicId: id,
                pos: -1,
                success: false
            }

            return {extrinsic, call}
        })
    }

    parseCalls(): void {

    }

    private formatId(index?: number): string {
        return formatId(this.rawBlock.header.height, this.rawBlock.header.hash, index)
    }
}
