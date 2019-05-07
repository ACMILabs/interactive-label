#!/bin/bash

rm /tmp/.X0-lock &>/dev/null || true

export DISPLAY=:0
export DBUS_SYSTEM_BUS_ADDRESS=unix:path=/host/run/dbus/system_bus_socket
echo "Starting X in 2 seconds"
sleep 2
startx &

# Hide the cursor
unclutter -display :0 -idle 0.1 &

# Start Flask
python -u app/main.py &

# Launch chromium browser in fullscreen on that page
chromium-browser --app=http://localhost:8080 --start-fullscreen --no-sandbox --user-data-dir --kiosk
