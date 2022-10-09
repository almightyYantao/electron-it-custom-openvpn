import crypto from 'crypto'
import { xiaokuError } from './log'

// 生成符合规范长度的密钥
export function genkey(secret, length = 32): any {
  return crypto.createHash('sha256').update(String(secret)).digest('base64').substr(0, length)
}

/**
 * 加密文本
 * @param {*} content
 * @param {*} secretkey
 * @param {*} iv
 * @returns
 */
export function aesEncrypt(content: string, secretkey: string, iv: string): string {
  const cipher = crypto.createCipheriv('aes-256-cbc', genkey(secretkey), genkey(iv, 16))
  let enc = cipher.update(content, 'utf8', 'hex')
  enc += cipher.final('hex')
  return enc
}

/**
 * 解密文本
 * @param {*} content
 * @param {*} secretkey
 * @param {*} iv
 * @returns
 */
export function aesDecrypt(content: string, secretkey: string, iv: string): string {
  try {
    const decipher = crypto.createDecipheriv('aes-256-cbc', genkey(secretkey), genkey(iv, 16))
    let dec = decipher.update(content, 'hex', 'utf8')
    dec += decipher.final('utf8')
    return dec
  } catch (e) {
    xiaokuError(`解密失败：${e}`)
    return ''
  }
}
