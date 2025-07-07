# Progress: Mini-Bild-Speicherservice

## What Works
*   **Basic Flask Application Structure**: `app.py` correctly initializes the Flask app and registers blueprints.
*   **UI Blueprint (`ui.py`)**: Serves `index.html` and static image files.
*   **API Blueprint (`api.py`)**: Provides endpoints for file upload, file listing, folder creation, deletion, and renaming.
*   **File Storage (`storage.py`)**:
    *   Saves uploaded files to the filesystem.
    *   Manages filename collisions by adding suffixes (e.g., `filename-1.jpg`).
    *   Lists files and directories.
    *   Creates, deletes, and renames folders.
*   **Thumbnail Generation (`thumbs.py`)**:
    *   Generates JPEG thumbnails from uploaded images.
    *   Optimizes thumbnail size and quality.
    *   Stores thumbnails in `.thumbs` subdirectories.
*   **Configuration (`config.py`)**:
    *   Loads environment variables for flexible configuration (`BASE_PATH`, `MAX_SIZE_MB`, `ALLOWED_TYPES`, etc.).
    *   Supports dynamic `APPLICATION_ROOT` for subdirectory deployments.
    *   Includes settings for CGI and Replit environments.
*   **Root Folder Upload**: Files can now be uploaded directly to the root of the configured `UPLOAD_FOLDER`.
*   **Automated Deployment (Direct Python App on Plesk)**: Instructions have been provided for setting up automated deployment on Plesk using GitHub integration for direct Python applications. This includes configuring Git integration, Python app settings, and dependency installation.

## What's Left to Build (Discrepancies/Missing Features based on PRD)
*   **F-3 Metadaten ohne DB (Metadata without DB)**:
    *   **Editable Original Name**: The UI should allow editing of the original name, which implies this metadata needs to be stored and retrievable. (Backend: Update metadata in sidecar JSON).
*   **F-4 Verzeichnis-Listing (Directory Listing)**:
    *   The `list_files` API endpoint returns file information, but the UI needs to render these with thumbnails and provide sorting options (Name or Upload-Datum). The "Upload-Datum" implies storing this in the sidecar JSON.
*   **User-Flows**:
    *   **Startseite → Ordnerbaum erscheint**: The UI (`index.html` und `app.js`) needs to implement the folder tree view.
    *   **Nach dem Upload: Thumbnail, Originalname (bearbeitbar), Öffentliche URL mit “Copy”-Button**: The UI needs to display these elements after upload.
    *   **Optionale Massen-Uploads wiederholen**: The UI needs this functionality.
*   **"Lovability" UX-Prinzipien (Section 8)**: Many of these are UI/UX related and require frontend implementation:
    *   Sofort sichtbares Ergebnis.
    *   Ein-Klick-Kopie mit optischer Bestätigung.
    *   Kontextuelle Hinweise (Größen-Limit, erlaubte Formate).
    *   Fehler, die man versteht.
    *   Ästhetische Minimal-Oberfläche.

## Current Status
*   Core backend logic for file and folder management is mostly in place.
*   Key functional requirements related to file-based metadata (`F-3`) and UI interactions (User-Flows, "Lovability") are either partially implemented or entirely missing.
*   **Drag-&-Drop Upload oder Dateidialog**: Diese Funktion ist jetzt implementiert und funktioniert.
*   **Neue Upload-Logik implementiert**: Die automatische datumsbasierte Ordnererstellung wurde im Backend entfernt. Bilder werden nun direkt in den vom Frontend übermittelten Pfad hochgeladen.
*   **"Folder path not provided" Fehler behoben**: Uploads in den Root-Ordner funktionieren jetzt korrekt.
*   **Korrektur des Upload-Pfades für Unterordner**: Der `UploadManager` im Frontend wurde korrigiert, um den korrekten aktuellen Ordnerpfad an das Backend zu senden, wenn in Unterordner hochgeladen wird.
*   **Debugging-Zeilen entfernt**: Alle temporären Debugging-Zeilen wurden aus dem Code entfernt.
*   **Doppelter Upload behoben**: Der doppelte Event-Listener für den Upload-Button in `static/js/app.js` wurde entfernt, um zu verhindern, dass Dateien zweimal hochgeladen werden.
*   **Doppelte Anzeige nach Upload behoben**: Der redundante Aufruf von `this.app.folderTree.loadFolderTree()` nach einem Upload wurde entfernt, um zu verhindern, dass Dateien zweimal in der Dateiliste angezeigt werden.
*   **Automatisches Schließen von Modals**: Die Upload- und "New Folder"-Modals werden nach erfolgreicher Aktion automatisch geschlossen.
*   **Verbesserung des Folder Trees**: Die CSS-Regeln in `static/css/custom.css` wurden aktualisiert, um eine modernere Darstellung des Folder Trees zu ermöglichen, und in `static/js/folder-tree-view.js` wurde ein Ordner-Icon hinzugefügt.
*   **Bildvorschau-Korrekturen und Navigation**: Die `previewImage`-Methode in `static/js/preview-modal.js` wurde so angepasst, dass sie die relative URL für die Bildvorschau verwendet. Die Navigation zwischen Bildern im Preview-Modal (vorheriges/nächstes Bild) wurde implementiert, indem die Dateiliste und der aktuelle Index verfolgt werden und Event-Listener für Pfeiltasten und Navigationsbuttons hinzugefügt wurden (`static/js/app.js`, `static/js/preview-modal.js`, `templates/index.html`).
*   **Folder Tree - "Add Subfolder" Button und Sichtbarkeit**: Der "Add Subfolder"-Button wurde in `static/js/folder-tree-view.js` wiederhergestellt. Die Sichtbarkeit der Buttons im Folder Tree wurde durch Anpassung der Farbe in `static/css/custom.css` verbessert.
*   **Korrektur der Ordnererstellung und Auswahl des übergeordneten Ordners**: Die `addSubfolderAtPath`-Methode wurde in `static/js/file-management.js` hinzugefügt, um das "New Folder"-Modal korrekt mit dem übergeordneten Ordner vorauszufüllen.

## Known Issues
*   Frontend (HTML/JS) implementation for many UI/UX features is yet to be reviewed/implemented.

## Evolution of Project Decisions
*   The project started with a strong emphasis on a database-less approach, which is maintained in the current backend structure.
*   The decision to use Flask with Blueprints and separate services has led to a modular and maintainable backend.
*   The detailed PRD highlights several areas where the current implementation needs to be enhanced, especially regarding metadata handling and frontend user experience.
*   **Deployment Strategy**: The user has chosen "Direct Python Application Deployment" on Plesk to leverage its built-in Git integration for automated updates and application restarts.
