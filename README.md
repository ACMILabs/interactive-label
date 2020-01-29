Label interactive
=================

An interactive label selector prototype running on a Raspberry Pi connected to a 12.3" screen.

## Installation on Raspbian

To install and run on a Raspbian OS Raspberry Pi for prototyping:

* Install [Pyenv](http://www.knight-of-pi.org/pyenv-for-python-version-management-on-raspbian-stretch/) and Python 3.7.3
* Install the required packages `pip install -r requirements.txt`
* Copy `config.tmpl.env` to `source config.env` and fill in the relevant environment variables
* Run `source config.env`
* Run `./scripts/pi.sh`

## Installation via Balena

* Clone this repo.
* Add the Balena remote
* Git push your changes
* Push your edits to Balena `git push balena master`

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
