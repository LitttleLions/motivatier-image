// static/js/ui-utils.js

class UiUtils {
    constructor(appInstance) {
        this.app = appInstance; // Reference to the main app instance
        this.translations = {
            de: {
                home: 'Home',
                current: 'Aktuell',
                currentFolder: 'Aktueller Ordner',
                uploadDestination: 'Upload-Ziel',
                chooseFiles: 'Dateien wählen',
                upload: 'Upload',
                createFolder: 'Ordner erstellen',
                folderName: 'Ordnername',
                parentFolder: 'Überordner',
                enterFolderName: 'Ordnername eingeben:',
                folderCreatedSuccess: 'Ordner erfolgreich erstellt',
                folderCreateFailed: 'Ordner konnte nicht erstellt werden',
                deleteConfirm: 'Sind Sie sicher, dass Sie den Ordner löschen möchten?',
                folderDeleted: 'Ordner erfolgreich gelöscht',
                folderRenamed: 'Ordner erfolgreich umbenannt',
                loading: 'Lädt...',
                noImagesFound: 'Keine Bilder gefunden',
                uploadImages: 'Bilder hochladen',
                dragDrop: 'Bilder hierher ziehen & ablegen',
                orUseButton: 'oder verwenden Sie den "Dateien wählen" Button oben',
                selectedFiles: 'Ausgewählte Dateien',
                ready: 'Bereit',
                uploading: 'Wird hochgeladen...',
                uploaded: 'Hochgeladen',
                failed: 'Fehlgeschlagen',
                urlCopied: 'URL in Zwischenablage kopiert',
                copyUrl: 'URL kopieren',
                preview: 'Vorschau',
                cancel: 'Abbrechen',
                small: 'Klein',
                medium: 'Mittel',
                large: 'Groß',
                publicBaseUrlLabel: 'Öffentliche Basis-URL',
                publicBaseUrlHint: 'Diese URL wird beim Kopieren von Bild-Links verwendet.',
                save: 'Speichern',
                reset: 'Zurücksetzen',
                settingsSaved: 'Einstellungen gespeichert!',
                publicBaseUrlPlaceholder: 'z.B. https://ihredomain.com/bilder',
                renameFile: 'Datei umbenennen',
                deleteFile: 'Datei löschen',
                renameFolder: 'Ordner umbenennen',
                deleteFolder: 'Ordner löschen',
                folderCreateFailed: 'Ordner konnte nicht erstellt werden',
                folderDeleteFailed: 'Ordner konnte nicht gelöscht werden',
                folderRenameFailed: 'Ordner konnte nicht umbenannt werden',
                fileRenamed: 'Datei erfolgreich umbenannt',
                fileRenameFailed: 'Datei konnte nicht umbenannt werden',
                fileDeleteFailed: 'Datei konnte nicht gelöscht werden',
                uploadFilesSuccess: 'Erfolgreich hochgeladen',
                uploadFilesFailed: 'Dateien konnten nicht hochgeladen werden',
                noFilesSelected: 'Bitte wählen Sie Dateien zum Hochladen aus.',
                urlCopied: 'URL in Zwischenablage kopiert',
                urlCopyFailed: 'Fehler beim Kopieren der URL'
            },
            en: {
                home: 'Home',
                current: 'Current',
                currentFolder: 'Current Folder',
                uploadDestination: 'Upload Destination',
                chooseFiles: 'Choose Files',
                upload: 'Upload',
                createFolder: 'Create Folder',
                folderName: 'Folder Name',
                parentFolder: 'Parent Folder',
                enterFolderName: 'Enter folder name:',
                folderCreatedSuccess: 'Folder created successfully',
                folderCreateFailed: 'Failed to create folder',
                deleteConfirm: 'Are you sure you want to delete this folder?',
                folderDeleted: 'Folder deleted successfully',
                folderRenamed: 'Folder renamed successfully',
                loading: 'Loading...',
                noImagesFound: 'No images found',
                uploadImages: 'Upload Images',
                dragDrop: 'Drag & Drop your images here',
                orUseButton: 'or use the "Choose Files" button above',
                selectedFiles: 'Selected Files',
                ready: 'Ready',
                uploading: 'Uploading...',
                uploaded: 'Uploaded',
                failed: 'Failed',
                urlCopied: 'URL copied to clipboard',
                copyUrl: 'Copy URL',
                preview: 'Preview',
                cancel: 'Cancel',
                small: 'Small',
                medium: 'Medium',
                large: 'Large',
                publicBaseUrlLabel: 'Public Base URL',
                publicBaseUrlHint: 'This URL is used when copying image links.',
                save: 'Save',
                reset: 'Reset',
                settingsSaved: 'Settings saved!',
                publicBaseUrlPlaceholder: 'e.g. https://yourdomain.com/images',
                renameFile: 'Rename File',
                deleteFile: 'Delete File',
                renameFolder: 'Rename Folder',
                deleteFolder: 'Delete Folder',
                folderCreateFailed: 'Failed to create folder',
                folderDeleteFailed: 'Failed to delete folder',
                folderRenameFailed: 'Failed to rename folder',
                fileRenamed: 'File renamed successfully',
                fileRenameFailed: 'Failed to rename file',
                fileDeleteFailed: 'Failed to delete file',
                uploadFilesSuccess: 'Successfully uploaded',
                uploadFilesFailed: 'Failed to upload files',
                noFilesSelected: 'Please select files to upload.',
                urlCopied: 'URL copied to clipboard',
                urlCopyFailed: 'Failed to copy URL'
            }
        };
    }

    t(key) {
        return this.translations[this.app.language][key] || key;
    }

    showLoading(show) {
        const indicator = document.getElementById('loadingIndicator');
        const grid = document.getElementById('fileGrid');

        if (show) {
            indicator.classList.remove('d-none'); // Show loading indicator
            grid.classList.add('loading'); // Add loading class to grid
        } else {
            indicator.classList.add('d-none'); // Hide loading indicator
            grid.classList.remove('loading'); // Remove loading class from grid
        }
    }

    showToast(message, type = 'info') {
        // Create toast container if it doesn't exist
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toastId = 'toast-' + Date.now();
        const bgClass = type === 'success' ? 'bg-success' : 
                       type === 'error' ? 'bg-danger' : 
                       type === 'warning' ? 'bg-warning' : 'bg-info';

        const toastHtml = `
            <div id="${toastId}" class="toast ${bgClass} text-white" role="alert">
                <div class="toast-body">
                    ${message}
                    <button type="button" class="btn-close btn-close-white float-end" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;

        container.insertAdjacentHTML('beforeend', toastHtml);

        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement);
        toast.show();

        // Remove toast element after it's hidden
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    updateUITexts() {
        // Update page title
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) pageTitle.textContent = 'Image Storage Service'; // Directly set, as no specific translation key was defined

        // Update upload button
        const uploadBtn = document.getElementById('uploadImageBtn');
        if (uploadBtn) uploadBtn.innerHTML = `${this.t('uploadImages')} <i class="fas fa-sparkles"></i>`;

        // Update modal title
        const modalTitle = document.getElementById('uploadModalTitle');
        if (modalTitle) modalTitle.textContent = this.t('uploadImages');

        // Update current location label
        const locationLabel = document.getElementById('currentLocationLabel');
        if (locationLabel) locationLabel.textContent = this.t('currentLocationLabel'); // Assuming a translation key for this

        // Update language buttons
        const btnDe = document.getElementById('btnDe');
        const btnEn = document.getElementById('btnEn');
        if (btnDe && btnEn) {
            btnDe.classList.toggle('btn-orange', this.app.language === 'de');
            btnEn.classList.toggle('btn-orange', this.app.language === 'en');
        }

        // Update public base URL input and labels
        const publicBaseUrlLabel = document.getElementById('publicBaseUrlLabel');
        const publicBaseUrlHint = document.getElementById('publicBaseUrlHint');
        const publicBaseUrlInput = document.getElementById('publicBaseUrlInput');
        const savePublicBaseUrlBtn = document.getElementById('savePublicBaseUrlBtn');
        const resetPublicBaseUrlBtn = document.getElementById('resetPublicBaseUrlBtn');

        if (publicBaseUrlLabel) publicBaseUrlLabel.textContent = this.t('publicBaseUrlLabel');
        if (publicBaseUrlHint) publicBaseUrlHint.textContent = this.t('publicBaseUrlHint');
        if (publicBaseUrlInput) {
            publicBaseUrlInput.placeholder = this.t('publicBaseUrlPlaceholder');
            // Set input value from stored setting on UI update
            publicBaseUrlInput.value = this.app.publicBaseUrl;
        }
        if (savePublicBaseUrlBtn) savePublicBaseUrlBtn.textContent = this.t('save');
        if (resetPublicBaseUrlBtn) resetPublicBaseUrlBtn.textContent = this.t('reset');


        // Refresh folder tree to update texts - This will be handled by app.loadFolderTree()
        // this.app.loadFolderTree();
    }

    switchView(view) {
        const gallery = document.getElementById('fileGrid');
        if (view === 'list') {
            gallery.classList.add('list-view');
        } else {
            gallery.classList.remove('list-view');
        }
    }

    changeImageSize(size) {
        const gallery = document.getElementById('fileGrid');
        gallery.className = gallery.className.replace(/size-(small|medium|large)/g, '');
        gallery.classList.add(`size-${size}`);
    }
}

export { UiUtils };
