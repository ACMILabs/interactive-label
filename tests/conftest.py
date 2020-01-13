import datetime

import pytest
from peewee import SqliteDatabase

from app import main
from app.main import HasTapped, Label


@pytest.fixture
def app():
    return main.app


@pytest.fixture
def database():
    """
    Setup the test database.
    """
    test_db = SqliteDatabase(':memory:')
    test_db.bind([Label, HasTapped], bind_refs=False, bind_backrefs=False)
    test_db.connect()
    test_db.create_tables([Label, HasTapped])

    Label.create(
        datetime=datetime.datetime.now().timestamp(),
        playlist_id=10,
        label_id=10,
    )
