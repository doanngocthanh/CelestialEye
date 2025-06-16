# OCR Setup Instructions

## Tesseract Installation and Vietnamese Language Support

### 1. Install Tesseract OCR

#### Windows:
1. Download Tesseract installer from: https://github.com/UB-Mannheim/tesseract/wiki
2. Run the installer and install to default location (C:\Program Files\Tesseract-OCR)
3. Add Tesseract to system PATH environment variable

#### Linux (Ubuntu/Debian):
```bash
sudo apt-get update
sudo apt-get install tesseract-ocr
sudo apt-get install tesseract-ocr-vie  # Vietnamese language pack
sudo apt-get install tesseract-ocr-eng  # English language pack
```

#### macOS:
```bash
brew install tesseract
brew install tesseract-lang  # Includes Vietnamese
```

### 2. Download Vietnamese Language Data

#### Windows:
1. Download `vie.traineddata` from: https://github.com/tesseract-ocr/tessdata
2. Copy to: `C:\Program Files\Tesseract-OCR\tessdata\`

#### Linux/macOS:
Vietnamese language data should be included with tesseract-ocr-vie package.
If not available, download and copy `vie.traineddata` to tessdata directory:
```bash
# Find tessdata directory
tesseract --list-langs

# Download Vietnamese data
wget https://github.com/tesseract-ocr/tessdata/raw/main/vie.traineddata
sudo cp vie.traineddata /usr/share/tesseract-ocr/*/tessdata/
```

### 3. Verify Installation

Test Tesseract with Vietnamese support:
```bash
tesseract --list-langs
```

Should show both 'eng' and 'vie' in the list.

### 4. Application Configuration

The OcrService automatically configures Tesseract for Vietnamese OCR:
- Language: Vietnamese + English (`vie+eng`)
- OCR Engine Mode: 3 (Default, based on what is available)
- Page Segmentation Mode: 6 (Uniform block of text)

If Vietnamese language is not available, the application will fallback to English only.

### 5. Usage

1. **OCR with Detection**: 
   - Upload an image in the OCR tab
   - Select a YOLO model for object detection
   - Click "Detect & Extract Text"
   - The system will detect objects and extract text from each detected region

2. **Test OCR Only**:
   - Upload an image
   - Click "Test OCR Only" to extract text from the entire image

### 6. Supported Image Formats

- PNG
- JPEG/JPG
- BMP
- TIFF
- GIF

### 7. Performance Tips

1. Use high-quality images for better OCR accuracy
2. Ensure text regions are clearly visible and not too small
3. Images with good contrast work best
4. For Vietnamese text, ensure proper font rendering

### 8. Troubleshooting

#### Common Issues:

1. **"Tesseract not found"**: 
   - Ensure Tesseract is installed and in system PATH
   - Check Java library can access Tesseract binary

2. **"Vietnamese language not available"**:
   - Download and install vie.traineddata
   - Application will fallback to English

3. **Poor OCR accuracy**:
   - Use higher resolution images
   - Ensure good lighting and contrast
   - Check if text is rotated or skewed

4. **Memory issues with large images**:
   - Resize images before processing
   - Current implementation automatically crops detected regions
