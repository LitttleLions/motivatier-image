# Technical Context: Mini-Bild-Speicherservice

## Technologies Used
*   **Backend Framework**: Flask (Python)
*   **Image Processing**: Pillow (PIL Fork)
*   **Environment Variables**: `python-dotenv` for loading `.env` files
*   **WSGI Middleware**: `werkzeug.middleware.proxy_fix.ProxyFix` for handling proxy headers in deployed environments.
*   **File Uploads**: `werkzeug.utils.secure_filename` for secure filename handling.
*   **Logging**: Python's built-in `logging` module with `RotatingFileHandler`.

## Development Setup
*   **Local Development**: Assumes a standard Python environment. Configuration in `config.py` uses `os.getcwd()` for `UPLOAD_FOLDER` in development mode.
*   **Dependencies**: Listed in `requirements.txt` and `pyproject.toml`.
*   **Environment Variables**: Uses `.env` for configuration (e.g., `BASE_PATH`, `MAX_SIZE_MB`, `ALLOWED_TYPES`, `APPLICATION_ROOT`, `CGI_MODE`, `REPLIT_DEPLOYMENT`, `SESSION_SECRET`, `PREFERRED_URL_SCHEME`, `SERVER_NAME`).

## Technical Constraints
*   **No Database**: Strict adherence to file-based metadata storage, which impacts query capabilities (e.g., no complex search, tagging).
*   **Filesystem Access**: Requires write permissions to the designated `UPLOAD_FOLDER`.
*   **Image Formats**: Limited to formats supported by Pillow and explicitly allowed in `config.py`.
*   **File Naming**: `secure_filename` is used, which might alter original filenames to ensure safety.
*   **Scalability**: Designed for trivial horizontal scaling by sharing a common network drive for the `UPLOAD_FOLDER`.

## Dependencies (from `pyproject.toml` and `requirements.txt` - inferred from project structure, actual contents not read yet)
*   `Flask`
*   `Pillow` (PIL)
*   `python-dotenv`
*   `gunicorn` (likely for production deployment)
*   `werkzeug` (part of Flask, but specifically `ProxyFix` is used)

## Tool Usage Patterns
*   **File System Operations**: Extensive use of `os` module functions (`os.path.join`, `os.makedirs`, `os.stat`, `os.listdir`, `os.remove`, `os.rmdir`, `shutil.rmtree`, `shutil.move`) for file and directory management.
*   **Image Manipulation**: `PIL.Image` for opening, resizing, converting, and saving images.
*   **Security**: `secure_filename` for sanitizing uploaded filenames, basic path traversal checks (`'..' in path`).
*   **Configuration Loading**: `load_dotenv()` to read environment variables from `.env` file.
