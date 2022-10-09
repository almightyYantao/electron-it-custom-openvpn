// import { Low, JSONFile } from 'lowdb'
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const { app } = require('electron')
const path = require('path')
const STORE_PATH = app.getPath('userData')

export type BaseConfig = {
  appPath: string
  staticPath: string
  version: string
  gpu?: boolean
}

// 初始化lowdb读写的json文件名以及存储路径
const adapter = new FileSync(path.join(STORE_PATH, '/base-config.json'))
console.log(path.join(STORE_PATH, '/base-config.json'))
const db = low(adapter)
// 这里要把原来的数据读取出来，要不然返回的是一个空对象
db.read()
export default db
