from pathlib import Path

from django.core.management.base import BaseCommand, CommandError

from upload.models import TreebankUpload
from treebanks.models import Treebank, Component, BaseXDB
from services.basex import basex


class Command(BaseCommand):
    help = 'Add corpus from directory or compressed file containing ' \
           'unparsed files'

    def add_arguments(self, parser):
        parser.add_argument(
            'input_path',
            help='compressed file or directory containing input files'
        )

    def handle(self, *args, **options):
        upload = TreebankUpload()
        path = Path(options['input_path'])
        if path.is_dir():
            upload.input_dir = path
        else:
            raise CommandError('Cannot work with compressed files for now. '
                               'Please provide a directory.')
        upload.prepare()
