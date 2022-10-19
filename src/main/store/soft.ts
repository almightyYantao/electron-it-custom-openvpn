// import lowdb from 'lowdb'
// import * as FileAsync from 'lowdb/adapters/FileAsync'
const { app } = require('electron')
const path = require('path')
const STORE_PATH = app.getPath('userData')
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

// const adapter = new FileSync('db.json') // 存储到db.json文件中
// const db = low(adapter)
export type SoftInstallValue = {
  percent?: number
  success?: boolean
}

// 初始化lowdb读写的json文件名以及存储路径
const adapter = new FileSync(path.join(STORE_PATH, '/soft.json'))
const db = low(adapter)
export default db
