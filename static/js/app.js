// Image Storage Service - Frontend JavaScript

class ImageStorageApp {
    constructor() {
        this.currentPath = '';
        this.selectedFiles = [];
        this.language = 'de'; // Default to German
        // Dynamic base path detection - configure for subdirectory deployment
        this.basePath = window.location.pathname.includes('/motivatier-image') ? '/motivatier-image' : '';
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
                large: 'Groß'
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
                large: 'Large'
            }
        };
        this.init();
    }

    t(key) {
        return this.translations[this.language][key] || key;
    }

    switchLanguage(lang) {
        this.language = lang;
        this.updateUITexts();
        localStorage.setItem('imageStorageLanguage', lang);
    }

    init() {
        this.bindEvents();
        this.loadFolder('');
        this.loadFolderTree();
    }

    bindEvents() {
        // Upload button
        document.getElementById('uploadBtn').addEventListener('click', () => this.uploadFiles());

        // Create folder button
        document.getElementById('createFolderBtn').addEventListener('click', () => this.createFolder());

        // Refresh tree button
        document.getElementById('refreshTree').addEventListener('click', () => this.loadFolderTree());

        // Tree action buttons
        document.getElementById('addSubfolderBtn').addEventListener('click', () => this.addSubfolder());
        document.getElementById('refreshTreeBtn').addEventListener('click', () => this.loadFolderTree());

        // Toggle custom folder input
        document.getElementById('toggleCustomFolder').addEventListener('click', () => this.toggleCustomFolderInput());

        // File input change
        document.getElementById('fileInput').addEventListener('change', (e) => {
            const files = e.target.files;
            if (files.length > 0) {
                this.handleFileSelection(files);
            }
        });

        // Drag and drop events
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
                this.handleFileSelection(files);
            }
        });

        // Folder form submit
        document.getElementById('folderForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createFolder();
        });

        // Upload form submit
        document.getElementById('uploadForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.uploadFiles();
        });

        // View toggle buttons
        document.querySelectorAll('.btn-view').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.btn-view').forEach(b => b.classList.remove('active'));
                e.target.closest('.btn-view').classList.add('active');

                const view = e.target.closest('.btn-view').dataset.view;
                this.switchView(view);
            });
        });

        // Image size radio buttons
        document.querySelectorAll('input[name="imageSize"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.changeImageSize(e.target.value);
            });
        });
    }

    handleFileSelection(files) {
        this.selectedFiles = Array.from(files);
        this.updateFilePreview();
        this.updateUploadButton();
        this.extractExifData();
    }

    async extractExifData() {
        for (let i = 0; i < this.selectedFiles.length; i++) {
            const file = this.selectedFiles[i];
            if (file.type.startsWith('image/')) {
                try {
                    const exifData = await this.readExifData(file);
                    file.exifData = exifData;
                } catch (error) {
                    console.log('No EXIF data found for', file.name);
                    file.exifData = null;
                }
            }
        }
        this.updateFilePreview(); // Refresh preview with EXIF data
    }

    readExifData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const arrayBuffer = e.target.result;
                const dataView = new DataView(arrayBuffer);

                try {
                    const exif = {};

                    // Check for JPEG format
                    if (dataView.getUint16(0) !== 0xFFD8) {
                        reject('Not a JPEG file');
                        return;
                    }

                    let offset = 2;
                    while (offset < dataView.byteLength) {
                        const marker = dataView.getUint16(offset);

                        if (marker === 0xFFE1) { // EXIF marker
                            const length = dataView.getUint16(offset + 2);
                            const exifString = '';

                            // Check for EXIF identifier
                            if (dataView.getUint32(offset + 4) === 0x45786966) { // "Exif"
                                // Extract basic EXIF data
                                const tiffOffset = offset + 10;
                                const byteOrder = dataView.getUint16(tiffOffset);
                                const littleEndian = byteOrder === 0x4949;

                                // Read image dimensions if available
                                for (let i = tiffOffset + 8; i < tiffOffset + length - 10; i += 12) {
                                    if (i + 12 > dataView.byteLength) break;

                                    const tag = littleEndian ? 
                                        dataView.getUint16(i, true) : 
                                        dataView.getUint16(i, false);

                                    if (tag === 0x0100) { // Image width
                                        const width = littleEndian ? 
                                            dataView.getUint32(i + 8, true) : 
                                            dataView.getUint32(i + 8, false);
                                        exif.width = width;
                                    } else if (tag === 0x0101) { // Image height
                                        const height = littleEndian ? 
                                            dataView.getUint32(i + 8, true) : 
                                            dataView.getUint32(i + 8, false);
                                        exif.height = height;
                                    }
                                }
                            }
                            break;
                        }

                        offset += 2 + dataView.getUint16(offset + 2);
                    }

                    // Get image dimensions using Image object as fallback
                    const img = new Image();
                    img.onload = function() {
                        exif.width = exif.width || img.width;
                        exif.height = exif.height || img.height;
                        exif.aspectRatio = (exif.width / exif.height).toFixed(2);
                        resolve(exif);
                    };
                    img.onerror = function() {
                        resolve(exif);
                    };
                    img.src = URL.createObjectURL(file);

                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject('Error reading file');
            reader.readAsArrayBuffer(file.slice(0, 65536)); // Read first 64KB for EXIF
        });
    }

    updateFilePreview() {
        const previewSection = document.getElementById('filePreviewSection');
        const previewList = document.getElementById('filePreviewList');

        if (this.selectedFiles.length === 0) {
            previewSection.classList.add('d-none');
            return;
        }

        previewSection.classList.remove('d-none');
        previewList.innerHTML = '';

        this.selectedFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-preview-item';
            fileItem.dataset.index = index;

            const thumbnail = document.createElement('div');
            thumbnail.className = 'file-preview-thumbnail';

            if (file.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.className = 'file-preview-thumbnail';
                img.src = URL.createObjectURL(file);
                img.onload = () => URL.revokeObjectURL(img.src);
                thumbnail.appendChild(img);
            } else {
                thumbnail.innerHTML = '<i class="fas fa-file"></i>';
            }

            const info = document.createElement('div');
            info.className = 'file-preview-info';

            let exifInfo = '';
            if (file.exifData && (file.exifData.width || file.exifData.height)) {
                exifInfo = `<div class="file-preview-exif">${file.exifData.width}×${file.exifData.height}px</div>`;
            }

            info.innerHTML = `
                <div class="file-preview-name">${file.name}</div>
                <div class="file-preview-size">${this.formatFileSize(file.size)}</div>
                ${exifInfo}
            `;

            const status = document.createElement('div');
            status.className = 'file-preview-status';
            status.innerHTML = '<span class="text-muted">Ready</span>';

            const removeBtn = document.createElement('button');
            removeBtn.className = 'file-preview-remove';
            removeBtn.innerHTML = '<i class="fas fa-times"></i>';
            removeBtn.onclick = () => this.removeFile(index);

            fileItem.appendChild(thumbnail);
            fileItem.appendChild(info);
            fileItem.appendChild(status);
            fileItem.appendChild(removeBtn);

            previewList.appendChild(fileItem);
        });
    }

    removeFile(index) {
        this.selectedFiles.splice(index, 1);
        this.updateFilePreview();
        this.updateUploadButton();

        // Update file input
        const fileInput = document.getElementById('fileInput');
        const dt = new DataTransfer();
        this.selectedFiles.forEach(file => dt.items.add(file));
        fileInput.files = dt.files;
    }

    updateUploadButton() {
        const uploadBtn = document.getElementById('uploadBtn');
        const uploadCount = document.getElementById('uploadCount');

        if (this.selectedFiles.length > 0) {
            uploadBtn.disabled = false;
            uploadCount.textContent = `(${this.selectedFiles.length})`;
        } else {
            uploadBtn.disabled = true;
            uploadCount.textContent = '';
        }
    }

    async loadFolder(path) {
        this.currentPath = path;
        this.showLoading(true);

        try {
            const response = await fetch(`${this.basePath}/api/list?path=${encodeURIComponent(path)}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to load folder');
            }

            this.renderFiles(data);
            this.updateBreadcrumb(path);
            this.updateCurrentFolderDisplay(path);

        } catch (error) {
            console.error('Error loading folder:', error);
            this.showToast('Error loading folder: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    updateCurrentFolderDisplay(path) {
        const display = document.getElementById('currentFolderDisplay');
        if (display) {
            display.textContent = path || 'Home';
        }
    }



    async createFolderByPath(path) {
        try {
            const response = await fetch(`${this.basePath}/api/folder`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ path })
            });

            if (!response.ok) {
                const contentType = response.headers.get('content-type');
                let errorMessage = `HTTP ${response.status}`;

                if (contentType && contentType.includes('application/json')) {
                    const result = await response.json();
                    errorMessage = result.error || errorMessage;
                } else {
                    const text = await response.text();
                    console.error('Non-JSON response:', text);
                    errorMessage = `Server returned non-JSON response (${response.status})`;
                }

                throw new Error(errorMessage);
            }

            const result = await response.json();

            this.showToast('Ordner erfolgreich erstellt', 'success');
            await this.loadFolderTree();
            await this.loadFolder(this.currentPath); // Refresh current view

        } catch (error) {
            console.error('Create folder error:', error);
            this.showToast('Failed to create folder: ' + error.message, 'error');
        }
    }

    async deleteFolder(path) {
        if (!confirm(`Are you sure you want to delete folder "${path}"?`)) {
            return;
        }

        try {
            const response = await fetch(`${this.basePath}/api/folder`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ path })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to delete folder');
            }

            this.showToast('Folder deleted successfully', 'success');
            this.loadFolderTree();

            // If we're currently in the deleted folder, go to parent or home
            if (this.currentPath === path || this.currentPath.startsWith(path + '/')) {
                const parentPath = path.split('/').slice(0, -1).join('/');
                this.loadFolder(parentPath);
            }

        } catch (error) {
            console.error('Delete folder error:', error);
            this.showToast('Failed to delete folder: ' + error.message, 'error');
        }
    }

    renameFolder(oldPath) {
        const pathParts = oldPath.split('/');
        const currentName = pathParts[pathParts.length - 1];
        const newName = prompt('Enter new folder name:', currentName);

        if (newName && newName.trim() && newName.trim() !== currentName) {
            const newPath = pathParts.slice(0, -1).concat(newName.trim()).join('/');
            this.renameFolderByPath(oldPath, newPath);
        }
    }

    async renameFolderByPath(oldPath, newPath) {
        try {
            const response = await fetch(`${this.basePath}/api/folder/rename`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ oldPath, newPath })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to rename folder');
            }

            this.showToast('Folder renamed successfully', 'success');
            this.loadFolderTree();

            // Update current path if we're in the renamed folder
            if (this.currentPath === oldPath || this.currentPath.startsWith(oldPath + '/')) {
                const newCurrentPath = this.currentPath.replace(oldPath, newPath);
                this.loadFolder(newCurrentPath);
            }

        } catch (error) {
            console.error('Rename folder error:', error);
            this.showToast('Failed to rename folder: ' + error.message, 'error');
        }
    }

    async loadFolderTree() {
        try {
            // Load all folders recursively by getting folders from root and all subfolders
            const allFolders = await this.getAllFoldersRecursively('');

            this.renderFolderTree(allFolders);
            this.updateFolderSelect(allFolders);
            this.updateParentFolderSelect(allFolders);

        } catch (error) {
            console.error('Error loading folder tree:', error);
            this.showToast('Error loading folder tree: ' + error.message, 'error');
        }
    }

    async getAllFoldersRecursively(path = '') {
        const allFolders = [];

        try {
            const response = await fetch(`${this.basePath}/api/list?path=${encodeURIComponent(path)}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to load folder');
            }

            const folders = data.filter(f => f.type === 'directory');

            for (const folder of folders) {
                allFolders.push(folder);
                // Recursively get subfolders
                const subFolders = await this.getAllFoldersRecursively(folder.path);
                allFolders.push(...subFolders);
            }

        } catch (error) {
            console.error('Error loading folders from path:', path, error);
        }

        return allFolders;
    }

    updateFolderSelect(files) {
        const folderSelect = document.getElementById('folderSelect');
        const folders = files.filter(f => f.type === 'directory');

        // Clear existing options
        folderSelect.innerHTML = '';

        // Add current folder as first option (selected) - this is now the default
        const currentOption = document.createElement('option');
        currentOption.value = this.currentPath || '';
        currentOption.textContent = `📁 ${this.currentPath || 'Home'} (Aktueller Ordner)`;
        currentOption.selected = true;
        folderSelect.appendChild(currentOption);

        // Add separator if there are other folders
        if (folders.length > 0 || this.currentPath !== '') {
            const separatorOption = document.createElement('option');
            separatorOption.disabled = true;
            separatorOption.textContent = '──────────';
            folderSelect.appendChild(separatorOption);
        }

        // Add Home if we're not already there
        if (this.currentPath !== '') {
            const homeOption = document.createElement('option');
            homeOption.value = '';
            homeOption.textContent = '🏠 Home';
            folderSelect.appendChild(homeOption);
        }

        // Add auto date option
        const autoOption = document.createElement('option');
        autoOption.value = 'AUTO_DATE';
        autoOption.textContent = '📅 Auto date folder (YYYY/MM/DD)';
        folderSelect.appendChild(autoOption);

        // Add all available folders hierarchically
        this.addFoldersHierarchically(folderSelect, folders);

        // Force selection of current folder
        folderSelect.value = this.currentPath || '';
    }

    addFoldersHierarchically(selectElement, folders) {
        // Sort folders by path depth and name
        const sortedFolders = folders.sort((a, b) => {
            const depthA = a.path.split('/').length;
            const depthB = b.path.split('/').length;
            if (depthA !== depthB) return depthA - depthB;
            return a.path.localeCompare(b.path);
        });

        sortedFolders.forEach(folder => {
            if (folder.path !== this.currentPath) {
                const option = document.createElement('option');
                option.value = folder.path;

                // Add indentation based on folder depth
                const depth = folder.path.split('/').length - 1;
                const indent = '  '.repeat(depth);
                option.textContent = `${indent}📁 ${folder.path}`;

                selectElement.appendChild(option);
            }
        });
    }

    updateParentFolderSelect(files) {
        const parentSelect = document.getElementById('folderParentSelect');
        if (!parentSelect) return;

        const folders = files.filter(f => f.type === 'directory');

        // Clear existing options except the first one (Home)
        parentSelect.innerHTML = '<option value="">🏠 Home (Root)</option>';

        // Add current folder as selected if we're not in root
        if (this.currentPath) {
            const currentOption = document.createElement('option');
            currentOption.value = this.currentPath;
            currentOption.textContent = `📁 ${this.currentPath} (Current)`;
            currentOption.selected = true;
            parentSelect.appendChild(currentOption);
        }

        // Add separator if there are other folders
        if (folders.length > 0) {
            const separatorOption = document.createElement('option');
            separatorOption.disabled = true;
            separatorOption.textContent = '──────────';
            parentSelect.appendChild(separatorOption);
        }

        // Add all available folders hierarchically
        this.addFoldersHierarchically(parentSelect, folders);
    }

    toggleCustomFolderInput() {
        const folderSelect = document.getElementById('folderSelect');
        const folderInput = document.getElementById('folderInput');
        const toggleBtn = document.getElementById('toggleCustomFolder');

        if (folderInput.classList.contains('d-none')) {
            folderSelect.classList.add('d-none');
            folderInput.classList.remove('d-none');
            folderInput.focus();
            toggleBtn.innerHTML = '<i class="fas fa-list"></i> Choose from list';
        } else {
            folderSelect.classList.remove('d-none');
            folderInput.classList.add('d-none');
            folderInput.value = '';
            toggleBtn.innerHTML = '<i class="fas fa-edit"></i> Enter custom path';
        }
    }

    renderFiles(files) {
        const grid = document.getElementById('fileGrid');
        const emptyState = document.getElementById('emptyState');

        if (files.length === 0) {
            grid.innerHTML = '';
            emptyState.classList.remove('d-none');
            return;
        }

        emptyState.classList.add('d-none');

        grid.innerHTML = files.map(file => {
            if (file.type === 'directory') {
                return this.createFolderCard(file);
            } else {
                return this.createFileCard(file);
            }
        }).join('');
    }

    createFolderCard(folder) {
        return `
            <div class="folder-card" onclick="app.loadFolder('${folder.path}')">
                <div class="folder-icon">
                    <i class="fas fa-folder"></i>
                </div>
                <h6 class="folder-name">${folder.name}</h6>
            </div>
        `;
    }

    createFileCard(file) {
        const thumbnailUrl = file.thumb || file.url;
        const sizeFormatted = this.formatFileSize(file.size);

        return `
            <div class="image-card" onclick="app.previewImage('${file.url}', '${file.name}')">
                <img src="${thumbnailUrl}" alt="${file.name}" 
                     onerror="this.style.display='none'; this.parentElement.style.background='var(--card-bg)'; this.parentElement.innerHTML='<div style=&quot;display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-muted)&quot;><i class=&quot;fas fa-image fa-2x&quot;></i></div>';">
                <div class="image-overlay">
                    <h6 class="image-title">${file.name}</h6>
                    <div class="image-meta">${sizeFormatted}</div>
                    <div class="image-actions">
                        <button class="btn-action" onclick="event.stopPropagation(); app.copyUrl('${file.url}')" title="Copy URL">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button class="btn-action" onclick="event.stopPropagation(); app.previewImage('${file.url}', '${file.name}')" title="Preview">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderFolderTree(files) {
        const tree = document.getElementById('folderTree');
        const folders = files.filter(f => f.type === 'directory');

        // Build hierarchical structure
        const folderHierarchy = this.buildFolderHierarchy(folders);

        let html = `
            <div class="folder-item ${this.currentPath === '' ? 'active' : ''}" 
                 onclick="app.loadFolder('')">
                <div class="folder-name">
                    <i class="fas fa-home"></i> Home
                </div>
                <div class="folder-actions">
                    <button class="folder-action-btn add" onclick="event.stopPropagation(); app.addSubfolderAtPath('')" title="Add Subfolder">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </div>
        `;

        html += this.renderFolderHierarchy(folderHierarchy, '');

        tree.innerHTML = html;

        // Update navigation active states
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector('.nav-item[onclick*="loadFolder"]').classList.add('active');
    }

    buildFolderHierarchy(folders) {
        const hierarchy = {};

        folders.forEach(folder => {
            const parts = folder.path.split('/');
            let current = hierarchy;

            parts.forEach((part, index) => {
                if (!current[part]) {
                    current[part] = {
                        path: parts.slice(0, index + 1).join('/'),
                        name: part,
                        children: {}
                    };
                }
                current = current[part].children;
            });
        });

        return hierarchy;
    }

    renderFolderHierarchy(hierarchy, parentPath, depth = 0) {
        let html = '';

        Object.values(hierarchy).forEach(folder => {
            const isActive = this.currentPath === folder.path ? 'active' : '';
            const indent = '  '.repeat(depth);
            const hasChildren = Object.keys(folder.children).length > 0;

            html += `
                <div class="folder-item ${isActive}" onclick="app.loadFolder('${folder.path}')" 
                     style="padding-left: ${12 + (depth * 16)}px;">
                    <div class="folder-name">
                        <i class="fas fa-folder${hasChildren ? '' : '-open'}"></i> ${folder.name}
                    </div>
                    <div class="folder-actions">
                        <button class="folder-action-btn add" onclick="event.stopPropagation(); app.addSubfolderAtPath('${folder.path}')" title="Add Subfolder">
                            <i class="fas fa-plus"></i>
                        </button>
                        <button class="folder-action-btn edit" onclick="event.stopPropagation(); app.renameFolder('${folder.path}')" title="Rename">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="folder-action-btn delete" onclick="event.stopPropagation(); app.deleteFolder('${folder.path}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;

            // Recursively render children
            if (hasChildren) {
                html += this.renderFolderHierarchy(folder.children, folder.path, depth + 1);
            }
        });

        return html;
    }

    addSubfolderAtPath(parentPath) {
        const folderName = prompt(this.t('enterFolderName'));
        if (folderName && folderName.trim()) {
            const fullPath = parentPath ? `${parentPath}/${folderName.trim()}` : folderName.trim();
            this.createFolderByPath(fullPath);
        }
    }

    addSubfolder() {
        this.addSubfolderAtPath(this.currentPath);
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

    async uploadFiles() {
        const folderSelect = document.getElementById('folderSelect');
        const folderInput = document.getElementById('folderInput');

        if (!this.selectedFiles || this.selectedFiles.length === 0) {
            this.showToast('Please select files to upload', 'warning');
            return;
        }

        // Get selected folder - use custom input if visible, otherwise use select
        const selectedFolder = folderInput.classList.contains('d-none') 
            ? folderSelect.value 
            : folderInput.value.trim();

        const progressContainer = document.getElementById('uploadProgress');
        const progressFill = document.getElementById('progressFill');
        const statusEl = document.getElementById('uploadStatus');
        const uploadBtn = document.getElementById('uploadBtn');

        progressContainer.classList.remove('d-none');
        uploadBtn.disabled = true;

        let completed = 0;
        const total = this.selectedFiles.length;

        for (let i = 0; i < this.selectedFiles.length; i++) {
            const file = this.selectedFiles[i];
            const fileItem = document.querySelector(`[data-index="${i}"]`);
            const statusDiv = fileItem.querySelector('.file-preview-status');

            try {
                statusEl.textContent = `Uploading ${file.name}...`;
                statusDiv.innerHTML = '<span class="status-uploading"><i class="fas fa-spinner fa-spin"></i> Uploading...</span>';

                const formData = new FormData();
                formData.append('file', file);
                if (selectedFolder) {
                    formData.append('folder', selectedFolder);
                }

                const response = await fetch(`${this.basePath}/api/upload`, {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.error || 'Upload failed');
                }

                completed++;
                const progress = (completed / total) * 100;
                progressFill.style.width = `${progress}%`;

                statusDiv.innerHTML = '<span class="status-success"><i class="fas fa-check"></i> Uploaded</span>';

                console.log('Uploaded:', result);

            } catch (error) {
                console.error('Upload error:', error);
                statusDiv.innerHTML = '<span class="status-error"><i class="fas fa-times"></i> Failed</span>';
                this.showToast(`Failed to upload ${file.name}: ${error.message}`, 'error');
            }
        }

        statusEl.textContent = `Completed ${completed} of ${total} files`;

        if (completed > 0) {
            this.showToast(`Successfully uploaded ${completed} file(s)`, 'success');
            this.loadFolder(this.currentPath);
            this.loadFolderTree();

            // Reset form after delay
            setTimeout(() => {
                const modal = bootstrap.Modal.getInstance(document.getElementById('uploadModal'));
                if (modal) {
                    modal.hide();
                }
                this.resetUploadForm();
            }, 1500);
        } else {
            uploadBtn.disabled = false;
        }
    }

    resetUploadForm() {
        this.selectedFiles = [];
        document.getElementById('fileInput').value = '';
        document.getElementById('folderInput').value = '';

        // Always select the current folder as default
        const folderSelect = document.getElementById('folderSelect');
        folderSelect.value = this.currentPath || '';

        document.getElementById('filePreviewSection').classList.add('d-none');
        document.getElementById('uploadProgress').classList.add('d-none');
        document.getElementById('progressFill').style.width = '0%';

        // Reset folder input visibility
        const folderInput = document.getElementById('folderInput');
        const toggleBtn = document.getElementById('toggleCustomFolder');

        if (!folderInput.classList.contains('d-none')) {
            folderSelect.classList.remove('d-none');
            folderInput.classList.add('d-none');
            toggleBtn.innerHTML = '<i class="fas fa-edit"></i> Enter custom path';
        }

        this.updateUploadButton();
    }

    async createFolder() {
        const pathInput = document.getElementById('folderPath');
        const nameInput = document.getElementById('folderName');
        const parentSelect = document.getElementById('folderParentSelect');

        let path = '';

        // Check if manual path is provided
        if (pathInput.value.trim()) {
            path = pathInput.value.trim();
        } else {
            // Build path from parent + name
            const folderName = nameInput.value.trim();
            if (!folderName) {
                this.showToast('Please enter a folder name', 'warning');
                return;
            }

            const parentPath = parentSelect.value;
            path = parentPath ? `${parentPath}/${folderName}` : folderName;
        }

        if (!path) {
            this.showToast('Please enter a folder path or name', 'warning');
            return;
        }

        const createBtn = document.getElementById('createFolderBtn');
        createBtn.disabled = true;

        try {
            const response = await fetch(`${this.basePath}/api/folder`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ path })
            });

            if (!response.ok) {
                const contentType = response.headers.get('content-type');
                let errorMessage = `HTTP ${response.status}`;

                if (contentType && contentType.includes('application/json')) {
                    const result = await response.json();
                    errorMessage = result.error || errorMessage;
                } else {
                    const text = await response.text();
                    console.error('Non-JSON response:', text);
                    errorMessage = `Server returned non-JSON response (${response.status})`;
                }

                throw new Error(errorMessage);
            }

            const result = await response.json();

            this.showToast('Folder created successfully', 'success');
            this.loadFolderTree();

            // Reset and close modal
            pathInput.value = '';
            nameInput.value = '';
            parentSelect.selectedIndex = 0;
            const modal = bootstrap.Modal.getInstance(document.getElementById('newFolderModal'));
            if (modal) {
                modal.hide();
            }

        } catch (error) {
            console.error('Create folder error:', error);
            this.showToast('Failed to create folder: ' + error.message, 'error');
        } finally {
            createBtn.disabled = false;
        }
    }

    previewImage(url, name) {
        const modal = new bootstrap.Modal(document.getElementById('previewModal'));
        const image = document.getElementById('previewImage');
        const title = document.getElementById('previewTitle');
        const urlInput = document.getElementById('imageUrl');

        title.textContent = name;
        image.src = url;
        urlInput.value = window.location.origin + url;

        modal.show();
    }

    copyUrl(url) {
        const fullUrl = window.location.origin + url;

        if (navigator.clipboard) {
            navigator.clipboard.writeText(fullUrl).then(() => {
                this.showToast('URL copied to clipboard', 'success');
            }).catch(() => {
                this.fallbackCopyUrl(fullUrl);
            });
        } else {
            this.fallbackCopyUrl(fullUrl);
        }
    }

    fallbackCopyUrl(url) {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            this.showToast('URL copied to clipboard', 'success');
        } catch (err) {
            this.showToast('Failed to copy URL', 'error');
        }
        document.body.removeChild(textArea);
    }

    showLoading(show) {
        const indicator = document.getElementById('loadingIndicator');
        const grid = document.getElementById('fileGrid');

        if (show) {
            indicator.classList.remove('d-none');
            grid.classList.add('loading');
        } else {
            indicator.classList.add('d-none');
            grid.classList.remove('loading');
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
        if (pageTitle) pageTitle.textContent = this.language === 'de' ? 'Bild-Speicher-Tool' : 'Image Storage Tool';

        // Update upload button
        const uploadBtn = document.getElementById('uploadImageBtn');
        if (uploadBtn) uploadBtn.innerHTML = `${this.t('uploadImages')} <i class="fas fa-sparkles"></i>`;

        // Update modal title
        const modalTitle = document.getElementById('uploadModalTitle');
        if (modalTitle) modalTitle.textContent = this.t('uploadImages');

        // Update current location label
        const locationLabel = document.getElementById('currentLocationLabel');
        if (locationLabel) locationLabel.textContent = this.language === 'de' ? 'Aktuelle Position' : 'Current Location';

        // Update language buttons
        const btnDe = document.getElementById('btnDe');
        const btnEn = document.getElementById('btnEn');
        if (btnDe && btnEn) {
            btnDe.classList.toggle('btn-orange', this.language === 'de');
            btnEn.classList.toggle('btn-orange', this.language === 'en');
        }

        // Refresh folder tree to update texts
        this.loadFolderTree();
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

// Global copy URL function for modal
function copyUrl() {
    const urlInput = document.getElementById('imageUrl');
    urlInput.select();

    if (navigator.clipboard) {
        navigator.clipboard.writeText(urlInput.value).then(() => {
            app.showToast('URL copied to clipboard', 'success');
        }).catch(() => {
            document.execCommand('copy');
            app.showToast('URL copied to clipboard', 'success');
        });
    } else {
        document.execCommand('copy');
        app.showToast('URL copied to clipboard', 'success');
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ImageStorageApp();
});