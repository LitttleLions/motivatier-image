// static/js/preview-modal.js

class PreviewModal {
    constructor(appInstance) {
        this.app = appInstance; // Reference to the main app instance
        this.files = []; // To store the list of files for navigation
        this.currentIndex = 0; // To store the current index in the files array
        this.modalElement = document.getElementById('previewModal');
        this.previewImageElement = document.getElementById('previewImage');
        this.previewTitleElement = document.getElementById('previewTitle');
        this.imageUrlInput = document.getElementById('imageUrl');

        // Bind keyboard events for navigation
        this.modalElement.addEventListener('shown.bs.modal', () => {
            document.addEventListener('keydown', this.handleKeyDown);
        });
        this.modalElement.addEventListener('hidden.bs.modal', () => {
            document.removeEventListener('keydown', this.handleKeyDown);
        });

        // Bind navigation buttons (if they exist in the modal HTML)
        const prevBtn = this.modalElement.querySelector('#previewPrevBtn');
        const nextBtn = this.modalElement.querySelector('#previewNextBtn');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.showPreviousImage());
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.showNextImage());
        }
    }

    handleKeyDown = (event) => {
        if (event.key === 'ArrowLeft') {
            this.showPreviousImage();
        } else if (event.key === 'ArrowRight') {
            this.showNextImage();
        }
    }

    // Updated to accept files array and current index
    previewImage(files, startIndex) {
        this.files = files;
        this.currentIndex = startIndex;
        this.updateModalContent();
        const modal = new bootstrap.Modal(this.modalElement);
        modal.show();
    }

    updateModalContent() {
        if (this.files.length === 0) return;

        const file = this.files[this.currentIndex];
        
        // Construct the display URL using the app's basePath
        const displayImageUrl = `${this.app.basePath === '/' ? '' : this.app.basePath}/images/${file.url}`;
        
        // Construct the URL for copying (uses publicBaseUrl if set)
        const copyImageUrl = `${this.app.publicBaseUrl || (window.location.origin + (this.app.basePath === '/' ? '' : this.app.basePath) + '/') }images/${file.url}`;

        this.previewTitleElement.textContent = file.display_name;
        this.previewImageElement.src = displayImageUrl;
        this.imageUrlInput.value = copyImageUrl;

        // Update navigation button states
        const prevBtn = this.modalElement.querySelector('#previewPrevBtn');
        const nextBtn = this.modalElement.querySelector('#previewNextBtn');
        if (prevBtn) {
            prevBtn.disabled = this.currentIndex === 0;
        }
        if (nextBtn) {
            nextBtn.disabled = this.currentIndex === this.files.length - 1;
        }
    }

    showNextImage() {
        if (this.currentIndex < this.files.length - 1) {
            this.currentIndex++;
            this.updateModalContent();
        }
    }

    showPreviousImage() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.updateModalContent();
        }
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
