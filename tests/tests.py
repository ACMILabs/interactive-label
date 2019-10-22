import datetime

from peewee import SqliteDatabase

from app.main import Label


def test_label():
    """
    Test the Label class initialises.
    """

    db = SqliteDatabase('label.db')
    db.create_tables([Label])
    timestamp = datetime.datetime.now().timestamp()

    label = Label.create(
        datetime=timestamp,
        playlist_id=1,
        label_id=1,
    )
    assert label
    assert label.datetime is timestamp
