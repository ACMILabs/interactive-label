#!/bin/bash

rm /tmp/.X0-lock &>/dev/null || true

echo "Starting X in 2 seconds"
sleep 2
startx &
sleep 20

# Hide the cursor
unclutter -display :0 -idle 0.1 &

# Start Flask
python -u app/main.py &

sleep 20

# Launch chromium browser in fullscreen on that page
chromium-browser --app=http://localhost:8080 --start-fullscreen --no-sandbox --user-data-dir --kiosk

while :
do
	echo "startx failed, so we will just wait here while you debug!"
	sleep 30
done
