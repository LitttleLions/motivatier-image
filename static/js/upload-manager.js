// static/js/upload-manager.js

class UploadManager {
    constructor(appInstance) {
        this.app = appInstance; // Reference to the main app instance
        this.selectedFiles = [];
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
                <div class="file-preview-size">${this.app.ui.formatFileSize(file.size)}</div>
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

    async uploadFiles() {
        const folderSelect = document.getElementById('folderSelect');
        const folderInput = document.getElementById('folderInput');

        if (!this.selectedFiles || this.selectedFiles.length === 0) {
            this.app.ui.showToast(this.app.t('noFilesSelected'), 'warning');
            return;
        }

        // Get selected folder - use custom input if visible, otherwise use select
        let selectedFolder = folderInput.classList.contains('d-none') 
            ? folderSelect.value 
            : folderInput.value.trim();

        // If currentPath is empty (root folder), send '.' to the backend
        if (selectedFolder === '') {
            selectedFolder = '.';
        }

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
                console.log('UploadManager: Sending folder to backend:', selectedFolder); // Debugging line

                const result = await this.app.api.uploadFile(formData);

                completed++;
                const progress = (completed / total) * 100;
                progressFill.style.width = `${progress}%`;

                statusDiv.innerHTML = '<span class="status-success"><i class="fas fa-check"></i> Uploaded</span>';

                console.log('Uploaded:', result);

            } catch (error) {
                console.error('Upload error:', error);
                statusDiv.innerHTML = '<span class="status-error"><i class="fas fa-times"></i> Failed</span>';
                this.app.ui.showToast(`${this.app.t('uploadFilesFailed')} ${file.name}: ${error.message}`, 'error');
            }
        }

        statusEl.textContent = `Completed ${completed} of ${total} files`;

        if (completed > 0) {
            this.app.ui.showToast(`${this.app.t('uploadFilesSuccess')} ${completed} file(s)`, 'success');
            this.app.loadFolder(this.app.currentPath);
            this.app.folderTree.loadFolderTree(); // Corrected method call

            // Reset form immediately
            const modal = bootstrap.Modal.getInstance(document.getElementById('uploadModal'));
            if (modal) {
                modal.hide();
            }
            this.resetUploadForm();
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
        folderSelect.value = this.app.currentPath || '';

        document.getElementById('filePreviewSection').classList.add('d-none');
        document.getElementById('uploadProgress').classList.add('d-none');
        document.getElementById('progressFill').style.width = '0%';

        // Reset folder input visibility
        const folderInput = document.getElementById('folderInput');
        const toggleBtn = document.getElementById('toggleCustomFolder');

        if (!folderInput.classList.contains('d-none')) {
            folderSelect.classList.remove('d-none');
            folderInput.classList.add('d-none');
            toggleBtn.innerHTML = '<i class="fas fa-list"></i> Choose from list';
        } else {
            folderSelect.classList.remove('d-none');
            folderInput.classList.add('d-none');
            folderInput.value = '';
            toggleBtn.innerHTML = '<i class="fas fa-edit"></i> Enter custom path';
        }
    }

    toggleCustomFolderInput() {
        const folderSelect = document.getElementById('folderSelect');
        const folderInput = document.getElementById('folderInput');
        const toggleBtn = document.getElementById('toggleCustomFolder');

        if (folderInput.classList.contains('d-none')) {
            folderSelect.classList.add('d-none');
            folderInput.classList.remove('d-none');
            folderInput.value = folderSelect.value === '' ? '' : folderSelect.value;
            toggleBtn.innerHTML = '<i class="fas fa-list"></i> Choose from list';
        } else {
            folderSelect.classList.remove('d-none');
            folderInput.classList.add('d-none');
            folderSelect.value = folderInput.value === '' ? '' : folderInput.value;
            toggleBtn.innerHTML = '<i class="fas fa-edit"></i> Enter custom path';
        }
    }
}

export { UploadManager };
