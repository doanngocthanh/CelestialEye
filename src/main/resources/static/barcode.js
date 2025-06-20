// Utility functions
const createCard = () => {
    const card = document.createElement('div');
    card.className = 'preview-card';
    return card;
};

const showImagePreview = (card, file) => {
    if (file.type.startsWith('image/')) {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        card.appendChild(img);
    }
    const fileName = document.createElement('p');
    fileName.textContent = `File: ${file.name}`;
    card.appendChild(fileName);
};

const createBarcodeResult = (result, index) => {
    if (!result.content) return null;
    
    const barcodeDiv = document.createElement('div');
    barcodeDiv.className = 'barcode-result';
    barcodeDiv.innerHTML = `
        <h4>Barcode ${index + 1}</h4>
        <p>Content: ${result.content}</p>
        <p>Format: ${result.format}</p>
        ${result.pageNumber ? `<p>Page: ${result.pageNumber}</p>` : ''}
        ${result.boundingBox ? `
        <p>Location: 
            X: ${Math.round(result.boundingBox.x)}, 
            Y: ${Math.round(result.boundingBox.y)}, 
            Width: ${Math.round(result.boundingBox.width)}, 
            Height: ${Math.round(result.boundingBox.height)}
        </p>` : ''}
    `;
    return barcodeDiv;
};

const showError = (message, isWarning = false) => {
    const div = document.createElement('div');
    div.className = `barcode-result ${isWarning ? 'warning' : 'error'}`;
    div.textContent = message;
    return div;
};

const processBarcodeResults = (card, data) => {
    if (!Array.isArray(data.results) || data.results.length === 0) {
        card.appendChild(showError('No barcodes found in this file', true));
        return;
    }

    const successfulResults = data.results.map((result, index) => 
        createBarcodeResult(result, index)).filter(Boolean);

    if (successfulResults.length === 0) {
        card.appendChild(showError('No valid barcodes found in this file', true));
        return;
    }

    successfulResults.forEach(resultDiv => card.appendChild(resultDiv));
};

document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('fileInput');
    const processButton = document.getElementById('processButton');
    const imagePreview = document.getElementById('imagePreview');
    const results = document.getElementById('results');
    const loadingSpinner = document.getElementById('loadingSpinner');    const processFile = async (file) => {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/barcode/process', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error);
            }

            const card = createCard();
            showImagePreview(card, file);
            processBarcodeResults(card, data);
            return card;

        } catch (error) {
            console.error('Error processing file:', error);
            const errorCard = createCard();
            errorCard.appendChild(showError(`Error processing ${file.name}: ${error.message}`));
            return errorCard;
        }
    };

    processButton.addEventListener('click', async function() {
        const files = fileInput.files;
        if (files.length === 0) {
            alert('Please select files to process');
            return;
        }

        loadingSpinner.style.display = 'block';
        imagePreview.innerHTML = '';
        results.innerHTML = '';        try {
            const processPromises = Array.from(files).map(processFile);
            const processedCards = await Promise.all(processPromises);
            processedCards.forEach(card => results.appendChild(card));
        } catch (error) {
            console.error('Error processing files:', error);
            const errorCard = createCard();
            errorCard.appendChild(showError('Error processing files: ' + error.message));
            results.appendChild(errorCard);
        } finally {
            loadingSpinner.style.display = 'none';
        }
    });    // Preview selected images
    fileInput.addEventListener('change', function() {
        imagePreview.innerHTML = '';
        const files = this.files;

        Array.from(files)
            .filter(file => file.type.startsWith('image/'))
            .forEach(file => {
                const card = createCard();
                showImagePreview(card, file);
                imagePreview.appendChild(card);
            });
    });

    // Support drag and drop
    const dropZone = document.querySelector('.upload-section');
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
    });

    dropZone.addEventListener('dragover', () => dropZone.classList.add('dragover'));
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    
    dropZone.addEventListener('drop', (e) => {
        dropZone.classList.remove('dragover');
        fileInput.files = e.dataTransfer.files;
        const event = new Event('change');
        fileInput.dispatchEvent(event);
    });
});
