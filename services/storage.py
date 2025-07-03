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
