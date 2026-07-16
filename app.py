"""
HireSight Flask Application — Production-ready REST API server.
Serves the frontend and exposes /api endpoints for the HireSight memory agent.
"""

import os
import logging
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
from agent import run_hiresight_query, run_chat_message

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger("hiresight")

app = Flask(__name__, static_folder="frontend", static_url_path="")

allowed_origins = os.getenv("ALLOWED_ORIGINS", "*")
CORS(app, resources={r"/api/*": {"origins": allowed_origins}})

@app.route("/")
def index():
    return send_from_directory(app.static_folder, "index.html")

@app.errorhandler(404)
def not_found(e):
    try:
        return send_from_directory(app.static_folder, "index.html")
    except Exception:
        return jsonify({"error": "Not found"}), 404

@app.route("/api/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({"status": "ok", "service": "HireSight API", "version": "2.0.0"})

@app.route("/api/search", methods=["POST"])
def search():
    """
    POST /api/search
    Body: { "skill": "Generative AI", "location": "Bangalore", "session_id": "uuid" }
    Returns structured skill demand + job listings JSON.
    """
    payload = request.get_json(silent=True)
    if not payload:
        return jsonify({"success": False, "error": "Request body must be JSON"}), 400

    skill      = payload.get("skill", "").strip()
    location   = payload.get("location", "India").strip()
    session_id = payload.get("session_id", "default")

    if not skill:
        return jsonify({"success": False, "error": "'skill' field is required"}), 422
    if len(skill) > 100:
        return jsonify({"success": False, "error": "'skill' is too long"}), 422

    logger.info("Search  — skill=%s  location=%s  session=%s", skill, location, session_id)

    result = run_hiresight_query(skill, location, session_id)
    return jsonify(result), 200 if result.get("success") else 500

@app.route("/api/chat", methods=["POST"])
def chat():
    """
    POST /api/chat
    Body: { "message": "Tell me more about the first job", "session_id": "uuid" }
    Returns conversational response using the session's memory.
    """
    payload = request.get_json(silent=True)
    if not payload:
        return jsonify({"success": False, "error": "Request body must be JSON"}), 400

    message    = payload.get("message", "").strip()
    session_id = payload.get("session_id", "default")

    if not message:
        return jsonify({"success": False, "error": "'message' field is required"}), 422
    if len(message) > 500:
        return jsonify({"success": False, "error": "'message' is too long"}), 422

    logger.info("Chat    — session=%s  message=%s", session_id, message[:60])

    result = run_chat_message(message, session_id)
    return jsonify(result), 200 if result.get("success") else 500

if __name__ == "__main__":
    port  = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    logger.info("Starting HireSight Memory Agent server on port %d  debug=%s", port, debug)
    app.run(host="0.0.0.0", port=port, debug=debug)
