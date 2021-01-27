Interactive Label
=================

An interactive label running on a small form factor PC connected to a touchscreen screen.

![Interactive Label CI](https://github.com/ACMILabs/interactive-label/workflows/Interactive%20Label%20CI/badge.svg)

## Features

* Takes label and background layout data from an XOS playlist via an API call
* Renders background layout in a fullscreen Chromium window
* When a visitor touches a region of the background, the applicable label is rendered
* A label can be closed, returning visitor to the background layout
* A label with many images is rendered as an interactive slideshow
* Receives tap information from a lens reader and attaches the appropriate label data, before forwarding the Tap message to XOS API

## Hardware

* Accuview OFU215CRUA 21" Touchscreen
* Dell Optiplex 3070 Micro i3 small form factor PC
* [A set of lens reader hardware](https://github.com/ACMILabs/lens-reader) if lens reader integration is needed

## Generate background layout files

See the README in the [background-image-tools](background-image-tools) folder

## Building PlaylistLabel region SVGs

Using your favourite graphics program, load up the background image for reference, then draw superimposed SVG regions and each one to svg files. Then open each file with a text editor, and copy paste the path data (starting with M and ending with Z) into its respective XOS Playlist Label "Region SVG" field.

**Illustrator instructions:**

- Create a new 1920 x 1080px file
- Place the background image of your choice and lock it (Object > Lock)
- Using a rectangle or circle tool, draw the clickable regions over the image
- Select those shapes you've made and turn them into compound paths (Object > Compound Path > Make)
- Export the SVG paths (File > Export > Export As)
- To see which blob of SVG relates to which region, load the SVG in a browser, open dev tools and inspect each SVG path. You can then copy between the M and Z into XOS for that region

## Run a development server with docker

* Run `cp config.tmpl.env config.env`
* Edit `config.env` to include auth token for connecting to a playlist API
* Run `cd development`
* Run `docker-compose up --build`
* Open a browser and visit: http://localhost:8081

## Run Javascript tests with docker

* Run `cd testing`
* Run `docker-compose up --build`
* In another Terminal run `docker exec -it javascripttests make linttestjs`

## Run Python tests with docker

* Run `cd development`
* Run `docker-compose up --build`
* In another Terminal run `docker exec -it labelinteractive make linttest`

## Run Python tests without docker

```
$ virtualenv .venv
$ pwd > ./.venv/lib/python3.7/site-packages/the.pth
$ source .venv/bin/activate
$ pip install -r requirements/test.txt
$ env $(cat config.env | xargs) make test
```

## Installation via Balena

* Clone this repo.
* Add the Balena remote
* Git push your changes
* Push your edits to Balena `git push balena master`

## Manual installation on Raspbian

To install and run on a Raspbian OS Raspberry Pi for prototyping:

* Install [Pyenv](http://www.knight-of-pi.org/pyenv-for-python-version-management-on-raspbian-stretch/) and Python 3.7.3
* Install the required packages `pip install -r requirements.txt`
* Copy `config.tmpl.env` to `source config.env` and fill in the relevant environment variables
* Run `source config.env`
* Run `./scripts/pi.sh`

## Keyboard input from a shell

* Install xdotool `sudo apt install xdotool`
* To zoom out in the browser `xdotool key Ctrl+minus`
* To refresh the page `xdotool key "ctrl+F5"`
