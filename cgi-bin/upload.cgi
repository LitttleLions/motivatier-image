
#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import os
import cgitb
import cgi
import json

# CGI Error handling
cgitb.enable()

# Pfad zur App hinzufügen
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, parent_dir)

print("Content-Type: application/json; charset=utf-8")
print()

try:
    from services.storage import StorageService
    from services.thumbs import ThumbnailService
    import tempfile
    
    # CGI Form-Daten lesen
    form = cgi.FieldStorage()
    
    if "file" in form:
        fileitem = form["file"]
        
        if fileitem.filename:
            # Temporäre Datei erstellen
            with tempfile.NamedTemporaryFile(delete=False) as temp_file:
                temp_file.write(fileitem.file.read())
                temp_path = temp_file.name
            
            try:
                # Datei verarbeiten
                result = StorageService.save_file(
                    temp_path, 
                    fileitem.filename,
                    form.getvalue("folder", "")
                )
                
                # Thumbnail erstellen
                if result.get('success'):
                    ThumbnailService.create_thumbnail(result['file_path'])
                
                print(json.dumps(result))
                
            finally:
                # Temp-Datei löschen
                os.unlink(temp_path)
        else:
            print(json.dumps({"error": "No file selected"}))
    else:
        print(json.dumps({"error": "No file uploaded"}))
        
except Exception as e:
    print(json.dumps({"error": f"Server error: {str(e)}"}))
