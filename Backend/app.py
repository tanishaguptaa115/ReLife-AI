"""
ReLife AI - Main Application Entry Point
"""

from flask import Flask
from flask_cors import CORS
from config import Config
from routes import register_routes
import os


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS for all routes
    CORS(app, resources={r"/*": {"origins": "*"}})

    # Ensure upload folder exists
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    # Register all routes
    register_routes(app)

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(
        host="0.0.0.0",
        port=5001,
        debug=True
    )
