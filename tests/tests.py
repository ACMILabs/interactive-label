import datetime
import json
import os
from unittest.mock import MagicMock, patch

import pytest

from app import main
from app.main import XOS_PLAYLIST_ID, Label, download_playlist


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
    with open(os.path.join(cwd, filename), 'r') as file_obj:
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


def mocked_requests_get(*args, **kwargs):
    if '/api/playlists/2/' in args[0]:
        return MockResponse(file_to_string_strip_new_lines('data/playlist_no_label.json'), 200)
    if '/api/playlists/' in args[0]:
        return MockResponse(file_to_string_strip_new_lines('data/playlist.json'), 200)

    raise Exception("No mocked sample data for request: "+args[0])


def mocked_requests_post(*args, **kwargs):
    if '/api/taps/' in args[0]:
        return MockResponse(file_to_string_strip_new_lines('data/xos_tap.json'), 201)

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
def test_download_playlist_label():
    """
    Test that downloading the playlist from XOS
    successfully saves it to the filesystem.
    """

    download_playlist()
    file_exists = os.path.isfile(f'playlist_{XOS_PLAYLIST_ID}.json')
    playlist = json.loads(
        file_to_string_strip_new_lines(f'../playlist_{XOS_PLAYLIST_ID}.json')
    )['playlist_labels']

    assert file_exists is True
    assert len(playlist) == 3
    assert playlist[0]['label']['title'] == 'Dracula'


def test_route_playlist_label(client):
    """
    Test that the root route renders the expected data.
    """

    response = client.get('/')

    assert b'#labeltile17' in response.data
    assert b'#labeltile18' in response.data
    assert b'#labeltile19' in response.data
    assert response.status_code == 200


def test_route_playlist_json(client):
    """
    Test that the playlist route returns the expected data.
    """

    response = client.get('/api/playlist/')

    assert b'Dracula' in response.data
    assert response.status_code == 200


@patch('requests.get', MagicMock(side_effect=mocked_requests_get))
def test_route_playlist_label_with_no_label(client):
    """
    Test that the playlist route returns the expected data
    when a playlist item doesn't have a label.
    """

    main.XOS_PLAYLIST_ID = 2
    download_playlist()
    response = client.get('/')
    response_data = response.data.decode('utf-8')

    assert 'resource' not in response_data
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
