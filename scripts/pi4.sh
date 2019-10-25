#!/bin/bash

# Remove the X server lock file so ours starts cleanly
rm /tmp/.X0-lock &>/dev/null || true

# Set the display to use
export DISPLAY=:0

# Set the DBUS address for sending around system messages
export DBUS_SYSTEM_BUS_ADDRESS=unix:path=/host/run/dbus/system_bus_socket

# start desktop manager
echo "STARTING X"
sleep 2
startx &
sleep 20

# Hide the cursor
unclutter -display :0 -idle 0.1 &

# Start Flask
python3 -u app/main.py &

sleep 10

# Launch chromium browser in fullscreen on that page
SCREEN_SCALE="${SCREEN_SCALE:-default 1.0}"
chromium-browser --app=http://localhost:8081 --start-fullscreen --no-sandbox --user-data-dir --kiosk --force-device-scale-factor=$SCREEN_SCALE

# For debugging
echo "Chromium browser exited unexpectedly."
free -h
echo "End of pi.sh ..."
