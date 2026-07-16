from langchain.chat_models import init_chat_model
from langchain_tavily import TavilySearch
from langchain.tools import tool
import requests
from google.colab import userdata

# Initialize Google API key and model
google_api_key = userdata.get('GOOGLE_API_KEY')
model = init_chat_model("google_genai:gemini-2.5-flash", api_key=google_api_key)

# Initialize Tavily search tool
tavily_api_key = userdata.get('TAVILY_API_KEY')
skill_demand_tool = TavilySearch(
    max_results=5,
    search_depth="advanced",
    tavily_api_key=tavily_api_key,
)

# Invoke Tavily search tool
result = skill_demand_tool.invoke({"query": "generative ai skills demand 2025"})
print(result)

# Set up RapidAPI key and search jobs function
rapidapi_key = userdata.get('RAPIDAPI_KEY')

def search_jobs(skill: str, location: str) -> list:
    """Search for jobs requiring a specific skill using JSearch API from RapidAPI."""
    print(f"\nCalling search_jobs tool")
    print(f"Searching jobs for: {skill} in {location}")

    url = "https://jsearch.p.rapidapi.com/search"
    headers = {
        "x-rapidapi-key": rapidapi_key,
        "x-rapidapi-host": "jsearch.p.rapidapi.com"
    }
    querystring = {
        "query": f"{skill} in {location}",
        "page": "1",
        "country": "in",
        "employment_types": "INTERN,FULLTIME",
        "job_requirements": "no_experience,under_3_years_experience"
    }

    response = requests.get(url, headers=headers, params=querystring)
    data = response.json()
    jobs = data.get("data", [])
    print(f"Found {len(jobs)} jobs\n")

    # Format and return job results
    result = []
    for job in jobs:
        result.append({
            "title": job.get("job_title"),
            "company": job.get("employer_name"),
            "location": job.get("job_city"),
            "apply_link": job.get("job_apply_link")
        })
    return result

# Define system prompt for the agent
system_prompt = """You are a Skill-to-Career Mapping assistant that helps students understand skill demand and find matching job opportunities.

You have access to these tools:
- skill_demand_tool: Search for industry demand, salary insights, and career trends
- search_jobs: Find actual job listings requiring specific skills

Help the student by researching the skill they ask about and finding relevant opportunities.

Present results in a clean, readable format with clear sections and proper spacing. Include all job details with apply links. Don't use markdown format."""

# Create and invoke LangChain agent
from langchain.agents import create_agent

agent = create_agent(
    model=model,
    tools=[skill_demand_tool, search_jobs],
    system_prompt=system_prompt,
    debug=True
)

user_query = "What's the demand for generative ai in the industry and show me related job openings in India"

response = agent.invoke({
    "messages": [{"role": "user", "content": user_query}]
})
print(response["messages"][-1].content)



# Try It Yourself
# Challenge yourself by building similar agents:

# Agent Type	Input	What It Does
# Interview Prep Agent	Role Name (e.g., "Data Analyst")	Find common interview questions + preparation tips
# Salary Insights Agent	Job Title (e.g., "Full Stack Developer")	Fetch salary trends + top paying companies
# Course Finder Agent	Skill name (e.g., "Gen AI")	Find free courses + certification options
# Startup Jobs Agent	Domain (e.g., "Fin Tech")	Find startup job openings + company details
# Skill Comparison Agent	Two skills (e.g., "React vs Angular")	Compare demand + job count + future scope
# # Location-Job Agent	City + Skill (e.g., "Bangalore, Python")	Find local jobs + remote options + avg salary