
#!/usr/bin/env python3
"""
WSGI Entry Point for Docker Deployment
"""
import os
import sys

# Add current directory to Python path
sys.path.insert(0, os.path.dirname(__file__))

# Import the Flask application
from app import app as application

if __name__ == '__main__':
    # For development/testing
    application.run(host='0.0.0.0', port=5000, debug=False)
