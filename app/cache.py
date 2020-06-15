import json.decoder
import os
from urllib.parse import urlparse

import requests
import sentry_sdk

XOS_API_ENDPOINT = os.getenv('XOS_API_ENDPOINT')
XOS_PLAYLIST_ID = os.getenv('XOS_PLAYLIST_ID', '1')
SENTRY_ID = os.getenv('SENTRY_ID')

sentry_sdk.init(dsn=SENTRY_ID)

CACHE_DIR = os.getenv('CACHE_DIR', '/data/')


def get_image_name(image_url):
    """
    Get the base name of an image.
    """
    return urlparse(image_url).path.split('/')[-1]


def cache_image(image_url):
    """
    Download and save an image in the CACHE_DIR.
    """
    name = get_image_name(image_url)

    if not os.path.isfile(CACHE_DIR+name):
        print('Downloading: ' + image_url)
        response = requests.get(image_url)
        with open(CACHE_DIR + name, 'wb') as cache_file:
            cache_file.write(response.content)


def cache_image_and_update_json(json_dict, image_key):
    """
    Cache an image and replace its location in the json dict
    """
    image_url = json_dict[image_key]
    cache_image(image_url)
    json_dict[image_key] = '/cache/' + get_image_name(image_url)


def create_cache():
    """
    Fetches a playlist, saves the images to the CACHE_DIR.
    """
    try:
        playlist_json = requests.get(f'{XOS_API_ENDPOINT}playlists/{XOS_PLAYLIST_ID}/').json()

        for old_file in os.listdir(CACHE_DIR):
            os.remove(CACHE_DIR + old_file)

        for label in playlist_json['playlist_labels']:
            for image in label['label']['images']:
                cache_image_and_update_json(image, 'image_file')

        cache_image_and_update_json(playlist_json, 'background')

        with open(f'playlist_{XOS_PLAYLIST_ID}.json', 'w') as outfile:
            json.dump(playlist_json, outfile)

    except (requests.exceptions.HTTPError, requests.exceptions.ConnectionError) as exception:
        sentry_sdk.capture_exception(exception)
        print(f'Error downloading playlist JSON from XOS: {exception}')


if __name__ == '__main__':
    create_cache()
