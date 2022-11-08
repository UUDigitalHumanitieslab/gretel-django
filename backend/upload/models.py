from django.db import models
from django.contrib.auth.models import User

from treebanks.models import Treebank, Component, BaseXDB


class UploadError(RuntimeError):
    pass


class TreebankUpload(models.Model):
    treebank = models.OneToOneField(Treebank, on_delete=models.SET_NULL,
                                    null=True)
    input_file = models.FileField(upload_to='uploaded_treebanks/', blank=True)
    input_dir = models.CharField(max_length=255, blank=True)
    upload_timestamp = models.DateTimeField(
        verbose_name='Upload date and time', null=True, blank=True
    )
    uploaded_by = models.ForeignKey(User, null=True, blank=True,
                                    on_delete=models.SET_NULL)
    public = models.BooleanField(default=True)
    sentence_tokenized = models.BooleanField(null=True)
    word_tokenized = models.BooleanField(null=True)
    sentences_have_labels = models.BooleanField(null=True)
    processed = models.DateTimeField(null=True, blank=True)

    def _unpack(self):
        '''Unpack compressed input file and set input_dir'''
        if not self.input_file:
            raise UploadError('Need input_file to unpack')
        pass

    def _read_input_files(self):
        '''Divide extracted files into components and probe input format'''
        pass

    def prepare(self):
        if not self.input_dir:
            self._unpack()
        self._read_input_files()

    def process(self):
        '''Process prepared treebank upload'''
        # Check if preparation has been done yet
        if not self.input_dir:
            raise UploadError('input_dir not set')
