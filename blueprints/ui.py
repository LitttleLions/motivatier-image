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
