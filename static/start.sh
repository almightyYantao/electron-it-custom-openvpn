cd "$(dirname "${BASH_SOURCE[0]}")"
sudo rm -rf "/Library/Application Support/xiaoku-app/"

sudo mkdir -p "/Library/Application Support/xiaoku-app/"
sudo cp -r ./assets/config "/Library/Application Support/xiaoku-app/"
sudo cp -r ./assets/macos "/Library/Application Support/xiaoku-app/"
sudo cp close.sh "/Library/Application Support/xiaoku-app/macos/close.sh"
sudo cp dns.sh "/Library/Application Support/xiaoku-app/macos/dns.sh"
sudo cp assets/macos/proxy_conf_helper "/Library/Application Support/xiaoku-app/macos/proxy_conf_helper"

## 赋权限
sudo chmod a+rx "/Library/Application Support/xiaoku-app/macos"
sudo chmod +s "/Library/Application Support/xiaoku-app/macos"

sudo chmod a+rx "/Library/Application Support/xiaoku-app/macos/openvpn10"
sudo chmod +s "/Library/Application Support/xiaoku-app/macos/openvpn10"

sudo chmod a+rx "/Library/Application Support/xiaoku-app/macos/openvpn-executable"
sudo chmod +s "/Library/Application Support/xiaoku-app/macos/openvpn-executable"

sudo chmod a+rx "/Library/Application Support/xiaoku-app/macos/close.sh"
sudo chmod +s "/Library/Application Support/xiaoku-app/macos/close.sh"

sudo chmod a+rx "/Library/Application Support/xiaoku-app/macos/dns.sh"
sudo chmod +s "/Library/Application Support/xiaoku-app/macos/dns.sh"

sudo chmod a+rx "/Library/Application Support/xiaoku-app/macos/proxy_conf_helper"
sudo chmod +s "/Library/Application Support/xiaoku-app/macos/proxy_conf_helper"

sudo chmod a+rx "/Library/Application Support/xiaoku-app/macos/proxy_xiaoku_helper"
sudo chmod +s "/Library/Application Support/xiaoku-app/macos/proxy_xiaoku_helper"
echo done