import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    BASE_PATH = os.getenv('BASE_PATH', 'images')
    MAX_SIZE_MB = int(os.getenv('MAX_SIZE_MB', '10'))
    ALLOWED_TYPES = os.getenv('ALLOWED_TYPES', 'image/jpeg,image/png,image/gif,image/webp').split(',')
    
    # Optimized for Replit Deployments with persistent storage
    if os.getenv('REPLIT_DEPLOYMENT'):
        UPLOAD_FOLDER = f'/tmp/persistent/{BASE_PATH}'
    else:
        UPLOAD_FOLDER = os.path.join(os.getcwd(), BASE_PATH)
    
    MAX_CONTENT_LENGTH = MAX_SIZE_MB * 1024 * 1024  # Convert MB to bytes
    THUMBNAIL_SIZE = (150, 150)
