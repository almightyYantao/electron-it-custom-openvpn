/**
 * 持久化存储
 * @param value Object对象 {}
 */
export function databaseSet(channel: string, value: any): void {
  window.electron.ipcRenderer.send(channel, value)
}
