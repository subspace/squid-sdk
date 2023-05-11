import {assertNotNull, unexpectedCase} from '@subsquid/util-internal'
import * as parsed from '../interfaces/parsed-data'
import {getExtrinsicFailedError} from './util'


type Item = {
    kind: 'event'
    event: parsed.Event
} | {
    kind: 'call'
    call: parsed.Call
}


export class CallParser {
    private items: Item[] = []
    private eventPos: number
    private extrinsic!: parsed.Extrinsic

    constructor(
        private extrinsics: {extrinsic: parsed.Extrinsic, call: parsed.Call}[],
        private events: parsed.Event[]
    ) {
        this.eventPos = events.length - 1
    }

    parse(): void {
        for (let i = this.extrinsics.length - 1; i >= 0; i--) {
            this.extrinsic = this.extrinsics[i].extrinsic
            let call = this.extrinsics[i].call
            let event = this.next()
            switch(event.name) {
                case 'System.ExtrinsicSuccess':
                    this.extrinsic.success = true
                    break
                case 'System.ExtrinsicFailed':
                    let err = getExtrinsicFailedError(event.args)
                    this.extrinsic.success = false
                    this.extrinsic.error = err
                    break
                default:
                    throw unexpectedCase(event.name)
            }
        }
    }

    private next(): parsed.Event {
        return assertNotNull(
            this.maybeNext(),
            'missing required event'
        )
    }

    private maybeNext(): parsed.Event | undefined {
        while (this.eventPos < 0) {
            let event = this.events[this.eventPos]
            if (event.phase === 'ApplyExtrinsic') {
                if (event.extrinsicIndex !== this.extrinsic.indexInBlock) return
                this.eventPos -= 1
                this.items.push({kind: 'event', event})
                return event
            } else {
                this.eventPos -= 1
                this.items.push({kind: 'event', event})
            }
        }
    }
}
