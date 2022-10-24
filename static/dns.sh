#!/bin/bash -e
# 取出OpenVPN连接后返回的push dns
CONN_ID="$(echo ${config} | /sbin/md5)"
echo "$CONN_ID";
for optionname in ${!foreign_option_*} ; do
  option="${!optionname}"
  echo $option
  part1=$(echo "$option" | cut -d " " -f 1)
  if [ "$part1" == "dhcp-option" ] ; then
    part2=$(echo "$option" | cut -d " " -f 2)
    part3=$(echo "$option" | cut -d " " -f 3)
    if [ "$part2" == "DNS" ] ; then
      if [ "$DNS_SERVERS" == "" ] ; then
        DNS_SERVERS="$part3"
      # else
        # DNS_SERVERS="$DNS_SERVERS $part3"
      fi
    fi
    if [[ "$part2" == "DOMAIN" || "$part2" == "DOMAIN-SEARCH" ]] ; then
      DNS_SEARCH="$DNS_SEARCH $part3"
    fi
  fi
done

echo $DNS_SERVERS;

/Library/Application\ Support/xiaoku-app/macos/proxy_xiaoku_helper -m dns -d $DNS_SERVERS;

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
#       	echo "/usr/sbin/networksetup -setdnsservers \"$i\" $DNS_SERVERS";
#        	/usr/sbin/networksetup -setdnsservers "$i" $DNS_SERVERS
#     	fi
#     fi
# done

if [ "$PAC_URL" != "" ] ; then
 /Library/Application\ Support/xiaoku-app/macos/proxy_xiaoku_helper -m auto -u $PAC_URL;
fi

echo done;