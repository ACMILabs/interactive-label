FROM balenalib/raspberrypi3-python:3.7.2-stretch-run

RUN install_packages apt-utils

ENV PYTHONUNBUFFERED 1

COPY ./requirements.txt /code/requirements.txt
RUN pip install -Ur /code/requirements.txt
COPY . /code/
WORKDIR /code/
