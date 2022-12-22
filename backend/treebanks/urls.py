from django.urls import include, path
from .views import (
    treebank_view, treebank_components_view, treebank_metadata_view
)

urlpatterns = [
    path('treebank/', treebank_view),
    path('treebank/<slug:treebank>/components/', treebank_components_view),
    path('treebank/<slug:treebank>/metadata/', treebank_metadata_view),
    path(
        'api-auth/',
        include('rest_framework.urls', namespace='rest_framework')
    ),
]
