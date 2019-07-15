class HTTPError(Exception):

    def __init__(self, message, status_code=400, payload=None):
        super().__init__()
        self.message = message
        self.status_code = status_code
        self.payload = payload

    def to_dict(self):
        error = dict(self.payload or ())
        error['message'] = self.message
        return error