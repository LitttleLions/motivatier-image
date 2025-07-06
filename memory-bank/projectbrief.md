# Project Brief: Mini-Bild-Speicherservice – “lovable” Edition

## Core Vision
To create a small, "lovable" image storage service that accepts images, stores them structurally within the filesystem, and provides direct links for other applications.

## Key Objectives
*   **No Database Backend**: All metadata is managed file-based (sidecar JSON files).
*   **Instant Usability**: Upload → Copy URL → Embed.
*   **Minimal Maintenance**: Install, configure path, done.

## Scope (In-Scope)
*   Upload and storage of images.
*   Automatic, nested folder structure (e.g., /YYYY/MM/DD/).
*   Overview per folder (thumbnails + links).
*   Copyable direct URLs.
*   Basic configuration via text file/ENV.

## Out of Scope
*   User authentication, roles, and rights management.
*   Versioning, trash bin.
*   CDN or cloud integrations.
*   Full-text search, tags.

## Target Audience
*   **Uploader (Designer, Editor, Dev)**: Needs to upload images and copy links quickly.
*   **Viewer (Websites, Mobile Apps)**: Requires stable, fast image delivery via URL.
*   **Technical Admin**: Needs effortless maintenance without a database.

## "Lovability" Principles
*   Instant visible results post-upload.
*   One-click URL copy with visual confirmation.
*   Contextual hints (size limits, allowed formats).
*   Understandable error messages.
*   Aesthetic, minimal UI.
