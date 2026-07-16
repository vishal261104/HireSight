"""
HireSight Memory Agent — Production-ready agent with in-session conversation memory.
Implements memory via chat_history (no langgraph dependency conflicts).
Each session_id gets its own message history, enabling multi-turn conversations.
"""

import os
import json
import re
import requests
from typing import Dict, List
from dotenv import load_dotenv

from langchain_groq import ChatGroq
from langchain_tavily import TavilySearch
from langchain_core.tools import tool
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

load_dotenv()

GROQ_API_KEY   = os.getenv("GROQ_API_KEY")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
RAPIDAPI_KEY   = os.getenv("RAPIDAPI_KEY")

_session_store: Dict[str, List[BaseMessage]] = {}

def _get_model():
    if not GROQ_API_KEY:
        raise EnvironmentError("GROQ_API_KEY is not set in environment variables.")
    return ChatGroq(
        model="llama-3.3-70b-versatile",
        api_key=GROQ_API_KEY,
        temperature=0.3,
    )

def _get_skill_demand_tool():
    if not TAVILY_API_KEY:
        raise EnvironmentError("TAVILY_API_KEY is not set in environment variables.")
    return TavilySearch(
        max_results=5,
        search_depth="advanced",
        tavily_api_key=TAVILY_API_KEY,
        name="skill_demand_tool",
        description=(
            "Search for industry demand, salary insights, growth rates, "
            "top hiring companies, and career trends for a given skill."
        ),
    )

@tool
def search_jobs(skill: str, location: str) -> list:
    """Search for real job listings requiring a specific skill in a given location
    using the JSearch API. Returns a list of job objects."""
    if not RAPIDAPI_KEY:
        return [{"error": "RAPIDAPI_KEY not configured"}]

    url = "https://jsearch.p.rapidapi.com/search"
    headers = {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": "jsearch.p.rapidapi.com",
    }
    querystring = {
        "query": f"{skill} jobs in {location}",
        "page": "1",
        "country": "in",
        "employment_types": "INTERN,FULLTIME",
        "job_requirements": "no_experience,under_3_years_experience",
        "num_pages": "1",
    }

    try:
        response = requests.get(url, headers=headers, params=querystring, timeout=10)
        response.raise_for_status()
        data = response.json()
        jobs = data.get("data", [])
    except Exception as exc:
        return [{"error": str(exc)}]

    result = []
    for job in jobs[:6]:
        result.append({
            "title":      job.get("job_title", "N/A"),
            "company":    job.get("employer_name", "N/A"),
            "location":   job.get("job_city") or job.get("job_country", "Remote"),
            "type":       job.get("job_employment_type", "Full-time"),
            "apply_link": job.get("job_apply_link", "#"),
        })
    return result

SEARCH_SYSTEM_PROMPT = """You are HireSight — a Skill-to-Career Mapping assistant with memory.
You help students and professionals understand skill demand and find matching job opportunities.

You have access to:
- skill_demand_tool: Search industry demand, salary insights, career trends, top companies
- search_jobs: Find real job listings for a given skill and location

Use both tools to research the skill, then return ONLY a valid JSON object (no markdown, no code fences, no extra text):
{{
  "skill": "<skill name>",
  "location": "<location>",
  "demand_overview": "<2-3 sentence overview of demand>",
  "salary_range": "<e.g. ₹8 LPA – ₹25 LPA>",
  "growth_rate": "<e.g. 35% YoY>",
  "demand_level": "<High | Medium | Low>",
  "top_industries": ["...", "..."],
  "top_companies": ["...", "..."],
  "key_insights": ["insight 1", "insight 2", "insight 3"],
  "career_paths": ["Path 1", "Path 2", "Path 3"],
  "recommended_skills": ["skill1", "skill2", "skill3"],
  "jobs": [
    {{"title": "...", "company": "...", "location": "...", "type": "...", "apply_link": "..."}}
  ]
}}"""

CHAT_SYSTEM_PROMPT = """You are HireSight — a friendly Skill-to-Career Mapping assistant with memory.
You remember the entire conversation history including the initial skill research and job listings shown.

Answer follow-up questions conversationally, drawing from your memory of previous results.
Examples of follow-up questions you can handle:
- "Tell me more about the second job"
- "What salary should I expect for this?"
- "Which companies should I target?"
- "What roadmap would you recommend?"

Be specific, concise, and helpful. Use bullet points when listing multiple items."""

def _build_executor(system_prompt: str) -> AgentExecutor:
    model = _get_model()
    tools = [_get_skill_demand_tool(), search_jobs]

    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        MessagesPlaceholder("chat_history", optional=True),
        ("human", "{input}"),
        MessagesPlaceholder("agent_scratchpad"),
    ])

    agent = create_tool_calling_agent(model, tools, prompt)
    return AgentExecutor(agent=agent, tools=tools, verbose=True, max_iterations=5)

def _get_history(session_id: str) -> List[BaseMessage]:
    return _session_store.get(session_id, [])

def _save_turn(session_id: str, human_msg: str, ai_msg: str):
    history = _session_store.setdefault(session_id, [])
    history.append(HumanMessage(content=human_msg))
    history.append(AIMessage(content=ai_msg))

def clear_session(session_id: str):
    """Clear memory for a session (called on new search)."""
    _session_store.pop(session_id, None)

def run_hiresight_query(skill: str, location: str, session_id: str) -> dict:
    """
    Initial skill search — uses both tools and returns structured JSON.
    Clears any prior memory for this session_id and starts fresh.
    """
    clear_session(session_id)

    executor = _build_executor(SEARCH_SYSTEM_PROMPT)
    user_message = (
        f"Research the skill '{skill}' for someone looking for opportunities in "
        f"'{location}'. Use the tools and return the JSON response."
    )

    try:
        result = executor.invoke({
            "input": user_message,
            "chat_history": [],
        })
        raw = result.get("output", "")

        raw = re.sub(r"^```(?:json)?\s*", "", raw.strip(), flags=re.IGNORECASE)
        raw = re.sub(r"\s*```$", "", raw.strip())

        data = json.loads(raw)
        data.setdefault("skill", skill)
        data.setdefault("location", location)

        summary = json.dumps(data, ensure_ascii=False)
        _save_turn(session_id, user_message, summary)

        return {"success": True, "data": data}

    except json.JSONDecodeError:
        _save_turn(session_id, user_message, raw)
        return {
            "success": True,
            "data": {
                "skill": skill,
                "location": location,
                "demand_overview": raw if raw else "Research completed.",
                "salary_range": "N/A",
                "growth_rate": "N/A",
                "demand_level": "High",
                "top_industries": [],
                "top_companies": [],
                "key_insights": [],
                "career_paths": [],
                "recommended_skills": [],
                "jobs": [],
            },
        }
    except Exception as exc:
        return {"success": False, "error": str(exc)}

def run_chat_message(message: str, session_id: str) -> dict:
    """
    Follow-up conversational query — uses the session's message history
    so the agent remembers everything from the initial search.
    """
    history = _get_history(session_id)

    if not history:
        return {
            "success": False,
            "error": "No active session. Please run a skill search first.",
        }

    executor = _build_executor(CHAT_SYSTEM_PROMPT)

    try:
        result = executor.invoke({
            "input": message,
            "chat_history": history,
        })
        reply = result.get("output", "I couldn't process that. Please try again.")

        _save_turn(session_id, message, reply)

        return {"success": True, "reply": reply}

    except Exception as exc:
        return {"success": False, "error": str(exc)}
