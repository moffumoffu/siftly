from flask import Flask, jsonify, render_template
import requests
import os
import json
import random
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def fetch_hn_posts(limit=20):
    ids = requests.get("https://hacker-news.firebaseio.com/v0/topstories.json").json()
    sample = random.sample(ids[:100], limit)
    posts = []
    for id in sample:
        post = requests.get(f"https://hacker-news.firebaseio.com/v0/item/{id}.json").json()
        if post and 'title' in post:
            posts.append(post)
    return posts

def analyze_post(title, text=""):
    content = f"Title: {title}\n{('Body: ' + text) if text else ''}"
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": "You are a news analyst. Given a post title and optional body, return a JSON with 3 fields: 'verdict' (one of: Useful, Noise, Spam), 'score' (1-10 quality score), 'summary' (one sentence max). Return only raw JSON, no markdown."
            },
            {
                "role": "user",
                "content": content
            }
        ]
    )
    return response.choices[0].message.content

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/posts")
def get_posts():
    posts = fetch_hn_posts(20)
    results = []
    for post in posts:
        analysis_raw = analyze_post(post.get('title', ''), post.get('text', ''))
        try:
            analysis = json.loads(analysis_raw)
        except:
            analysis = {"verdict": "Unknown", "score": 0, "summary": "Could not analyze."}
        
        results.append({
            "title": post.get('title'),
            "url": post.get('url', '#'),
            "score": post.get('score'),
            "by": post.get('by'),
            "analysis": analysis
        })
    return jsonify(results)

@app.route("/about")
def about():
    return render_template("about.html")

if __name__ == "__main__":
    app.run(debug=True)