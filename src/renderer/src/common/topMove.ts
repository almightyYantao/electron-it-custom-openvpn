// 在顶部插入一个的dom 用作窗口的拖放使用
export default function initTopDrag(): void {
  const topDiv = document.createElement('div') // 创建节点
  topDiv.style.position = 'fixed' // 一直在顶部
  topDiv.style.top = '2px'
  topDiv.style.left = '2px'
  topDiv.style.height = '18px' // 顶部20px才可拖动
  topDiv.style.width = 'calc(100vw - 122px)' // 宽度100%
  topDiv.style.zIndex = '9999' // 悬浮于最外层
  // topDiv.style.pointerEvents = 'none' // 用于点击穿透
  topDiv.style['-webkit-user-select'] = 'none' // 禁止选择文字
  topDiv.style['-webkit-app-region'] = 'drag' // 拖动
  topDiv.id = 'drag-top-line'
  document.body.appendChild(topDiv) // 添加节点
}
