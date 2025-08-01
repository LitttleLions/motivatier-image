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
    
    # Configure ProxyFix to trust headers from the reverse proxy
    # x_for=1, x_proto=1, x_host=1, x_port=1, x_prefix=1
    # This will correctly handle URL generation when behind a proxy.
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_port=1, x_prefix=1)

    # The APPLICATION_ROOT is now handled by ProxyFix via the X-Forwarded-Prefix header.
    # We still read it from the environment for fallback or direct runs.
    base_path = os.environ.get('APPLICATION_ROOT', '').rstrip('/')
    if base_path:
        app.config['APPLICATION_ROOT'] = base_path
        # Explicitly set the static URL path to respect the APPLICATION_ROOT
        app.static_url_path = f"{base_path}/static"
    
    app.logger.info(f"App initialized with APPLICATION_ROOT: {app.config.get('APPLICATION_ROOT')}")
    app.logger.info(f"Static URL Path set to: {app.static_url_path}")


    from blueprints.api import api_bp
    from blueprints.ui import ui_bp

    # Register blueprints. Flask will handle the APPLICATION_ROOT prefix automatically.
    app.register_blueprint(api_bp, url_prefix='/api')
    app.register_blueprint(ui_bp, url_prefix='/')

    return app

app = create_app()
