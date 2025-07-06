# System Patterns: Mini-Bild-Speicherservice

## System Architecture
The application is a Flask-based web service designed for minimal maintenance and easy deployment. It leverages the filesystem for all data storage, avoiding the need for a separate database.

## Key Technical Decisions
*   **File-based Metadata**: Instead of a database, metadata for each image is stored in a JSON "sidecar" file (e.g., `filename.json`) alongside the image.
*   **Filesystem for Storage**: All images and their associated data (including thumbnails) are stored directly on the filesystem.
*   **Thumbnail Generation**: Thumbnails are generated on upload and stored in a hidden `.thumbs/` subdirectory within the image's directory for performance during listing.
*   **Dynamic Base Path**: Supports deployment in subdirectories (e.g., `/motivatier-image`) using `APPLICATION_ROOT` configuration.
*   **CGI and Replit Compatibility**: Specific configurations are in place to support CGI environments and Replit deployments, indicating a focus on broad portability.

## Design Patterns in Use
*   **Blueprint Pattern (Flask)**: The application uses Flask Blueprints (`api_bp` and `ui_bp`) to modularize routes and views, separating API logic from UI rendering.
*   **Service Layer**: `StorageService` and `ThumbnailService` abstract file system operations and image processing, promoting separation of concerns and reusability.
*   **Configuration Management**: Utilizes `dotenv` and a `Config` class to manage environment-specific settings, making the application configurable without code changes.

## Component Relationships
*   `app.py`: Main application entry point, initializes Flask app, loads configuration, and registers blueprints.
*   `blueprints/ui.py`: Handles user interface routes (e.g., `/`, `/images/<path:filename>`), rendering HTML templates and serving static images.
*   `blueprints/api.py`: Exposes RESTful API endpoints for `upload`, `list`, `create_folder`, `delete_folder`, and `rename_folder`.
*   `services/storage.py`: Manages all file system interactions: saving files, handling naming collisions, creating/listing/deleting/renaming folders, and providing file info.
*   `services/thumbs.py`: Responsible for generating image thumbnails using PIL (Pillow) and managing their storage.
*   `config.py`: Defines application-wide configuration settings, including paths, file size limits, allowed types, and deployment specific settings.

## Critical Implementation Paths
*   **File Upload**: `api_bp.upload_file` -> `StorageService.save_file` -> `ThumbnailService.create_thumbnail` (called from `api_bp`).
*   **File Listing**: `api_bp.list_files` -> `StorageService.list_files` (which also determines thumbnail URLs).
*   **Image Serving**: `ui_bp.serve_image` directly serves files from the `UPLOAD_FOLDER`.

## Data & Directory Model (as per PRD)
```
/images/
  ├─ 2025/
  │   └─ 07/
  │       └─ 02/
  │           ├─ beach.jpg
  │           ├─ beach.json   ← { "displayName":"Strand", … }
  │           └─ .thumbs/
  │               └─ beach.jpg
  └─ custom/
      └─ marketing/
          └─ logo.png
```
*   `Sidecar-JSON`: Stores all necessary metadata, eliminating SQL. (Currently not implemented in `StorageService.save_file`).
*   `Thumbnails`: Located in hidden `.thumbs/` subfolders for performance.
*   `Global Index File`: Optional, for aggregating recent uploads (not currently implemented).
