import json
import os

import requests
from flask import Flask, jsonify, render_template, request

from errors import HTTPError

XOS_API_ENDPOINT = os.getenv('XOS_API_ENDPOINT')
AUTH_TOKEN = os.getenv('AUTH_TOKEN')
XOS_PLAYLIST_ID = os.getenv('XOS_PLAYLIST_ID')
XOS_MEDIA_PLAYER_ID = os.getenv('XOS_MEDIA_PLAYER_ID')
RABBITMQ_MQTT_HOST = os.getenv('RABBITMQ_MQTT_HOST')
RABBITMQ_MQTT_PORT = os.getenv('RABBITMQ_MQTT_PORT')
RABBITMQ_MEDIA_PLAYER_USER = os.getenv('RABBITMQ_MEDIA_PLAYER_USER')
RABBITMQ_MEDIA_PLAYER_PASS = os.getenv('RABBITMQ_MEDIA_PLAYER_PASS')

app = Flask(__name__)
cached_playlist_json = f'playlist_{XOS_PLAYLIST_ID}.json'


def download_playlist_label():
    # Download Playlist JSON from XOS
    try:
        playlist_label_json = requests.get(f'{XOS_API_ENDPOINT}playlists/{XOS_PLAYLIST_ID}/').json()

        # Write it to the file system
        with open(cached_playlist_json, 'w') as outfile:
            json.dump(playlist_label_json, outfile)

    except (requests.exceptions.HTTPError, requests.exceptions.ConnectionError) as e:
        print(f'Error downloading playlist JSON from XOS: {e}')


@app.errorhandler(HTTPError)
def handle_http_error(error):
    """
    Format error for response.
    """
    response = jsonify(error.to_dict())
    response.status_code = error.status_code
    return response


@app.route('/')
def playlist_label():
    # Read in the cached JSON
    with open(cached_playlist_json, encoding='utf-8') as json_file:
        json_data = json.load(json_file)

    return render_template(
        'playlist.html',
        playlist_json=json_data,
        mqtt={
            'host': RABBITMQ_MQTT_HOST,
            'port': RABBITMQ_MQTT_PORT,
            'username': RABBITMQ_MEDIA_PLAYER_USER,
            'password': RABBITMQ_MEDIA_PLAYER_PASS
        },
        xos={
            'playlist_endpoint': f'{XOS_API_ENDPOINT}playlists/',
            'media_player_id': XOS_MEDIA_PLAYER_ID
        }
    )


@app.route('/json')
def playlist_json():
    # Read in the cached JSON
    with open(cached_playlist_json, encoding='utf-8') as json_file:
        json_data = json.load(json_file)
    
    return jsonify(json_data)


@app.route('/tap', methods=['POST'])
def collect_item():
    """
    Collect a tap and forward it on to XOS with the label ID.
    """
    tap = request.get_json()
    xos_tap_endpoint = f'{XOS_API_ENDPOINT}taps/'
    xos_tap = dict(tap)
    xos_tap['label'] = '1'
    headers = {'Authorization': 'Token ' + AUTH_TOKEN}
    response = requests.post(xos_tap_endpoint, json=xos_tap, headers=headers)
    if response.status_code != requests.codes['created']:
        raise HTTPError('Could not save tap to XOS.')

    return jsonify(xos_tap)

if __name__ == '__main__':
    download_playlist_label()
    app.run(host='0.0.0.0', port=8080)
