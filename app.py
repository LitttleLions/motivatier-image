import os
from flask import Flask, render_template, request, redirect, url_for, flash, send_from_directory
from werkzeug.utils import secure_filename
from werkzeug.middleware.proxy_fix import ProxyFix
import uuid
from datetime import datetime

# Flask App mit korrekter Subpath-Konfiguration
app = Flask(__name__, 
           static_folder='static',
           static_url_path='/motivatier-image/static',  # KRITISCH: Vollständiger Pfad
           template_folder='templates')

# APPLICATION_ROOT setzen (wichtig für url_for)
app.config['APPLICATION_ROOT'] = '/motivatier-image'

# ProxyFix für Nginx Reverse Proxy
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)

# Weitere App-Konfiguration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-key-change-in-production')
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max

# Upload-Ordner erstellen
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    # Alle Bilder aus dem Upload-Ordner laden
    images = []
    upload_folder = app.config['UPLOAD_FOLDER']
    
    if os.path.exists(upload_folder):
        for filename in os.listdir(upload_folder):
            if allowed_file(filename):
                filepath = os.path.join(upload_folder, filename)
                file_stats = os.stat(filepath)
                images.append({
                    'filename': filename,
                    'upload_date': datetime.fromtimestamp(file_stats.st_mtime).strftime('%Y-%m-%d %H:%M'),
                    'size': f"{file_stats.st_size / 1024:.1f} KB"
                })
    
    # Nach Upload-Datum sortieren (neueste zuerst)
    images.sort(key=lambda x: x['upload_date'], reverse=True)
    
    return render_template('index.html', images=images)

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        flash('Keine Datei ausgewählt', 'error')
        return redirect(url_for('index'))
    
    file = request.files['file']
    
    if file.filename == '':
        flash('Keine Datei ausgewählt', 'error')
        return redirect(url_for('index'))
    
    if file and allowed_file(file.filename):
        # Sicheren Dateinamen generieren
        original_filename = secure_filename(file.filename)
        file_extension = original_filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{uuid.uuid4().hex}.{file_extension}"
        
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(filepath)
        
        flash(f'Bild "{original_filename}" erfolgreich hochgeladen!', 'success')
    else:
        flash('Ungültiges Dateiformat. Erlaubt: PNG, JPG, JPEG, GIF, WebP', 'error')
    
    return redirect(url_for('index'))

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    """Sichere Bereitstellung der hochgeladenen Dateien"""
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/delete/<filename>', methods=['POST'])
def delete_file(filename):
    """Datei löschen"""
    try:
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], secure_filename(filename))
        if os.path.exists(filepath):
            os.remove(filepath)
            flash(f'Bild "{filename}" wurde gelöscht', 'success')
        else:
            flash('Datei nicht gefunden', 'error')
    except Exception as e:
        flash(f'Fehler beim Löschen: {str(e)}', 'error')
    
    return redirect(url_for('index'))

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
