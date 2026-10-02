

from django.http import JsonResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.views.decorators.csrf import csrf_exempt
import json

from MyWebsite import urls
from .models import Contact, Message
import os
from dotenv import load_dotenv
from openai import OpenAI

from IPython.display import display, Markdown

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


# def Ai(request):
#     return render(request, 'chat.html')

@csrf_exempt
def AiChat(request):
    if request.method == 'POST':
        load_dotenv()  # Load environment variables from .env file
        openai = os.getenv("GOOGLE_API_KEY")
       
        message = ''
        if request.content_type == 'application/json':
            try:
                data = json.loads(request.body)
                message = data.get('message', '') or (data.get('messages', [{}])[-1].get('content', ''))
            except Exception:
                message = ''
        if not message:
            message = request.POST.get('message', '')  # Get the message from the POST request

        gemi = OpenAI(api_key = openai, base_url = "https://generativelanguage.googleapis.com/v1beta/openai/")

        system_content = (
            "You are a helpful personal Abhishek's assistant and you are here to help other who are come to check out Abhishek's portfolio, a Full-Stack Developer & Generative AI Engineer. "
            "Answer clearly and try to make the answers short and max you are allowed to use 100 words."
            "When listing projects or skills, format each item on its own line: '1. **Project Name**: description' "
            "with a blank line between items so it renders cleanly as structured cards. Avoid dense walls of text."
        )

        try:
            response = gemi.chat.completions.create(
                model="gemini-3.1-flash-lite",
                messages=[{"role": "system", "content": system_content}, {"role": "user", "content": message}]
            )
            ai_response = response.choices[0].message.content
        except Exception as e:
            try:
                response = gemi.chat.completions.create(
                    model="gemini-3.8-flash",
                    messages=[{"role": "system", "content": system_content}, {"role": "user", "content": message}]
                )
                ai_response = response.choices[0].message.content
            except Exception as e2:
                ai_response = f"I received your message. Sorry, But I am experiencing technical difficulties. Try again after sometime but till then, Feel free to explore Abhishek's projects and skills on this portfolio!"

        return JsonResponse({'ai_response': ai_response})
    else:
        return JsonResponse({'ai_response': 'Sorry, Can you please repeat that again?'})
