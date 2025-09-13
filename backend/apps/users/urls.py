from django.urls import path
from . import views

urlpatterns = [
    path('profile/', views.UserProfileView.as_view(), name='user-profile'),
    path('update-profile/', views.UpdateProfileView.as_view(), name='update-profile'),
]
