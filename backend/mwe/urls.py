from django.urls import path

from rest_framework.routers import SimpleRouter

from .views import CanonicalFormList, GenerateMweQueries

urlpatterns = [
    path('canonical', CanonicalFormList.as_view(), name='canonical'),
    path('generate', GenerateMweQueries.as_view(), name='generate'),
]

router = SimpleRouter()

urlpatterns += router.urls  # type: ignore
