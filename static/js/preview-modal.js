// static/js/preview-modal.js

class PreviewModal {
    constructor(appInstance) {
        this.app = appInstance; // Reference to the main app instance
    }

    previewImage(url, name) {
        const modal = new bootstrap.Modal(document.getElementById('previewModal'));
        const image = document.getElementById('previewImage');
        const title = document.getElementById('previewTitle');
        const urlInput = document.getElementById('imageUrl');

        title.textContent = name;
        image.src = url;
        // The 'url' passed here is already the full, absolute URL, so no need to prefix again
        urlInput.value = url; 

        modal.show();
    }

    copyUrl(url) {
        // The 'url' passed here is already the full, absolute URL
        const fullUrl = url; 

        if (navigator.clipboard) {
            navigator.clipboard.writeText(fullUrl).then(() => {
                this.app.ui.showToast(this.app.t('urlCopied'), 'success'); // Use ui.showToast
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
            this.app.ui.showToast(this.app.t('urlCopied'), 'success'); // Use ui.showToast
        } catch (err) {
            this.app.ui.showToast(this.app.t('urlCopyFailed'), 'error'); // Use ui.showToast
        }
        document.body.removeChild(textArea);
    }
}

export { PreviewModal };
