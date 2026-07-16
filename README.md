# 🗺️ HireSight — Skill-to-Career Intelligence

> **AI-powered career intelligence platform** that maps any skill to real industry demand, salary benchmarks, career paths, and live job opportunities — powered by Gemini, Tavily, and JSearch.

---

## ✨ Features

- 🔍 **Real-time Skill Demand Analysis** — Web-searched insights on market demand, growth rates, and trends
- 💰 **Salary Benchmarking** — Curated salary ranges from current industry data
- 🏢 **Top Industries & Companies** — Find out who's hiring for your skill
- 🗺️ **Career Roadmap** — AI-generated progression paths from entry to senior level
- 💼 **Live Job Listings** — Real job postings fetched from JSearch API with apply links
- ⚡ **Skill Pairing** — Complementary skills to learn for maximum employability
- 🎨 **Modern UI** — Dark glassmorphism design with smooth animations

---

## 🏗️ Architecture

```
HireSight/
├── app.py                   # Flask REST API server
├── agent.py                 # LangChain agent (Gemini + Tavily + JSearch)
├── requirements.txt         # Python dependencies
├── .env.example             # Environment variable template
├── .gitignore               # Git ignore rules
├── frontend/
│   ├── index.html           # Main application page
│   ├── style.css            # Design system & component styles
│   └── app.js               # Frontend logic & API integration
└── hiresight_agent (1).py    # Original Colab notebook (reference)
```

**Request flow:**
```
Browser → Flask (app.py) → LangChain Agent (agent.py)
                                ├── Tavily Search (skill demand)
                                └── JSearch API (job listings)
                         ← Gemini 2.5 Flash synthesises → JSON response
```

---

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/HireSight.git
cd HireSight
```

### 2. Set up Python environment
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
```

### 3. Configure environment variables
```bash
cp .env.example .env
```

Open `.env` and fill in your API keys:

| Variable | Description | Get it at |
|----------|-------------|-----------|
| `GOOGLE_API_KEY` | Gemini 2.5 Flash | [aistudio.google.com](https://aistudio.google.com/apikey) |
| `TAVILY_API_KEY` | Tavily Search | [app.tavily.com](https://app.tavily.com) |
| `RAPIDAPI_KEY` | JSearch API | [rapidapi.com/jsearch](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch) |

### 4. Run the server
```bash
python app.py
```

Open your browser at **http://localhost:5000** 🎉

---

## 🌐 API Reference

### `GET /api/health`
Health check endpoint.

**Response:**
```json
{ "status": "ok", "service": "HireSight API", "version": "1.0.0" }
```

---

### `POST /api/search`
Run a skill search through the AI agent.

**Request body:**
```json
{
  "skill": "Generative AI",
  "location": "Bangalore"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "skill": "Generative AI",
    "location": "Bangalore",
    "demand_overview": "Generative AI is experiencing explosive growth...",
    "salary_range": "₹8 LPA – ₹40 LPA",
    "growth_rate": "45% YoY",
    "demand_level": "High",
    "top_industries": ["Tech", "Finance", "Healthcare"],
    "top_companies": ["Google", "Microsoft", "Flipkart"],
    "key_insights": ["...", "..."],
    "career_paths": ["AI Engineer", "ML Researcher", "Prompt Engineer"],
    "recommended_skills": ["Python", "PyTorch", "LangChain"],
    "jobs": [
      {
        "title": "AI Engineer",
        "company": "Google",
        "location": "Bangalore",
        "type": "FULLTIME",
        "apply_link": "https://..."
      }
    ]
  }
}
```

---

## 🛠️ Production Deployment

### Using Gunicorn (recommended)
```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Environment variables for production
```env
FLASK_DEBUG=false
ALLOWED_ORIGINS=https://yourdomain.com
PORT=5000
```

---

## 🧠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **LLM** | Google Gemini 2.5 Flash |
| **Agent Framework** | LangChain |
| **Search** | Tavily Search API |
| **Jobs** | JSearch API (RapidAPI) |
| **Backend** | Flask + Flask-CORS |
| **Frontend** | Vanilla HTML / CSS / JS |
| **Font** | Space Grotesk + Inter |

---

## 📸 UI Overview

- **Hero Section** — Animated search with skill + location inputs
- **Stats Row** — Demand level, salary range, growth rate, jobs found
- **Demand Overview** — Narrative summary + key insights
- **Industries & Companies** — Tagged display of top hirers
- **Career Roadmap** — Step-by-step career progression paths
- **Live Job Listings** — Cards with company, location, and apply links

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

MIT License — feel free to use, modify, and distribute.

---

<p align="center">Built with ❤️ using Gemini AI + LangChain</p>
