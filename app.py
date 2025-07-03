import os
import logging
from logging.handlers import RotatingFileHandler
from flask import Flask
from werkzeug.middleware.proxy_fix import ProxyFix
from config import Config

# Configure logging
if not os.path.exists('logs'):
    os.makedirs('logs')

logging.basicConfig(
    handlers=[RotatingFileHandler('logs/app.log', maxBytes=10000000, backupCount=10)],
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(name)s %(message)s'
)

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key-change-in-production")
    app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)
    
    # Create required directories
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # Register blueprints
    from blueprints.api import api_bp
    from blueprints.ui import ui_bp
    
    app.register_blueprint(api_bp, url_prefix='/api')
    app.register_blueprint(ui_bp)
    
    return app

app = create_app()
