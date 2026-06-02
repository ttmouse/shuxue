#!/bin/bash

SERVER_IP="38.55.192.139"
SERVER_USER="root"
SERVER_PASS="Pf-^lM3Y=G"
REMOTE_DIR="/root/twitter-hot/math-game"

cd "$(dirname "$0")"

echo "📦 打包文件..."
tar -czf math-game.tar.gz \
  index.html \
  css/style.css \
  js/lucide.js \
  js/knowledge.js \
  js/questions.js \
  js/wrongbook.js \
  js/stats.js \
  js/sound.js \
  js/framework.js \
  js/app.js \
  js/modes/game24.js \
  js/modes/clever.js \
  js/modes/card-draw.js \
  manifest.json \
  service-worker.js \
  icons/icon-192.svg

echo "🚚 上传到服务器..."
sshpass -p "$SERVER_PASS" scp -o StrictHostKeyChecking=no math-game.tar.gz $SERVER_USER@$SERVER_IP:/root/

echo "🛠️  服务器部署..."
sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP "
set -e
mkdir -p $REMOTE_DIR
tar -xzf /root/math-game.tar.gz -C $REMOTE_DIR
rm /root/math-game.tar.gz
echo '文件已解压到 $REMOTE_DIR'
"

echo "🧹 清理..."
rm math-game.tar.gz

echo ""
echo "✅ 部署完成！"
echo "🌐 https://ttmouse.com/math-game/"
