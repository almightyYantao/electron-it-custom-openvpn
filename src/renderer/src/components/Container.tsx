/* eslint-disable @typescript-eslint/explicit-function-return-type */
import Left from './Left'
import VPN from './child/Vpn'

function Container(): JSX.Element {
  return (
    <div className="container">
      <Left />
      <VPN />
    </div>
  )
}

export default Container
