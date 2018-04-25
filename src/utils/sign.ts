import * as ethUtil from 'ethereumjs-util'
import { leftPadWith0 } from './helper'
import { Dex } from '../types'
import { ECSignature } from '0x.js'

// sig is buffer
export const concatSig = (ecSignatureBuffer: Dex.ECSignatureBuffer): Buffer => {
  const { v, r, s } = ecSignatureBuffer
  const vSig = ethUtil.bufferToInt(v)
  const rSig = ethUtil.fromSigned(r)
  const sSig = ethUtil.fromSigned(s)
  const rStr = leftPadWith0(ethUtil.toUnsigned(rSig).toString('hex'), 64)
  const sStr = leftPadWith0(ethUtil.toUnsigned(sSig).toString('hex'), 64)
  const vStr = ethUtil.stripHexPrefix(ethUtil.intToHex(vSig))
  return ethUtil.addHexPrefix(rStr.concat(sStr, vStr)).toString('hex')
}

export const personalECSign = (privateKey: string, msg: string): Dex.ECSignatureBuffer => {
  const message = ethUtil.toBuffer(msg)
  const msgHash = ethUtil.hashPersonalMessage(message)
  return ethUtil.ecsign(msgHash, new Buffer(privateKey, 'hex'))
}

export const personalSign = (privateKey: string, msg: string): string => {
  const sig = personalECSign(privateKey, msg)
  return ethUtil.bufferToHex(concatSig(sig))
}

export const personalECSignHex = (privateKey: string, msg: string): ECSignature => {
  const { r, s, v } = personalECSign(privateKey, msg)
  const ecSignature = {
    v,
    r: ethUtil.bufferToHex(r),
    s: ethUtil.bufferToHex(s),
  }
  return ecSignature
}