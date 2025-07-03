
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    BASE_PATH = os.getenv('BASE_PATH', 'images')
    MAX_SIZE_MB = int(os.getenv('MAX_SIZE_MB', '10'))
    ALLOWED_TYPES = os.getenv('ALLOWED_TYPES', 'image/jpeg,image/png,image/gif,image/webp').split(',')
    
    # CGI-optimierte Pfade
    if os.getenv('CGI_MODE') or 'cgi-bin' in os.getcwd():
        # CGI-Modus: Relative Pfade vom Document Root
        UPLOAD_FOLDER = os.path.join('..', BASE_PATH)
        STATIC_FOLDER = os.path.join('..', 'static')
    elif os.getenv('REPLIT_DEPLOYMENT'):
        # Replit Deployment
        UPLOAD_FOLDER = f'/tmp/persistent/{BASE_PATH}'
        STATIC_FOLDER = 'static'
    else:
        # Entwicklung
        UPLOAD_FOLDER = os.path.join(os.getcwd(), BASE_PATH)
        STATIC_FOLDER = 'static'
    
    MAX_CONTENT_LENGTH = MAX_SIZE_MB * 1024 * 1024
    THUMBNAIL_SIZE = (150, 150)
