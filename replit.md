# Image Storage Service

## Overview

This is a minimal image storage service built with Flask 3.1 and Pillow for handling image uploads, organization, and thumbnail generation. The application provides both a REST API and a web interface for managing images in a date-based folder structure.

## System Architecture

### Backend Architecture
- **Framework**: Flask 3.1 with modular blueprint structure
- **Image Processing**: Pillow 11 for thumbnail generation and image manipulation
- **File Organization**: Date-based folder structure (YYYY/MM/DD) with custom folder support
- **Logging**: Rotating file handler for application logs
- **Configuration**: Environment-based configuration with sensible defaults

### Frontend Architecture
- **UI Framework**: Bootstrap 5 with dark theme
- **JavaScript**: Vanilla ES6+ for interactive functionality
- **Layout**: Responsive design with sidebar navigation and main content area
- **Icons**: Font Awesome 6 for UI icons

### Blueprint Structure
```
app.py (main application factory)
├── blueprints/
│   ├── api.py (REST API endpoints)
│   └── ui.py (web interface routes)
├── services/
│   ├── storage.py (file management logic)
│   └── thumbs.py (thumbnail generation)
└── templates/
    └── index.html (main UI template)
```

## Key Components

### Storage Service
- **Purpose**: Handles file uploads, naming conflicts, and folder organization
- **Features**: 
  - Automatic date-based folder creation
  - Custom folder path support
  - Filename collision resolution with incremental numbering
  - Security validation to prevent directory traversal attacks

### Thumbnail Service
- **Purpose**: Generates optimized thumbnails for uploaded images
- **Features**:
  - 150x150px thumbnails stored in `.thumbs/` subdirectories
  - JPEG optimization with quality adjustment
  - Automatic file size optimization (target: under 30KB)
  - RGB conversion for compatibility

### API Endpoints
- **POST /api/upload**: File upload with optional folder specification
- **GET /api/list**: List files and folders (implementation appears incomplete)
- **Error Handling**: Proper HTTP status codes and JSON error responses

### Web Interface
- **File Upload**: Modal-based upload with drag-and-drop support
- **Folder Management**: Tree view navigation with breadcrumb support
- **Image Display**: Grid layout with thumbnail previews
- **Responsive Design**: Mobile-friendly interface

## Data Flow

1. **File Upload Process**:
   - Client uploads file via API or web interface
   - File type validation against allowed formats (JPEG, PNG, GIF, WebP)
   - File size validation (configurable, default 10MB)
   - Storage service saves file to date-based or custom folder
   - Thumbnail service generates optimized preview
   - Response includes file metadata and access URLs

2. **File Serving**:
   - Images served directly from filesystem via Flask
   - Security checks prevent directory traversal
   - 404 handling for missing files

3. **Folder Navigation**:
   - Dynamic folder tree generation
   - Breadcrumb navigation for deep folder structures
   - AJAX-based content loading

## External Dependencies

### Python Packages
- **Flask 3.1**: Core web framework
- **Pillow 11**: Image processing and thumbnail generation
- **Werkzeug**: WSGI utilities and file handling
- **python-dotenv**: Environment variable management

### Frontend Libraries
- **Bootstrap 5**: UI framework with dark theme
- **Font Awesome 6**: Icon library
- **Vanilla JavaScript**: No additional frameworks

## Deployment Strategy

### Development Environment
- **Platform**: Replit Python template
- **Configuration**: Debug mode enabled, host 0.0.0.0:5000
- **File Storage**: Local filesystem within Replit container

### Production Considerations
- **Hosting**: Ubuntu 22.04 VM with uWSGI + Nginx
- **CI/CD**: GitHub Actions with SSH deployment
- **Scaling**: Single-instance deployment, suitable for internal tools
- **Security**: ProxyFix middleware for reverse proxy headers

### Configuration Management
- Environment variables for:
  - `BASE_PATH`: Storage directory path
  - `MAX_SIZE_MB`: Maximum file size
  - `ALLOWED_TYPES`: Comma-separated MIME types
  - `SESSION_SECRET`: Flask session encryption key

## Changelog
- July 02, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.