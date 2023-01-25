from .celery import app as celery_app

__all__ = ('celery_app',)

# FIXME this is a temporary hack to prevent the loading of the CELEX lexicon by sastadev
# and thus save quite some RAM usage.
# To be remove once https://github.com/UUDigitalHumanitieslab/sastadev/pull/9 is merged
import sys
sys.modules['celexlexicon'] = type(sys)('celexlexicon')
