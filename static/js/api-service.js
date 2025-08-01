// static/js/api-service.js

class ApiService {
    constructor(appInstance) {
        this.app = appInstance; // Reference to the main app instance
        this.basePath = appInstance.basePath;
    }

    async fetchJson(url, options = {}) {
        try {
            const response = await fetch(url, options);
            const contentType = response.headers.get('content-type');

            if (!response.ok) {
                let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                if (contentType && contentType.includes('application/json')) {
                    const errorResult = await response.json();
                    errorMessage = errorResult.error || errorMessage;
                } else {
                    const text = await response.text();
                    console.error('Non-JSON error response:', text);
                    errorMessage = `Server returned non-JSON error response (${response.status})`;
                }
                throw new Error(errorMessage);
            }

            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            } else {
                const text = await response.text();
                console.warn('Non-JSON success response:', text);
                return {}; // Return empty object for non-JSON success
            }

        } catch (error) {
            console.error(`API call to ${url} failed:`, error);
            throw error;
        }
    }

    async listFiles(path) {
        const url = `/motivatier-image/api/list?path=${encodeURIComponent(path)}`;
        console.log('API: Listing files at', url);
        return this.fetchJson(url);
    }

    async uploadFile(formData) {
        const url = `/motivatier-image/api/upload`;
        console.log('API: Uploading file to', url);
        return this.fetchJson(url, {
            method: 'POST',
            body: formData
        });
    }

    async renameFile(filePath, newName) {
        const url = `/motivatier-image/api/file/rename`;
        console.log('API: Renaming file', filePath, 'to', newName);
        return this.fetchJson(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ path: filePath, newName: newName })
        });
    }

    async deleteFile(filePath) {
        const url = `/motivatier-image/api/file`;
        console.log('API: Deleting file', filePath);
        return this.fetchJson(url, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ path: filePath })
        });
    }

    async createFolder(path) {
        const url = `/motivatier-image/api/folder`;
        console.log('API: Creating folder', path);
        return this.fetchJson(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ path })
        });
    }

    async deleteFolder(path) {
        const url = `/motivatier-image/api/folder`;
        console.log('API: Deleting folder', path);
        return this.fetchJson(url, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ path })
        });
    }

    async renameFolder(oldPath, newPath) {
        const url = `/motivatier-image/api/folder/rename`;
        console.log('API: Renaming folder', oldPath, 'to', newPath);
        return this.fetchJson(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ oldPath: oldPath, newPath: newPath })
        });
    }
}

export { ApiService };
