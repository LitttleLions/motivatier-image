import os
import shutil
import json
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
    def save_file(file, folder_path=None, original_filename=None):
        """Save uploaded file with proper organization and create sidecar JSON"""
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
            
            # Generate public URL (this is the path relative to the UPLOAD_FOLDER)
            public_url = os.path.join(date_path, unique_filename).replace('\\', '/')
            current_app.logger.info(f"StorageService.save_file public_url: {public_url}")
            
            # Create sidecar JSON file
            json_filename = Path(unique_filename).stem + ".json"
            json_path = os.path.join(full_dir, json_filename)
            
            metadata = {
                'original_name': original_filename if original_filename else unique_filename,
                'display_name': Path(original_filename).stem if original_filename else Path(unique_filename).stem,
                'upload_date': datetime.now().isoformat(),
                'size': file_stats.st_size,
                'mimetype': file.content_type,
                'secure_name': unique_filename,
                'public_url': public_url
            }
            
            with open(json_path, 'w') as f:
                json.dump(metadata, f, indent=4)
            
            logger.info(f"File saved: {file_path}, Metadata saved: {json_path}")
            
            return {
                'url': public_url,
                'path': os.path.join(date_path, unique_filename),
                'name': unique_filename,
                'size': file_stats.st_size,
                'type': file.content_type,
                'display_name': metadata['display_name'],
                'upload_date': metadata['upload_date']
            }
            
        except Exception as e:
            logger.error(f"Error saving file: {str(e)}")
            raise
    
    @staticmethod
    def list_files(path=''):
        """List files in a given path"""
        try:
            current_app.logger.info(f"StorageService.list_files called with path: '{path}'")
            current_app.logger.info(f"StorageService.list_files UPLOAD_FOLDER: {current_app.config['UPLOAD_FOLDER']}")

            # Sanitize path
            path = path.strip('/')
            if '..' in path:
                raise ValueError("Invalid path")
            
            full_path = os.path.join(current_app.config['UPLOAD_FOLDER'], path) if path else current_app.config['UPLOAD_FOLDER']
            current_app.logger.info(f"StorageService.list_files full_path: {full_path}")
            
            if not os.path.exists(full_path):
                current_app.logger.info(f"StorageService.list_files Path does not exist: {full_path}")
                return []
            
            files = []
            for item in os.listdir(full_path):
                current_app.logger.info(f"StorageService.list_files processing item: {item}")
                if item.startswith('.'):
                    current_app.logger.info(f"StorageService.list_files skipping hidden item: {item}")
                    continue
                    
                item_path = os.path.join(full_path, item)
                # relative_path is the path relative to UPLOAD_FOLDER (e.g., "2025/07/06/my_image.png")
                relative_path = os.path.join(path, item).replace('\\', '/')
                current_app.logger.info(f"StorageService.list_files relative_path for item {item}: {relative_path}")
                
                if os.path.isfile(item_path):
                    stats = os.stat(item_path)
                    
                    # Check for thumbnail
                    # Thumbnail filename has .jpg extension, regardless of original file type
                    thumb_name = Path(item).stem + ".jpg" 
                    thumb_path_full = os.path.join(full_path, '.thumbs', thumb_name)
                    thumb_url = None
                    current_app.logger.info(f"StorageService.list_files checking thumb_path_full: {thumb_path_full}")
                    if os.path.exists(thumb_path_full):
                        # Construct relative path for thumbnail (e.g., "2025/07/06/.thumbs/my_image.jpg")
                        thumb_relative_path = os.path.join(os.path.dirname(relative_path), '.thumbs', thumb_name).replace('\\', '/')
                        thumb_url = thumb_relative_path
                        current_app.logger.info(f"StorageService.list_files thumb_url generated: {thumb_url}")
                    else:
                        current_app.logger.info(f"StorageService.list_files thumbnail not found for {item}")
                    
                    # Try to read sidecar JSON for metadata
                    metadata = {}
                    json_path = os.path.join(full_path, Path(item).stem + ".json")
                    if os.path.exists(json_path):
                        try:
                            with open(json_path, 'r') as f:
                                metadata = json.load(f)
                        except json.JSONDecodeError:
                            logger.warning(f"Error decoding JSON for {json_path}. Skipping metadata.")
                    
                    display_name = metadata.get('display_name', Path(item).stem)
                    upload_date = metadata.get('upload_date', datetime.fromtimestamp(stats.st_mtime).isoformat())

                    files.append({
                        'name': item,
                        'display_name': display_name, # Use display_name from metadata
                        'path': relative_path, # Add the full relative path
                        'url': relative_path, # This is now just the path relative to UPLOAD_FOLDER
                        'size': stats.st_size,
                        'thumb': thumb_url,
                        'mtime': stats.st_mtime,
                        'upload_date': upload_date, # Use upload_date from metadata
                        'type': 'file'
                    })
                elif os.path.isdir(item_path):
                    current_app.logger.info(f"StorageService.list_files found directory: {item}")
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

    @staticmethod
    def rename_file(old_relative_path, new_name):
        """Rename a file and its associated thumbnail and sidecar file."""
        try:
            old_relative_path = old_relative_path.strip('/')
            if '..' in old_relative_path or not old_relative_path:
                raise ValueError("Invalid old file path")
            
            new_name = secure_filename(new_name)
            if not new_name:
                raise ValueError("Invalid new file name")

            base_upload_folder = current_app.config['UPLOAD_FOLDER']
            old_full_path = os.path.join(base_upload_folder, old_relative_path)
            
            if not os.path.exists(old_full_path):
                raise FileNotFoundError(f"File not found: {old_full_path}")

            # Determine new full path
            old_dir = os.path.dirname(old_full_path)
            new_full_path = os.path.join(old_dir, new_name)

            # Handle filename collisions for the new name
            new_full_path_unique = StorageService.get_unique_filename(old_dir, new_name)
            new_name_unique = os.path.basename(new_full_path_unique)

            # Rename main file
            os.rename(old_full_path, new_full_path_unique)
            logger.info(f"File renamed from {old_full_path} to {new_full_path_unique}")

            # Rename thumbnail
            old_thumb_name = Path(old_full_path).stem + ".jpg"
            old_thumb_path = os.path.join(old_dir, '.thumbs', old_thumb_name)
            if os.path.exists(old_thumb_path):
                new_thumb_name = Path(new_full_path_unique).stem + ".jpg"
                new_thumb_path = os.path.join(old_dir, '.thumbs', new_thumb_name)
                os.rename(old_thumb_path, new_thumb_path)
                logger.info(f"Thumbnail renamed from {old_thumb_path} to {new_thumb_path}")

            # Rename sidecar JSON (if implemented)
            old_json_name = Path(old_full_path).stem + ".json"
            old_json_path = os.path.join(old_dir, old_json_name)
            if os.path.exists(old_json_path):
                new_json_name = Path(new_full_path_unique).stem + ".json"
                new_json_path = os.path.join(old_dir, new_json_name)
                os.rename(old_json_path, new_json_path)
                logger.info(f"Sidecar JSON renamed from {old_json_path} to {new_json_path}")
            
            return {
                'old_path': old_relative_path,
                'new_path': os.path.join(os.path.dirname(old_relative_path), new_name_unique).replace('\\', '/'),
                'new_name': new_name_unique
            }

        except Exception as e:
            logger.error(f"Error renaming file '{old_relative_path}' to '{new_name}': {str(e)}")
            raise

    @staticmethod
    def delete_file(relative_path):
        """Delete a file and its associated thumbnail and sidecar file."""
        try:
            relative_path = relative_path.strip('/')
            if '..' in relative_path or not relative_path:
                raise ValueError("Invalid file path")

            base_upload_folder = current_app.config['UPLOAD_FOLDER']
            full_path = os.path.join(base_upload_folder, relative_path)

            if not os.path.exists(full_path):
                raise FileNotFoundError(f"File not found: {full_path}")
            
            if not os.path.isfile(full_path):
                raise ValueError(f"Path is not a file: {full_path}")

            # Delete main file
            os.remove(full_path)
            logger.info(f"File deleted: {full_path}")

            # Delete thumbnail
            thumb_name = Path(full_path).stem + ".jpg"
            thumb_path = os.path.join(os.path.dirname(full_path), '.thumbs', thumb_name)
            if os.path.exists(thumb_path):
                os.remove(thumb_path)
                logger.info(f"Thumbnail deleted: {thumb_path}")

            # Delete sidecar JSON (if implemented)
            json_name = Path(full_path).stem + ".json"
            json_path = os.path.join(os.path.dirname(full_path), json_name)
            if os.path.exists(json_path):
                os.remove(json_path)
                logger.info(f"Sidecar JSON deleted: {json_path}")
            
            return {'message': 'File deleted successfully', 'path': relative_path}

        except Exception as e:
            logger.error(f"Error deleting file '{relative_path}': {str(e)}")
            raise

    @staticmethod
    def delete_folder(relative_path):
        """Delete a folder and its contents recursively."""
        try:
            relative_path = relative_path.strip('/')
            if '..' in relative_path or not relative_path:
                raise ValueError("Invalid folder path")

            base_upload_folder = current_app.config['UPLOAD_FOLDER']
            full_path = os.path.join(base_upload_folder, relative_path)

            if not os.path.exists(full_path):
                raise FileNotFoundError(f"Folder not found: {full_path}")

            if not os.path.isdir(full_path):
                raise ValueError(f"Path is not a directory: {full_path}")

            shutil.rmtree(full_path)
            logger.info(f"Folder deleted: {full_path}")

            # Clean up parent directories if they become empty
            StorageService._cleanup_empty_parent_dirs(full_path, base_upload_folder)

            return {'message': 'Folder deleted successfully', 'path': relative_path}

        except Exception as e:
            logger.error(f"Error deleting folder '{relative_path}': {str(e)}")
            raise

    @staticmethod
    def rename_folder(old_relative_path, new_name):
        """Rename a folder."""
        try:
            old_relative_path = old_relative_path.strip('/')
            if '..' in old_relative_path or not old_relative_path:
                raise ValueError("Invalid old folder path")
            
            new_name = secure_filename(new_name)
            if not new_name:
                raise ValueError("Invalid new folder name")

            base_upload_folder = current_app.config['UPLOAD_FOLDER']
            old_full_path = os.path.join(base_upload_folder, old_relative_path)
            
            if not os.path.exists(old_full_path):
                raise FileNotFoundError(f"Folder not found: {old_full_path}")
            
            if not os.path.isdir(old_full_path):
                raise ValueError(f"Path is not a directory: {old_full_path}")

            parent_dir = os.path.dirname(old_full_path)
            new_full_path = os.path.join(parent_dir, new_name)

            if os.path.exists(new_full_path):
                raise FileExistsError(f"Folder with new name '{new_name}' already exists.")

            os.rename(old_full_path, new_full_path)
            logger.info(f"Folder renamed from {old_full_path} to {new_full_path}")

            return {
                'old_path': old_relative_path,
                'new_path': os.path.join(os.path.dirname(old_relative_path), new_name).replace('\\', '/'),
                'new_name': new_name
            }

        except Exception as e:
            logger.error(f"Error renaming folder '{old_relative_path}' to '{new_name}': {str(e)}")
            raise

    @staticmethod
    def _cleanup_empty_parent_dirs(deleted_path, base_path):
        """Recursively delete empty parent directories up to base_path."""
        current_dir = Path(deleted_path).parent
        base_path_obj = Path(base_path)

        while current_dir and current_dir != base_path_obj and current_dir.is_dir():
            try:
                # Check if directory is empty (excluding .thumbs subdirectories)
                # This is a simplification; a more robust check would involve listing all
                # contents and ensuring none are non-hidden files or non-empty directories.
                # For now, if it's empty according to os.listdir, we delete it.
                if not os.listdir(current_dir):
                    os.rmdir(current_dir)
                    logger.info(f"Cleaned up empty directory: {current_dir}")
                else:
                    break # Stop if a parent directory is not empty
            except OSError as e:
                logger.warning(f"Could not remove directory {current_dir}: {e}")
                break
            current_dir = current_dir.parent

    @staticmethod
    def is_allowed_file(mimetype):
        """Check if the file's mimetype is allowed"""
        return mimetype in current_app.config['ALLOWED_TYPES']
