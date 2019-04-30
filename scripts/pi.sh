#!/bin/bash

# Start Flask
python -u app/main.py &

# Launch chromium browser in fullscreen on that page
chromium-browser --app=http://localhost --start-fullscreen
