#!/bin/bash
# ====================================================================================
#                    TEST SCRIPT - SmartBot vs Original Bot
# ====================================================================================

pwd=`pwd`
echo "🎮 Starting AI Tank Test Match..."
echo "📍 SmartBot (Key 30) vs Original Bot (Key 11)"
echo ""

# Khởi động Server
osascript -e "tell application \"Terminal\" to do script \"cd '$pwd' && echo '🖥️ SERVER STARTING...' && node ./Server/Server.js -p 3011 -k 30 11 -r Replay/Last.glr\"" 

# Đợi server khởi động
sleep 2

# Khởi động SmartBot (Player 1)
osascript -e "tell application \"Terminal\" to do script \"cd '$pwd' && echo '🤖 SMART BOT (P1) STARTING...' && node ./Bots/Javascript/SmartBot.js -h 127.0.0.1 -p 3011 -k 30\"" 

# Khởi động Original Bot (Player 2)
osascript -e "tell application \"Terminal\" to do script \"cd '$pwd' && echo '🎯 ORIGINAL BOT (P2) STARTING...' && node ./Bots/Javascript/Client.js -h 127.0.0.1 -p 3011 -k 11\"" 

# Mở Observer
sleep 1
open "$pwd/Observer/index.html"

echo "✅ Match started! Watch in browser."
echo "📺 Observer opened at: Observer/index.html"
