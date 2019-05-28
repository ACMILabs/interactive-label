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

sleep 10

# Launch chromium browser in fullscreen on that page
chromium-browser --app=http://localhost:8080 --start-fullscreen --no-sandbox --user-data-dir --kiosk

# For debugging
echo "Chromium browser exited unexpectedly."
free -h
echo "End of pi.sh ..."
