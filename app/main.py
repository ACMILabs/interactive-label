import json
import os
import sqlite3
from threading import Thread

import requests
from flask import Flask, jsonify, render_template, request

from errors import HTTPError

XOS_API_ENDPOINT = os.getenv('XOS_API_ENDPOINT')
AUTH_TOKEN = os.getenv('AUTH_TOKEN')
XOS_LABEL_ID = os.getenv('XOS_LABEL_ID')


app = Flask(__name__)
cached_label_json = f'label_{XOS_LABEL_ID}.json'


def download_label():
    # Download Playlist JSON from XOS
    try:
        label_json = requests.get(f'{XOS_API_ENDPOINT}labels/{XOS_LABEL_ID}/').json()

        # Write it to the file system
        with open(cached_label_json, 'w') as outfile:
            json.dump(label_json, outfile)

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
def label():
    # Read in the cached JSON
    with open(cached_label_json, encoding='utf-8') as json_file:
        json_data = json.load(json_file)

    return render_template(
        'label.html',
        label_json=json_data,
        xos={
            'label_endpoint': f'{XOS_API_ENDPOINT}labels/',
        }
    )


@app.route('/json')
def label_json():
    # Read in the cached JSON
    with open(cached_label_json, encoding='utf-8') as json_file:
        json_data = json.load(json_file)
    
    return jsonify(json_data)


@app.route('/tap', methods=['POST'])
def collect_item():
    """
    Collect a tap and forward it on to XOS with the label ID.
    """
    xos_tap_endpoint = f'{XOS_API_ENDPOINT}taps/'
    xos_tap = dict(request.get_json())
    record = {"label_id": 1}
    xos_tap['label'] = record.pop('label_id', None)
    xos_tap.setdefault('data', {})['playlist_info'] = record
    headers = {'Authorization': 'Token ' + AUTH_TOKEN}
    response = requests.post(xos_tap_endpoint, json=xos_tap, headers=headers)
    if response.status_code != requests.codes['created']:
        raise HTTPError('Could not save tap to XOS.')
    return jsonify(xos_tap), response.status_code

if __name__ == '__main__':
    download_label()
    app.run(host='0.0.0.0', port=8080)
