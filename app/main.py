import json
import os
import requests

from flask import jsonify, Flask, render_template


app = Flask(__name__)

XOS_PLAYLIST_ENDPOINT = os.getenv('XOS_PLAYLIST_ENDPOINT')
XOS_PLAYLIST_ID = os.getenv('XOS_PLAYLIST_ID')
RABBITMQ_MQTT_HOST = os.getenv('RABBITMQ_MQTT_HOST')
RABBITMQ_MQTT_PORT = os.getenv('RABBITMQ_MQTT_PORT')
RABBITMQ_MEDIA_PLAYER_USER = os.getenv('RABBITMQ_MEDIA_PLAYER_USER')
RABBITMQ_MEDIA_PLAYER_PASS = os.getenv('RABBITMQ_MEDIA_PLAYER_PASS')

cached_playlist_json = f'playlist_{XOS_PLAYLIST_ID}.json'

# Download Playlist JSON from XOS
try:
    playlist_label_json = requests.get(f'{XOS_PLAYLIST_ENDPOINT}{XOS_PLAYLIST_ID}/').json()

    # Write it to the file system
    with open(cached_playlist_json, 'w') as outfile:
        json.dump(playlist_label_json, outfile)

except (requests.exceptions.HTTPError, requests.exceptions.ConnectionError) as e:
    print(f'Error downloading playlist JSON from XOS: {e}')


@app.route('/')
def playlist_label(playlist_json=None, mqtt=None, xos=None):
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
            'playlist_endpoint': XOS_PLAYLIST_ENDPOINT
        }
    )


@app.route('/json')
def playlist_json():
    # Read in the cached JSON
    with open(cached_playlist_json, encoding='utf-8') as json_file:
        json_data = json.load(json_file)
    
    return jsonify(json_data)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=80)
