// static/js/file-management.js

class FileManagement {
    constructor(appInstance) {
        this.app = appInstance; // Reference to the main app instance
    }

    async createFolder(path) {
        const createBtn = document.getElementById('createFolderBtn');
        createBtn.disabled = true;

        try {
            const result = await this.app.api.createFolder(path); // Use ApiService

            this.app.ui.showToast(this.app.t('folderCreatedSuccess'), 'success');
            await this.app.folderTree.loadFolderTree(); // Delegate to folderTree
            await this.app.loadFolder(this.app.currentPath); // Refresh current view

        } catch (error) {
            console.error('Create folder error:', error);
            this.app.ui.showToast(this.app.t('folderCreateFailed') + ': ' + error.message, 'error');
        } finally {
            createBtn.disabled = false;
        }
    }

    async deleteFolder(path) {
        if (!confirm(this.app.t('deleteConfirm'))) { // Use translation
            return;
        }

        try {
            const result = await this.app.api.deleteFolder(path); // Use ApiService

            this.app.ui.showToast(this.app.t('folderDeleted'), 'success'); // Use translation
            this.app.folderTree.loadFolderTree(); // Delegate to folderTree

            // If we're currently in the deleted folder, go to parent or home
            if (this.app.currentPath === path || this.app.currentPath.startsWith(path + '/')) {
                const parentPath = path.split('/').slice(0, -1).join('/');
                this.app.loadFolder(parentPath);
            }

        } catch (error) {
            console.error('Delete folder error:', error);
            this.app.ui.showToast(this.app.t('folderDeleteFailed') + ': ' + error.message, 'error'); // Use translation
        }
    }

    renameFolder(oldPath) {
        const pathParts = oldPath.split('/');
        const currentName = pathParts[pathParts.length - 1];
        const newName = prompt(this.app.t('enterFolderName'), currentName); // Use translation

        if (newName && newName.trim() && newName.trim() !== currentName) {
            const newPath = pathParts.slice(0, -1).concat(newName.trim()).join('/');
            this.renameFolderByPath(oldPath, newPath);
        }
    }

    async renameFolderByPath(oldPath, newPath) {
        try {
            const result = await this.app.api.renameFolder(oldPath, newPath); // Use ApiService

            this.app.ui.showToast(this.app.t('folderRenamed'), 'success'); // Use translation
            this.app.folderTree.loadFolderTree(); // Refresh folder tree
            this.app.loadFolder(newPath); // Load the new path if we were in the old one

        } catch (error) {
            console.error('Rename folder error:', error);
            this.app.ui.showToast(this.app.t('folderRenameFailed') + ': ' + error.message, 'error'); // Use translation
        }
    }

    async renameFileByPath(filePath, newName) {
        try {
            const result = await this.app.api.renameFile(filePath, newName); // Use ApiService

            this.app.ui.showToast(this.app.t('fileRenamed'), 'success'); // Use translation
            this.app.loadFolder(this.app.currentPath); // Refresh current view

        } catch (error) {
            console.error('Rename file error:', error);
            this.app.ui.showToast(this.app.t('fileRenameFailed') + ': ' + error.message, 'error'); // Use translation
        }
    }

    deleteFile(filePath, fileName) {
        if (!confirm(`${this.app.t('deleteConfirm')} "${fileName}"?`)) { // Use translation
            return;
        }
        this.deleteFileByPath(filePath);
    }

    async deleteFileByPath(filePath) {
        try {
            const result = await this.app.api.deleteFile(filePath); // Use ApiService

            this.app.ui.showToast(this.app.t('fileDeleted'), 'success'); // Use translation
            this.app.loadFolder(this.app.currentPath); // Refresh current view

        } catch (error) {
            console.error('Delete file error:', error);
            this.app.ui.showToast(this.app.t('fileDeleteFailed') + ': ' + error.message, 'error'); // Use translation
        }
    }
}

export { FileManagement };
