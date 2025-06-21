import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import axios from 'axios';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('ocr');
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  // Test API connection on component mount
  useEffect(() => {
    const testConnection = async () => {
      try {
        await axios.get('/api/test');
        console.log('API connection successful');
      } catch (error) {
        console.warn('API connection failed:', error);
      }
    };
    testConnection();
  }, []);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    processSelectedFile(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files[0];
    processSelectedFile(file);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setDragOver(false);
  };

  const processSelectedFile = (file) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setResult(null);
      setUploadProgress(0);
    } else {
      alert('Vui lòng chọn file ảnh hợp lệ (JPG, PNG, GIF, etc.)');
    }
  };
  const handleOCR = async () => {
    if (!selectedFile) {
      alert('Vui lòng chọn file ảnh');
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post('/api/ocr/extract', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        },
      });
      setResult(response.data);
    } catch (error) {
      console.error('OCR Error:', error);
      alert(`Lỗi khi xử lý OCR: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleDetection = async () => {
    if (!selectedFile) {
      alert('Vui lòng chọn file ảnh');
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post('/api/detection/detect', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        },
      });
      setResult(response.data);
    } catch (error) {
      console.error('Detection Error:', error);
      alert(`Lỗi khi xử lý detection: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleBarcode = async () => {
    if (!selectedFile) {
      alert('Vui lòng chọn file ảnh');
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post('/api/barcode/detect', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        },
      });
      setResult(response.data);
    } catch (error) {
      console.error('Barcode Error:', error);
      alert(`Lỗi khi xử lý barcode: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };
  return (
    <div className="App">
      <header className="App-header">
        <h1>🌟 CelestialEye</h1>
        <p>Hệ thống nhận diện thông minh với AI - Powered by Machine Learning</p>
      </header>

      <main className="main-content">
        {/* Feature Cards */}
        <div className="feature-cards">
          <div className="feature-card">
            <span className="feature-icon">📝</span>
            <div className="feature-title">OCR Recognition</div>
            <div className="feature-description">
              Trích xuất văn bản từ hình ảnh với độ chính xác cao, hỗ trợ tiếng Việt và tiếng Anh
            </div>
          </div>
          <div className="feature-card">
            <span className="feature-icon">🎯</span>
            <div className="feature-title">Object Detection</div>
            <div className="feature-description">
              Nhận diện và phân loại đối tượng trong hình ảnh với công nghệ AI tiên tiến
            </div>
          </div>
          <div className="feature-card">
            <span className="feature-icon">📱</span>
            <div className="feature-title">Barcode & QR</div>
            <div className="feature-description">
              Quét và giải mã mã vạch, mã QR với tốc độ xử lý nhanh chóng
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button 
            className={activeTab === 'ocr' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('ocr')}
          >
            📝 OCR Recognition
          </button>
          <button 
            className={activeTab === 'detection' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('detection')}
          >
            🎯 Object Detection
          </button>
          <button 
            className={activeTab === 'barcode' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('barcode')}
          >
            📱 Barcode/QR Scanner
          </button>
        </div>

        {/* Upload Section */}
        <div 
          className={`upload-section ${dragOver ? 'drag-over' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            style={{ display: 'none' }}
          />
          
          {!selectedFile ? (
            <div>
              <button 
                className="upload-btn"
                onClick={() => fileInputRef.current.click()}
              >
                📁 Chọn ảnh hoặc kéo thả vào đây
              </button>
              <p style={{ marginTop: '1rem', opacity: 0.8 }}>
                Hỗ trợ các định dạng: JPG, PNG, GIF, WEBP
              </p>
            </div>
          ) : (
            <div className="file-info">
              <p>✅ Đã chọn: <strong>{selectedFile.name}</strong></p>
              <p>📊 Kích thước: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              <img 
                src={URL.createObjectURL(selectedFile)} 
                alt="Preview" 
                className="image-preview"
              />
              <button 
                className="upload-btn" 
                onClick={() => fileInputRef.current.click()}
                style={{ marginTop: '1rem' }}
              >
                🔄 Chọn ảnh khác
              </button>
            </div>
          )}
        </div>

        {/* Action Section */}
        <div className="action-section">
          {activeTab === 'ocr' && (
            <button 
              className="action-btn" 
              onClick={handleOCR}
              disabled={loading || !selectedFile}
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Đang xử lý OCR... {uploadProgress > 0 && `${uploadProgress}%`}
                </>
              ) : (
                '📝 Trích xuất văn bản'
              )}
            </button>
          )}
          
          {activeTab === 'detection' && (
            <button 
              className="action-btn" 
              onClick={handleDetection}
              disabled={loading || !selectedFile}
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Đang nhận diện... {uploadProgress > 0 && `${uploadProgress}%`}
                </>
              ) : (
                '🎯 Nhận diện đối tượng'
              )}
            </button>
          )}
          
          {activeTab === 'barcode' && (
            <button 
              className="action-btn" 
              onClick={handleBarcode}
              disabled={loading || !selectedFile}
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Đang quét... {uploadProgress > 0 && `${uploadProgress}%`}
                </>
              ) : (
                '📱 Quét Barcode/QR'
              )}
            </button>
          )}
        </div>

        {/* Results Section */}
        {result && (
          <div className="result-section">
            <h3>🎉 Kết quả xử lý</h3>
            {result.success ? (
              <div>
                {activeTab === 'ocr' && result.text && (
                  <div style={{ marginBottom: '2rem' }}>
                    <h4>📝 Văn bản được trích xuất:</h4>
                    <div style={{ 
                      background: 'rgba(255, 255, 255, 0.1)', 
                      padding: '1.5rem', 
                      borderRadius: '10px',
                      fontSize: '1.1rem',
                      lineHeight: '1.6'
                    }}>
                      {result.text}
                    </div>
                  </div>
                )}
                
                {activeTab === 'detection' && result.detections && (
                  <div style={{ marginBottom: '2rem' }}>
                    <h4>🎯 Đối tượng được phát hiện ({result.totalDetections || result.detections.length}):</h4>
                    {result.detections.map((detection, index) => (
                      <div key={index} style={{ 
                        background: 'rgba(255, 255, 255, 0.1)', 
                        padding: '1rem', 
                        borderRadius: '8px',
                        margin: '0.5rem 0'
                      }}>
                        <strong>{detection.className || detection.class}</strong> 
                        {detection.confidence && ` - ${(detection.confidence * 100).toFixed(1)}%`}
                      </div>
                    ))}
                  </div>
                )}
                
                {activeTab === 'barcode' && result.barcodes && (
                  <div style={{ marginBottom: '2rem' }}>
                    <h4>📱 Mã được tìm thấy ({result.totalFound || result.barcodes.length}):</h4>
                    {result.barcodes.map((barcode, index) => (
                      <div key={index} style={{ 
                        background: 'rgba(255, 255, 255, 0.1)', 
                        padding: '1rem', 
                        borderRadius: '8px',
                        margin: '0.5rem 0'
                      }}>
                        <strong>Loại:</strong> {barcode.format || barcode.type}<br/>
                        <strong>Nội dung:</strong> {barcode.text || barcode.data}
                      </div>
                    ))}
                  </div>
                )}
                
                <details>
                  <summary style={{ cursor: 'pointer', fontSize: '1.1rem', marginBottom: '1rem' }}>
                    🔍 Xem chi tiết kỹ thuật
                  </summary>
                  <pre className="result-content">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </details>
              </div>
            ) : (
              <div style={{ 
                background: 'rgba(255, 0, 0, 0.1)', 
                padding: '1.5rem', 
                borderRadius: '10px',
                border: '1px solid rgba(255, 0, 0, 0.3)'
              }}>
                ❌ <strong>Lỗi:</strong> {result.message || 'Có lỗi xảy ra trong quá trình xử lý'}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
