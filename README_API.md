# Spring AI REST API

REST API service for ONNX model management and object detection using YOLOv8.

## Features

- ✅ Upload và quản lý ONNX models
- ✅ List danh sách models đã upload
- ✅ Object detection sử dụng bất kỳ model nào đã upload
- ✅ Trả về vị trí và label của objects được phát hiện
- ✅ Caching để tối ưu hiệu suất
- ✅ Support custom class names và confidence threshold

## API Endpoints

### Model Management

#### 1. Upload Model
```http
POST /api/models/upload
Content-Type: multipart/form-data

file: (ONNX file)
name: model_name
description: Model description (optional)
```

#### 2. List Models
```http
GET /api/models/list
```

#### 3. Get Model Info
```http
GET /api/models/{modelName}
```

#### 4. Delete Model
```http
DELETE /api/models/{modelName}
```

### Object Detection

#### 1. Detect Objects
```http
POST /api/detection/detect/{modelName}
Content-Type: multipart/form-data

image: (Image file - JPG, PNG, etc.)
classNames: person,car,bicycle (optional, comma-separated)
confThreshold: 0.5 (optional, float between 0-1)
```

**Response Example:**
```json
{
  "modelName": "my_yolo_model",
  "imageName": "test_image.jpg",
  "imageWidth": 640,
  "imageHeight": 480,
  "processingTime": 150,
  "detections": [
    {
      "x1": 100.5,
      "y1": 200.2,
      "x2": 300.8,
      "y2": 400.1,
      "confidence": 0.85,
      "classId": 0,
      "className": "person",
      "width": 200.3,
      "height": 199.9,
      "centerX": 200.65,
      "centerY": 300.15
    }
  ]
}
```

#### 2. Get Available Models
```http
GET /api/detection/models
```

#### 3. Clear Cache
```http
DELETE /api/detection/cache/{modelName}  # Clear specific model cache
DELETE /api/detection/cache              # Clear all cache
```

### Utility Endpoints

#### 1. API Documentation
```http
GET /api/docs
```

#### 2. Health Check
```http
GET /api/health
GET /api/detection/health
```

## Usage Examples

### 1. Upload a Model
```bash
curl -X POST http://localhost:8080/api/models/upload \
  -F "file=@yolo_model.onnx" \
  -F "name=my_yolo_model" \
  -F "description=YOLOv8 object detection model"
```

### 2. List Models
```bash
curl http://localhost:8080/api/models/list
```

### 3. Detect Objects
```bash
curl -X POST http://localhost:8080/api/detection/detect/my_yolo_model \
  -F "image=@test_image.jpg" \
  -F "classNames=person,car,bicycle" \
  -F "confThreshold=0.5"
```

## Running the Application

1. **Build and run:**
```bash
./mvnw spring-boot:run
```

2. **Or build JAR and run:**
```bash
./mvnw clean package
java -jar target/restai-0.0.1-SNAPSHOT.jar
```

3. **Access the API:**
- Base URL: `http://localhost:8080`
- API Documentation: `http://localhost:8080/api/docs`
- Health Check: `http://localhost:8080/api/health`

## Configuration

Application properties (`application.properties`):
```properties
# Server port
server.port=8080

# File upload limits
spring.servlet.multipart.max-file-size=100MB
spring.servlet.multipart.max-request-size=100MB

# Model storage directory
app.model.upload.dir=models
```

## Model Requirements

- **Format**: ONNX (.onnx files)
- **Architecture**: YOLOv8 hoặc tương thích
- **Input**: Images (JPG, PNG, BMP, etc.)
- **Output**: Bounding boxes với confidence scores

## Notes

- Models được lưu trong thư mục `models/` 
- Detector cache để tối ưu hiệu suất (không cần reload model mỗi lần)
- Support custom class names hoặc sử dụng COCO classes mặc định
- Tự động resize ảnh theo yêu cầu của model
- Thread-safe và có thể handle multiple requests đồng thời
