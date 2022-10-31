import { Checkbox, Input } from 'antd'
import { CheckboxChangeEvent } from 'antd/lib/checkbox'
import { useEffect, useState } from 'react'

function Plugin(): JSX.Element {
  const [shortcuts, setShortcuts] = useState<string[]>([])
  const onChange = (e: CheckboxChangeEvent): void => {
    console.log(`checked = ${e.target.checked}`)
  }

  useEffect(() => {
    // document.onkeydown = function (e: KeyboardEvent): void {
    //   shortcuts.push(e.key)
    //   setShortcuts([...shortcuts])
    // }
    // document.onkeyup = function (): void {
    //   console.log('===>up', shortcuts)
    //   shortcuts.()
    //   setShortcuts([...shortcuts])
    // }
  }, [])

  return (
    <div>
      <Checkbox onChange={onChange}>启用快捷插件</Checkbox>
      <Input placeholder="Basic usage" />
    </div>
  )
}

export default Plugin
