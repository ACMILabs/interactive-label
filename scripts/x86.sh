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

# Start desktop manager
echo "Starting X"
startx -- -nocursor &

# TODO: work out how to detect X has started
sleep 10

# Print all of the current displays used by running processes
echo "Displays in use after starting X"
DISPLAYS=`ps -u $(id -u) -o pid= | \
  while read pid; do
    cat /proc/$pid/environ 2>/dev/null | tr '\0' '\n' | grep '^DISPLAY=:'
  done | sort -u`
echo $DISPLAYS

# If DISPLAYS doesn't include 0.0 set the new display
if [[ $DISPLAYS == *"0.0"* ]]; then
  echo "Display includes 0.0 so let's launch..."
else
  LAST_DISPLAY=`ps -u $(id -u) -o pid= | \
    while read pid; do
      cat /proc/$pid/environ 2>/dev/null | tr '\0' '\n' | grep '^DISPLAY=:'
    done | sort -u | tail -n1`
  echo "0.0 is missing, so setting display to: ${LAST_DISPLAY}"
  export $LAST_DISPLAY
fi

# Prevent blanking and screensaver
xset s off -dpms

# Hide the cursor
unclutter -idle 0.1 &

# Cache playlist and images
python -u -m app.cache

# Start Flask
python -u app/main.py &

# Wait for Flask to load
sleep 5

# Calibrate touch screen
if [[ -v TOUCH_CALIBRATION ]]; then
  xinput set-int-prop "eGalax Inc. USB TouchController Touchscreen" "Evdev Axis Calibration" $TOUCH_CALIBRATION
fi

if [[ -v TRANSFORM_CALIBRATION ]]; then
  xinput set-prop "eGalax Inc. USB TouchController Touchscreen" "Coordinate Transformation Matrix" $TRANSFORM_CALIBRATION
fi

LIBVA_DRIVER_NAME=iHD chromium http://localhost:8081 \
  --no-sandbox \
  --enable-native-gpu-memory-buffers --force-gpu-rasterization --enable-oop-rasterization --enable-zero-copy \
  --ignore-gpu-blacklist \
  --window-position=0,0 --window-size=1920,1080 \
  --start-fullscreen --kiosk --test-type \
  --disable-dev-shm-usage --disable-backing-store-limit

  # --enable-logging=stderr --v=1
# Running as root
# https://software.intel.com/en-us/articles/software-vs-gpu-rasterization-in-chromium
# Intel Kaby Lake Graphics are blacklisted
# All required for screen size
# Logging

# Use this for remote debug
#chromium --no-sandbox --disable-gpu --remote-debugging-address=0.0.0.0 --remote-debugging-port=9222 --headless http://localhost:8080

# For debugging
echo "Chromium browser exited unexpectedly."
free -h

# Restart the container
echo "Restarting container..."
curl -H "Content-Type: application/json" -d "{\"serviceName\": \"$BALENA_SERVICE_NAME\"}" "$BALENA_SUPERVISOR_ADDRESS/v2/applications/$BALENA_APP_ID/restart-service?apikey=$BALENA_SUPERVISOR_API_KEY"
echo "End of x86.sh ..."
