import datetime
import json
import os
from unittest.mock import patch

import pytest
from peewee import SqliteDatabase

from app.main import XOS_PLAYLIST_ID, Label, download_playlist


@pytest.fixture
def database():
    """
    Setup the test database.
    """
    test_db = SqliteDatabase(':memory:')
    test_db.bind([Label], bind_refs=False, bind_backrefs=False)
    test_db.connect()
    test_db.create_tables([Label])

    Label.create(
        datetime=datetime.datetime.now().timestamp(),
        playlist_id=10,
        label_id=10,
    )


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


def mocked_requests_get(*args, **kwargs):
    """
    Thanks to https://stackoverflow.com/questions/15753390/how-can-i-mock-requests-and-the-response
    """
    class MockResponse:
        def __init__(self, json_data, status_code):
            self.content = json.loads(json_data)
            self.status_code = status_code

        def json(self):
            return self.content

        def raise_for_status(self):
            return None

    if args[0].startswith('https://xos.acmi.net.au/api/playlists/'):
        return MockResponse(file_to_string_strip_new_lines('data/playlist.json'), 200)

    return MockResponse(None, 404)


def mocked_requests_post(*args, **kwargs):
    """
    Thanks to https://stackoverflow.com/questions/15753390/how-can-i-mock-requests-and-the-response
    """
    class MockResponse:
        def __init__(self, json_data, status_code):
            self.content = json.loads(json_data)
            self.status_code = status_code

        def json(self):
            return self.content

        def raise_for_status(self):
            return None

    if args[0].startswith('https://xos.acmi.net.au/api/taps/'):
        return MockResponse(file_to_string_strip_new_lines('data/xos_tap.json'), 201)

    return MockResponse(None, 404)


def test_label(database):
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


@patch('requests.get', side_effect=mocked_requests_get)
def test_download_playlist_label(mocked_requests_get):
    """
    Test that downloading the playlist from XOS
    successfully saves it to the filesystem.
    """

    download_playlist()
    file_exists = os.path.isfile(f'playlist_{XOS_PLAYLIST_ID}.json')
    playlist = json.loads(file_to_string_strip_new_lines(f'../playlist_{XOS_PLAYLIST_ID}.json'))['playlist_labels']

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


@patch('requests.post', side_effect=mocked_requests_post)
def test_tap_received_set_label(mocked_requests_post, database, client):
    """
    Test that a tap is received and the correct label id is added.
    """
    lens_tap_data = file_to_string_strip_new_lines('data/lens_tap.json')
    response = client.post('/api/taps/', data=lens_tap_data, headers={'Content-Type': 'application/json'})

    assert b'"label":10' in response.data
    assert response.status_code == 201


@patch('requests.post', side_effect=mocked_requests_post)
def test_tap_received_no_label(mocked_requests_post, database, client):
    """
    Test appropriate response when that a tap is received but no label is selected.
    """
    Label.delete().execute()
    lens_tap_data = file_to_string_strip_new_lines('data/lens_tap.json')
    response = client.post('/api/taps/', data=lens_tap_data, headers={'Content-Type': 'application/json'})

    assert b'No label selected.' in response.data
    assert response.status_code == 404


@patch('requests.post', side_effect=mocked_requests_post)
def test_select_label(mocked_requests_post, database, client):
    """
    Test that a label is correctly selected.
    """
    Label.delete().execute()
    lens_tap_data = file_to_string_strip_new_lines('data/label.json')
    response = client.post('/api/labels/', data=lens_tap_data, headers={'Content-Type': 'application/json'})

    assert b'"label_id":17' in response.data
    assert response.status_code == 200
