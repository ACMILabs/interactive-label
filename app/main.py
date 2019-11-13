import json
import os

import requests
import sentry_sdk
from flask import Flask, abort, jsonify, render_template, request
from flask_cors import CORS, cross_origin
from peewee import (CharField, DoesNotExist, IntegerField, IntegrityError,
                    Model, SqliteDatabase)
from playhouse.shortcuts import model_to_dict
from sentry_sdk.integrations.flask import FlaskIntegration

from app.errors import HTTPError

XOS_API_ENDPOINT = os.getenv('XOS_API_ENDPOINT')
XOS_TAPS_ENDPOINT = os.getenv('XOS_TAPS_ENDPOINT', f'{XOS_API_ENDPOINT}taps/')
AUTH_TOKEN = os.getenv('AUTH_TOKEN')
XOS_PLAYLIST_ID = os.getenv('XOS_PLAYLIST_ID', '1')
SENTRY_ID = os.getenv('SENTRY_ID')
CACHED_PLAYLIST_JSON = f'playlist_{XOS_PLAYLIST_ID}.json'

# Setup Sentry
sentry_sdk.init(
    dsn=SENTRY_ID,
    integrations=[FlaskIntegration()]
)

# instantiate the peewee database
db = SqliteDatabase('label.db')  # pylint: disable=C0103
app = Flask(__name__)  # pylint: disable=C0103
CORS(app)


class Label(Model):
    datetime = CharField(primary_key=True)
    label_id = IntegerField()
    playlist_id = IntegerField()

    class Meta:  # pylint: disable=R0903
        database = db


def download_playlist():
    # Download Playlist JSON from XOS
    try:
        playlist_json_data = requests.get(f'{XOS_API_ENDPOINT}playlists/{XOS_PLAYLIST_ID}/').json()

        # Write it to the file system
        with open(CACHED_PLAYLIST_JSON, 'w') as outfile:
            json.dump(playlist_json_data, outfile)

    except (requests.exceptions.HTTPError, requests.exceptions.ConnectionError) as error:
        print(f'Error downloading playlist JSON from XOS: {error}')
        sentry_sdk.capture_exception(error)


@app.errorhandler(HTTPError)
def handle_http_error(error):
    """
    Format error for response.
    """
    response = jsonify(error.to_dict())
    response.status_code = error.status_code
    sentry_sdk.capture_exception(error)
    return response


@app.route('/')
def playlist():
    # Read in the cached JSON
    with open(CACHED_PLAYLIST_JSON, encoding='utf-8') as json_file:
        json_data = json.load(json_file)

    # Remove playlist items that don't have a label
    for idx, item in enumerate(json_data['playlist_labels']):
        if item['label'] is None:
            json_data['playlist_labels'].pop(idx)

    return render_template(
        'playlist.html',
        playlist_json=json_data,
        xos={
            'playlist_endpoint': f'{XOS_API_ENDPOINT}playlists/',
        }
    )


@app.route('/api/playlist/')
def playlist_json():
    # Read in the cached JSON
    with open(CACHED_PLAYLIST_JSON, encoding='utf-8') as json_file:
        json_data = json.load(json_file)

    return jsonify(json_data)


@app.route('/api/labels/', methods=['POST'])
@cross_origin()
def select_label():
    """
    Save the Label ID that was selected to a local database with the Date, and Playlist ID.
    """
    # pylint: disable=E1120

    label_selected = dict(request.get_json())

    try:
        # Save the label selected to the database
        label = Label.create(
            datetime=label_selected['datetime'],
            playlist_id=label_selected.get('playlist_id', 0),
            label_id=label_selected.get('label_id', 0),
        )
        # Clear out other messages beyond the last 5
        delete_records = Label.delete().where(
            Label.datetime.not_in(
                Label.select(Label.datetime).order_by(Label.datetime.desc()).limit(5)
            )
        )
        delete_records.execute()

    except IntegrityError:
        # Label deselected, so delete the data in the database
        Label.delete().execute()
        return jsonify({
            'datetime': label_selected['datetime'],
            'playlist_id': None,
            'label_id': None
        })

    return jsonify(model_to_dict(label))


@app.route('/api/taps/', methods=['POST'])
@cross_origin()
def collect_item():
    """
    Collect a tap and forward it on to XOS with the label ID.
    """
    xos_tap = dict(request.get_json())
    try:
        record = model_to_dict(Label.select().order_by(Label.datetime.desc()).get())
    except DoesNotExist:
        return HTTPError('No label selected.'), abort(404, 'No label selected.')
    xos_tap['label'] = record.pop('label_id', None)
    xos_tap.setdefault('data', {})['playlist_info'] = record
    headers = {'Authorization': 'Token ' + AUTH_TOKEN}
    response = requests.post(XOS_TAPS_ENDPOINT, json=xos_tap, headers=headers)
    if response.status_code != requests.codes['created']:
        raise HTTPError('Could not save tap to XOS.')
    return jsonify(xos_tap), response.status_code


if __name__ == '__main__':
    db.create_tables([Label])
    download_playlist()
    app.run(host='0.0.0.0', port=8081)
