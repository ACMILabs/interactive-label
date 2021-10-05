import datetime
import json
import os
from unittest.mock import MagicMock, patch

import pytest

from app.cache import create_cache
from app.main import HasTapped, Label


def file_to_string_strip_new_lines(filename):
    """
    Read file and return as string with new line characters stripped
    :param filename: a filename relative to the current working directory.
    e.g. 'xml_files/example.xml' or 'example.xml'
    :return: a string representation of the contents of filename, with new line characters removed
    """
    # get current working directory
    cwd = os.path.dirname(__file__)
    file_as_string = ""

    # open filename assuming filename is relative to current working directory
    with open(os.path.join(cwd, filename), 'r', encoding='utf-8') as file_obj:
        # strip new line characters
        file_as_string = file_obj.read().replace('\n', '')
    # return string
    return file_as_string


class MockResponse:
    def __init__(self, json_data, status_code):
        self.content = json.loads(json_data)
        self.status_code = status_code

    def json(self):
        return self.content

    def raise_for_status(self):
        return None


class MockBinaryResponse:
    # pylint: disable=too-few-public-methods
    def __init__(self, data):
        self.content = data
        self.status_code = 200


def mocked_requests_get(*args, **kwargs):
    if args[0] == 'https://xos.acmi.net.au/api/playlists/2/':
        return MockResponse(file_to_string_strip_new_lines('data/playlist_no_label.json'), 200)
    if args[0] == 'https://xos.acmi.net.au/api/playlists/1/':
        return MockResponse(file_to_string_strip_new_lines('data/playlist.json'), 200)

    if '.jpg' in args[0]:
        with open('tests/data/sample.jpg', 'rb') as file_obj:
            return MockBinaryResponse(file_obj.read())

    raise Exception("No mocked sample data for request: "+args[0])


def mocked_requests_post(*args, **kwargs):
    request_url = args[0]

    if '/api/taps/' in request_url:
        return MockResponse(file_to_string_strip_new_lines('data/xos_tap.json'), 201)
    if '/api/bad-uri/' in request_url:
        return MockResponse('{}', 404)

    raise Exception("No mocked sample data for request: "+args[0])


@pytest.mark.usefixtures('database')
def test_label():
    """
    Test the Label class initialises.
    """
    timestamp = datetime.datetime.now().timestamp()

    label = Label.create(
        datetime=timestamp,
        playlist_id=1,
        label_id=1,
    )
    assert label
    assert label.datetime is timestamp


@patch('requests.get', MagicMock(side_effect=mocked_requests_get))
def test_route_playlist_label(client):
    """
    Test that the root route renders the expected data.
    """
    create_cache()

    response = client.get('/')

    assert b'<!doctype html>' in response.data
    assert b"<div id='root'>" in response.data
    assert b"<script src='/static/app.js'>" in response.data
    assert response.status_code == 200


@patch('requests.get', MagicMock(side_effect=mocked_requests_get))
def test_route_playlist_json(client):
    """
    Test that the playlist route returns the expected data.
    """
    create_cache()

    response = client.get('/api/playlist/')

    assert b'Dracula' in response.data
    assert response.status_code == 200


@pytest.mark.usefixtures('database')
@patch('requests.post', MagicMock(side_effect=mocked_requests_post))
def test_tap_received_set_label(client):
    """
    Test that a tap is received and the correct label id is added.
    """
    lens_tap_data = file_to_string_strip_new_lines('data/lens_tap.json')
    response = client.post(
        '/api/taps/',
        data=lens_tap_data,
        headers={'Content-Type': 'application/json'}
    )

    assert response.json['label'] == 10
    assert response.status_code == 201

    has_tapped = HasTapped.get_or_none(tap_processing=1)
    assert has_tapped.has_tapped == 1
    assert has_tapped.tap_successful == 1


@pytest.mark.usefixtures('database')
@patch('requests.post', MagicMock(side_effect=mocked_requests_post))
def test_tap_received_no_label(client):
    """
    Test appropriate response when that a tap is received but no label is selected.
    """
    # pylint: disable=E1120
    Label.delete().execute()
    lens_tap_data = file_to_string_strip_new_lines('data/lens_tap.json')
    response = client.post(
        '/api/taps/',
        data=lens_tap_data,
        headers={'Content-Type': 'application/json'}
    )

    assert b'No label selected.' in response.data
    assert response.status_code == 404

    has_tapped = HasTapped.get_or_none(tap_processing=1)
    assert has_tapped.has_tapped == 1
    assert has_tapped.tap_successful == 0


@pytest.mark.usefixtures('database')
@patch('app.main.XOS_TAPS_ENDPOINT', 'https://xos.acmi.net.au/api/bad-uri/')
@patch('requests.post', MagicMock(side_effect=mocked_requests_post))
def test_tap_received_xos_error(client):
    """
    Test that a tap fails correctly for an XOS error
    """
    lens_tap_data = file_to_string_strip_new_lines('data/lens_tap.json')
    response = client.post(
        '/api/taps/',
        data=lens_tap_data,
        headers={'Content-Type': 'application/json'}
    )

    assert response.status_code == 400

    has_tapped = HasTapped.get_or_none(tap_processing=1)
    assert has_tapped.has_tapped == 1
    assert has_tapped.tap_successful == 0


@pytest.mark.usefixtures('database')
@patch('requests.post', MagicMock(side_effect=mocked_requests_post))
def test_tap_received_while_processing_still_creates(client):
    """
    Test that if an old tap is still being processed by the UI, new taps are still created
    """
    has_tapped = HasTapped.get_or_none(tap_processing=0)
    has_tapped.tap_processing = 1
    has_tapped.save()

    lens_tap_data = file_to_string_strip_new_lines('data/lens_tap.json')
    response = client.post(
        '/api/taps/',
        data=lens_tap_data,
        headers={'Content-Type': 'application/json'}
    )

    assert response.status_code == 201


@pytest.mark.usefixtures('database')
@patch('requests.post', MagicMock(side_effect=mocked_requests_post))
def test_select_label(client):
    """
    Test that a label is correctly selected.
    """
    # pylint: disable=E1120
    Label.delete().execute()
    lens_tap_data = file_to_string_strip_new_lines('data/label.json')
    response = client.post(
        '/api/labels/',
        data=lens_tap_data,
        headers={'Content-Type': 'application/json'}
    )

    assert response.json['label_id'] == 17
    assert response.status_code == 200


@patch('requests.get', MagicMock(side_effect=mocked_requests_get))
def test_cache():
    """
    Test the cache downloads and saves images
    """
    create_cache()
    with open('/data/playlist_1.json', 'r', encoding='utf-8') as playlist_cache:
        playlist = json.loads(playlist_cache.read())['playlist_labels']
    assert len(playlist) == 3
    assert playlist[0]['label']['title'] == 'Dracula'
    assert playlist[0]['label']['images'][0]['image_file_xs'] == '/cache/sample.jpg'
