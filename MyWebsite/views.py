

from django.shortcuts import render, redirect, get_object_or_404
from .models import Contact, Message

def home(request):
    contact, created = Contact.objects.get_or_create()  # Get the first contact object
    return render(request, 'home.html', {'contact': contact})

# def message(request):
#     return render(request, 'Message.html')

#Create operation to get the contact details:
def message(request):
    if request.method == 'POST':
        name = request.POST.get('name')
        email = request.POST.get('email')
        message = request.POST.get('message')

        Message.objects.create(messager_name=name, messager_email=email, message=message)
        return redirect('home')
    return render(request, 'message.html')


#Read operation to get the stored urls:
def stored_urls(request):
    urls = stored_urls.objects.all()
    return render(request, 'stored_urls.html', {'urls': urls})
