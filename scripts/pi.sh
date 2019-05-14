#!/bin/bash

rm /tmp/.X0-lock &>/dev/null || true

echo "Starting X in 5 seconds"
sleep 5
startx &
sleep 10

# Hide the cursor
unclutter -display :0 -idle 0.1 &

# Start Flask
python -u app/main.py &

# Launch chromium browser in fullscreen on that page
chromium-browser --app=http://localhost:8080 --start-fullscreen --no-sandbox --user-data-dir --kiosk
