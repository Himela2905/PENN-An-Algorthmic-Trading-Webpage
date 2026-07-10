import requests
from dotenv import load_dotenv
FINNHUB_API_KEY = load_dotenv.getenv("FINNHUB_API_KEY")

def get_market_news():

    url = (
        f"https://finnhub.io/api/v1/news?"
        f"category=general&token={FINNHUB_API_KEY}"
    )

    response = requests.get(url)

    data = response.json()

    news = []

    for item in data[:6]:

        news.append({
            "headline": item["headline"],
            "source": item["source"],
            "image": item["image"],
            "summary": item["summary"],
            "url": item["url"]
        })

    return news