#!/bin/bash
# IFS=$'\n' # 修改默认分隔符
# OLDIFS="$IFS"

# for i in $(/usr/sbin/networksetup -listallnetworkservices)
# do
#     # 第一行不进行DNS设置，后面的所有网卡都进行DNS设置
#     if [ "$i" != "An asterisk (*) denotes that a network service is disabled." ] ; then
# 	    if [[ "$i" =~ "Bluetooth" || "$i" =~ "Bridge" ]] ; then
# 	      echo "$i network service"
# 	    else
# 	      echo $i;
#       	echo "/usr/sbin/networksetup -setdnsservers \"$i\" empty";
#        	/usr/sbin/networksetup -setdnsservers "$i" empty
#     	fi
#     fi
# done
/Library/Application\ Support/xiaoku-app/macos/proxy_xiaoku_helper -m dns -d "";

dscacheutil -flushcache
killall -HUP mDNSResponder

kill -9 $(ps -ef | grep openvpn-executable | grep -v grep | awk '{ print $2 }')

"/Library/Application Support/xiaoku-app/macos/proxy_conf_helper" -m off;

echo done;
