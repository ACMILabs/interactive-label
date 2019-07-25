import json
import os
import sqlite3
from threading import Thread

import requests
from flask import Flask, jsonify, render_template, request
from kombu import Connection, Exchange, Queue
from peewee import CharField, FloatField, IntegerField, Model, SqliteDatabase
from playhouse.shortcuts import model_to_dict

from errors import HTTPError

XOS_API_ENDPOINT = os.getenv('XOS_API_ENDPOINT')
AUTH_TOKEN = os.getenv('AUTH_TOKEN')
XOS_PLAYLIST_ID = os.getenv('XOS_PLAYLIST_ID')
XOS_MEDIA_PLAYER_ID = os.getenv('XOS_MEDIA_PLAYER_ID')
RABBITMQ_MQTT_HOST = os.getenv('RABBITMQ_MQTT_HOST')
RABBITMQ_MQTT_PORT = os.getenv('RABBITMQ_MQTT_PORT')
RABBITMQ_MEDIA_PLAYER_USER = os.getenv('RABBITMQ_MEDIA_PLAYER_USER')
RABBITMQ_MEDIA_PLAYER_PASS = os.getenv('RABBITMQ_MEDIA_PLAYER_PASS')
AMQP_PORT = os.getenv('AMQP_PORT')
MEDIA_PLAYER_ID = os.getenv('XOS_MEDIA_PLAYER_ID')

amqp_url = f'amqp://{RABBITMQ_MEDIA_PLAYER_USER}:{RABBITMQ_MEDIA_PLAYER_PASS}@{RABBITMQ_MQTT_HOST}:{AMQP_PORT}//'
queue_name = f'mqtt-subscription-playback_{MEDIA_PLAYER_ID}'
routing_key = f'mediaplayer.{MEDIA_PLAYER_ID}'

media_player_exchange = Exchange('amq.topic', 'direct', durable=True)
playback_queue = Queue(queue_name, exchange=media_player_exchange, routing_key=routing_key)

app = Flask(__name__)
cached_playlist_json = f'playlist_{XOS_PLAYLIST_ID}.json'
# instantiate the peewee database
db = SqliteDatabase('message.db')


class Message(Model):
    datetime = CharField(primary_key=True)
    label_id = IntegerField()
    playlist_id = IntegerField()
    media_player_id = IntegerField()
    playback_position = FloatField()
    audio_buffer = FloatField(null=True)
    video_buffer = FloatField(null=True)
    class Meta:
        database = db


def download_playlist_label():
    # Download Playlist JSON from XOS
    try:
        playlist_label_json = requests.get(f'{XOS_API_ENDPOINT}playlists/{XOS_PLAYLIST_ID}/').json()

        # Write it to the file system
        with open(cached_playlist_json, 'w') as outfile:
            json.dump(playlist_label_json, outfile)

    except (requests.exceptions.HTTPError, requests.exceptions.ConnectionError) as e:
        print(f'Error downloading playlist JSON from XOS: {e}')


def process_media(body, message):
    Message.create(
        datetime = body['datetime'],
        playlist_id = body.get('playlist_id', 0),
        media_player_id = body.get('media_player_id', 0),
        label_id = body.get('label_id', 0),
        playback_position = body.get('playback_position', 0),
        audio_buffer = body.get('audio_buffer', 0),
        video_buffer = body.get('video_buffer', 0),       
    )
    # clear out other messages beyond the last 5
    delete_records = Message.delete().where(
        Message.datetime.not_in(Message.select(Message.datetime).order_by(Message.datetime.desc()).limit(5))
    )
    delete_records.execute()
    message.ack()

def get_events():
    # connections
    with Connection(amqp_url) as conn:
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
    xos_tap_endpoint = f'{XOS_API_ENDPOINT}taps/'
    xos_tap = dict(request.get_json())
    record = model_to_dict(Message.select().order_by(Message.datetime.desc()).get())
    xos_tap['label'] = record.pop('label_id', None)
    xos_tap.setdefault('data', {})['playlist_info'] = record
    headers = {'Authorization': 'Token ' + AUTH_TOKEN}
    response = requests.post(xos_tap_endpoint, json=xos_tap, headers=headers)
    if response.status_code != requests.codes['created']:
        raise HTTPError('Could not save tap to XOS.')
    return jsonify(xos_tap), response.status_code

if __name__ == '__main__':
    db.create_tables([Message])
    download_playlist_label()
    Thread(target=get_events).start()
    app.run(host='0.0.0.0', port=8080)
