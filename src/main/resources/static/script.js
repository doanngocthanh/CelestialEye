// Tab functionality
function openTab(evt, tabName) {
    var i, tabcontent, tablinks;
    
    // Hide all tab content
    tabcontent = document.getElementsByClassName("tab-content");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].classList.remove("active");
    }
    
    // Remove active class from all tab buttons
    tablinks = document.getElementsByClassName("tab-button");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].classList.remove("active");
    }
    
    // Show selected tab and mark button as active
    document.getElementById(tabName).classList.add("active");
    evt.currentTarget.classList.add("active");
}

// File input handling
document.getElementById('model-file').addEventListener('change', function(e) {
    const file = e.target.files[0];
    const fileInfo = document.getElementById('file-info');
    
    if (file) {
        const size = (file.size / (1024 * 1024)).toFixed(2);
        fileInfo.innerHTML = `
            <i class="fas fa-file"></i> 
            <strong>${file.name}</strong> (${size} MB)
        `;
        fileInfo.classList.add('show');
    } else {
        fileInfo.classList.remove('show');
    }
});

document.getElementById('image-file').addEventListener('change', function(e) {
    const file = e.target.files[0];
    const preview = document.getElementById('image-preview');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `
                <img src="${e.target.result}" alt="Image preview">
                <p><i class="fas fa-image"></i> ${file.name}</p>
            `;
            preview.classList.add('show');
        };
        reader.readAsDataURL(file);
    } else {
        preview.classList.remove('show');
    }
});

// Upload model form
document.getElementById('upload-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = new FormData();
    const name = document.getElementById('model-name').value;
    const description = document.getElementById('model-description').value;
    const file = document.getElementById('model-file').files[0];
    
    if (!file) {
        showResult('upload-result', 'Please select an ONNX file', 'error');
        return;
    }
    
    formData.append('name', name);
    formData.append('description', description);
    formData.append('file', file);
    
    const resultDiv = document.getElementById('upload-result');
    resultDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading model...';
    resultDiv.className = 'result show';
      fetch('/api/models/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        console.log('Upload response status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('Upload response data:', data);
        if (data.success) {
            showResult('upload-result', `Model "${data.modelName}" uploaded successfully!`, 'success');
            document.getElementById('upload-form').reset();
            document.getElementById('file-info').classList.remove('show');
            loadModelsForSelect(); // Refresh model list in detection tab
        } else {
            showResult('upload-result', data.message || 'Upload failed', 'error');
        }
    })
    .catch(error => {
        console.error('Upload error:', error);
        showResult('upload-result', 'Upload failed: ' + error.message, 'error');
    });
});

// Detection form
document.getElementById('detection-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const modelName = document.getElementById('model-select').value;
    const imageFile = document.getElementById('image-file').files[0];
    
    if (!modelName) {
        showResult('detection-result', 'Please select a model', 'error');
        return;
    }
    
    if (!imageFile) {
        showResult('detection-result', 'Please select an image', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('image', imageFile);
    
    const resultDiv = document.getElementById('detection-result');
    resultDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Detecting objects...';
    resultDiv.className = 'result show';
      fetch(`/api/detection/detect/${modelName}`, {
        method: 'POST',
        body: formData
    })
    .then(response => {
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        return response.json();
    })
    .then(data => {
        console.log('Response data:', data);
        if (data.success) {
            displayDetectionResults(data);
        } else {
            showResult('detection-result', data.message || 'Detection failed', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showResult('detection-result', 'Detection failed: ' + error.message, 'error');
    });
});

// Load models list
function loadModels() {
    const modelsListDiv = document.getElementById('models-list');
    modelsListDiv.innerHTML = '<div class="loading">Loading models...</div>';
      fetch('/api/models/list')
    .then(response => {
        console.log('Load models response status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('Load models response data:', data);
        if (data.success && data.models) {
            displayModels(data.models);
        } else {
            modelsListDiv.innerHTML = '<p>No models found</p>';
        }
    })
    .catch(error => {
        console.error('Error loading models:', error);
        modelsListDiv.innerHTML = '<p>Error loading models: ' + error.message + '</p>';
    });
}

// Display models in list
function displayModels(models) {
    const modelsListDiv = document.getElementById('models-list');
    
    if (models.length === 0) {
        modelsListDiv.innerHTML = '<p>No models uploaded yet</p>';
        return;
    }
    
    let html = '';
    models.forEach(model => {
        html += `
            <div class="model-item">
                <div class="model-header">
                    <div class="model-name">
                        <i class="fas fa-brain"></i> ${model.name}
                    </div>
                    <div class="model-size">${formatFileSize(model.fileSize)}</div>
                </div>
                <div class="model-description">${model.description || 'No description'}</div>
                <div class="model-meta">
                    <i class="fas fa-calendar"></i> Uploaded: ${formatDate(model.uploadTime)}
                    <br>
                    <i class="fas fa-file"></i> File: ${model.fileName}
                    <br>
                    <i class="fas fa-info-circle"></i> Status: ${model.status}
                </div>
            </div>
        `;
    });
    
    modelsListDiv.innerHTML = html;
}

// Load models for select dropdown
function loadModelsForSelect() {
    const select = document.getElementById('model-select');
    const currentValue = select.value;
    
    fetch('/api/models/list')
    .then(response => response.json())
    .then(data => {
        if (data.success && data.models) {
            select.innerHTML = '<option value="">Choose a model...</option>';
            data.models.forEach(model => {
                const option = document.createElement('option');
                option.value = model.name;
                option.textContent = model.name;
                if (model.name === currentValue) {
                    option.selected = true;
                }
                select.appendChild(option);
            });
        }
    })
    .catch(error => {
        console.error('Error loading models for select:', error);
    });
}

// Configuration functions
function loadModelsForConfig() {
    fetch('/api/models/list')
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById('config-model-select');
            select.innerHTML = '<option value="">Choose a model...</option>';
            
            if (data.success && data.models) {
                data.models.forEach(model => {
                    const option = document.createElement('option');
                    option.value = model.name;
                    option.textContent = `${model.name} (${model.fileName})`;
                    select.appendChild(option);
                });
                showResult('config-result', 'Models loaded successfully', 'success');
            } else {
                showResult('config-result', 'Failed to load models', 'error');
            }
        })
        .catch(error => {
            console.error('Error loading models:', error);
            showResult('config-result', 'Error loading models: ' + error.message, 'error');
        });
}

function loadCurrentClassNames() {
    const modelName = document.getElementById('config-model-select').value;
    const configDiv = document.getElementById('class-names-config');
    
    if (!modelName) {
        configDiv.style.display = 'none';
        return;
    }
    
    configDiv.style.display = 'block';
    
    // For now, show placeholder since we don't have an endpoint to get current class names
    // In a real implementation, you'd fetch current class names from the server
    document.getElementById('current-class-names').innerHTML = 
        '<div class="class-name">Current class names will be shown here after first detection</div>';
}

function updateClassNames() {
    const modelName = document.getElementById('config-model-select').value;
    const newClassNamesText = document.getElementById('new-class-names').value;
    
    if (!modelName) {
        showResult('config-result', 'Please select a model first', 'error');
        return;
    }
    
    if (!newClassNamesText.trim()) {
        showResult('config-result', 'Please enter class names', 'error');
        return;
    }
    
    // Parse class names (one per line)
    const classNames = newClassNamesText.trim().split('\n')
        .map(name => name.trim())
        .filter(name => name.length > 0);
    
    if (classNames.length === 0) {
        showResult('config-result', 'No valid class names found', 'error');
        return;
    }
    
    // Send update request
    fetch(`/api/detection/models/${modelName}/class-names`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            classNames: classNames
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showResult('config-result', 
                `Class names updated successfully for model "${modelName}".\n` +
                `Updated ${classNames.length} class names: ${classNames.join(', ')}`, 
                'success');
            
            // Update current class names display
            const currentDisplay = document.getElementById('current-class-names');
            currentDisplay.innerHTML = classNames.map(name => 
                `<span class="class-name">${name}</span>`
            ).join('');
        } else {
            showResult('config-result', 'Failed to update class names: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error updating class names:', error);
        showResult('config-result', 'Error updating class names: ' + error.message, 'error');
    });
}

// Display detection results
function displayDetectionResults(data) {
    const resultDiv = document.getElementById('detection-result');
    
    if (!data.success || !data.detections) {
        showResult('detection-result', 'No detection data received', 'error');
        return;
    }
    
    const detections = data.detections;
    let resultHtml = `
        <div class="detection-summary">
            <h3><i class="fas fa-search"></i> Detection Results</h3>
            <div class="detection-info">
                <div class="info-item">
                    <strong>Model:</strong> ${data.modelName || 'Unknown'}
                </div>
                <div class="info-item">
                    <strong>Image:</strong> ${data.imageName || 'Unknown'}
                </div>
                <div class="info-item">
                    <strong>Size:</strong> ${data.imageWidth || 0} x ${data.imageHeight || 0}
                </div>
                <div class="info-item">
                    <strong>Processing Time:</strong> ${data.processingTime || 0}ms
                </div>
                <div class="info-item">
                    <strong>Objects Found:</strong> ${detections.length}
                </div>
            </div>
        </div>
    `;
    
    if (detections.length > 0) {
        resultHtml += `
            <div class="detections-list">
                <h4>Detected Objects:</h4>
        `;
        
        detections.forEach((detection, index) => {
            const confidence = (detection.confidence * 100).toFixed(1);
            const bbox = `[${Math.round(detection.x1)}, ${Math.round(detection.y1)}, ${Math.round(detection.x2)}, ${Math.round(detection.y2)}]`;
            
            resultHtml += `
                <div class="detection-item">
                    <div class="detection-header">
                        <span class="detection-class">${detection.className || 'Unknown'}</span>
                        <span class="detection-confidence">${confidence}%</span>
                    </div>
                    <div class="detection-details">
                        <small>Class ID: ${detection.classId}, BBox: ${bbox}</small>
                    </div>
                </div>
            `;
        });
        
        resultHtml += '</div>';
    } else {
        resultHtml += `
            <div class="no-detections">
                <i class="fas fa-info-circle"></i>
                No objects detected in the image.
            </div>
        `;
    }
    
    resultDiv.innerHTML = resultHtml;
    resultDiv.className = 'result show success';
}

// OCR functionality
document.getElementById('ocr-image-file').addEventListener('change', function(e) {
    const file = e.target.files[0];
    const preview = document.getElementById('ocr-image-preview');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `
                <img src="${e.target.result}" alt="Image preview">
                <p><i class="fas fa-image"></i> ${file.name}</p>
            `;
            preview.classList.add('show');
        };
        reader.readAsDataURL(file);
    } else {
        preview.classList.remove('show');
    }
});

// Load jsQR library dynamically for QR code decoding
function loadJsQRLibrary() {
    return new Promise((resolve, reject) => {
        if (window.jsQR) {
            resolve(window.jsQR);
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
        script.onload = () => resolve(window.jsQR);
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Decode QR code from image data
async function decodeQRCode(imageData) {
    try {
        const jsQR = await loadJsQRLibrary();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        ctx.putImageData(imageData, 0, 0);
        
        const imageDataForQR = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageDataForQR.data, imageDataForQR.width, imageDataForQR.height);
        
        return code ? code.data : null;
    } catch (error) {
        console.error('Error decoding QR code:', error);
        return null;
    }
}

// Enhanced function to crop image and decode QR if applicable
async function cropAndProcessImage(img, boundingBox, className) {
    return new Promise(async (resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size to the cropping area
        canvas.width = boundingBox.width;
        canvas.height = boundingBox.height;
        
        // Draw the cropped portion
        ctx.drawImage(
            img,
            boundingBox.x1, boundingBox.y1, // Source x, y
            boundingBox.width, boundingBox.height, // Source width, height
            0, 0, // Destination x, y
            boundingBox.width, boundingBox.height // Destination width, height
        );
        
        const croppedImageUrl = canvas.toDataURL('image/jpeg', 0.8);
        let qrCodeData = null;
        
        // If it's a QR code, try to decode it
        if (className === 'qr_code') {
            try {
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                qrCodeData = await decodeQRCode(imageData);
            } catch (error) {
                console.error('Error processing QR code:', error);
            }
        }
        
        resolve({
            imageUrl: croppedImageUrl,
            qrData: qrCodeData
        });
    });
}

// Global variable to store original image for cropping
let originalImage = null;

// Function to load image from file
function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();
        
        reader.onload = function(e) {
            img.onload = function() {
                resolve(img);
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// OCR form submission
document.getElementById('ocr-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = new FormData();
    const imageFile = document.getElementById('ocr-image-file').files[0];
    const modelName = document.getElementById('ocr-model-select').value;
    
    if (!imageFile) {
        showResult('ocr-result', 'Please select an image file.', 'error');
        return;
    }
    
    if (!modelName) {
        showResult('ocr-result', 'Please select a model.', 'error');
        return;
    }
    
    formData.append('image', imageFile);
    
    showResult('ocr-result', '<i class="fas fa-spinner fa-spin"></i> Processing OCR detection...', 'loading');
    
    // Load original image for cropping
    loadImageFromFile(imageFile)
        .then(img => {
            originalImage = img;
            console.log('Original image loaded:', img.width + 'x' + img.height);
            
            return fetch(`/api/ocr/detect/${modelName}`, {
                method: 'POST',
                body: formData
            });
        })
        .then(response => response.json())
        .then(data => {
            console.log('OCR Response:', data); // Debug log
            if (data.success) {
                console.log('OCR Data:', data.data); // Debug log
                displayOcrResults(data.data);
            } else {
                showResult('ocr-result', `Error: ${data.error}`, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showResult('ocr-result', `Error: ${error.message}`, 'error');
        });
});

// Load models for OCR
function loadOcrModels() {
    fetch('/api/models/list')
        .then(response => response.json())
        .then(data => {
            console.log('OCR Models response:', data); // Debug log
            
            const select = document.getElementById('ocr-model-select');
            select.innerHTML = '<option value="">Select a YOLO model for object detection</option>';
            
            if (data.success && data.models && Array.isArray(data.models)) {
                data.models.forEach(model => {
                    const option = document.createElement('option');
                    option.value = model.name;
                    option.textContent = `${model.name} (${formatFileSize(model.fileSize)})`;
                    select.appendChild(option);
                });
            } else {
                console.warn('No models data available or invalid format:', data);
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'No models available';
                select.appendChild(option);
            }
        })
        .catch(error => {
            console.error('Error loading models:', error);
            const select = document.getElementById('ocr-model-select');
            select.innerHTML = '<option value="">Error loading models</option>';
        });
}

// Display OCR results
async function displayOcrResults(data) {
    console.log('DisplayOcrResults called with data:', data); // Debug log
    
    const resultDiv = document.getElementById('ocr-result');
    
    // Check if data is valid
    if (!data) {
        console.error('No data provided to displayOcrResults');
        showResult('ocr-result', 'No data received from server', 'error');
        return;
    }
    
    let html = `
        <div class="text-result-summary">
            <h4><i class="fas fa-font"></i> OCR Detection Results</h4>
            <p><strong>Model:</strong> ${data.modelName || 'Unknown'}</p>
            <p><strong>Image:</strong> ${data.imageInfo || 'Unknown'}</p>
            <p><strong>Total Detections:</strong> ${data.totalDetections || 0}</p>
            <div class="processing-time">Processing time: ${data.processingTimeMs || 0}ms</div>
        </div>
    `;
      console.log('OCR Results array:', data.results); // Debug log
    
    // Check if server parsed CCCD information
    if (data.cccdInfo) {
        html += `
            <div class="cccd-info">
                <h4><i class="fas fa-id-card"></i> Thông tin căn cước công dân (Parsed from OCR)</h4>
                <div class="cccd-fields">
        `;
        
        if (data.cccdInfo.id) {
            html += `
                <div class="cccd-field">
                    <label>Số căn cước:</label>
                    <span class="cccd-value">${data.cccdInfo.id}</span>
                </div>
            `;
        }
        
        if (data.cccdInfo.oldIdNumber) {
            html += `
                <div class="cccd-field">
                    <label>Số CMND cũ:</label>
                    <span class="cccd-value">${data.cccdInfo.oldIdNumber}</span>
                </div>
            `;
        }
        
        if (data.cccdInfo.name) {
            html += `
                <div class="cccd-field">
                    <label>Họ và tên:</label>
                    <span class="cccd-value">${data.cccdInfo.name}</span>
                </div>
            `;
        }
        
        if (data.cccdInfo.birth) {
            html += `
                <div class="cccd-field">
                    <label>Ngày sinh:</label>
                    <span class="cccd-value">${data.cccdInfo.birth}</span>
                </div>
            `;
        }
        
        if (data.cccdInfo.sex) {
            html += `
                <div class="cccd-field">
                    <label>Giới tính:</label>
                    <span class="cccd-value">${data.cccdInfo.sex}</span>
                </div>
            `;
        }
        
        if (data.cccdInfo.nationality) {
            html += `
                <div class="cccd-field">
                    <label>Quốc tịch:</label>
                    <span class="cccd-value">${data.cccdInfo.nationality}</span>
                </div>
            `;
        }
        
        if (data.cccdInfo.place_of_origin) {
            html += `
                <div class="cccd-field">
                    <label>Quê quán:</label>
                    <span class="cccd-value">${data.cccdInfo.place_of_origin}</span>
                </div>
            `;
        }
        
        if (data.cccdInfo.place_of_residence) {
            html += `
                <div class="cccd-field">
                    <label>Nơi thường trú:</label>
                    <span class="cccd-value">${data.cccdInfo.place_of_residence}</span>
                </div>
            `;
        }
        
        if (data.cccdInfo.issueDate) {
            html += `
                <div class="cccd-field">
                    <label>Ngày cấp:</label>
                    <span class="cccd-value">${data.cccdInfo.issueDate}</span>
                </div>
            `;
        }
        
        if (data.cccdInfo.expiry) {
            html += `
                <div class="cccd-field">
                    <label>Ngày hết hạn:</label>
                    <span class="cccd-value">${data.cccdInfo.expiry}</span>
                </div>
            `;
        }
        
        if (data.cccdInfo.issuePlace) {
            html += `
                <div class="cccd-field">
                    <label>Nơi cấp:</label>
                    <span class="cccd-value">${data.cccdInfo.issuePlace}</span>
                </div>
            `;
        }
        
        html += `
                </div>
            </div>
        `;
    }
    
    if (data.results && Array.isArray(data.results) && data.results.length > 0) {
        // Check if this looks like CCCD data for organized display (fallback for old logic)
        const cccdFields = organizeCCCDFields(data.results);
        
        if (cccdFields.length > 0 && !data.cccdInfo) { // Only show if server didn't parse CCCD
            html += `
                <div class="cccd-organized">
                    <h4><i class="fas fa-id-card"></i> CCCD Information (Client-side parsed)</h4>
                    <div class="cccd-fields">
            `;cccdFields.forEach(field => {
                html += `
                    <div class="cccd-field">
                        <div class="cccd-field-label">${field.label}:</div>
                        <div class="cccd-field-value">${field.value}</div>
                        <div class="cccd-field-confidence">
                            Confidence: ${(field.confidence * 100).toFixed(1)}%
                            ${field.multiPart ? `<span class="multi-part-info"> (${field.partCount} parts combined)</span>` : ''}
                        </div>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        }
          // Always show detailed detection results
        html += `
            <div class="ocr-detailed">
                <h4><i class="fas fa-list"></i> Detailed Detection Results</h4>
        `;
        
        // Process results and crop images for qr_code and portrait
        for (let index = 0; index < data.results.length; index++) {
            const result = data.results[index];
            console.log(`Processing result ${index}:`, result); // Debug log
            
            const className = result.className || 'Unknown';
            const isImageType = className === 'qr_code' || className === 'portrait';
            
            html += `
                <div class="ocr-region" id="ocr-region-${index}">
                    <div class="ocr-region-header">
                        <span class="ocr-region-class">${className}</span>
                        <span class="ocr-region-confidence">Confidence: ${(result.confidence * 100).toFixed(1)}%</span>
                    </div>
            `;
            
            if (isImageType && originalImage && result.boundingBox) {
                // Create placeholder for cropped image
                html += `
                    <div class="ocr-region-image" id="cropped-image-${index}">
                        <div class="loading-crop">
                            <i class="fas fa-spinner fa-spin"></i> Cropping ${className}...
                        </div>
                    </div>
                `;
            } else {
                // Display text for other types
                html += `
                    <div class="ocr-region-text">${result.text || '[No text detected]'}</div>
                `;
            }
             
            html += `
                    <div class="ocr-region-bbox">
                        Bounding Box: (${Math.round(result.boundingBox.x1)}, ${Math.round(result.boundingBox.y1)}) - 
                        (${Math.round(result.boundingBox.x2)}, ${Math.round(result.boundingBox.y2)})
                        [${result.boundingBox.width} x ${result.boundingBox.height}]
                    </div>
                </div>
            `;
        }
        
        html += '</div>';
    } else {
        html += '<div class="no-results">No text detected in any regions.</div>';
        console.log('No results found or results is not an array'); // Debug log
    }
    
    resultDiv.innerHTML = html;
      // Now crop and display images for qr_code and portrait
    if (data.results && Array.isArray(data.results) && originalImage) {
        for (let index = 0; index < data.results.length; index++) {
            const result = data.results[index];
            const className = result.className || 'Unknown';
            const isImageType = className === 'qr_code' || className === 'portrait';
            
            if (isImageType && result.boundingBox) {
                try {
                    const processedImage = await cropAndProcessImage(originalImage, result.boundingBox, className);
                    const imageContainer = document.getElementById(`cropped-image-${index}`);
                    
                    if (imageContainer) {
                        let imageHtml = `
                            <img src="${processedImage.imageUrl}" 
                                 alt="${className}" 
                                 style="max-width: 200px; max-height: 200px; border: 1px solid #ddd; border-radius: 4px;">
                            <div class="crop-info">Cropped ${className}</div>
                        `;
                        
                        // Add QR code data if available
                        if (className === 'qr_code' && processedImage.qrData) {
                            imageHtml += `
                                <div class="qr-decoded-data">
                                    <strong>QR Code Data:</strong>
                                    <div class="qr-content">${processedImage.qrData}</div>
                                </div>
                            `;
                        } else if (className === 'qr_code') {
                            imageHtml += `
                                <div class="qr-decode-failed">
                                    <em>QR code could not be decoded</em>
                                </div>
                            `;
                        }
                        
                        imageContainer.innerHTML = imageHtml;
                    }
                } catch (error) {
                    console.error(`Error cropping image for ${className}:`, error);
                    const imageContainer = document.getElementById(`cropped-image-${index}`);
                    if (imageContainer) {
                        imageContainer.innerHTML = `<div class="crop-error">Error cropping ${className}</div>`;
                    }
                }
            }
        }
    }
    
    resultDiv.className = 'result show success';
    console.log('OCR results displayed successfully'); // Debug log
}

// Function to organize CCCD fields from detection results
function organizeCCCDFields(results) {
    const cccdFields = [];
    
    // Map class names to human-readable labels
    const fieldLabels = {
        'id_number': 'ID Number',
        'full_name': 'Full Name', 
        'birth_date': 'Date of Birth',
        'gender': 'Gender',
        'nationality': 'Nationality',
        'place_of_origin': 'Place of Origin',
        'place_of_residence': 'Place of Residence',
        'expiry_date': 'Expiry Date',
        'issue_date': 'Issue Date'
    };
      // Group results by className to handle multiple detections for same field
    const groupedResults = {};
    
    results.forEach(result => {
        if (result.className && fieldLabels[result.className] && result.text && result.text.trim()) {
            if (!groupedResults[result.className]) {
                groupedResults[result.className] = [];
            }
            groupedResults[result.className].push({
                text: result.text.trim(),
                confidence: result.confidence,
                boundingBox: result.boundingBox
            });
        }
    });
    
    console.log('Grouped CCCD results:', groupedResults); // Debug log
    
    // Process each field type
    Object.keys(groupedResults).forEach(className => {
        const detections = groupedResults[className];
        
        console.log(`Processing ${className}: ${detections.length} detections`); // Debug log
        
        if (detections.length === 1) {
            // Single detection - use as is
            cccdFields.push({
                label: fieldLabels[className],
                value: detections[0].text,
                confidence: detections[0].confidence,
                className: className
            });
        } else {
            // Multiple detections - combine them
            // Sort by Y position (top to bottom) then X position (left to right)
            detections.sort((a, b) => {
                const yDiff = a.boundingBox.y1 - b.boundingBox.y1;
                if (Math.abs(yDiff) < 10) { // Same line tolerance
                    return a.boundingBox.x1 - b.boundingBox.x1; // Sort by X
                }
                return yDiff; // Sort by Y
            });
            
            // Combine text with appropriate separator
            const combinedText = detections.map(d => d.text).join(' ');
            const avgConfidence = detections.reduce((sum, d) => sum + d.confidence, 0) / detections.length;
            
            cccdFields.push({
                label: fieldLabels[className],
                value: combinedText,
                confidence: avgConfidence,
                className: className,
                multiPart: true,
                partCount: detections.length
            });
            
            console.log(`Combined ${detections.length} parts for ${className}: "${combinedText}"`);
        }
    });
    
    // Sort fields in a logical order
    const fieldOrder = ['id_number', 'full_name', 'birth_date', 'gender', 'nationality', 'place_of_origin', 'place_of_residence', 'issue_date', 'expiry_date'];
    cccdFields.sort((a, b) => {
        const aIndex = fieldOrder.indexOf(a.className);
        const bIndex = fieldOrder.indexOf(b.className);
        return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    });
    
    return cccdFields;
}

// Utility function to show results with styling
function showResult(elementId, message, type) {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error('Element not found:', elementId);
        return;
    }
    
    element.innerHTML = message;
    element.className = `result show ${type}`;
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            element.classList.remove('show');
        }, 5000);
    }
}

// Utility function to format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Utility function to format date
function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date';
        
        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        };
        
        return date.toLocaleDateString('en-US', options);
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Invalid Date';
    }
}

// Load models on page load
document.addEventListener('DOMContentLoaded', function() {
    // Load models on page load
    loadModels();
    loadModelsForSelect();
    loadOcrModels();
    
    // Load workflows
    loadWorkflows();
    
    // Auto-refresh models list every 30 seconds
    setInterval(() => {
        loadModelsForSelect();
        loadOcrModels();
    }, 30000);
    
    // Load models for configuration
    loadModelsForConfig();
    
    // Setup QR Code form listener
    setupQrCodeForm();
    
    // Setup QR Code image preview
    setupQrCodeImagePreview();
    
    // Setup Workflow forms
    setupWorkflowExecutionForm();
    setupWorkflowCreationForm();
});

// Setup QR Code form
function setupQrCodeForm() {
    const qrForm = document.getElementById('qrcode-form');
    if (qrForm) {
        // Remove any existing listeners to prevent duplicates
        const newForm = qrForm.cloneNode(true);
        qrForm.parentNode.replaceChild(newForm, qrForm);
        
        newForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData();
            const imageFile = document.getElementById('qrcode-image-file').files[0];
            
            if (!imageFile) {
                showResult('qrcode-result', 'Please select an image file.', 'error');
                return;
            }
            
            formData.append('image', imageFile);
            
            showResult('qrcode-result', '<i class="fas fa-spinner fa-spin"></i> Processing QR code detection...', 'loading');
            
            fetch('/api/qrcode/detect', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                console.log('QR Code Response:', data);
                if (data.success) {
                    displayQrCodeResults(data.data);
                } else {
                    showResult('qrcode-result', `Error: ${data.error}`, 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showResult('qrcode-result', `Error: ${error.message}`, 'error');
            });
        });
    } else {
        console.warn('QR Code form not found');
    }
}

// Setup QR Code image preview
function setupQrCodeImagePreview() {
    const qrImageFile = document.getElementById('qrcode-image-file');
    if (qrImageFile) {
        // Remove any existing listeners to prevent duplicates
        const newInput = qrImageFile.cloneNode(true);
        qrImageFile.parentNode.replaceChild(newInput, qrImageFile);
        
        newInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            const preview = document.getElementById('qrcode-image-preview');
            
            if (file && preview) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    preview.innerHTML = `
                        <img src="${e.target.result}" alt="Preview" style="max-width: 300px; max-height: 200px;">
                        <p>File: ${file.name} (${formatFileSize(file.size)})</p>
                    `;
                };
                reader.readAsDataURL(file);
            } else if (preview) {
                preview.innerHTML = '';
            }
        });
    } else {
        console.warn('QR Code image file input not found');
    }
}

// Display QR Code results
function displayQrCodeResults(data) {
    console.log('DisplayQrCodeResults called with data:', data);
    
    const resultDiv = document.getElementById('qrcode-result');
    
    if (!data) {
        console.error('No data provided to displayQrCodeResults');
        showResult('qrcode-result', 'No data received from server', 'error');
        return;
    }
    
    let html = `
        <div class="qrcode-result-summary">
            <h4><i class="fas fa-qrcode"></i> QR Code Detection Results</h4>
            <p><strong>Image:</strong> ${data.imageInfo || 'Unknown'}</p>
            <p><strong>Total QR Codes:</strong> ${data.totalQrCodes || 0}</p>
            <div class="processing-time">Processing time: ${data.processingTimeMs || 0}ms</div>
        </div>
    `;
    
    if (data.qrCodes && Array.isArray(data.qrCodes) && data.qrCodes.length > 0) {
        html += `
            <div class="qrcode-detailed">
                <h4><i class="fas fa-list"></i> Detected QR Codes</h4>
        `;
          data.qrCodes.forEach((qrCode, index) => {
            console.log(`Processing QR code ${index}:`, qrCode);
            
            html += `
                <div class="qrcode-item">
                    <div class="qrcode-header">
                        <span class="qrcode-number">QR Code #${index + 1}</span>
                        <span class="qrcode-type">${qrCode.type || 'TEXT'}</span>
                        <span class="qrcode-confidence">Confidence: ${(qrCode.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <div class="qrcode-content">
                        <strong>Content:</strong>
                        <div class="qrcode-text">${qrCode.content || '[No content]'}</div>
                    </div>
            `;
              // If this is CCCD information, display parsed fields
            if (qrCode.type === 'CCCD' && qrCode.cccdInfo) {
                html += `
                    <div class="cccd-info">
                        <h5><i class="fas fa-id-card"></i> Thông tin căn cước công dân</h5>
                        <div class="cccd-fields">
                            <div class="cccd-field">
                                <label>Số căn cước:</label>
                                <span class="cccd-value">${qrCode.cccdInfo.id || 'N/A'}</span>
                            </div>
                            ${qrCode.cccdInfo.oldIdNumber ? `
                            <div class="cccd-field">
                                <label>Số CMND cũ:</label>
                                <span class="cccd-value">${qrCode.cccdInfo.oldIdNumber}</span>
                            </div>` : ''}
                            <div class="cccd-field">
                                <label>Họ và tên:</label>
                                <span class="cccd-value">${qrCode.cccdInfo.name || 'N/A'}</span>
                            </div>
                            <div class="cccd-field">
                                <label>Ngày sinh:</label>
                                <span class="cccd-value">${qrCode.cccdInfo.birth || 'N/A'}</span>
                            </div>
                            <div class="cccd-field">
                                <label>Giới tính:</label>
                                <span class="cccd-value">${qrCode.cccdInfo.sex || 'N/A'}</span>
                            </div>
                            <div class="cccd-field">
                                <label>Quốc tịch:</label>
                                <span class="cccd-value">${qrCode.cccdInfo.nationality || 'N/A'}</span>
                            </div>
                            ${qrCode.cccdInfo.place_of_origin ? `
                            <div class="cccd-field">
                                <label>Quê quán:</label>
                                <span class="cccd-value">${qrCode.cccdInfo.place_of_origin}</span>
                            </div>` : ''}
                            <div class="cccd-field">
                                <label>Nơi thường trú:</label>
                                <span class="cccd-value">${qrCode.cccdInfo.place_of_residence || 'N/A'}</span>
                            </div>
                            <div class="cccd-field">
                                <label>Ngày cấp:</label>
                                <span class="cccd-value">${qrCode.cccdInfo.issueDate || 'N/A'}</span>
                            </div>
                            ${qrCode.cccdInfo.expiry ? `
                            <div class="cccd-field">
                                <label>Ngày hết hạn:</label>
                                <span class="cccd-value">${qrCode.cccdInfo.expiry}</span>
                            </div>` : ''}
                            ${qrCode.cccdInfo.issuePlace ? `
                            <div class="cccd-field">
                                <label>Nơi cấp:</label>
                                <span class="cccd-value">${qrCode.cccdInfo.issuePlace}</span>
                            </div>` : ''}
                        </div>
                    </div>
                `;
            }
            
            html += `
                    <div class="qrcode-bbox">
                        Bounding Box: (${Math.round(qrCode.boundingBox.x)}, ${Math.round(qrCode.boundingBox.y)}) - 
                        Size: ${Math.round(qrCode.boundingBox.width)} x ${Math.round(qrCode.boundingBox.height)}
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
    } else {
        html += '<div class="no-results">No QR codes detected in the image.</div>';
    }
    
    resultDiv.innerHTML = html;
    resultDiv.className = 'result show success';
    console.log('QR code results displayed successfully');
}

// Workflow Management Functions

/**
 * Load all workflows
 */
function loadWorkflows() {
    const workflowsList = document.getElementById('workflows-list');
    workflowsList.innerHTML = '<div class="loading">Loading workflows...</div>';
    
    fetch('/api/workflows')
    .then(response => response.json())
    .then(data => {
        console.log('Workflows loaded:', data);
        if (data.success && data.workflows) {
            displayWorkflows(data.workflows);
            loadWorkflowsForSelect(data.workflows);
        } else {
            workflowsList.innerHTML = '<p>No workflows found</p>';
        }
    })
    .catch(error => {
        console.error('Error loading workflows:', error);
        workflowsList.innerHTML = '<p>Error loading workflows: ' + error.message + '</p>';
    });
}

/**
 * Display workflows in the list
 */
function displayWorkflows(workflows) {
    const workflowsList = document.getElementById('workflows-list');
    
    if (workflows.length === 0) {
        workflowsList.innerHTML = '<p>No workflows available</p>';
        return;
    }
    
    let html = '';
    workflows.forEach(workflow => {
        const stepsCount = workflow.steps ? workflow.steps.length : 0;
        const statusClass = workflow.active ? 'active' : 'inactive';
        const statusText = workflow.active ? 'Active' : 'Inactive';
        
        html += `
            <div class="workflow-item">
                <div class="workflow-header">
                    <div class="workflow-name">${workflow.name}</div>
                    <div class="workflow-status ${statusClass}">${statusText}</div>
                </div>
                <div class="workflow-description">${workflow.description || 'No description'}</div>
                <div class="workflow-steps">
                    <span>Steps: ${stepsCount}</span>
        `;
        
        if (workflow.steps) {
            workflow.steps.forEach(step => {
                html += `<span class="workflow-step-badge">${step.type}</span>`;
            });
        }
        
        html += `
                </div>
                <div class="workflow-actions">
                    <button class="btn btn-primary btn-sm" onclick="executeWorkflowById('${workflow.id}')">
                        <i class="fas fa-play"></i> Execute
                    </button>
                    <button class="btn btn-info btn-sm" onclick="viewWorkflowDetails('${workflow.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteWorkflow('${workflow.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    });
    
    workflowsList.innerHTML = html;
}

/**
 * Load workflows for select dropdown
 */
function loadWorkflowsForSelect(workflows) {
    const select = document.getElementById('workflow-select');
    const currentValue = select.value;
    
    select.innerHTML = '<option value="">Choose a workflow...</option>';
    
    if (workflows) {
        workflows.forEach(workflow => {
            if (workflow.active) {
                const option = document.createElement('option');
                option.value = workflow.id;
                option.textContent = workflow.name;
                if (workflow.id === currentValue) {
                    option.selected = true;
                }
                select.appendChild(option);
            }
        });
    }
}

/**
 * Execute workflow by ID (quick execute)
 */
function executeWorkflowById(workflowId) {
    // Set the selected workflow
    document.getElementById('workflow-select').value = workflowId;
    
    // Scroll to execution form
    document.querySelector('.workflow-section:nth-child(2)').scrollIntoView({ behavior: 'smooth' });
}

/**
 * View workflow details
 */
function viewWorkflowDetails(workflowId) {
    fetch(`/api/workflows/${workflowId}`)
    .then(response => response.json())
    .then(data => {
        if (data.success && data.workflow) {
            displayWorkflowDetails(data.workflow);
        } else {
            alert('Failed to load workflow details: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Error loading workflow details:', error);
        alert('Error loading workflow details: ' + error.message);
    });
}

/**
 * Display workflow details in a modal or alert
 */
function displayWorkflowDetails(workflow) {
    let details = `Workflow: ${workflow.name}\n`;
    details += `Description: ${workflow.description || 'No description'}\n`;
    details += `Status: ${workflow.active ? 'Active' : 'Inactive'}\n`;
    details += `Created: ${workflow.createdAt || 'Unknown'}\n`;
    details += `Steps (${workflow.steps ? workflow.steps.length : 0}):\n`;
    
    if (workflow.steps) {
        workflow.steps.forEach((step, index) => {
            details += `  ${index + 1}. ${step.name} (${step.type})\n`;
            details += `     ${step.description || 'No description'}\n`;
        });
    }
    
    alert(details);
}

/**
 * Delete workflow
 */
function deleteWorkflow(workflowId) {
    if (!confirm('Are you sure you want to delete this workflow?')) {
        return;
    }
    
    fetch(`/api/workflows/${workflowId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Workflow deleted successfully');
            loadWorkflows(); // Refresh the list
        } else {
            alert('Failed to delete workflow: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Error deleting workflow:', error);
        alert('Error deleting workflow: ' + error.message);
    });
}

/**
 * Setup workflow execution form
 */
function setupWorkflowExecutionForm() {
    const form = document.getElementById('workflow-execution-form');
    const imageFile = document.getElementById('workflow-image-file');
    const preview = document.getElementById('workflow-image-preview');
    
    // Image preview
    if (imageFile) {
        imageFile.addEventListener('change', function(e) {
            const file = e.target.files[0];
            
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    preview.innerHTML = `
                        <img src="${e.target.result}" alt="Preview" style="max-width: 300px; max-height: 200px;">
                        <p>File: ${file.name} (${formatFileSize(file.size)})</p>
                    `;
                };
                reader.readAsDataURL(file);
            } else {
                preview.innerHTML = '';
            }
        });
    }
    
    // Form submission
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const workflowId = document.getElementById('workflow-select').value;
            const imageFile = document.getElementById('workflow-image-file').files[0];
            
            if (!workflowId) {
                showResult('workflow-execution-result', 'Please select a workflow', 'error');
                return;
            }
            
            if (!imageFile) {
                showResult('workflow-execution-result', 'Please select an image file', 'error');
                return;
            }
            
            const formData = new FormData();
            formData.append('image', imageFile);
            
            showResult('workflow-execution-result', '<i class="fas fa-spinner fa-spin"></i> Executing workflow...', 'loading');
            
            fetch(`/api/workflows/${workflowId}/execute`, {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                console.log('Workflow execution result:', data);
                if (data.success) {
                    displayWorkflowExecutionResult(data.executionResult);
                } else {
                    showResult('workflow-execution-result', `Error: ${data.error}`, 'error');
                }
            })
            .catch(error => {
                console.error('Error executing workflow:', error);
                showResult('workflow-execution-result', `Error: ${error.message}`, 'error');
            });
        });
    }
}

/**
 * Display workflow execution result
 */
function displayWorkflowExecutionResult(result) {
    console.log('Displaying workflow execution result:', result);
    
    const resultDiv = document.getElementById('workflow-execution-result');
    
    let html = `
        <div class="workflow-execution-summary">
            <h4><i class="fas fa-project-diagram"></i> Workflow Execution Result</h4>
            <div class="execution-info">
                <p><strong>Workflow:</strong> ${result.workflowName}</p>
                <p><strong>Execution ID:</strong> ${result.executionId}</p>
                <p><strong>Status:</strong> <span class="workflow-step-status ${result.status}">${result.status}</span></p>
                <p><strong>Total Time:</strong> ${result.totalExecutionTimeMs}ms</p>
                <p><strong>Steps:</strong> ${result.successfulSteps} successful, ${result.failedSteps} failed, ${result.skippedSteps} skipped</p>
            </div>
        </div>
    `;
    
    if (result.stepExecutions && result.stepExecutions.length > 0) {
        html += `
            <div class="workflow-execution-steps">
                <h5><i class="fas fa-list"></i> Step Execution Details</h5>
        `;
          result.stepExecutions.forEach((step, index) => {
            html += `
                <div class="workflow-execution-step">
                    <div class="workflow-step-header">
                        <div>
                            <strong>${index + 1}. ${step.stepName}</strong> (${step.stepType})
                            <div style="font-size: 12px; color: #6c757d;">
                                ${step.executionTimeMs}ms
                            </div>
                        </div>
                        <div class="workflow-step-status ${step.status}">${step.status}</div>
                    </div>
            `;
            
            // Show error message if step failed
            if (step.errorMessage) {
                html += `
                    <div class="step-error-message">
                        <i class="fas fa-exclamation-triangle"></i> Error: ${step.errorMessage}
                    </div>
                `;
            }
            
            // Show input summary
            if (step.input) {
                html += `
                    <div class="step-data-section">
                        <h6><i class="fas fa-arrow-down"></i> Input</h6>
                        <div class="step-data-content">
                            ${formatStepData(step.input)}
                        </div>
                    </div>
                `;
            }
            
            // Show output summary if step was successful
            if (step.status === 'SUCCESS' && step.output) {
                html += `
                    <div class="step-data-section">
                        <h6><i class="fas fa-arrow-up"></i> Output</h6>
                        <div class="step-data-content">
                            ${formatStepData(step.output)}
                        </div>
                    </div>
                `;
            }
            
            html += '</div>';
        });
        
        html += '</div>';
    }
    
    // Display final output if available
    if (result.finalOutput) {
        html += `
            <div class="workflow-final-output">
                <h5><i class="fas fa-flag-checkered"></i> Final Output</h5>
                <pre style="background: #f8f9fa; padding: 10px; border-radius: 4px; max-height: 300px; overflow: auto;">
                    ${JSON.stringify(result.finalOutput, null, 2)}
                </pre>
            </div>
        `;
    }
    
    resultDiv.innerHTML = html;
    resultDiv.className = 'result show success';
}

/**
 * Add workflow step to creation form
 */
function addWorkflowStep() {
    const container = document.getElementById('workflow-steps-container');
    const stepIndex = container.children.length;
    
    const stepHtml = `
        <div class="workflow-step-item" data-step-index="${stepIndex}">
            <div class="workflow-step-header">
                <strong>Step ${stepIndex + 1}</strong>
                <div class="workflow-step-controls">
                    <button type="button" class="btn btn-danger btn-sm" onclick="removeWorkflowStep(this)">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div>
                    <label>Step Name:</label>
                    <input type="text" class="step-name" required>
                </div>
                <div>
                    <label>Step Type:</label>
                    <select class="step-type" required>
                        <option value="">Choose type...</option>
                        <option value="DETECTION">Object Detection</option>
                        <option value="OCR">OCR Text Extraction</option>
                        <option value="QR_CODE">QR Code Detection</option>
                        <option value="IMAGE_PREPROCESSING">Image Preprocessing</option>
                        <option value="VALIDATION">Data Validation</option>
                    </select>
                </div>
            </div>
            <div style="margin-top: 10px;">
                <label>Description:</label>
                <input type="text" class="step-description" placeholder="Optional description">
            </div>
            <div style="margin-top: 10px;">
                <label>Parameters (JSON):</label>
                <textarea class="step-parameters" rows="2" placeholder='{"modelName": "detect_card"}'></textarea>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', stepHtml);
}

/**
 * Remove workflow step from creation form
 */
function removeWorkflowStep(button) {
    const stepItem = button.closest('.workflow-step-item');
    stepItem.remove();
    
    // Renumber steps
    const container = document.getElementById('workflow-steps-container');
    Array.from(container.children).forEach((step, index) => {
        step.setAttribute('data-step-index', index);
        const header = step.querySelector('.workflow-step-header strong');
        if (header) {
            header.textContent = `Step ${index + 1}`;
        }
    });
}

/**
 * Setup workflow creation form
 */
function setupWorkflowCreationForm() {
    const form = document.getElementById('workflow-create-form');
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('workflow-name').value;
            const description = document.getElementById('workflow-description').value;
            
            // Collect steps
            const steps = [];
            const stepItems = document.querySelectorAll('.workflow-step-item');
            
            stepItems.forEach((stepItem, index) => {
                const stepName = stepItem.querySelector('.step-name').value;
                const stepType = stepItem.querySelector('.step-type').value;
                const stepDescription = stepItem.querySelector('.step-description').value;
                const stepParametersText = stepItem.querySelector('.step-parameters').value;
                
                let stepParameters = {};
                if (stepParametersText.trim()) {
                    try {
                        stepParameters = JSON.parse(stepParametersText);
                    } catch (e) {
                        showResult('workflow-create-result', `Invalid JSON in step ${index + 1} parameters`, 'error');
                        return;
                    }
                }
                
                steps.push({
                    id: `step${index + 1}`,
                    name: stepName,
                    type: stepType,
                    description: stepDescription,
                    parameters: stepParameters,
                    enabled: true,
                    order: index + 1
                });
            });
            
            if (steps.length === 0) {
                showResult('workflow-create-result', 'Please add at least one step', 'error');
                return;
            }
            
            const workflow = {
                name: name,
                description: description,
                steps: steps,
                active: true
            };
            
            showResult('workflow-create-result', '<i class="fas fa-spinner fa-spin"></i> Creating workflow...', 'loading');
            
            fetch('/api/workflows', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(workflow)
            })
            .then(response => response.json())
            .then(data => {
                console.log('Workflow creation result:', data);
                if (data.success) {
                    showResult('workflow-create-result', 'Workflow created successfully!', 'success');
                    form.reset();
                    document.getElementById('workflow-steps-container').innerHTML = '';
                    loadWorkflows(); // Refresh the list
                } else {
                    showResult('workflow-create-result', `Error: ${data.error}`, 'error');
                }
            })
            .catch(error => {
                console.error('Error creating workflow:', error);
                showResult('workflow-create-result', `Error: ${error.message}`, 'error');
            });
        });
    }
}

/**
 * Format step data for display
 */
function formatStepData(data) {
    if (!data) return '<em>No data</em>';
    
    let html = '';
    
    // Basic info
    html += `<div class="data-basic-info">`;
    html += `<span class="data-type">${data.type || 'Unknown'}</span>`;
    if (data.timestamp) {
        html += ` <span class="data-timestamp">${new Date(data.timestamp).toLocaleString()}</span>`;
    }
    html += `</div>`;
    
    // Type-specific details
    if (data.type === 'DetectionResult') {
        html += formatDetectionData(data);
    } else if (data.type === 'OcrDetectionResponse') {
        html += formatOcrData(data);
    } else if (data.type === 'QrCodeDetectionResponse') {
        html += formatQrCodeData(data);
    } else if (data.type === 'StandardMultipartFile') {
        html += formatFileData(data);
    } else {
        // Generic data display
        html += `<pre class="data-raw">${JSON.stringify(data, null, 2)}</pre>`;
    }
    
    return html;
}

/**
 * Format detection result data
 */
function formatDetectionData(data) {
    let html = `
        <div class="detection-summary">
            <div class="data-stat">
                <span class="stat-label">Detections:</span>
                <span class="stat-value">${data.detectionsCount || 0}</span>
            </div>
            <div class="data-stat">
                <span class="stat-label">Model:</span>
                <span class="stat-value">${data.modelName || 'Unknown'}</span>
            </div>
            <div class="data-stat">
                <span class="stat-label">Image:</span>
                <span class="stat-value">${data.imageInfo || 'Unknown'}</span>
            </div>
            <div class="data-stat">
                <span class="stat-label">Processing:</span>
                <span class="stat-value">${data.processingTime || 0}ms</span>
            </div>
        </div>
    `;
    
    if (data.detectionDetails && data.detectionDetails.length > 0) {
        html += `
            <div class="detection-details">
                <h6>Detected Objects:</h6>
                <div class="detection-items">
        `;
        
        data.detectionDetails.forEach((detection, index) => {
            html += `
                <div class="detection-item-mini">
                    <span class="detection-class">${detection.className}</span>
                    <span class="detection-confidence">${(detection.confidence * 100).toFixed(1)}%</span>
                    <span class="detection-bbox">${detection.bbox}</span>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    }
    
    return html;
}

/**
 * Format OCR result data
 */
function formatOcrData(data) {
    let html = `
        <div class="ocr-summary">
            <div class="data-stat">
                <span class="stat-label">OCR Results:</span>
                <span class="stat-value">${data.ocrResultsCount || 0}</span>
            </div>
            <div class="data-stat">
                <span class="stat-label">Model:</span>
                <span class="stat-value">${data.modelName || 'Unknown'}</span>
            </div>
            <div class="data-stat">
                <span class="stat-label">Processing:</span>
                <span class="stat-value">${data.processingTime || 0}ms</span>
            </div>
            <div class="data-stat">
                <span class="stat-label">CCCD Info:</span>
                <span class="stat-value">${data.hasCccdInfo ? 'Yes' : 'No'}</span>
            </div>
        </div>
    `;
    
    // Show CCCD info if available
    if (data.cccdInfo) {
        html += `
            <div class="cccd-summary">
                <h6><i class="fas fa-id-card"></i> CCCD Information:</h6>
                <div class="cccd-fields-mini">
                    <div class="cccd-field-mini">
                        <strong>ID:</strong> ${data.cccdInfo.id || 'N/A'}
                    </div>
                    <div class="cccd-field-mini">
                        <strong>Name:</strong> ${data.cccdInfo.name || 'N/A'}
                    </div>
                    <div class="cccd-field-mini">
                        <strong>Birth:</strong> ${data.cccdInfo.birth || 'N/A'}
                    </div>
                    <div class="cccd-field-mini">
                        <strong>Sex:</strong> ${data.cccdInfo.sex || 'N/A'}
                    </div>
                </div>
            </div>
        `;
    }
    
    if (data.ocrDetails && data.ocrDetails.length > 0) {
        html += `
            <div class="ocr-details">
                <h6>OCR Results:</h6>
                <div class="ocr-items">
        `;
        
        data.ocrDetails.forEach((ocr, index) => {
            html += `
                <div class="ocr-item-mini">
                    <span class="ocr-text">"${ocr.text}"</span>
                    <span class="ocr-class">${ocr.className}</span>
                    <span class="ocr-confidence">${(ocr.confidence * 100).toFixed(1)}%</span>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    }
    
    return html;
}

/**
 * Format QR code result data
 */
function formatQrCodeData(data) {
    let html = `
        <div class="qrcode-summary">
            <div class="data-stat">
                <span class="stat-label">QR Codes:</span>
                <span class="stat-value">${data.qrCodesCount || 0}</span>
            </div>
            <div class="data-stat">
                <span class="stat-label">Processing:</span>
                <span class="stat-value">${data.processingTime || 0}ms</span>
            </div>
            <div class="data-stat">
                <span class="stat-label">Image:</span>
                <span class="stat-value">${data.imageInfo || 'Unknown'}</span>
            </div>
        </div>
    `;
    
    if (data.qrCodeDetails && data.qrCodeDetails.length > 0) {
        html += `
            <div class="qrcode-details">
                <h6>QR Codes:</h6>
                <div class="qrcode-items">
        `;
        
        data.qrCodeDetails.forEach((qr, index) => {
            html += `
                <div class="qrcode-item-mini">
                    <span class="qrcode-type-badge">${qr.type || 'TEXT'}</span>
                    <span class="qrcode-content-preview">${qr.content ? qr.content.substring(0, 50) + (qr.content.length > 50 ? '...' : '') : 'No content'}</span>
                    <span class="qrcode-confidence">${(qr.confidence * 100).toFixed(1)}%</span>
                </div>
            `;
            
            // Show CCCD info if QR contains CCCD data
            if (qr.cccdInfo) {
                html += `
                    <div class="qrcode-cccd-mini">
                        <i class="fas fa-id-card"></i> CCCD: ${qr.cccdInfo.name || 'N/A'} (${qr.cccdInfo.id || 'N/A'})
                    </div>
                `;
            }
        });
        
        html += `
                </div>
            </div>
        `;
    }
    
    return html;
}

/**
 * Format file data
 */
function formatFileData(data) {
    return `
        <div class="file-summary">
            <div class="data-stat">
                <span class="stat-label">File:</span>
                <span class="stat-value">${data.fileName || 'Unknown'}</span>
            </div>
            <div class="data-stat">
                <span class="stat-label">Size:</span>
                <span class="stat-value">${formatFileSize(data.fileSize || 0)}</span>
            </div>
            <div class="data-stat">
                <span class="stat-label">Type:</span>
                <span class="stat-value">${data.contentType || 'Unknown'}</span>
            </div>
        </div>
    `;
}
