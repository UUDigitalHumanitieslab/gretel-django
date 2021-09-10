#!/usr/bin/env python3
from typing import Any, List
from urllib.parse import quote_plus
import requests
import json

BASE_URL = 'https://gretel.hum.uu.nl/api/src/router.php/'


class Urls:
    def __init__(self, base_url):
        self.base_url = base_url

    def parse_sentence(self, sentence: str):
        return self.base_url + 'parse_sentence/' + quote_plus(sentence)

    def generate_xpath(self):
        return self.base_url + 'generate_xpath'


class GeneratedXpath:
    markedTree: str
    subTree: str
    xpath: str

    def __init__(self, json: Any):
        self.markedTree = json['markedTree']
        self.subTree = json['subTree']
        self.xpath = json['xpath']


class Actions:
    def __init__(self, urls: Urls):
        self.urls = urls

    def parse_sentence(self, sentence: str):
        response = requests.get(self.urls.parse_sentence(sentence))
        response.raise_for_status()
        return response.text

    def generate_xpath(self, attributes: List[str], ignoreTopNode: bool, respectOrder: bool, tokens: List[str], xml: str) -> GeneratedXpath:
        """
        attributes for each token: see matrix.component.ts for the options (token/cs/lemma/pos/postag/na/not)
        """
        response = requests.post(self.urls.generate_xpath(), data=json.dumps({
            'attributes': attributes,
            'ignoreTopNode': ignoreTopNode,
            'respectOrder': respectOrder,
            'tokens': tokens,
            'xml': xml
        }))
        response.raise_for_status()
        return GeneratedXpath(response.json())

urls = Urls(BASE_URL)
actions = Actions(urls)

sentence = "iemand zal de dans ontspringen"

parsed = actions.parse_sentence(sentence)
generated = actions.generate_xpath(
    ['na', 'na', 'pos', 'lemma', 'lemma'], True, False, sentence.split(' '), parsed)

print(generated.xpath)
