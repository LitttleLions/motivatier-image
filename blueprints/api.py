
from flask import Blueprint, request, jsonify, current_app, send_file
from werkzeug.exceptions import RequestEntityTooLarge
from werkzeug.utils import secure_filename
from services.storage import StorageService
from services.thumbs import ThumbnailService
import os
import logging

logger = logging.getLogger(__name__)

api_bp = Blueprint('api', __name__)

@api_bp.route('/upload', methods=['POST'])
def upload_file():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        # Get folder from form data
        folder = request.form.get('folder', '').strip()
        
        # Handle AUTO_DATE folder
        if folder == 'AUTO_DATE':
            from datetime import datetime
            now = datetime.now()
            folder = f"{now.year}/{now.month:02d}/{now.day:02d}"

        # Validate file type
        if not StorageService.is_allowed_file(file.filename):
            return jsonify({'error': 'File type not allowed'}), 400

        # Save file
        result = StorageService.save_file(file, folder)
        
        # Generate thumbnail
        try:
            ThumbnailService.create_thumbnail(result['filepath'])
        except Exception as e:
            logger.warning(f"Failed to create thumbnail: {e}")

        return jsonify(result), 200

    except RequestEntityTooLarge:
        return jsonify({'error': 'File too large'}), 413
    except Exception as e:
        logger.error(f"Upload error: {e}")
        return jsonify({'error': str(e)}), 500

@api_bp.route('/list', methods=['GET'])
def list_files():
    try:
        path = request.args.get('path', '').strip()
        logger.info(f"API /list called with path: '{path}'")
        
        # Security check
        if '..' in path or path.startswith('/'):
            logger.warning(f"Invalid path attempted: '{path}'")
            return jsonify({'error': 'Invalid path'}), 400

        # Build full path
        base_path = current_app.config['UPLOAD_FOLDER']
        full_path = os.path.join(base_path, path) if path else base_path
        logger.info(f"Full path: '{full_path}'")

        if not os.path.exists(full_path):
            logger.info(f"Path does not exist: '{full_path}'")
            return jsonify([]), 200

        if not os.path.isdir(full_path):
            logger.warning(f"Path is not a directory: '{full_path}'")
            return jsonify({'error': 'Path is not a directory'}), 400

        files = []
        
        try:
            for item in os.listdir(full_path):
                if item.startswith('.'):  # Skip hidden files/folders
                    continue
                    
                item_path = os.path.join(full_path, item)
                relative_path = os.path.join(path, item) if path else item
                
                if os.path.isdir(item_path):
                    files.append({
                        'name': item,
                        'path': relative_path,
                        'type': 'directory'
                    })
                elif os.path.isfile(item_path):
                    # Get file info
                    stat = os.stat(item_path)
                    
                    # Build URLs with base path
                    base_path = current_app.config.get('APPLICATION_ROOT', '')
                    file_url = f"{base_path}/images/{relative_path}".replace('//', '/')
                    
                    # Check for thumbnail
                    thumb_dir = os.path.join(os.path.dirname(item_path), '.thumbs')
                    thumb_file = os.path.join(thumb_dir, f"thumb_{item}")
                    thumb_url = None
                    
                    if os.path.exists(thumb_file):
                        thumb_rel_path = os.path.join(os.path.dirname(relative_path), '.thumbs', f"thumb_{item}")
                        thumb_url = f"{base_path}/images/{thumb_rel_path}".replace('//', '/')
                    
                    files.append({
                        'name': item,
                        'path': relative_path,
                        'url': file_url,
                        'thumb': thumb_url,
                        'size': stat.st_size,
                        'type': 'file'
                    })
                    
        except PermissionError:
            return jsonify({'error': 'Permission denied'}), 403
        
        # Sort: directories first, then files
        files.sort(key=lambda x: (x['type'] == 'file', x['name'].lower()))
        
        return jsonify(files), 200

    except Exception as e:
        logger.error(f"List files error: {e}")
        return jsonify({'error': str(e)}), 500

@api_bp.route('/folder', methods=['POST'])
def create_folder():
    try:
        data = request.get_json()
        if not data or 'path' not in data:
            return jsonify({'error': 'Path required'}), 400

        path = data['path'].strip()
        
        # Security check
        if not path or '..' in path or path.startswith('/'):
            return jsonify({'error': 'Invalid path'}), 400

        # Create folder
        base_path = current_app.config['UPLOAD_FOLDER']
        full_path = os.path.join(base_path, path)
        
        # Check if folder already exists
        if os.path.exists(full_path):
            return jsonify({'error': 'Folder already exists'}), 409

        # Create the folder and any parent directories
        os.makedirs(full_path, exist_ok=True)
        
        return jsonify({'message': 'Folder created successfully', 'path': path}), 201

    except Exception as e:
        logger.error(f"Create folder error: {e}")
        return jsonify({'error': str(e)}), 500

@api_bp.route('/folder', methods=['DELETE'])
def delete_folder():
    try:
        data = request.get_json()
        if not data or 'path' not in data:
            return jsonify({'error': 'Path required'}), 400

        path = data['path'].strip()
        
        # Security check
        if not path or '..' in path or path.startswith('/'):
            return jsonify({'error': 'Invalid path'}), 400

        # Delete folder
        base_path = current_app.config['UPLOAD_FOLDER']
        full_path = os.path.join(base_path, path)
        
        if not os.path.exists(full_path):
            return jsonify({'error': 'Folder not found'}), 404

        if not os.path.isdir(full_path):
            return jsonify({'error': 'Path is not a directory'}), 400

        # Check if folder is empty
        if os.listdir(full_path):
            return jsonify({'error': 'Folder is not empty'}), 400

        os.rmdir(full_path)
        
        return jsonify({'message': 'Folder deleted successfully'}), 200

    except Exception as e:
        logger.error(f"Delete folder error: {e}")
        return jsonify({'error': str(e)}), 500

@api_bp.route('/folder/rename', methods=['POST'])
def rename_folder():
    try:
        data = request.get_json()
        if not data or 'oldPath' not in data or 'newPath' not in data:
            return jsonify({'error': 'oldPath and newPath required'}), 400

        old_path = data['oldPath'].strip()
        new_path = data['newPath'].strip()
        
        # Security checks
        if not old_path or not new_path or '..' in old_path or '..' in new_path:
            return jsonify({'error': 'Invalid path'}), 400

        # Rename folder
        base_path = current_app.config['UPLOAD_FOLDER']
        old_full_path = os.path.join(base_path, old_path)
        new_full_path = os.path.join(base_path, new_path)
        
        if not os.path.exists(old_full_path):
            return jsonify({'error': 'Source folder not found'}), 404

        if os.path.exists(new_full_path):
            return jsonify({'error': 'Destination folder already exists'}), 409

        # Create parent directory if needed
        os.makedirs(os.path.dirname(new_full_path), exist_ok=True)
        
        os.rename(old_full_path, new_full_path)
        
        return jsonify({'message': 'Folder renamed successfully'}), 200

    except Exception as e:
        logger.error(f"Rename folder error: {e}")
        return jsonify({'error': str(e)}), 500
