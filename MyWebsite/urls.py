from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('message/', views.message, name='message'),
    # path('chat/', views.Ai, name='chat'),
    path('AiChat/', views.AiChat, name='AiChat'),
    

]
