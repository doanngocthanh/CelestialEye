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
    
    fetch(`/api/ocr/detect/${modelName}`, {
        method: 'POST',
        body: formData
    })    .then(response => response.json())
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
function displayOcrResults(data) {
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
    
    if (data.results && Array.isArray(data.results) && data.results.length > 0) {
        // Check if this looks like CCCD data for organized display
        const cccdFields = organizeCCCDFields(data.results);
        
        if (cccdFields.length > 0) {
            html += `
                <div class="cccd-organized">
                    <h4><i class="fas fa-id-card"></i> CCCD Information</h4>
                    <div class="cccd-fields">
            `;
            
            cccdFields.forEach(field => {
                html += `
                    <div class="cccd-field">
                        <div class="cccd-field-label">${field.label}:</div>
                        <div class="cccd-field-value">${field.value}</div>
                        <div class="cccd-field-confidence">Confidence: ${(field.confidence * 100).toFixed(1)}%</div>
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
        
        data.results.forEach((result, index) => {
            console.log(`Processing result ${index}:`, result); // Debug log
            
            html += `
                <div class="ocr-region">
                    <div class="ocr-region-header">
                        <span class="ocr-region-class">${result.className || 'Unknown'}</span>
                        <span class="ocr-region-confidence">Confidence: ${(result.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <div class="ocr-region-text">${result.text || '[No text detected]'}</div>
                    <div class="ocr-region-bbox">
                        Bounding Box: (${Math.round(result.boundingBox.x1)}, ${Math.round(result.boundingBox.y1)}) - 
                        (${Math.round(result.boundingBox.x2)}, ${Math.round(result.boundingBox.y2)})
                        [${result.boundingBox.width} x ${result.boundingBox.height}]
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
    } else {
        html += '<div class="no-results">No text detected in any regions.</div>';
        console.log('No results found or results is not an array'); // Debug log
    }
    
    resultDiv.innerHTML = html;
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
    
    results.forEach(result => {
        if (result.className && fieldLabels[result.className] && result.text && result.text.trim()) {
            cccdFields.push({
                label: fieldLabels[result.className],
                value: result.text.trim(),
                confidence: result.confidence,
                className: result.className
            });
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
    
    // Auto-refresh models list every 30 seconds
    setInterval(() => {
        loadModelsForSelect();
        loadOcrModels();
    }, 30000);
    
    // Load models for configuration
    loadModelsForConfig();
});
