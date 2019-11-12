import pytest

from app import main


@pytest.fixture
def app():
    return main.app
