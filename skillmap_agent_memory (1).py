import requests
from google.colab import userdata
from langchain.tools import tool
from langchain_tavily import TavilySearch
from langchain.chat_models import init_chat_model
from langchain.agents import create_agent
from langgraph.checkpoint.memory import InMemorySaver

TAVILY_API_KEY = userdata.get("TAVILY_API_KEY")
RAPIDAPI_KEY = userdata.get("RAPIDAPI_KEY")
GOOGLE_API_KEY = userdata.get("GOOGLE_API_KEY")

skill_demand_tool = TavilySearch(
    max_results=5,
    search_depth="advanced",
    tavily_api_key=TAVILY_API_KEY,
)

@tool
def search_jobs(skill: str, location: str) -> list:
    """
    Search for jobs requiring a specific skill using the JSearch API.
    """
    print("\nCalling search_jobs tool")
    print(f"Searching jobs for: {skill} in {location}")
    url = "https://jsearch.p.rapidapi.com/search"
    headers = {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": "jsearch.p.rapidapi.com",
    }
    params = {
        "query": f"{skill} in {location}",
        "page": "1",
        "num_pages": "1",
        "country": "in",
        "employment_types": "INTERN,FULLTIME",
        "job_requirements": "no_experience,under_3_years_experience",
    }
    response = requests.get(url, headers=headers, params=params)
    data = response.json()
    jobs = data.get("data", [])
    print(f"Found {len(jobs)} jobs\n")
    return [
        {
            "title": job.get("job_title"),
            "company": job.get("employer_name"),
            "location": job.get("job_city"),
            "apply_link": job.get("job_apply_link"),
        }
        for job in jobs
    ]

SYSTEM_PROMPT = """
You are a Skill-to-Career Mapping assistant that helps students understand skill demand
and find matching job opportunities.

You have access to these tools:
- skill_demand_tool: Research industry demand, salary insights, and career trends
- search_jobs: Find real job listings based on skills and location

Present results in a clean, readable format with clear sections and spacing.
Include all job details with apply links.
Do not use markdown formatting.
"""

model = init_chat_model(
    "google_genai:gemini-2.5-flash",
    api_key=GOOGLE_API_KEY,
)

checkpointer = InMemorySaver()
config = {"configurable": {"thread_id": "1"}}

agent = create_agent(
    model=model,
    system_prompt=SYSTEM_PROMPT,
    tools=[skill_demand_tool, search_jobs],
    checkpointer=checkpointer,
    debug=True,
)

user_query = (
    "What's the demand for generative AI in the industry "
    "and show me related job openings in India"
)

response = agent.invoke(
    {"messages": [{"role": "user", "content": user_query}]},
    config=config,
)

print(response["messages"][-1].content[0]["text"])

user_query = "Tell me more about the second job you showed"

response = agent.invoke(
    {"messages": [{"role": "user", "content": user_query}]},
    config=config,
)

print(response["messages"][-1].content[0]["text"])