from django.contrib import admin
from .models import Contact, Message, stored_urls
# Register your models here.

admin.site.register(Contact)

class ContactAdmin(admin.ModelAdmin):
    list_display = ('name', 'email')
    list_filter = ('name', 'email')
# admin.site.register(Contact, ContactAdmin)