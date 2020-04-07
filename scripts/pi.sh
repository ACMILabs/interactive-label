#!/bin/bash

rm /tmp/.X0-lock &>/dev/null || true

echo "Starting X in 2 seconds"
sleep 2
startx -- -nocursor &
sleep 20

# Hide the cursor
unclutter -display :0 -idle 0.1 &

# Start Flask
python -u -m app.main &

sleep 10

xset s off -dpms

# Launch chromium browser in fullscreen on that page

SCREEN_SCALE="${SCREEN_SCALE:-1.0}"
LABEL_INTERACTIVE_PORT="${LABEL_INTERACTIVE_PORT:-8081}"
chromium-browser --app=http://localhost:$LABEL_INTERACTIVE_PORT --start-fullscreen --no-sandbox --user-data-dir --kiosk --disable-dev-shm-usage --disable-backing-store-limit --force-device-scale-factor=$SCREEN_SCALE --check-for-update-interval=31449600 --simulate-outdated-no-au='Tue, 31 Dec 2099 23:59:59 GMT'

# For debugging
echo "Chromium browser exited unexpectedly."
free -h
echo "End of pi.sh ..."
