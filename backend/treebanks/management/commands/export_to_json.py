from django.core.management.base import BaseCommand, CommandError

from pathlib import Path
import json

from treebanks.models import Treebank


class Command(BaseCommand):
    help = 'Export treebank information to a JSON file that can be used to ' \
           'copy treebanks to other GrETEL installations'

    def add_arguments(self, parser) -> None:
        parser.add_argument(
            'treebank',
            help='The slug of the treebank you want to export'
        )
        parser.add_argument(
            '--outputfile',
            help='The output JSON file to write to'
        )

    def handle(self, *args, **options):
        treebank_slug = options['treebank']
        try:
            treebank = Treebank.objects.get(slug=treebank_slug)
        except Treebank.DoesNotExist:
            raise CommandError('Treebank {} does not exist.'
                               .format(treebank_slug))
        outputfilename = options['outputfile']
        if not outputfilename:
            outputfilename = treebank_slug + '.json'
        outputfilepath = Path(outputfilename)
        if outputfilepath.exists():
            raise CommandError('The file {} already exists.'
                               .format(outputfilename))
        configuration = treebank.serialize()
        try:
            with open(outputfilename, 'w') as f:
                json.dump(configuration, f, indent=4)
        except OSError as e:
            raise CommandError('Error opening file {} for writing: {}'
                               .format(outputfilename, e))
        self.stdout.write(self.style.SUCCESS(
            'Export written to {}.'.format(outputfilename)
        ))
