from django.db import models

class Contact(models.Model):
    default_name= 'Abhishek Kumar Singh'
    default_email= 'abhisheksingh913396@gmail.com'

    name = models.CharField(max_length=100, default=default_name) 
    email = models.EmailField(default=default_email)

    def __str__(self):
        return f"{self.name} - {self.email}"

class Message(models.Model):
    messager_id = models.AutoField(primary_key=True)
    messager_name = models.CharField(max_length=100)
    messager_email = models.EmailField()
    message = models.CharField(max_length=500)
    date_time = models.DateTimeField(auto_now_add=True)


class stored_urls(models.Model):
    web_name = models.CharField(max_length=100)
    url = models.URLField(max_length=200)

    def __str__(self):
        return f"{self.web_name} - {self.url}"