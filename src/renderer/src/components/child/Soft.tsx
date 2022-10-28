import { getSoftList, SoftResult } from '@renderer/api/softConfig'
import { Tabs, Card, Avatar, Button, Spin, Divider, Modal } from 'antd'
import { useEffect, useState } from 'react'
import '@renderer/assets/soft.less'
import {
  EVENT_SOFT_DOWNLOAD_PERCENT,
  EVENT_SOFT_DOWNLOAD_SUCCESS,
  EVENT_SOFT_INSTALL_APP_STATUS,
  EVENT_SOFT_START_INSTALL
} from '../../../../event'
function Soft(): JSX.Element {
  const [softList, setSoftList] = useState<SoftResult[]>()
  // const [loadings, setLoadings] = useState<{ [key: string]: boolean }>({})
  // const [loadingTips, setLoadingTips] = useState<{ [key: string]: string }>({})
  const [loading, setLoading] = useState(false)
  const [percent, setPercent] = useState(0.0)
  const [tabls] = useState([
    { title: '办公软件', id: '2' },
    { title: '开发软件', id: '3' }
  ])

  /**
   * 初始化
   */
  useEffect(() => {
    getSoftListClass(2)
    if (sessionStorage.getItem(EVENT_SOFT_INSTALL_APP_STATUS) === 'true') {
      setLoading(true)
      window.electron.ipcRenderer.on(
        EVENT_SOFT_DOWNLOAD_PERCENT + '-' + sessionStorage.getItem('item-id'),
        (_event: Event, percent: number) => {
          setPercent(percent)
          // setLoadingTips({
          //   ...loadingTips,
          //   [`soft-${item.id}`]: percent + '%'
          // })
        }
      )
      setPercent(percent)
    }
  }, [])

  /**
   * 获取软件列表
   * @param typeId 类型ID
   */
  const getSoftListClass = (typeId: number): void => {
    getSoftList(typeId).then((result: any) => {
      setSoftList(result)
    })
  }

  /**
   * 卡片切换回调
   * @param activeKey 选中卡片的ID
   */
  const onTablesChange = (activeKey: string): any => {
    getSoftListClass(Number(activeKey))
    console.log(softList)
  }

  /**
   * 开始安装
   * @param item
   */
  const startInstall = (item: SoftResult): void => {
    // setLoadings({ ...loadings, [`soft-${item.id}`]: true })
    sessionStorage.setItem(EVENT_SOFT_INSTALL_APP_STATUS, 'true')
    sessionStorage.setItem('item-id', String(item.id))
    setLoading(true)
    window.electron.ipcRenderer.send(
      EVENT_SOFT_START_INSTALL,
      item.id,
      item.downUrl,
      item.execSilent,
      item
    )
    window.electron.ipcRenderer.on(
      EVENT_SOFT_DOWNLOAD_PERCENT + '-' + item.id,
      (_event: Event, percent: number) => {
        setPercent(percent)
        // setLoadingTips({
        //   ...loadingTips,
        //   [`soft-${item.id}`]: percent + '%'
        // })
      }
    )
    window.electron.ipcRenderer.once(
      EVENT_SOFT_DOWNLOAD_SUCCESS + item.id,
      (_event: Event, result: string) => {
        if (result !== 'success') {
          Modal.error({
            title: '安装失败',
            content: result
          })
        }
        // setLoadings((pref) => ({ ...pref, [`soft-${item.id}`]: false }))
        setLoading(false)
        sessionStorage.setItem(EVENT_SOFT_INSTALL_APP_STATUS, 'false')
        window.electron.ipcRenderer.removeAllListeners(EVENT_SOFT_DOWNLOAD_PERCENT + '-' + item.id)
      }
    )
  }

  return (
    <Spin
      spinning={loading}
      tip={percent}
      // spinning={
      //   loadings['soft-' + item.id] === null || loadings['soft-' + item.id] === undefined
      //     ? false
      //     : loadings['soft-' + item.id]
      // }
      // tip={
      //   loadingTips['soft-' + item.id] === null || loadingTips['soft-' + item.id] === undefined
      //     ? 0
      //     : loadingTips['soft-' + item.id]
      // }
    >
      <Tabs
        defaultActiveKey="1"
        type="card"
        onChange={(activeKey): any => onTablesChange(activeKey)}
        size="small"
        items={tabls.map((_) => {
          return {
            label: _.title,
            key: _.id,
            children: (
              <div className="soft-card-main">
                {softList?.map((item: SoftResult) => {
                  return (
                    <div className="soft-card" key={item.id}>
                      <Card hoverable={true}>
                        <Card.Meta
                          avatar={<Avatar src={item.icon} />}
                          title={item.title}
                          description={item.desc}
                        />
                        <Divider />
                        <div style={{ textAlign: 'center' }}>
                          <Button type="primary" onClick={(): void => startInstall(item)}>
                            点击安装
                          </Button>
                        </div>
                      </Card>
                    </div>
                  )
                })}
              </div>
            )
          }
        })}
      />
    </Spin>
  )
}

export default Soft
