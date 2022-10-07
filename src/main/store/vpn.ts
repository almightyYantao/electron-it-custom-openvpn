import { Low, JSONFile } from 'lowdb'
const { app } = require('electron')
const path = require('path')
const STORE_PATH = app.getPath('userData')

export interface ConfigValue {
  configValue: string
  connectStaus?: boolean
}

// 初始化lowdb读写的json文件名以及存储路径
const adapter = new JSONFile<ConfigValue>(path.join(STORE_PATH, '/vpn.json'))
console.log(path.join(STORE_PATH, '/vpn.json'))
const db = new Low(adapter)
// 这里要把原来的数据读取出来，要不然返回的是一个空对象
db.read()
export default db
