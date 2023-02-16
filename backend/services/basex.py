from BaseXClient import BaseXClient

from django.conf import settings


class BaseXService:
    session: BaseXClient.Session = None

    def perform_query(self, query):
        """Open a session if needed, create a query, execute it
        and result the result"""
        if not self.session:
            self.session = self.get_session()
        response = self.session.query(query).execute()
        return response

    def perform_query_iter(self, query):
        session = self.get_session()
        yield from session.query(query).iter()
        session.close()

    def execute(self, command):
        """Open a session if needed, execute a command and return the
        result"""
        if not self.session:
            self.session = self.get_session()
        response = self.session.execute(command)
        return response

    def create(self, name, content):
        """Open a session if needed and create a database"""
        if not self.session:
            self.session = self.get_session()
        self.session.create(name, content)

    def get_session(self):
        session = BaseXClient.Session(
                    settings.BASEX_HOST,
                    settings.BASEX_PORT,
                    settings.BASEX_USER,
                    settings.BASEX_PASSWORD
        )
        return session

    def test_connection(self):
        try:
            session = BaseXClient.Session(
                settings.BASEX_HOST,
                settings.BASEX_PORT,
                settings.BASEX_USER,
                settings.BASEX_PASSWORD
            )
        except ConnectionError:
            return False
        session.close()
        return True

    def __del__(self):
        if self.session is not None:
            self.session.close()


basex = BaseXService()
