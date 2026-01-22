# 画面回転
xrandr --output HDMI-1 --rotate right

# ソースコピー
scp -r ~/workspace/signage dietpi@192.168.10.84:~/workspace/
rsync -av --delete --exclude='.git' ~/workspace/signage/ dietpi@192.168.20.20:~/workspace/signage-p5/
rsync -av --delete ~/workspace/signage/ dietpi@192.168.20.20:~/workspace/signage-p5/

# サーバー立ち上げ
http-server -p 8000 -a localhost
## URL
http://localhost:8000/countdown/?debug=1

# カウントダウン表示
chromium --app="file://$HOME/workspace/signage/countdown/countdown.html"

chromium --app="http://localhost:8000/workspace/signage/countdown/?debug"

chromium \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --incognito \
  "http://localhost:8000/workspace/signage/countdown/?debug"


# シャットダウン
shutdown -h 18:00

# 自動実行
sudo crontab -e

## 21:00 に Chromium を強制終了
00 20 * * * pkill chromium
00 20 * * * pkill lxterminal
01 20 * * * echo "kill executed..."

## 9:00 に kiosk を再起動（Chromium起動スクリプトを実行）
#0 9 * * * /home/dietpi/workspace/signage/kiosk.sh
55 08 * * * sudo reboot