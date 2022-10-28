import { Alert, Segmented } from 'antd'
import { SegmentedLabeledOption } from 'antd/lib/segmented'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Printer from './Printer'
import '@renderer/assets/tools.less'
import { EVENT_APP_OPEN_URL } from '../../../../event'

function Tools(): JSX.Element {
  const [options, setOptions] = useState<SegmentedLabeledOption[]>([])

  useEffect(() => {
    setOptions([
      { label: t('tools.printer'), value: 0 }
      // { label: t('tools.selfHelp'), value: 1 }
    ])
  }, [])

  /**
   * 引入国际化
   */
  const { t } = useTranslation()

  const onChange = (value: number | string): void => {
    console.log(value)
  }

  return (
    <div className="tools">
      <Segmented
        options={options}
        defaultValue={0}
        onChange={(value): void => {
          onChange(value)
        }}
        className="tools-header"
      />
      <div className="tools-content">
        <div>
          {process.platform === 'darwin' ? (
            <Alert
              message={
                <span>
                  Mac OS电脑请首次安装需要安装驱动文件👉
                  <a
                    onClick={(): void =>
                      window.electron.ipcRenderer.send(
                        EVENT_APP_OPEN_URL,
                        'https://nextcloud.qunhequnhe.com/s/kzaSFPW5EgjTb4N'
                      )
                    }
                  >
                    【点击下载】
                  </a>
                </span>
              }
              type="warning"
            />
          ) : null}
        </div>
        <Printer />
      </div>
      {/* <webview
        src="https://it-course.qunhequnhe.com:8180/docs/intro/"
        style={{ width: '100%', height: '90vh' }}
        // eslint-disable-next-line react/no-unknown-property
        autosize
        // eslint-disable-next-line react/no-unknown-property
        useragent="Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; AS; rv:11.0) like Gecko wxwork"
      ></webview> */}
    </div>
  )
}

export default Tools
