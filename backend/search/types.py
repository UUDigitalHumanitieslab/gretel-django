from dataclasses import dataclass
from typing import Iterable, Optional

from lxml import etree


@dataclass
class BaseXMatch:
    sentid: str
    sentence: str
    prevs: str
    nexts: str
    ids: str
    begins: str
    xml_sentences: str
    meta: str
    component: str
    database: str


class Result:
    _match: BaseXMatch
    _tree: Optional[etree.ElementTree]
    _variables: str

    def __init__(self, match: BaseXMatch):
        self._match = match
        self._tree = None
        self._variables = ''

    def as_dict(self):
        return dict(
            sentid=self._match.sentid,
            sentence=self._match.sentence,
            prevs=self._match.prevs,
            nexts=self._match.nexts,
            ids=self._match.ids,
            begins=self._match.begins,
            xml_sentences=self._match.xml_sentences,
            meta=self._match.meta,
            variables=self._variables,
            component=self._match.component,
            database=self._match.database)

    @property
    def tree(self) -> etree.ElementTree:
        if self._tree is None:
            # important: we have to use lxml.etree and not Python's builtin ElementTree
            # for compatability with mwe-query
            self._tree = etree.fromstring(self._match.xml_sentences)
        return self._tree

    @tree.setter
    def tree(self, tree):
        # we want to allow manipulations for the result tree
        # note however that this has no effect on the serialized result (see as_dict())
        self._tree = tree

    @property
    def variables(self):
        return self._variables

    @variables.setter
    def variables(self, variables):
        # this is set by SearchQuery, but variable resolution could potentially be moved here
        self._variables = variables

    def __eq__(self, other):
        # used for testing purposes
        return self._match == other._match


ResultSet = Iterable[Result]
