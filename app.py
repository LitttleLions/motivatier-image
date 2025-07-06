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
    app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

    # Dynamic base path support for subdirectory deployment
    base_path = os.environ.get('APPLICATION_ROOT', '/motivatier-image').rstrip('/')
    app.config['APPLICATION_ROOT'] = base_path
    app.logger.info(f"App initialized with APPLICATION_ROOT: {app.config['APPLICATION_ROOT']}")
    app.logger.info(f"Calculated base_path for blueprints: {base_path}")

    from blueprints.api import api_bp
    from blueprints.ui import ui_bp

    # Configure for subdirectory deployment
    api_prefix = f"{base_path}/api"
    ui_prefix = base_path

    # Register blueprints with subdirectory prefixes
    app.register_blueprint(api_bp, url_prefix=api_prefix)
    app.register_blueprint(ui_bp, url_prefix=ui_prefix)

    # Debug: Print registered routes
    print("Registered routes:")
    for rule in app.url_map.iter_rules():
        print(f"  {rule.rule} -> {rule.endpoint}")

    # Add a catch-all route for debugging
    @app.route('/<path:path>')
    def catch_all(path):
        print(f"Catch-all route accessed: {path}")
        return f"Path not found: {path}", 404

    return app

app = create_app()
