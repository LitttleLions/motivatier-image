
#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import os
import cgitb

# CGI Error handling aktivieren
cgitb.enable()

# Pfad zur App hinzufügen
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, parent_dir)

# CGI-Header setzen
print("Content-Type: text/html; charset=utf-8")
print()

try:
    from app import create_app
    from werkzeug.serving import CGIHandler
    
    # Flask-App erstellen
    app = create_app()
    
    # CGI-Handler verwenden
    handler = CGIHandler()
    handler.run(app)
    
except Exception as e:
    print(f"<h1>CGI Error</h1>")
    print(f"<p>Error: {str(e)}</p>")
    print(f"<p>Python Path: {sys.path}</p>")
    print(f"<p>Current Dir: {os.getcwd()}</p>")
