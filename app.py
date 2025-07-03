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

    # Dynamic base path support for subdirectory deployment
    base_path = os.environ.get('APPLICATION_ROOT', '/motivatier-image').rstrip('/')
    if base_path:
        app.config['APPLICATION_ROOT'] = base_path

    # Create required directories
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    # Register blueprints with dynamic prefix
    from blueprints.api import api_bp
    from blueprints.ui import ui_bp

    # Configure for subdirectory deployment
    api_prefix = f"{base_path}/api"
    ui_prefix = base_path

    # Register blueprints with subdirectory prefixes
    app.register_blueprint(api_bp, url_prefix=api_prefix)
    app.register_blueprint(ui_bp, url_prefix=ui_prefix)

    return app

app = create_app()