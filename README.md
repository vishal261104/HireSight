# 🗺️ HireSight — Skill-to-Career Intelligence

> **AI-powered career intelligence platform** that maps any skill to real industry demand, salary benchmarks, career roadmaps, and live job opportunities — then lets you have a follow-up conversation about the results, powered by **Groq (Llama 3.3)**, **Tavily Search**, and **JSearch**.

---

## ✨ Features

- 🔍 **Real-Time Skill Demand Analysis** — Live web research (via Tavily) on market demand, growth rate, and industry trends for any skill
- 💰 **Salary Benchmarking** — Current salary ranges synthesized from real search data
- 🏢 **Top Industries & Companies** — See who's actually hiring for a given skill
- 🗺️ **AI-Generated Career Roadmap** — Progression paths from entry level to senior roles, plus complementary "skill pairing" recommendations
- 💼 **Live Job Listings** — Real postings pulled from the JSearch API (RapidAPI), filtered to entry-level/internship-friendly roles in India, with direct apply links
- 💬 **Conversational Follow-Up (Memory Agent)** — After a search, ask follow-up questions ("Tell me more about the top job", "What salary should I negotiate?") and the agent answers using in-session memory of the original results
- 🎨 **Modern, Animated UI** — Dark glassmorphism design with a typed-text hero animation, floating gradient orbs, and an animated canvas particle background

---

## 🏗️ Architecture

```
HireSight/
├── app.py                          # Flask REST API server (serves frontend + /api routes)
├── agent.py                        # Production LangChain agent (Groq + Tavily + JSearch), with per-session chat memory
├── requirements.txt                # Python dependencies
├── .env.example                    # Environment variable template
├── .gitignore
├── frontend/
│   ├── index.html                  # Single-page app: hero, search form, results, chat panel
│   ├── style.css                   # Design system — glassmorphism, gradients, animations
│   └── app.js                      # Frontend logic: form handling, rendering results, chat UI, particle/typed-text effects
├── skillmap_agent (1).py           # Legacy Colab prototype (Gemini-based, single-shot query, no memory)
└── skillmap_agent_memory (1).py    # Legacy Colab prototype (Gemini + LangGraph memory experiment)
```

> The two `skillmap_agent*` files are earlier Google Colab notebooks kept for reference — they were the original prototypes (built on Gemini + LangGraph) before the project was rebuilt as the Flask + Groq production app in `app.py` / `agent.py`.

**Request flow:**

```
Browser (frontend/)
   │
   ▼
Flask API (app.py)
   │
   ▼
LangChain Tool-Calling Agent (agent.py)
   ├── Tavily Search  → skill demand, salary, growth, industries
   └── JSearch API    → live job listings
   │
   ▼
Groq (Llama 3.3 70B) synthesizes → structured JSON (search) or conversational reply (chat)
```

Each request carries a `session_id`. The agent keeps an in-memory chat history per session, so a `/api/chat` follow-up call has full context of the original `/api/search` results without the client having to resend them.

---

## 🚀 Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/vishal261104/HireSight.git
cd HireSight
```

### 2. Set up a Python environment

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
|---|---|---|
| `GROQ_API_KEY` | Groq inference (Llama 3.3 70B) | [console.groq.com/keys](https://console.groq.com/keys) |
| `TAVILY_API_KEY` | Tavily Search — skill demand research | [app.tavily.com](https://app.tavily.com) |
| `RAPIDAPI_KEY` | JSearch API — live job listings | [rapidapi.com/jsearch](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch) |

Optional Flask config (also in `.env.example`):

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | Port the Flask server listens on |
| `FLASK_DEBUG` | `false` | Set `true` for local development |
| `ALLOWED_ORIGINS` | `*` | Comma-separated CORS allow-list for `/api/*` |

### 4. Run the server

```bash
python app.py
```

Open your browser at **http://localhost:5000** 🎉

---

## 🌐 API Reference

### `GET /api/health`

Health check.

```json
{ "status": "ok", "service": "HireSight API", "version": "2.0.0" }
```

### `POST /api/search`

Runs the full skill research + job search agent and starts a new memory session (any prior history for the given `session_id` is cleared first).

**Request body:**

```json
{
  "skill": "Generative AI",
  "location": "Bangalore",
  "session_id": "some-uuid"
}
```

- `skill` — required, non-empty, max 100 characters
- `location` — optional, defaults to `"India"`
- `session_id` — optional, defaults to `"default"`

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

### `POST /api/chat`

Follow-up conversational question about the most recent `/api/search` results for that `session_id`. Requires that a search has already been run for the session — otherwise returns an error asking for one.

**Request body:**

```json
{
  "message": "Tell me more about the top job",
  "session_id": "some-uuid"
}
```

- `message` — required, non-empty, max 500 characters
- `session_id` — optional, defaults to `"default"`

**Response:**

```json
{
  "success": true,
  "reply": "The top listing is an AI Engineer role at Google in Bangalore..."
}
```

---

## 🛠️ Production Deployment

### Using Gunicorn (recommended)

```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Environment variables for production

```bash
FLASK_DEBUG=false
ALLOWED_ORIGINS=https://yourdomain.com
PORT=5000
```

> Note: session/chat memory is currently stored in-process (an in-memory dict in `agent.py`), so it will not be shared across multiple Gunicorn workers or survive a restart. For multi-worker or multi-instance production deployments, consider moving session storage to Redis or another shared store.

---

## 🧠 Tech Stack

| Layer | Technology |
|---|---|
| **LLM** | Groq — `llama-3.3-70b-versatile` |
| **Agent Framework** | LangChain (`create_tool_calling_agent` + `AgentExecutor`) |
| **Skill/Market Research** | Tavily Search API |
| **Job Listings** | JSearch API (via RapidAPI) |
| **Backend** | Flask + Flask-CORS |
| **WSGI Server** | Gunicorn |
| **Frontend** | Vanilla HTML / CSS / JavaScript (no framework) |
| **Fonts** | Space Grotesk + Inter |

---

## 📸 UI Overview

- **Hero Section** — Animated typed-text headline over a canvas particle background, with skill + location search inputs
- **Stats Row** — Demand level, salary range, growth rate, and jobs-found counters
- **Demand Overview** — Narrative summary card + key insights
- **Industries & Companies** — Tagged display of top hiring industries and companies
- **Career Roadmap** — Step-by-step progression paths plus recommended complementary skills
- **Live Job Listings** — Cards with company, location, employment type, and apply links
- **Follow-Up Chat Panel** — Appears after a search completes; lets you ask the memory agent questions about your results, with quick-start example prompts

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

Built with ❤️ using Groq + LangChain
