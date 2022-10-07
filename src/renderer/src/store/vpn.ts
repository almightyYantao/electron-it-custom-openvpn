import Datastore from 'lowdb'
const FileSync = require('lowdb/adapters/FileSync') // 同步模块
const path = require('path')

const { app } = require('@electron/remote') // 根据process.type来分辨在哪种模式使用哪种模块

const STORE_PATH = app.getPath('userData') // 获取electron应用的用户目录
// 判断路径是否存在，若不存在，就创建
// if (process.type !== 'renderer') {
//   if (!fs.pathExistsSync(STORE_PATH)) {
//     fs.mkdirpSync(STORE_PATH)
//   }
// }

// 初始化lowdb读写的json文件名以及存储路径
const adapter = new FileSync(path.join(STORE_PATH, '/renderer_vpn.json'))

const db = Datastore(adapter) // lowdb接管该文件

db.defaults({ configValue: 'slb', isConnect: false }).write()
export default db // 暴露出去
