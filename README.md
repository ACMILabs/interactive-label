Interactive Label
=================

An interactive label running on a small form factor PC connected to a touchscreen screen.

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

## Run tests without docker

```
$ virtualenv .venv
$ pwd > ./.venv/lib/python3.7/site-packages/the.pth
$ source .venv/bin/activate
$ pip install -r requirements/test.txt
$ env $(cat config.env | xargs) make test
```
