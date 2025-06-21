# CelestialEye - React Frontend Integration

## Cấu trúc dự án

```
CelestialEye/
├── celestial-eye-vision-kit/     # React.js + Vite + TypeScript frontend
│   ├── public/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── OCRDetection.tsx
│   │   │   ├── ObjectDetection.tsx
│   │   │   ├── BarcodeDetection.tsx
│   │   │   └── ...
│   │   └── components/
│   ├── package.json
│   ├── vite.config.ts
│   └── ...
├── src/                          # Spring Boot backend
│   └── main/
│       ├── java/
│       └── resources/
│           └── static/           # Vite build output (auto-generated)
├── pom.xml                       # Maven với celestial-eye-vision-kit integration
├── start.bat                     # Start với auto-build frontend
├── build.bat                     # Build production
└── dev-start.bat                 # Development mode
```

## Cách chạy dự án

### 🚀 **Quick Start (Khuyến nghị)**
```bash
# Chạy ngay lập tức với frontend tự động build
start.bat
```
- Tự động cài đặt Node.js, npm
- Build React frontend
- Copy vào Spring Boot static
- Start ứng dụng tại: http://localhost:8080

### 🛠️ **Development Mode**
```bash
# Chạy script development với nhiều tùy chọn
dev-start.bat
```

**Tùy chọn development:**
1. **Integrated mode**: Maven tự build Vite + start Spring Boot
2. **Separate mode**: Spring Boot (8080) + Vite dev server (3000)  
3. **Frontend only**: Chỉ Vite dev server
4. **Backend only**: Chỉ Spring Boot (skip frontend build)

### 📦 **Production Build**
```bash
# Build JAR file production
build.bat

# Hoặc manual
mvnw clean package
java -jar target/restai-0.0.1-SNAPSHOT.jar
```

## Maven Commands

### Các lệnh Maven chính:
```bash
# Start với auto-build frontend
mvnw spring-boot:run

# Build production
mvnw clean package

# Start mà không build frontend (nhanh hơn cho dev)
mvnw spring-boot:run -Pskip-frontend

# Clean toàn bộ (bao gồm frontend build)
mvnw clean
```

### Profiles Maven:
- **Default**: Tự động build frontend
- **`-Pskip-frontend`**: Bỏ qua build frontend 
- **`-Pdev`**: Development mode

## Cấu hình Maven tự động

### Frontend Maven Plugin sẽ:
1. **Tự động cài đặt** Node.js v18.19.0 và npm v10.2.3
2. **Chạy `npm install`** để cài dependencies (Vite, TypeScript, etc.)
3. **Chạy `npm run build`** để build React với Vite
4. **Copy build** từ `celestial-eye-vision-kit/dist/` vào `src/main/resources/static/`

### Lifecycle Maven:
- **`generate-resources`**: Install Node.js, npm install, npm build (Vite)
- **`process-resources`**: Copy Vite build từ dist/ vào static folder
- **`clean`**: Xóa celestial-eye-vision-kit/dist và static files

## Tính năng Frontend (celestial-eye-vision-kit)

- **Modern Tech Stack**: Vite + React + TypeScript + Tailwind CSS
- **Beautiful UI Components**: Shadcn/ui components
- **Professional Pages**: Dedicated pages cho OCR, Object Detection, Barcode
- **Responsive Design**: Tối ưu cho mọi thiết bị
- **Real-time API Integration**: Gọi Spring Boot APIs
- **Dark/Light Mode**: Theme switching
- **Error Handling**: Toast notifications và error boundaries
- **TypeScript**: Type safety và better development experience

## API Endpoints

- `/api/ocr/extract` - OCR text extraction
- `/api/detection/detect` - Object detection  
- `/api/barcode/detect` - Barcode/QR code detection

## Lưu ý quan trọng

### ✅ **Ưu điểm cấu hình này:**
- **Tự động hoàn toàn**: Không cần cài Node.js thủ công
- **Single command**: Chỉ cần `mvnw spring-boot:run` 
- **Production ready**: JAR file chứa toàn bộ frontend
- **No CORS issues**: Cùng origin
- **Caching**: Maven cache Node.js và npm packages

### ⚠️ **Lưu ý:**
- **Lần đầu chậm**: Cần download Node.js và install packages
- **Development**: Dùng `mvnw spring-boot:run -Pskip-frontend` cho nhanh
- **Clean build**: `mvnw clean package` để build hoàn toàn mới

### 🔧 **Tuỳ chỉnh:**
- **Node version**: Thay đổi trong pom.xml `<nodeVersion>`
- **npm version**: Thay đổi trong pom.xml `<npmVersion>`
- **Build args**: Thay đổi trong `<arguments>` của npm executions

## Yêu cầu hệ thống

- **Java 17+**
- **Maven 3.6+** 
- **Internet connection** (để download Node.js lần đầu)
- **No Node.js installation required** (Maven tự cài)
