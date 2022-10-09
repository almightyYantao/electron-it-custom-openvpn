/* eslint-disable @typescript-eslint/explicit-function-return-type */
import Left from '@renderer/components/Left'
import VPN from '@renderer/components/child/Vpn'
import initTopDrag from '@renderer/common/topMove'
window.addEventListener('DOMContentLoaded', function onDOMContentLoaded() {
  initTopDrag()
})
function Container(): JSX.Element {
  return (
    <div className="container">
      <Left />
      <VPN />
    </div>
  )
}

export default Container
