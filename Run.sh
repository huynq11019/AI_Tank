#!/bin/bash

pwd=`pwd`

# Khởi động Server
osascript -e "tell application \"Terminal\" to do script \"cd '$pwd' && node ./Server/Server.js -p 3011 -k 30 11 -r Replay/Last.glr\"" 

# Đợi server khởi động
sleep 2

# Khởi động Bot 1
osascript -e "tell application \"Terminal\" to do script \"cd '$pwd' && node ./Bots/Javascript/Client.js -h 127.0.0.1 -p 3011 -k 30\"" 

# Khởi động Bot 2
osascript -e "tell application \"Terminal\" to do script \"cd '$pwd' && node ./Bots/Javascript/Client.js -h 127.0.0.1 -p 3011 -k 11\"" 

# Mở Observer trong trình duyệt (dùng lệnh open trên macOS)
sleep 1
open "$pwd/Observer/index.html"