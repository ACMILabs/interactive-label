import json
import os
import sqlite3
from threading import Thread

import requests
from flask import Flask, jsonify, render_template, request
from kombu import Connection, Exchange, Queue

from errors import HTTPError

XOS_API_ENDPOINT = os.getenv('XOS_API_ENDPOINT')
AUTH_TOKEN = os.getenv('AUTH_TOKEN')
XOS_PLAYLIST_ID = os.getenv('XOS_PLAYLIST_ID')
XOS_MEDIA_PLAYER_ID = os.getenv('XOS_MEDIA_PLAYER_ID')
RABBITMQ_MQTT_HOST = os.getenv('RABBITMQ_MQTT_HOST')
RABBITMQ_MQTT_PORT = os.getenv('RABBITMQ_MQTT_PORT')
RABBITMQ_MEDIA_PLAYER_USER = os.getenv('RABBITMQ_MEDIA_PLAYER_USER')
RABBITMQ_MEDIA_PLAYER_PASS = os.getenv('RABBITMQ_MEDIA_PLAYER_PASS')
AMQP_URL = os.getenv('AMQP_URL')
MEDIA_PLAYER_ID = os.getenv('XOS_MEDIA_PLAYER_ID')
queue_name = f'mqtt-subscription-playback_{MEDIA_PLAYER_ID}'
routing_key = f'mediaplayer.{MEDIA_PLAYER_ID}'

media_player_exchange = Exchange('amq.topic', 'direct', durable=True)
playback_queue = Queue(queue_name, exchange=media_player_exchange, routing_key=routing_key)

app = Flask(__name__)
cached_playlist_json = f'playlist_{XOS_PLAYLIST_ID}.json'
# database_uri = 'file:messagedb?mode=memory&cache=shared'
database_uri = 'file:messagedb.db'

def initialise_db():
    """
    Initialise the database.
    """
    connection = sqlite3.connect(database_uri, uri=True)
    connection.execute('CREATE TABLE IF NOT EXISTS message(datetime text, playlist integer, mediaplayer integer, label integer, playback real, audiobuffer real, videobuffer real)')
    connection.close()

def get_record():
    """
    Get the latest record.
    """
    connection = sqlite3.connect(database_uri, uri=True)
    connection.row_factory = sqlite3.Row
    rows = connection.execute('SELECT * FROM message ORDER BY datetime DESC LIMIT 1')
    return rows.fetchone()

def write_record(values):
    """
    Write a record to the in memory database and remove the last one if more than one.
    """
    connection = sqlite3.connect(database_uri, uri=True)
    print(values)
    with connection:
        connection.execute('INSERT INTO message VALUES (?, ?, ?, ?, ?, ?, ?)', values)
    # delete all but 5 records
    with connection:
        connection.execute('DELETE FROM message WHERE datetime NOT IN (SELECT datetime FROM message ORDER BY datetime DESC LIMIT 5)')
    connection.close()

def process_media(body, message):
    datetime = body['datetime']
    playlist = body.get('playlist_id', 0)
    media_player = body.get('media_player_id')
    label = body.get('label_id', 0)
    playback = body.get('playback_position', 0)
    audio_buffer = body.get('audio_buffer', 0)
    video_buffer = body.get('video_buffer', 0)
    write_record([datetime, playlist, media_player, label, playback, audio_buffer, video_buffer])
    message.ack()

def download_playlist_label():
    # Download Playlist JSON from XOS
    try:
        playlist_label_json = requests.get(f'{XOS_API_ENDPOINT}playlists/{XOS_PLAYLIST_ID}/').json()

        # Write it to the file system
        with open(cached_playlist_json, 'w') as outfile:
            json.dump(playlist_label_json, outfile)

    except (requests.exceptions.HTTPError, requests.exceptions.ConnectionError) as e:
        print(f'Error downloading playlist JSON from XOS: {e}')

def get_events():
    # connections
    with Connection(AMQP_URL) as conn:

        # consume
        with conn.Consumer(playback_queue, callbacks=[process_media]) as consumer:
            # Process messages and handle events on all channels
            while True:
                conn.drain_events()    


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
    row = get_record()
    xos_tap['label'] = dict(row)
    # headers = {'Authorization': 'Token ' + AUTH_TOKEN}
    # response = requests.post(xos_tap_endpoint, json=xos_tap, headers=headers)
    # if response.status_code != requests.codes['created']:
    #     raise HTTPError('Could not save tap to XOS.')
    print(xos_tap)
    return jsonify(xos_tap)

if __name__ == '__main__':
    initialise_db()
    download_playlist_label()
    Thread(target=get_events).start()
    app.run(host='0.0.0.0', port=8080)
