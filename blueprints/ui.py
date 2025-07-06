from flask import Blueprint, render_template, request, current_app, abort, send_from_directory
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
        current_app.logger.info(f"Serving image: {filename}")
        # Security check to prevent directory traversal
        if '..' in filename or filename.startswith('/'):
            current_app.logger.warning(f"Attempted directory traversal: {filename}")
            abort(403)

        upload_folder = current_app.config['UPLOAD_FOLDER']
        file_path = os.path.join(upload_folder, filename)
        current_app.logger.info(f"Resolved file_path for serving: {file_path}")

        # Check if file exists and is within upload folder
        if not os.path.exists(file_path) or not os.path.commonpath([upload_folder, file_path]) == upload_folder:
            abort(404)

        return send_from_directory(upload_folder, filename)
    except Exception as e:
        current_app.logger.error(f"Error serving image {filename}: {e}")
        abort(404)
