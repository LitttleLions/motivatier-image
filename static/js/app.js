// Image Storage Service - Frontend JavaScript
import { UiUtils } from './ui-utils.js';
import { ApiService } from './api-service.js';
import { FolderTreeView } from './folder-tree-view.js';
import { FileManagement } from './file-management.js';
import { UploadManager } from './upload-manager.js';
import { PreviewModal } from './preview-modal.js';


class ImageStorageApp {
    constructor() {
        this.currentPath = '';
        this.language = 'de'; // Default to German
        // Ensure basePath always starts with a '/' and does NOT end with one (unless it's just '/')
        this.basePath = (window.BASE_PATH || '').replace(/\/+$/, ''); // Remove trailing slashes
        if (this.basePath === '') {
            this.basePath = '/'; // If empty, set to root
        } else if (!this.basePath.startsWith('/')) {
            this.basePath = '/' + this.basePath; // Ensure leading slash
        }
        
        this.publicBaseUrl = ''; // Initialize publicBaseUrl

        this.ui = new UiUtils(this); // Pass this (app instance) to UiUtils
        this.api = new ApiService(this); // Instantiate ApiService
        this.folderTree = new FolderTreeView(this); // Instantiate FolderTreeView
        this.fileManagement = new FileManagement(this); // Instantiate FileManagement
        this.uploadManager = new UploadManager(this); // Instantiate UploadManager
        this.previewModal = new PreviewModal(this); // Instantiate PreviewModal

        this.init();
    }

    t(key) {
        return this.ui.t(key);
    }

    switchLanguage(lang) {
        this.language = lang;
        this.ui.updateUITexts();
        localStorage.setItem('imageStorageLanguage', lang);
    }

    init() {
        this.bindEvents();
        this.loadSettings();
        this.loadFolder('');
        this.folderTree.loadFolderTree(); // Delegate to folderTree
        this.ui.updateUITexts(); // Use ui.updateUITexts
    }

    loadSettings() {
        const savedLanguage = localStorage.getItem('imageStorageLanguage');
        if (savedLanguage) {
            this.language = savedLanguage;
        }
        const savedPublicBaseUrl = localStorage.getItem('publicBaseUrl');
        if (savedPublicBaseUrl) {
            this.publicBaseUrl = savedPublicBaseUrl;
        }
    }

    savePublicBaseUrl() {
        const input = document.getElementById('publicBaseUrlInput');
        if (input) {
            let url = input.value.trim();
            // Ensure URL ends with a single slash if not empty
            if (url && !url.endsWith('/')) {
                url += '/';
            }
            this.publicBaseUrl = url;
            localStorage.setItem('publicBaseUrl', this.publicBaseUrl);
            this.ui.showToast(this.t('settingsSaved'), 'success'); // Use ui.showToast
            this.ui.updateUITexts(); // Use ui.updateUITexts
        }
    }

    resetPublicBaseUrl() {
        const defaultUrl = window.location.origin + this.basePath;
        let urlToSet = defaultUrl;
        // Ensure URL ends with a single slash if not empty
        if (urlToSet && !urlToSet.endsWith('/')) {
            urlToSet += '/';
        }
        this.publicBaseUrl = urlToSet;
        localStorage.setItem('publicBaseUrl', this.publicBaseUrl);
        this.ui.showToast(this.t('settingsSaved'), 'success'); // Use ui.showToast
        this.ui.updateUITexts(); // Use ui.updateUITexts
    }

    bindEvents() {
        document.getElementById('savePublicBaseUrlBtn').addEventListener('click', () => this.savePublicBaseUrl());
        document.getElementById('resetPublicBaseUrlBtn').addEventListener('click', () => this.resetPublicBaseUrl());
        document.getElementById('uploadBtn').addEventListener('click', () => this.uploadManager.uploadFiles()); // Re-added click listener
        document.getElementById('createFolderBtn').addEventListener('click', () => this.fileManagement.createFolder(
            document.getElementById('folderPath').value.trim() || 
            (document.getElementById('folderParentSelect').value ? `${document.getElementById('folderParentSelect').value}/${document.getElementById('folderName').value.trim()}` : document.getElementById('folderName').value.trim())
        )); // Delegate to fileManagement
        document.getElementById('refreshTree').addEventListener('click', () => this.folderTree.loadFolderTree()); // Delegate to folderTree
        document.getElementById('addSubfolderBtn').addEventListener('click', () => this.fileManagement.addSubfolderAtPath(this.currentPath));
        document.getElementById('refreshTreeBtn').addEventListener('click', () => this.folderTree.loadFolderTree()); // Delegate to folderTree
        document.getElementById('toggleCustomFolder').addEventListener('click', () => this.uploadManager.toggleCustomFolderInput()); // Delegate to uploadManager
        document.getElementById('fileInput').addEventListener('change', (e) => {
            const files = e.target.files;
            if (files.length > 0) {
                this.uploadManager.handleFileSelection(files); // Delegate to uploadManager
            }
        });
        const uploadArea = document.getElementById('uploadArea');
        uploadArea.addEventListener('click', (e) => {
            if (e.target.closest('.upload-button') || e.target === uploadArea) {
                document.getElementById('fileInput').click();
            }
        });
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            if (!uploadArea.contains(e.relatedTarget)) {
                uploadArea.classList.remove('dragover');
            }
        });
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = Array.from(e.dataTransfer.files).filter(file => 
                file.type.startsWith('image/')
            );
            if (files.length > 0) {
                const fileInput = document.getElementById('fileInput');
                const dt = new DataTransfer();
                files.forEach(file => dt.items.add(file));
                fileInput.files = dt.files;
                this.uploadManager.handleFileSelection(files); // Delegate to uploadManager
            }
        });
        document.getElementById('folderForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.fileManagement.createFolder(
                document.getElementById('folderPath').value.trim() || 
                (document.getElementById('folderParentSelect').value ? `${document.getElementById('folderParentSelect').value}/${document.getElementById('folderName').value.trim()}` : document.getElementById('folderName').value.trim())
            ); // Delegate to fileManagement
        });
        document.getElementById('uploadForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.uploadManager.uploadFiles(); // Delegate to uploadManager
        });
        document.querySelectorAll('.btn-view').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.btn-view').forEach(b => b.classList.remove('active'));
                e.target.closest('.btn-view').classList.add('active');
                const view = e.target.closest('.btn-view').dataset.view;
                this.ui.switchView(view); // Use ui.switchView
            });
        });
        document.querySelectorAll('input[name="imageSize"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.ui.changeImageSize(e.target.value); // Use ui.changeImageSize
            });
        });
    }

    async loadFolder(path) {
        console.log(`[App] loadFolder called with path: ${path}`);
        this.currentPath = path;
        this.ui.showLoading(true); // Use ui.showLoading

        try {
            const data = await this.api.listFiles(path); // Use ApiService
            
            // Filter out directories from the main file grid
            const filesOnly = data.filter(item => item.type === 'file');
            console.log(`[App] loadFolder received ${filesOnly.length} files. Calling renderFiles.`);
            this.renderFiles(filesOnly);

            this.updateBreadcrumb(path);
            this.updateCurrentFolderDisplay(path);
            this.folderTree.updateFolderSelects(data.filter(item => item.type === 'directory')); // Delegate to folderTree

        } catch (error) {
            console.error('Error loading folder:', error);
            this.ui.showToast('Error loading folder: ' + error.message, 'error'); // Use ui.showToast
        } finally {
            this.ui.showLoading(false); // Use ui.showLoading
        }
    }

    updateCurrentFolderDisplay(path) {
        const display = document.getElementById('currentFolderDisplay');
        if (display) {
            display.textContent = path || 'Home';
        }
    }

    updateBreadcrumb(path) {
        const breadcrumb = document.getElementById('breadcrumb');
        let html = '<li class="breadcrumb-item"><a href="#" onclick="app.loadFolder(\'\')">Home</a></li>';

        if (path) {
            const parts = path.split('/');
            let currentPath = '';

            parts.forEach((part, index) => {
                currentPath += (currentPath ? '/' : '') + part;
                if (index === parts.length - 1) {
                    html += `<li class="breadcrumb-item active">${part}</li>`;
                } else {
                    html += `<li class="breadcrumb-item"><a href="#" onclick="app.loadFolder('${currentPath}')">${part}</a></li>`;
                }
            });
        }

        breadcrumb.innerHTML = html;
    }

    renderFiles(files) {
        console.log(`[App] renderFiles called with ${files.length} files.`);
        const fileGrid = document.getElementById('fileGrid');
        const emptyState = document.getElementById('emptyState');
        
        // Clear previous files and log its state
        fileGrid.innerHTML = ''; 
        console.log(`[App] fileGrid cleared. InnerHTML length: ${fileGrid.innerHTML.length}`);

        if (files.length === 0) {
            emptyState.classList.remove('d-none');
            return;
        } else {
            emptyState.classList.add('d-none');
        }

        files.forEach((file, index) => { // Added index to the loop
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';

            // Construct full image URL for display (always relative to base path, ensuring no double slashes)
            // basePath already handled in constructor to ensure no trailing slash (unless it's just '/')
            const displayImageUrl = `${this.basePath === '/' ? '' : this.basePath}/images/${file.url}`;
            const displayThumbnailUrl = file.thumb ? `${this.basePath === '/' ? '' : this.basePath}/images/${file.thumb}` : displayImageUrl;
            
            // Construct full image URL for copying (uses publicBaseUrl if set, ensuring no double slashes)
            // publicBaseUrl already handled in save/reset to ensure trailing slash (if not empty)
            const copyImageUrl = `${this.publicBaseUrl || (window.location.origin + (this.basePath === '/' ? '' : this.basePath) + '/') }images/${file.url}`;

            fileItem.innerHTML = `
                <div class="file-thumbnail">
                    <img src="${displayThumbnailUrl}" alt="${file.display_name}" loading="lazy" onerror="this.onerror=null;this.src='${(displayImageUrl).replace(/'/g, "\\'")}'">
                    <div class="file-overlay">
                        <button class="btn-overlay view-btn" data-file-index="${index}">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-overlay copy-btn" onclick="app.previewModal.copyUrl('${copyImageUrl.replace(/'/g, "\\'")}')">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button class="btn-overlay rename-file-btn" data-path="${file.path}" data-name="${file.display_name}" title="${this.t('renameFile')}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-overlay delete-file-btn" data-path="${file.path}" data-name="${file.display_name}" title="${this.t('deleteFile')}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="file-info">
                    <span class="file-name">${file.display_name}</span>
                    <span class="file-size">${this.ui.formatFileSize(file.size)}</span>
                    <span class="file-date">${new Date(file.upload_date).toLocaleDateString()}</span>
                </div>
            `;
            fileGrid.appendChild(fileItem);

            // Bind events for rename and delete buttons
            const renameBtn = fileItem.querySelector('.rename-file-btn');
            if (renameBtn) {
                renameBtn.addEventListener('click', (e) => {
                    const path = e.currentTarget.dataset.path;
                    const name = e.currentTarget.dataset.name;
                    const newName = prompt(this.t('enterFolderName'), name); // Using enterFolderName as a generic prompt
                    if (newName && newName.trim() && newName.trim() !== name) {
                        this.fileManagement.renameFileByPath(path, newName.trim()); // Delegate to fileManagement
                    }
                });
            }

            const deleteBtn = fileItem.querySelector('.delete-file-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    const path = e.currentTarget.dataset.path;
                    const name = e.currentTarget.dataset.name;
                    this.fileManagement.deleteFile(path, name); // Delegate to fileManagement
                });
            }

            // Bind click event for view button
            const viewBtn = fileItem.querySelector('.view-btn');
            if (viewBtn) {
                viewBtn.addEventListener('click', (e) => {
                    const fileIndex = parseInt(e.currentTarget.dataset.fileIndex);
                    this.previewModal.previewImage(files, fileIndex); // Pass all files and the clicked index
                });
            }
        });
    }
}

// Global copy URL function for modal (for consistency, uses app's method)
function copyUrl() {
    const urlInput = document.getElementById('imageUrl');
    app.previewModal.copyUrl(urlInput.value); // Use the previewModal's copyUrl method directly
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ImageStorageApp();
});
