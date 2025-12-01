#!/bin/bash
# ====================================================================================
#                    TEST SCRIPT - SmartBot vs SmartBot
# ====================================================================================

pwd=`pwd`
echo "🎮 Starting AI Tank Mirror Match..."
echo "📍 SmartBot (Key 30) vs SmartBot (Key 11)"
echo ""

# Khởi động Server
osascript -e "tell application \"Terminal\" to do script \"cd '$pwd' && echo '🖥️ SERVER STARTING...' && node ./Server/Server.js -p 3011 -k 30 11 -r Replay/Last.glr\"" 

# Đợi server khởi động
sleep 2

# Khởi động SmartBot 1
osascript -e "tell application \"Terminal\" to do script \"cd '$pwd' && echo '🤖 SMART BOT 1 STARTING...' && node ./Bots/Javascript/SmartBot.js -h 127.0.0.1 -p 3011 -k 30\"" 

# Khởi động SmartBot 2
osascript -e "tell application \"Terminal\" to do script \"cd '$pwd' && echo '🤖 SMART BOT 2 STARTING...' && node ./Bots/Javascript/SmartBot.js -h 127.0.0.1 -p 3011 -k 11\"" 

# Mở Observer
sleep 1
open "$pwd/Observer/index.html"

echo "✅ Mirror match started!"
