import os
import logging
import sys # Import sys
from logging.handlers import RotatingFileHandler
from flask import Flask
from werkzeug.middleware.proxy_fix import ProxyFix
from config import Config

# Configure logging
if not os.path.exists('logs'):
    os.makedirs('logs')

# Configure logging to file and console
logging.basicConfig(
    handlers=[
        RotatingFileHandler('logs/app.log', maxBytes=10000000, backupCount=10),
        logging.StreamHandler(sys.stdout) # Add StreamHandler to output logs to console
    ],
    level=logging.DEBUG, # Set to DEBUG for more detailed logging
    format='%(asctime)s %(levelname)s %(name)s %(message)s'
)

# Set Werkzeug logger to DEBUG as well for detailed request/response info
logging.getLogger('werkzeug').setLevel(logging.DEBUG)

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key-change-in-production")
    
    app.wsgi_app = ProxyFix(app.wsgi_app) # Keep ProxyFix but simplify parameters

    # The APPLICATION_ROOT will be set by Werkzeug/Gunicorn based on SCRIPT_NAME header from Nginx
    base_path = os.environ.get('APPLICATION_ROOT', '').rstrip('/')
    if base_path:
        app.config['APPLICATION_ROOT'] = base_path
    
    app.logger.info(f"App initialized with APPLICATION_ROOT: {app.config.get('APPLICATION_ROOT')}")

    from blueprints.api import api_bp
    from blueprints.ui import ui_bp

    # Register blueprints. Werkzeug will use SCRIPT_NAME to calculate prefixes.
    app.register_blueprint(api_bp, url_prefix='/api')
    app.register_blueprint(ui_bp, url_prefix='/')

    return app

app = create_app()
