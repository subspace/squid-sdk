import {last, maybeLast} from '@subsquid/util-internal'
import assert from 'assert'


export interface Horizon {
    getChainHeight(): number
}


export interface Magazine<T> {
    get(height: number): Promise<T>
    equals(a: T, b: T): boolean
    getDistance(): number
}


export class Shooter<T> {
    private records: {height: number, value: T}[] = []
    private free = true

    constructor(private horizon: Horizon, private mag: Magazine<T>) {}

    async get(height: number): Promise<T> {
        assert(this.free, 'parallel requests to the shooter are not supported')
        this.free = false
        try {
            return await this.getInternal(height)
        } finally {
            this.free = true
        }
    }

    private async getInternal(height: number): Promise<T> {
        let chainHeight = this.horizon.getChainHeight()
        assert(chainHeight >= height)

        let current: {height: number, value: T} | undefined
        while (this.records.length) {
            let rec = last(this.records)
            if (rec.height > height) break
            current = this.records.pop()
        }

        if (current == null) {
            let value = await this.mag.get(height)
            this.records.push({height, value})
            return value
        }

        if (current.height == height) {
            this.records.push(current)
            return current.value
        }

        assert(current.height < height)

        while (true) {
            let rec = maybeLast(this.records)
            if (rec) {
                assert(rec.height >= height)
                if (rec.height == height) return rec.value
                if (this.mag.equals(rec.value, current.value)) {
                    this.records.push(current)
                    return current.value
                }
                await this.shoot(height + Math.floor((rec.height - height) / 2))
            } else {
                await this.shoot(Math.min(height + this.mag.getDistance(), chainHeight))
            }
        }
    }

    private async shoot(height: number): Promise<void> {
        let value = await this.mag.get(height)
        this.records.push({
            height,
            value
        })
    }
}
