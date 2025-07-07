
from flask import Blueprint, request, jsonify, current_app, send_file
from werkzeug.exceptions import RequestEntityTooLarge
from werkzeug.utils import secure_filename
from services.storage import StorageService
from services.thumbs import ThumbnailService
import os
import logging
from pathlib import Path
from services.storage import StorageService # Import StorageService

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
        
        if not folder:
            return jsonify({'error': 'Folder path not provided'}), 400

        # Validate file type
        if not StorageService.is_allowed_file(file.mimetype):
            return jsonify({'error': 'File type not allowed'}), 400

        # Save file
        original_filename = file.filename
        result = StorageService.save_file(file, folder, original_filename)
        current_app.logger.info(f"File saved, result: {result}")
        
        # Generate thumbnail
        try:
            # Ensure the correct path is passed for thumbnail generation
            full_file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], result['path'])
            ThumbnailService.process_uploaded_image(full_file_path)
        except Exception as e:
            logger.warning(f"Failed to create thumbnail: {e}")

        return jsonify(result), 200

    except RequestEntityTooLarge:
        current_app.logger.error("Upload error: File too large")
        return jsonify({'error': 'File too large'}), 413
    except Exception as e:
        current_app.logger.error(f"Upload error: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@api_bp.route('/file/rename', methods=['POST'])
def rename_file():
    try:
        data = request.get_json()
        if not data or 'path' not in data or 'newName' not in data:
            return jsonify({'error': 'Path and newName required'}), 400

        path = data['path'].strip()
        new_name = data['newName'].strip()

        result = StorageService.rename_file(path, new_name)
        return jsonify(result), 200

    except FileNotFoundError:
        current_app.logger.error(f"Rename file error: File not found for path '{path}'")
        return jsonify({'error': 'File not found'}), 404
    except ValueError as e:
        current_app.logger.error(f"Rename file error: {str(e)}")
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        current_app.logger.error(f"Rename file error: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@api_bp.route('/file', methods=['DELETE'])
def delete_file():
    try:
        data = request.get_json()
        if not data or 'path' not in data:
            return jsonify({'error': 'Path required'}), 400

        path = data['path'].strip()

        result = StorageService.delete_file(path)
        return jsonify(result), 200

    except FileNotFoundError:
        current_app.logger.error(f"Delete file error: File not found for path '{path}'")
        return jsonify({'error': 'File not found'}), 404
    except ValueError as e:
        current_app.logger.error(f"Delete file error: {str(e)}")
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        current_app.logger.error(f"Delete file error: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@api_bp.route('/list', methods=['GET'])
def list_files():
    try:
        path = request.args.get('path', '').strip()
        current_app.logger.info(f"API /list called with path: '{path}'")
        
        # Security check
        if '..' in path or path.startswith('/'):
            current_app.logger.warning(f"Invalid path attempted: '{path}'")
            return jsonify({'error': 'Invalid path'}), 400

        # Use StorageService to list files
        files_data = StorageService.list_files(path)
        
        current_app.logger.info(f"Files returned by list_files: {files_data}")
        
        # Sort: directories first, then files
        files_data.sort(key=lambda x: (x['type'] == 'file', x['name'].lower()))
        
        return jsonify(files_data), 200

    except PermissionError as e:
        current_app.logger.error(f"List files error: Permission denied for path '{path}': {str(e)}", exc_info=True)
        return jsonify({'error': 'Permission denied'}), 403
    except Exception as e:
        current_app.logger.error(f"List files error: {str(e)}", exc_info=True)
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

        # Use StorageService to create folder
        StorageService.create_folder(path)
        
        return jsonify({'message': 'Folder created successfully', 'path': path}), 201

    except Exception as e:
        current_app.logger.error(f"Create folder error: {str(e)}", exc_info=True)
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

        # Use StorageService to delete folder
        StorageService.delete_folder(path) # Assuming StorageService will have a delete_folder method

        return jsonify({'message': 'Folder deleted successfully'}), 200

    except Exception as e:
        current_app.logger.error(f"Delete folder error: {str(e)}", exc_info=True)
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

        # Use StorageService to rename folder
        StorageService.rename_folder(old_path, new_path) # Assuming StorageService will have a rename_folder method
        
        return jsonify({'message': 'Folder renamed successfully'}), 200

    except Exception as e:
        current_app.logger.error(f"Rename folder error: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500
