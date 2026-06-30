"""
ReLife AI - Route Registration
Registers all blueprints onto the Flask app.
"""

from item_analysis import item_analysis_bp
from sustainability import sustainability_bp
from recommendation import recommendation_bp

def register_routes(app):
    """Register all route blueprints."""
    app.register_blueprint(item_analysis_bp)
    app.register_blueprint(sustainability_bp)
    app.register_blueprint(recommendation_bp)

    # Root health check
    @app.route("/", methods=["GET"])
    def root():
        return {
            "app": "ReLife AI",
            "version": "1.0.0",
            "status": "running",
            "endpoints": {
                "POST /analyze": "Upload image for full item analysis",
                "POST /sustainability-score": "Upload image for sustainability breakdown",
                "POST /recommendation": "Upload image for recommendation only",
                "GET /health": "Health check",
            },
        }

    @app.route("/health", methods=["GET"])
    def health():
        return {"status": "ok", "message": "ReLife AI backend is running"}
