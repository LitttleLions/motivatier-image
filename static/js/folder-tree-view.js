// static/js/folder-tree-view.js

class FolderTreeView {
    constructor(appInstance) {
        this.app = appInstance; // Reference to the main app instance
    }

    async loadFolderTree() {
        console.log('Loading folder tree...');
        try {
            const data = await this.app.api.listFiles(''); // Use ApiService
            
            const rootFolderElement = document.getElementById('rootFolder');
            rootFolderElement.innerHTML = ''; // Clear existing tree

            // Filter for directories only and sort them
            const topLevelFolders = data.filter(item => item.type === 'directory');
            
            this.renderFolderTree(topLevelFolders, rootFolderElement, '');

            // Also update folder selects in modals
            this.updateFolderSelects(topLevelFolders);

        } catch (error) {
            console.error('Error loading folder tree:', error);
            this.app.ui.showToast('Error loading folder tree: ' + error.message, 'error'); // Use ui.showToast
        }
    }

    renderFolderTree(folders, parentElement, currentPath) {
        folders.sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically

        folders.forEach(folder => {
            const li = document.createElement('li');
            li.className = 'folder-item';

            const folderPath = currentPath ? `${currentPath}/${folder.name}` : folder.name;

            li.innerHTML = `
                <div class="folder-header">
                    <span class="folder-name" data-path="${folderPath}"><i class="fas fa-folder"></i> ${folder.name}</span>
                    <div class="folder-actions">
                        <button class="btn-action rename-folder-btn" data-path="${folderPath}" title="${this.app.t('renameFolder')}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action delete-folder-btn" data-path="${folderPath}" title="${this.app.t('deleteFolder')}">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button class="btn-action add-subfolder-btn" data-path="${folderPath}" title="${this.app.t('addSubfolder')}" data-bs-toggle="modal" data-bs-target="#newFolderModal">
                            <i class="fas fa-folder-plus"></i>
                        </button>
                    </div>
                </div>
                <ul class="folder-list" id="folder-${folderPath.replace(/[^a-zA-Z0-9]/g, '-')}-subfolders"></ul>
            `;
            parentElement.appendChild(li);

            // Bind click event for folder name
            li.querySelector('.folder-name').addEventListener('click', (e) => {
                const path = e.currentTarget.dataset.path;
                console.log('Folder clicked:', path); // Debugging log
                this.app.loadFolder(path);
            });

            // Bind event for add subfolder button
            li.querySelector('.add-subfolder-btn').addEventListener('click', (e) => {
                const path = e.currentTarget.dataset.path;
                this.app.fileManagement.addSubfolderAtPath(path);
            });

            // Bind events for rename and delete buttons
            li.querySelector('.rename-folder-btn').addEventListener('click', (e) => {
                const path = e.currentTarget.dataset.path;
                const newName = prompt(this.app.t('enterFolderName'), path.split('/').pop());
                if (newName) {
                    this.app.fileManagement.renameFolderByPath(path, newName);
                }
            });
            li.querySelector('.delete-folder-btn').addEventListener('click', (e) => {
                const path = e.currentTarget.dataset.path;
                this.app.fileManagement.deleteFolder(path);
            });

            // Recursively load subfolders (lazy loading for deeper levels)
            // For now, load all subfolders on initial tree load for simplicity
            this.fetchAndRenderSubfolders(folderPath, li.querySelector('.folder-list'));
        });
    }

    async fetchAndRenderSubfolders(parentPath, parentElement) {
        try {
            const data = await this.app.api.listFiles(parentPath); // Use ApiService
            const subfolders = data.filter(item => item.type === 'directory');
            this.renderFolderTree(subfolders, parentElement, parentPath);
        } catch (error) {
            console.error(`Error fetching subfolders for ${parentPath}:`, error);
        }
    }

    updateFolderSelects(folders, currentPath = '', depth = 0) {
        const folderSelect = document.getElementById('folderSelect');
        const folderParentSelect = document.getElementById('folderParentSelect');

        // Clear existing options, but keep the default "Current Folder" / "Home (Root)"
        if (depth === 0) {
            folderSelect.innerHTML = '<option value="">Current Folder</option>';
            folderParentSelect.innerHTML = '<option value="">Home (Root)</option>';
        }
        
        folders.sort((a, b) => a.name.localeCompare(b.name));

        folders.forEach(folder => {
            const path = currentPath ? `${currentPath}/${folder.name}` : folder.name;
            const prefix = '– '.repeat(depth); // Indent subfolders

            const option = document.createElement('option');
            option.value = path;
            option.textContent = prefix + folder.name;
            folderSelect.appendChild(option);

            const parentOption = document.createElement('option');
            parentOption.value = path;
            parentOption.textContent = prefix + folder.name;
            folderParentSelect.appendChild(parentOption);

            if (folder.subfolders && folder.subfolders.length > 0) {
                this.updateFolderSelects(folder.subfolders, path, depth + 1);
            }
        });

        // Set selected value for upload modal
        folderSelect.value = this.app.currentPath || '';
    }
}

export { FolderTreeView };
