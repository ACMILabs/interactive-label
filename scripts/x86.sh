#!/bin/bash

rm /tmp/.X0-lock &>/dev/null || true

startx &
sleep 10

unclutter -display :0 -idle 0.1 &

python -u app/main.py &

sleep 5

#chromium --app=http://localhost:8081 --enable-accelerated-video --enable-accelerated-mjpeg-decode --ignore-gpu-blacklist --enable-gpu-rasterization --enable-oop-rasterization --enable-zero-copy --enable-native-gpu-memory-buffers --test-type --start-fullscreen --user-data-dir --kiosk --disable-application-cache --incognito --no-sandbox
LIBVA_DRIVER_NAME=iHD chromium http://localhost:8081 \
  --no-sandbox \
  --enable-native-gpu-memory-buffers --force-gpu-rasterization --enable-oop-rasterization --enable-zero-copy \
  --ignore-gpu-blacklist \
  --window-position=0,0 --window-size=1920,1080 \
  --start-fullscreen --kiosk --test-type
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
echo "End of pi.sh ..."
