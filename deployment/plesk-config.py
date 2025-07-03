
import os
from dotenv import load_dotenv

load_dotenv()

class PleskConfig:
    """Plesk-optimierte Konfiguration"""
    
    # Plesk-spezifische Pfade
    BASE_PATH = os.getenv('BASE_PATH', 'httpdocs/images')
    MAX_SIZE_MB = int(os.getenv('MAX_SIZE_MB', '10'))
    ALLOWED_TYPES = os.getenv('ALLOWED_TYPES', 'image/jpeg,image/png,image/gif,image/webp').split(',')
    
    # Plesk-Pfad-Logik
    if os.getenv('PLESK_ENVIRONMENT'):
        # Produktionsumgebung auf Plesk
        DOMAIN = os.getenv('DOMAIN', 'ihre-domain.de')
        UPLOAD_FOLDER = f'/var/www/vhosts/{DOMAIN}/httpdocs/images'
        LOG_DIR = f'/var/www/vhosts/{DOMAIN}/logs'
    else:
        # Entwicklungsumgebung (Replit)
        UPLOAD_FOLDER = os.path.join(os.getcwd(), 'images')
        LOG_DIR = os.path.join(os.getcwd(), 'logs')
    
    MAX_CONTENT_LENGTH = MAX_SIZE_MB * 1024 * 1024
    THUMBNAIL_SIZE = (150, 150)
    
    # Plesk-spezifische URL-Basis
    if os.getenv('PLESK_ENVIRONMENT'):
        BASE_URL = f"https://{os.getenv('DOMAIN', 'ihre-domain.de')}"
    else:
        BASE_URL = ""
