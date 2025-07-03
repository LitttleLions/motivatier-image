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
