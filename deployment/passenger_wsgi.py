
#!/usr/bin/env python3
"""
Plesk Passenger WSGI Entry Point
Für Python-Apps in Plesk Obsidian
"""
import sys
import os

# Plesk-spezifische Pfade hinzufügen
sys.path.insert(0, os.path.dirname(__file__))

# Plesk-Umgebung aktivieren
os.environ['PLESK_ENVIRONMENT'] = '1'

# App importieren
from main import app as application

# Für Plesk-Kompatibilität
if __name__ == '__main__':
    application.run()
