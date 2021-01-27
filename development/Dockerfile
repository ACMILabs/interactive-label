FROM balenalib/intel-nuc-python:3.7-buster-run

RUN install_packages apt-utils g++ build-essential

ENV PYTHONUNBUFFERED 1

COPY ./requirements/base.txt /code/requirements/base.txt
COPY ./requirements/test.txt /code/requirements/test.txt
RUN pip3 install -Ur /code/requirements/test.txt

COPY . /code/
WORKDIR /code/
