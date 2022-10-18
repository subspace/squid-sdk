import assert from 'assert'
import * as ethers from 'ethers'
import {EvmLog, EvmTransaction, Block, ChainContext, BlockContext, Chain, Result} from './support'

export const abi = new ethers.utils.Interface(getJsonAbi());

export type Approval0Event = ([owner: string, approved: string, tokenId: ethers.BigNumber] & {owner: string, approved: string, tokenId: ethers.BigNumber})

export type ApprovalForAll0Event = ([owner: string, operator: string, approved: boolean] & {owner: string, operator: string, approved: boolean})

export type Transfer0Event = ([from: string, to: string, tokenId: ethers.BigNumber] & {from: string, to: string, tokenId: ethers.BigNumber})

class Events {

  Approval = this['Approval(address,address,uint256)']

  'Approval(address,address,uint256)' = {
    topic: abi.getEventTopic('Approval(address,address,uint256)'),
    decode(data: EvmLog): Approval0Event {
      return abi.decodeEventLog('Approval(address,address,uint256)', data.data, data.topics) as any
    }
  }

  ApprovalForAll = this['ApprovalForAll(address,address,bool)']

  'ApprovalForAll(address,address,bool)' = {
    topic: abi.getEventTopic('ApprovalForAll(address,address,bool)'),
    decode(data: EvmLog): ApprovalForAll0Event {
      return abi.decodeEventLog('ApprovalForAll(address,address,bool)', data.data, data.topics) as any
    }
  }

  Transfer = this['Transfer(address,address,uint256)']

  'Transfer(address,address,uint256)' = {
    topic: abi.getEventTopic('Transfer(address,address,uint256)'),
    decode(data: EvmLog): Transfer0Event {
      return abi.decodeEventLog('Transfer(address,address,uint256)', data.data, data.topics) as any
    }
  }
}

export const events = new Events()

export type Approve0Function = ([to: string, tokenId: ethers.BigNumber] & {to: string, tokenId: ethers.BigNumber})

export type SafeTransferFrom0Function = ([from: string, to: string, tokenId: ethers.BigNumber] & {from: string, to: string, tokenId: ethers.BigNumber})

export type SafeTransferFrom1Function = ([from: string, to: string, tokenId: ethers.BigNumber, _data: string] & {from: string, to: string, tokenId: ethers.BigNumber, _data: string})

export type SetApprovalForAll0Function = ([operator: string, approved: boolean] & {operator: string, approved: boolean})

export type TransferFrom0Function = ([from: string, to: string, tokenId: ethers.BigNumber] & {from: string, to: string, tokenId: ethers.BigNumber})

class Functions {

  approve = this['approve(address,uint256)']

  'approve(address,uint256)' = {
    sighash: abi.getSighash('approve(address,uint256)'),
    decode(data: EvmTransaction | string): Approve0Function {
      return abi.decodeFunctionData('approve(address,uint256)', typeof data === 'string' ? data : data.input) as any
    }
  }

  safeTransferFrom = this['safeTransferFrom(address,address,uint256)']

  'safeTransferFrom(address,address,uint256)' = {
    sighash: abi.getSighash('safeTransferFrom(address,address,uint256)'),
    decode(data: EvmTransaction | string): SafeTransferFrom0Function {
      return abi.decodeFunctionData('safeTransferFrom(address,address,uint256)', typeof data === 'string' ? data : data.input) as any
    }
  }

  'safeTransferFrom(address,address,uint256,bytes)' = {
    sighash: abi.getSighash('safeTransferFrom(address,address,uint256,bytes)'),
    decode(data: EvmTransaction | string): SafeTransferFrom1Function {
      return abi.decodeFunctionData('safeTransferFrom(address,address,uint256,bytes)', typeof data === 'string' ? data : data.input) as any
    }
  }

  setApprovalForAll = this['setApprovalForAll(address,bool)']

  'setApprovalForAll(address,bool)' = {
    sighash: abi.getSighash('setApprovalForAll(address,bool)'),
    decode(data: EvmTransaction | string): SetApprovalForAll0Function {
      return abi.decodeFunctionData('setApprovalForAll(address,bool)', typeof data === 'string' ? data : data.input) as any
    }
  }

  transferFrom = this['transferFrom(address,address,uint256)']

  'transferFrom(address,address,uint256)' = {
    sighash: abi.getSighash('transferFrom(address,address,uint256)'),
    decode(data: EvmTransaction | string): TransferFrom0Function {
      return abi.decodeFunctionData('transferFrom(address,address,uint256)', typeof data === 'string' ? data : data.input) as any
    }
  }
}

export const functions = new Functions()

export class Contract {
  private readonly _chain: Chain
  private readonly blockHeight: number
  readonly address: string

  constructor(ctx: BlockContext, address: string)
  constructor(ctx: ChainContext, block: Block, address: string)
  constructor(ctx: BlockContext, blockOrAddress: Block | string, address?: string) {
    this._chain = ctx._chain
    if (typeof blockOrAddress === 'string')  {
      this.blockHeight = ctx.block.height
      this.address = ethers.utils.getAddress(blockOrAddress)
    }
    else  {
      assert(address != null)
      this.blockHeight = blockOrAddress.height
      this.address = ethers.utils.getAddress(address)
    }
  }

  balanceOf = this['balanceOf(address)']

  'balanceOf(address)' = {
    call: (owner: string): Promise<ethers.BigNumber> => this.call('balanceOf(address)', [owner]),
    tryCall: (owner: string): Promise<Result<ethers.BigNumber>> => this.tryCall('balanceOf(address)', [owner])
  }

  baseURI = this['baseURI()']

  'baseURI()' = {
    call: (): Promise<string> => this.call('baseURI()', []),
    tryCall: (): Promise<Result<string>> => this.tryCall('baseURI()', [])
  }

  getApproved = this['getApproved(uint256)']

  'getApproved(uint256)' = {
    call: (tokenId: ethers.BigNumber): Promise<string> => this.call('getApproved(uint256)', [tokenId]),
    tryCall: (tokenId: ethers.BigNumber): Promise<Result<string>> => this.tryCall('getApproved(uint256)', [tokenId])
  }

  isApprovedForAll = this['isApprovedForAll(address,address)']

  'isApprovedForAll(address,address)' = {
    call: (owner: string, operator: string): Promise<boolean> => this.call('isApprovedForAll(address,address)', [owner, operator]),
    tryCall: (owner: string, operator: string): Promise<Result<boolean>> => this.tryCall('isApprovedForAll(address,address)', [owner, operator])
  }

  name = this['name()']

  'name()' = {
    call: (): Promise<string> => this.call('name()', []),
    tryCall: (): Promise<Result<string>> => this.tryCall('name()', [])
  }

  ownerOf = this['ownerOf(uint256)']

  'ownerOf(uint256)' = {
    call: (tokenId: ethers.BigNumber): Promise<string> => this.call('ownerOf(uint256)', [tokenId]),
    tryCall: (tokenId: ethers.BigNumber): Promise<Result<string>> => this.tryCall('ownerOf(uint256)', [tokenId])
  }

  supportsInterface = this['supportsInterface(bytes4)']

  'supportsInterface(bytes4)' = {
    call: (interfaceId: string): Promise<boolean> => this.call('supportsInterface(bytes4)', [interfaceId]),
    tryCall: (interfaceId: string): Promise<Result<boolean>> => this.tryCall('supportsInterface(bytes4)', [interfaceId])
  }

  symbol = this['symbol()']

  'symbol()' = {
    call: (): Promise<string> => this.call('symbol()', []),
    tryCall: (): Promise<Result<string>> => this.tryCall('symbol()', [])
  }

  tokenByIndex = this['tokenByIndex(uint256)']

  'tokenByIndex(uint256)' = {
    call: (index: ethers.BigNumber): Promise<ethers.BigNumber> => this.call('tokenByIndex(uint256)', [index]),
    tryCall: (index: ethers.BigNumber): Promise<Result<ethers.BigNumber>> => this.tryCall('tokenByIndex(uint256)', [index])
  }

  tokenOfOwnerByIndex = this['tokenOfOwnerByIndex(address,uint256)']

  'tokenOfOwnerByIndex(address,uint256)' = {
    call: (owner: string, index: ethers.BigNumber): Promise<ethers.BigNumber> => this.call('tokenOfOwnerByIndex(address,uint256)', [owner, index]),
    tryCall: (owner: string, index: ethers.BigNumber): Promise<Result<ethers.BigNumber>> => this.tryCall('tokenOfOwnerByIndex(address,uint256)', [owner, index])
  }

  tokenURI = this['tokenURI(uint256)']

  'tokenURI(uint256)' = {
    call: (tokenId: ethers.BigNumber): Promise<string> => this.call('tokenURI(uint256)', [tokenId]),
    tryCall: (tokenId: ethers.BigNumber): Promise<Result<string>> => this.tryCall('tokenURI(uint256)', [tokenId])
  }

  totalSupply = this['totalSupply()']

  'totalSupply()' = {
    call: (): Promise<ethers.BigNumber> => this.call('totalSupply()', []),
    tryCall: (): Promise<Result<ethers.BigNumber>> => this.tryCall('totalSupply()', [])
  }

  private async call(signature: string, args: any[]) : Promise<any> {
    const data = abi.encodeFunctionData(signature, args)
    const result = await this._chain.client.call('eth_call', [{to: this.address, data}, this.blockHeight])
    const decoded = abi.decodeFunctionResult(signature, result)
    return decoded.length > 1 ? decoded : decoded[0]
  }

  private async tryCall(signature: string, args: any[]) : Promise<Result<any>> {
    return this.call(signature, args).then(r => ({success: true, value: r})).catch(() => ({success: false}))
  }
}

function getJsonAbi(): any {
  return [{"type":"constructor","payable":false,"inputs":[{"type":"string","name":"name"},{"type":"string","name":"symbol"},{"type":"string","name":"baseURI"}]},{"type":"event","anonymous":false,"name":"Approval","inputs":[{"type":"address","name":"owner","indexed":true},{"type":"address","name":"approved","indexed":true},{"type":"uint256","name":"tokenId","indexed":true}]},{"type":"event","anonymous":false,"name":"ApprovalForAll","inputs":[{"type":"address","name":"owner","indexed":true},{"type":"address","name":"operator","indexed":true},{"type":"bool","name":"approved","indexed":false}]},{"type":"event","anonymous":false,"name":"Transfer","inputs":[{"type":"address","name":"from","indexed":true},{"type":"address","name":"to","indexed":true},{"type":"uint256","name":"tokenId","indexed":true}]},{"type":"function","name":"approve","constant":false,"payable":false,"inputs":[{"type":"address","name":"to"},{"type":"uint256","name":"tokenId"}],"outputs":[]},{"type":"function","name":"balanceOf","constant":true,"stateMutability":"view","payable":false,"inputs":[{"type":"address","name":"owner"}],"outputs":[{"type":"uint256"}]},{"type":"function","name":"baseURI","constant":true,"stateMutability":"view","payable":false,"inputs":[],"outputs":[{"type":"string"}]},{"type":"function","name":"getApproved","constant":true,"stateMutability":"view","payable":false,"inputs":[{"type":"uint256","name":"tokenId"}],"outputs":[{"type":"address"}]},{"type":"function","name":"isApprovedForAll","constant":true,"stateMutability":"view","payable":false,"inputs":[{"type":"address","name":"owner"},{"type":"address","name":"operator"}],"outputs":[{"type":"bool"}]},{"type":"function","name":"name","constant":true,"stateMutability":"view","payable":false,"inputs":[],"outputs":[{"type":"string"}]},{"type":"function","name":"ownerOf","constant":true,"stateMutability":"view","payable":false,"inputs":[{"type":"uint256","name":"tokenId"}],"outputs":[{"type":"address"}]},{"type":"function","name":"safeTransferFrom","constant":false,"payable":false,"inputs":[{"type":"address","name":"from"},{"type":"address","name":"to"},{"type":"uint256","name":"tokenId"}],"outputs":[]},{"type":"function","name":"safeTransferFrom","constant":false,"payable":false,"inputs":[{"type":"address","name":"from"},{"type":"address","name":"to"},{"type":"uint256","name":"tokenId"},{"type":"bytes","name":"_data"}],"outputs":[]},{"type":"function","name":"setApprovalForAll","constant":false,"payable":false,"inputs":[{"type":"address","name":"operator"},{"type":"bool","name":"approved"}],"outputs":[]},{"type":"function","name":"supportsInterface","constant":true,"stateMutability":"view","payable":false,"inputs":[{"type":"bytes4","name":"interfaceId"}],"outputs":[{"type":"bool"}]},{"type":"function","name":"symbol","constant":true,"stateMutability":"view","payable":false,"inputs":[],"outputs":[{"type":"string"}]},{"type":"function","name":"tokenByIndex","constant":true,"stateMutability":"view","payable":false,"inputs":[{"type":"uint256","name":"index"}],"outputs":[{"type":"uint256"}]},{"type":"function","name":"tokenOfOwnerByIndex","constant":true,"stateMutability":"view","payable":false,"inputs":[{"type":"address","name":"owner"},{"type":"uint256","name":"index"}],"outputs":[{"type":"uint256"}]},{"type":"function","name":"tokenURI","constant":true,"stateMutability":"view","payable":false,"inputs":[{"type":"uint256","name":"tokenId"}],"outputs":[{"type":"string"}]},{"type":"function","name":"totalSupply","constant":true,"stateMutability":"view","payable":false,"inputs":[],"outputs":[{"type":"uint256"}]},{"type":"function","name":"transferFrom","constant":false,"payable":false,"inputs":[{"type":"address","name":"from"},{"type":"address","name":"to"},{"type":"uint256","name":"tokenId"}],"outputs":[]}]
}

