#!/bin/bash

rm /tmp/.X0-lock &>/dev/null || true

startx &

# Wait for X to start
sleep 10

unclutter -display :0 -idle 0.1 &

python -u app/main.py &

# Wait for Flask to load
sleep 5

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
