#!/bin/bash

# Remove the X server lock file so ours starts cleanly
rm /tmp/.X0-lock &>/dev/null || true

# Set the display to use
export DISPLAY=:0

# Set the DBUS address for sending around system messages
export DBUS_SYSTEM_BUS_ADDRESS=unix:path=/host/run/dbus/system_bus_socket

# Set XDG_RUNTIME_DIR
mkdir -pv ~/.cache/xdgr
export XDG_RUNTIME_DIR=$PATH:~/.cache/xdgr

# Create Xauthority
touch /root/.Xauthority

# start desktop manager
echo "STARTING X"
sleep 2
startx -- -nocursor &
sleep 20

# Hide the cursor
unclutter -display :0 -idle 0.1 &

# Start Flask
python3 -u -m app.main &

sleep 10

xset s off -dpms

# Launch chromium browser in fullscreen on that page
SCREEN_SCALE="${SCREEN_SCALE:-1.0}"
LABEL_INTERACTIVE_PORT="${LABEL_INTERACTIVE_PORT:-8081}"
chromium-browser \
  --app=http://localhost:$LABEL_INTERACTIVE_PORT \
  --start-fullscreen \
  --no-sandbox \
  --user-data-dir \
  --kiosk \
  --disable-dev-shm-usage \
  --disable-backing-store-limit \
  --force-device-scale-factor=$SCREEN_SCALE \
  --check-for-update-interval=31449600 \
  --simulate-outdated-no-au='Tue, 31 Dec 2099 23:59:59 GMT'


# For debugging
echo "Chromium browser exited unexpectedly."
free -h
echo "End of pi.sh ..."

# Restart the container manually
echo "Restarting container..."
curl -H "Content-Type: application/json" -d "{\"serviceName\": \"$BALENA_SERVICE_NAME\"}" "$BALENA_SUPERVISOR_ADDRESS/v2/applications/$BALENA_APP_ID/restart-service?apikey=$BALENA_SUPERVISOR_API_KEY"
echo "End of pi.sh"
