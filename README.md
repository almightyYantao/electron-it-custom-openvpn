# xiaoku-helper

小酷助手桌面端  
---
Electron: (https://www.electronjs.org/zh/docs/latest)  
前端技术宅:   
- Vite: (https://cn.vitejs.dev/guide/env-and-mode.html)
- React: (https://reactjs.org/)

## Project Setup

### Install

```bash
$ yarn add
```

### Development

```bash
$ yarn dev
```

### Build
```bash
# For windows
$ yarn build:win

# For macOS
$ yarn build:mac

# For Linux
$ yarn build:linux
```

### Mac 打包需要注意
需要手动配置下本地的环境变量，因为要公证一下 
Mac开发证书：https://developer.apple.com/account/resources/certificates/list  
根据教程配置本地开发证书：https://www.jianshu.com/p/0d89a18308b2  
打包密钥 应用专用密码(https://support.apple.com/zh-cn/HT204397)（不是您的 Apple ID 密码）  

```bash
export CI=true
export APPLE_ID=你的APPLE_ID
export APPLE_ID_PASS=应用专用密码
```
