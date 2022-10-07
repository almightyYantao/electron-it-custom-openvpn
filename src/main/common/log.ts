const log = require('electron-log')

log.transports.console.level = true
// 值得注意的是：输出到文件的时候，log.log的日志输出默认级别是warn。也就是说，最常被使用的info()是不会被输出的，这是个小坑。所以，可以使用下面的代码，修改输出到文件的时候，默认的输出日志级别。
log.transports.console.level = 'silly'
log.transports.console.format = '{h}:{i}:{s} {text}'

log.transports.file.fileName = 'xiaoku.log'
log.transports.file.maxSize = 1048576

export function xiaokuInfo(text: string): void {
  log.info(text)
}

export function xiaokuError(text: string): void {
  log.error(text)
}

export function xiaokuDebug(text: string): void {
  log.debug(text)
}

export default function xiaokuLog(level: string, text: any): void {
  switch (level) {
    case 'error':
      log.error(text)
      break
    case 'info':
      log.info(text)
      break
    case 'debug':
      log.debug(text)
      break
  }
}
