#!/bin/bash

# Image Storage Service - VPS Setup Script
# Automatisches Deployment für Ubuntu 22.04 LTS (Hetzner/IONOS)
# Version: 1.0

set -e  # Exit bei Fehlern

echo "🚀 Image Storage Service - VPS Setup wird gestartet..."
echo "===================================================="

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging-Funktion
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

# Domain-Parameter prüfen
if [ -z "$1" ]; then
    echo -e "${RED}Verwendung: $0 <domain.de> [email@domain.de]${NC}"
    echo "Beispiel: $0 images.meinedomain.de admin@meinedomain.de"
    exit 1
fi

DOMAIN=$1
EMAIL=${2:-"admin@$DOMAIN"}
APP_USER="imgsvc"
APP_DIR="/var/www/imgsvc"
SERVICE_NAME="image-storage"

log "Setup für Domain: $DOMAIN"
log "SSL Email: $EMAIL"

# System Update
log "System wird aktualisiert..."
apt update && apt upgrade -y

# Basis-Pakete installieren
log "Installiere erforderliche Pakete..."
apt install -y \
    python3 \
    python3-pip \
    python3-venv \
    nginx \
    git \
    certbot \
    python3-certbot-nginx \
    ufw \
    supervisor \
    curl \
    unzip

# Python-Version prüfen
PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
log "Python Version: $PYTHON_VERSION"

# App-User erstellen
log "Erstelle Anwendungsbenutzer..."
if ! id "$APP_USER" &>/dev/null; then
    useradd -r -s /bin/false -d $APP_DIR $APP_USER
fi

# Verzeichnis erstellen
log "Erstelle Anwendungsverzeichnis..."
mkdir -p $APP_DIR
mkdir -p $APP_DIR/images
mkdir -p $APP_DIR/logs
mkdir -p /var/log/imgsvc

# Code-Dateien erstellen
log "Erstelle Anwendungscode..."
cd $APP_DIR

# App.py erstellen
cat > app.py << 'EOF'
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
    app.secret_key = os.environ.get("SESSION_SECRET", "change-this-in-production")
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
EOF

# Main-Datei
cat > main.py << 'EOF'
from app import app

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
EOF

# Config-Datei für Production
cat > config.py << 'EOF'
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    BASE_PATH = os.getenv('BASE_PATH', 'images')
    MAX_SIZE_MB = int(os.getenv('MAX_SIZE_MB', '10'))
    ALLOWED_TYPES = os.getenv('ALLOWED_TYPES', 'image/jpeg,image/png,image/gif,image/webp').split(',')
    UPLOAD_FOLDER = os.path.join('/var/www/imgsvc', BASE_PATH)
    MAX_CONTENT_LENGTH = MAX_SIZE_MB * 1024 * 1024
    THUMBNAIL_SIZE = (150, 150)
EOF

# Requirements
cat > requirements.txt << 'EOF'
Flask==3.1.*
Werkzeug>=3
python-dotenv>=1.0
Pillow>=11
gunicorn>=21.0
EOF

# Environment-Datei
cat > .env << 'EOF'
BASE_PATH=images
MAX_SIZE_MB=10
ALLOWED_TYPES=image/jpeg,image/png,image/gif,image/webp
SESSION_SECRET=change-this-secure-key-in-production
FLASK_ENV=production
EOF

# Blueprints-Verzeichnis
mkdir -p blueprints services static/css static/js templates

# API Blueprint
cat > blueprints/__init__.py << 'EOF'
# Empty file
EOF

cat > blueprints/api.py << 'EOF'
from flask import Blueprint, request, jsonify, current_app
from werkzeug.exceptions import RequestEntityTooLarge
from services.storage import StorageService
from services.thumbs import ThumbnailService
import os
import logging

logger = logging.getLogger(__name__)

api_bp = Blueprint('api', __name__)

@api_bp.errorhandler(RequestEntityTooLarge)
def handle_file_too_large(e):
    return jsonify({'error': f'File too large. Maximum size is {current_app.config["MAX_SIZE_MB"]}MB'}), 413

@api_bp.route('/upload', methods=['POST'])
def upload_file():
    """Upload a file"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Check file type
        if file.content_type not in current_app.config['ALLOWED_TYPES']:
            return jsonify({'error': f'Unsupported file type. Allowed types: {", ".join(current_app.config["ALLOWED_TYPES"])}'}), 415
        
        # Get optional folder parameter
        folder = request.form.get('folder', '').strip()
        
        # Save file
        result = StorageService.save_file(file, folder if folder else None)
        
        # Generate thumbnail
        file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], result['path'])
        ThumbnailService.process_uploaded_image(file_path)
        
        logger.info(f"File uploaded successfully: {result['name']}")
        return jsonify(result), 200
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@api_bp.route('/list', methods=['GET'])
def list_files():
    """List files in a directory"""
    try:
        path = request.args.get('path', '')
        files = StorageService.list_files(path)
        return jsonify(files), 200
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"List error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@api_bp.route('/folder', methods=['POST'])
def create_folder():
    """Create a new folder"""
    try:
        data = request.get_json()
        if not data or 'path' not in data:
            return jsonify({'error': 'Path is required'}), 400
        
        path = data['path']
        StorageService.create_folder(path)
        
        return jsonify({'success': True}), 200
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Folder creation error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500
EOF

cat > blueprints/ui.py << 'EOF'
from flask import Blueprint, render_template, send_from_directory, current_app, abort
import os

ui_bp = Blueprint('ui', __name__)

@ui_bp.route('/')
def index():
    """Main application page"""
    return render_template('index.html')

@ui_bp.route('/images/<path:filename>')
def serve_image(filename):
    """Serve uploaded images"""
    try:
        # Security check - prevent directory traversal
        if '..' in filename or filename.startswith('/'):
            abort(404)
        
        file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
        
        # Check if file exists
        if not os.path.exists(file_path):
            abort(404)
        
        # Get directory and filename
        directory = os.path.dirname(file_path)
        basename = os.path.basename(file_path)
        
        return send_from_directory(directory, basename)
        
    except Exception:
        abort(404)
EOF

# Services erstellen
cat > services/__init__.py << 'EOF'
# Empty file
EOF

cat > services/storage.py << 'EOF'
import os
import shutil
from datetime import datetime
from pathlib import Path
from werkzeug.utils import secure_filename
from flask import current_app
import logging

logger = logging.getLogger(__name__)

class StorageService:
    @staticmethod
    def get_date_path():
        """Generate date-based path (YYYY/MM/DD)"""
        now = datetime.now()
        return f"{now.year:04d}/{now.month:02d}/{now.day:02d}"
    
    @staticmethod
    def get_unique_filename(directory, filename):
        """Handle filename collisions by adding incrementing numbers"""
        if not os.path.exists(os.path.join(directory, filename)):
            return filename
        
        name, ext = os.path.splitext(filename)
        counter = 1
        while os.path.exists(os.path.join(directory, f"{name}-{counter}{ext}")):
            counter += 1
        return f"{name}-{counter}{ext}"
    
    @staticmethod
    def save_file(file, folder_path=None):
        """Save uploaded file with proper organization"""
        try:
            # Use provided folder or generate date-based path
            if folder_path:
                # Remove leading/trailing slashes and ensure it's safe
                folder_path = folder_path.strip('/')
                if '..' in folder_path or folder_path.startswith('/'):
                    raise ValueError("Invalid folder path")
                date_path = folder_path
            else:
                date_path = StorageService.get_date_path()
            
            # Create full directory path
            full_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], date_path)
            os.makedirs(full_dir, exist_ok=True)
            
            # Create thumbnails directory
            thumb_dir = os.path.join(full_dir, '.thumbs')
            os.makedirs(thumb_dir, exist_ok=True)
            
            # Get secure filename and handle collisions
            filename = secure_filename(file.filename)
            if not filename:
                raise ValueError("Invalid filename")
            
            unique_filename = StorageService.get_unique_filename(full_dir, filename)
            
            # Save original file
            file_path = os.path.join(full_dir, unique_filename)
            file.save(file_path)
            
            # Get file stats
            file_stats = os.stat(file_path)
            
            # Generate public URL
            public_url = f"/{current_app.config['BASE_PATH']}/{date_path}/{unique_filename}"
            
            logger.info(f"File saved: {file_path}")
            
            return {
                'url': public_url,
                'path': os.path.join(date_path, unique_filename),
                'name': unique_filename,
                'size': file_stats.st_size,
                'type': file.content_type
            }
            
        except Exception as e:
            logger.error(f"Error saving file: {str(e)}")
            raise
    
    @staticmethod
    def list_files(path=''):
        """List files in a given path"""
        try:
            # Sanitize path
            path = path.strip('/')
            if '..' in path:
                raise ValueError("Invalid path")
            
            full_path = os.path.join(current_app.config['UPLOAD_FOLDER'], path) if path else current_app.config['UPLOAD_FOLDER']
            
            if not os.path.exists(full_path):
                return []
            
            files = []
            for item in os.listdir(full_path):
                if item.startswith('.'):
                    continue
                    
                item_path = os.path.join(full_path, item)
                relative_path = os.path.join(path, item) if path else item
                
                if os.path.isfile(item_path):
                    stats = os.stat(item_path)
                    
                    # Check for thumbnail
                    thumb_path = os.path.join(full_path, '.thumbs', item)
                    thumb_url = None
                    if os.path.exists(thumb_path):
                        thumb_url = f"/{current_app.config['BASE_PATH']}/{relative_path.replace(item, f'.thumbs/{item}')}"
                    
                    files.append({
                        'name': item,
                        'url': f"/{current_app.config['BASE_PATH']}/{relative_path}",
                        'size': stats.st_size,
                        'thumb': thumb_url,
                        'mtime': stats.st_mtime,
                        'type': 'file'
                    })
                elif os.path.isdir(item_path):
                    files.append({
                        'name': item,
                        'path': relative_path,
                        'type': 'directory'
                    })
            
            # Sort directories first, then files by name
            files.sort(key=lambda x: (x['type'] != 'directory', x['name']))
            return files
            
        except Exception as e:
            logger.error(f"Error listing files: {str(e)}")
            raise
    
    @staticmethod
    def create_folder(path):
        """Create a new folder"""
        try:
            # Sanitize path
            path = path.strip('/')
            if '..' in path or not path:
                raise ValueError("Invalid path")
            
            full_path = os.path.join(current_app.config['UPLOAD_FOLDER'], path)
            os.makedirs(full_path, exist_ok=True)
            
            # Create thumbnails directory
            thumb_dir = os.path.join(full_path, '.thumbs')
            os.makedirs(thumb_dir, exist_ok=True)
            
            logger.info(f"Folder created: {full_path}")
            return True
            
        except Exception as e:
            logger.error(f"Error creating folder: {str(e)}")
            raise
EOF

cat > services/thumbs.py << 'EOF'
import os
from PIL import Image
from flask import current_app
import logging

logger = logging.getLogger(__name__)

class ThumbnailService:
    @staticmethod
    def generate_thumbnail(original_path, thumbnail_path):
        """Generate thumbnail for an image"""
        try:
            with Image.open(original_path) as img:
                # Convert to RGB if necessary (for PNG with transparency, etc.)
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                
                # Create thumbnail
                img.thumbnail(current_app.config['THUMBNAIL_SIZE'], Image.Resampling.LANCZOS)
                
                # Save thumbnail with optimization
                img.save(thumbnail_path, 'JPEG', optimize=True, quality=85)
                
                # Check if thumbnail is under 30KB
                if os.path.getsize(thumbnail_path) > 30 * 1024:
                    # If too large, reduce quality
                    img.save(thumbnail_path, 'JPEG', optimize=True, quality=60)
                
                logger.info(f"Thumbnail generated: {thumbnail_path}")
                return True
                
        except Exception as e:
            logger.error(f"Error generating thumbnail: {str(e)}")
            # If thumbnail generation fails, remove the partial file
            if os.path.exists(thumbnail_path):
                os.remove(thumbnail_path)
            return False
    
    @staticmethod
    def process_uploaded_image(file_path):
        """Process uploaded image and generate thumbnail"""
        try:
            directory = os.path.dirname(file_path)
            filename = os.path.basename(file_path)
            
            # Create thumbnail path
            thumb_dir = os.path.join(directory, '.thumbs')
            os.makedirs(thumb_dir, exist_ok=True)
            
            # Generate thumbnail with same name but .jpg extension
            name, _ = os.path.splitext(filename)
            thumb_path = os.path.join(thumb_dir, f"{name}.jpg")
            
            return ThumbnailService.generate_thumbnail(file_path, thumb_path)
            
        except Exception as e:
            logger.error(f"Error processing uploaded image: {str(e)}")
            return False
EOF

# Einfache HTML-Template (vereinfacht)
cat > templates/index.html << 'EOF'
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Image Storage Service</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #1a1a1a; color: white; }
        .container { max-width: 1200px; margin: 0 auto; }
        .upload-area { border: 2px dashed #8b5cf6; padding: 40px; text-align: center; margin: 20px 0; border-radius: 8px; }
        .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; margin-top: 20px; }
        .image-card { background: #2a2a2a; border-radius: 8px; overflow: hidden; }
        .image-card img { width: 100%; height: 200px; object-fit: cover; }
        .image-info { padding: 12px; }
        button { background: #8b5cf6; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; }
        button:hover { background: #7c3aed; }
        input[type="file"] { margin: 10px 0; }
        .success { color: #10b981; margin: 10px 0; }
        .error { color: #ef4444; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🖼️ Image Storage Service</h1>
        
        <div class="upload-area">
            <h3>Bilder hochladen</h3>
            <input type="file" id="fileInput" multiple accept="image/*">
            <br>
            <input type="text" id="folderInput" placeholder="Ordner (optional)" style="margin: 10px; padding: 8px; background: #333; border: 1px solid #666; color: white; border-radius: 4px;">
            <br>
            <button onclick="uploadFiles()">Upload starten</button>
            <div id="status"></div>
        </div>
        
        <div id="gallery" class="gallery"></div>
    </div>

    <script>
        let currentPath = '';
        
        async function uploadFiles() {
            const fileInput = document.getElementById('fileInput');
            const folderInput = document.getElementById('folderInput');
            const status = document.getElementById('status');
            
            if (!fileInput.files.length) {
                status.innerHTML = '<div class="error">Bitte Dateien auswählen</div>';
                return;
            }
            
            status.innerHTML = '<div>Upload läuft...</div>';
            
            for (let file of fileInput.files) {
                const formData = new FormData();
                formData.append('file', file);
                if (folderInput.value.trim()) {
                    formData.append('folder', folderInput.value.trim());
                }
                
                try {
                    const response = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData
                    });
                    
                    if (response.ok) {
                        status.innerHTML = '<div class="success">Upload erfolgreich!</div>';
                    } else {
                        const error = await response.json();
                        status.innerHTML = `<div class="error">Fehler: ${error.error}</div>`;
                    }
                } catch (error) {
                    status.innerHTML = `<div class="error">Fehler: ${error.message}</div>`;
                }
            }
            
            loadGallery();
        }
        
        async function loadGallery() {
            try {
                const response = await fetch(`/api/list?path=${currentPath}`);
                const files = await response.json();
                
                const gallery = document.getElementById('gallery');
                gallery.innerHTML = files.map(file => {
                    if (file.type === 'file') {
                        const thumbUrl = file.thumb || file.url;
                        return `
                            <div class="image-card">
                                <img src="${thumbUrl}" alt="${file.name}" onclick="window.open('${file.url}', '_blank')">
                                <div class="image-info">
                                    <strong>${file.name}</strong><br>
                                    <small>${formatFileSize(file.size)}</small><br>
                                    <button onclick="copyUrl('${window.location.origin}${file.url}')">URL kopieren</button>
                                </div>
                            </div>
                        `;
                    }
                    return '';
                }).join('');
            } catch (error) {
                console.error('Fehler beim Laden:', error);
            }
        }
        
        function copyUrl(url) {
            navigator.clipboard.writeText(url).then(() => {
                alert('URL kopiert!');
            });
        }
        
        function formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }
        
        // Galerie beim Laden anzeigen
        loadGallery();
    </script>
</body>
</html>
EOF

# Python Virtual Environment erstellen
log "Erstelle Python Virtual Environment..."
python3 -m venv venv
source venv/bin/activate

# Python-Pakete installieren
log "Installiere Python-Abhängigkeiten..."
pip install --upgrade pip
pip install -r requirements.txt

# Sichere Session-Secret generieren
log "Generiere sichere Session-Secret..."
SECRET=$(python3 -c 'import secrets; print(secrets.token_hex(32))')
sed -i "s/change-this-secure-key-in-production/$SECRET/" .env

# Berechtigungen setzen
log "Setze Dateiberechtigungen..."
chown -R $APP_USER:$APP_USER $APP_DIR
chmod -R 755 $APP_DIR
chmod -R 775 $APP_DIR/images
chmod -R 775 $APP_DIR/logs

# Systemd Service erstellen
log "Erstelle Systemd Service..."
cat > /etc/systemd/system/$SERVICE_NAME.service << EOF
[Unit]
Description=Image Storage Service (Flask/Gunicorn)
After=network.target

[Service]
Type=notify
User=$APP_USER
Group=$APP_USER
WorkingDirectory=$APP_DIR
Environment="PATH=$APP_DIR/venv/bin"
EnvironmentFile=$APP_DIR/.env
ExecStart=$APP_DIR/venv/bin/gunicorn --bind 127.0.0.1:5000 --workers 2 --timeout 120 --worker-class sync main:app
ExecReload=/bin/kill -s HUP \$MAINPID
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=$SERVICE_NAME

[Install]
WantedBy=multi-user.target
EOF

# Nginx-Konfiguration
log "Erstelle Nginx-Konfiguration..."
cat > /etc/nginx/sites-available/$SERVICE_NAME << EOF
server {
    listen 80;
    server_name $DOMAIN;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Max file size
    client_max_body_size 20M;

    # Static files
    location /static/ {
        alias $APP_DIR/static/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Image files
    location /images/ {
        alias $APP_DIR/images/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        
        # CORS für externe Verlinkung
        add_header Access-Control-Allow-Origin "*";
        add_header Access-Control-Allow-Methods "GET, OPTIONS";
        add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept";
    }

    # Application
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_redirect off;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

# Nginx-Site aktivieren
ln -sf /etc/nginx/sites-available/$SERVICE_NAME /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Nginx-Konfiguration testen
log "Teste Nginx-Konfiguration..."
nginx -t || error "Nginx-Konfiguration fehlerhaft"

# Firewall konfigurieren
log "Konfiguriere Firewall..."
ufw --force enable
ufw allow ssh
ufw allow 'Nginx Full'

# Services starten
log "Starte Services..."
systemctl daemon-reload
systemctl enable $SERVICE_NAME
systemctl start $SERVICE_NAME
systemctl restart nginx

# SSL-Zertifikat erstellen
log "Erstelle SSL-Zertifikat..."
certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email $EMAIL --redirect

# Service-Status prüfen
log "Prüfe Service-Status..."
if systemctl is-active --quiet $SERVICE_NAME; then
    log "✅ Image Storage Service läuft"
else
    warn "⚠️ Service-Problem erkannt"
    systemctl status $SERVICE_NAME
fi

if systemctl is-active --quiet nginx; then
    log "✅ Nginx läuft"
else
    error "❌ Nginx-Problem"
fi

# Backup-Script erstellen
log "Erstelle Backup-Script..."
cat > /usr/local/bin/backup-images.sh << EOF
#!/bin/bash
# Backup-Script für Image Storage
BACKUP_DIR="/var/backups/imgsvc"
DATE=\$(date +%Y%m%d_%H%M%S)

mkdir -p \$BACKUP_DIR

# Images backup
tar -czf \$BACKUP_DIR/images_\$DATE.tar.gz -C $APP_DIR images/

# Logs backup
tar -czf \$BACKUP_DIR/logs_\$DATE.tar.gz -C $APP_DIR logs/

# Alte Backups löschen (älter als 30 Tage)
find \$BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup erstellt: \$BACKUP_DIR"
EOF

chmod +x /usr/local/bin/backup-images.sh

# Cron für tägliche Backups
echo "0 2 * * * root /usr/local/bin/backup-images.sh" > /etc/cron.d/imgsvc-backup

# Monitoring-Script
cat > /usr/local/bin/monitor-imgsvc.sh << EOF
#!/bin/bash
# Service Monitoring
if ! systemctl is-active --quiet $SERVICE_NAME; then
    echo "Service down, restarting..."
    systemctl restart $SERVICE_NAME
fi

if ! systemctl is-active --quiet nginx; then
    echo "Nginx down, restarting..."
    systemctl restart nginx
fi
EOF

chmod +x /usr/local/bin/monitor-imgsvc.sh
echo "*/5 * * * * root /usr/local/bin/monitor-imgsvc.sh" > /etc/cron.d/imgsvc-monitor

# Abschluss
log "🎉 Setup erfolgreich abgeschlossen!"
echo ""
echo "=================================="
echo -e "${GREEN}✅ Image Storage Service ist bereit!${NC}"
echo "=================================="
echo ""
echo -e "${BLUE}🌐 Website:${NC} https://$DOMAIN"
echo -e "${BLUE}📁 App-Verzeichnis:${NC} $APP_DIR"
echo -e "${BLUE}📋 Logs:${NC} journalctl -u $SERVICE_NAME -f"
echo -e "${BLUE}🔄 Service neu starten:${NC} systemctl restart $SERVICE_NAME"
echo -e "${BLUE}💾 Backup erstellen:${NC} /usr/local/bin/backup-images.sh"
echo ""
echo -e "${YELLOW}📝 Nächste Schritte:${NC}"
echo "1. Domain $DOMAIN auf Server-IP zeigen lassen"
echo "2. Warten bis DNS propagiert ist (max. 24h)"
echo "3. Website unter https://$DOMAIN testen"
echo ""
echo -e "${GREEN}🔒 SSL-Zertifikat automatisch erstellt${NC}"
echo -e "${GREEN}🛡️ Firewall konfiguriert${NC}"
echo -e "${GREEN}📦 Automatische Backups aktiviert${NC}"
echo -e "${GREEN}📊 Service-Monitoring aktiv${NC}"