# Java Setup Guide for CelestialEye

## ❌ **Lỗi: JAVA_HOME not defined**

Nếu bạn gặp lỗi: `The JAVA_HOME environment variable is not defined correctly`, làm theo hướng dẫn sau:

## 🔧 **Cách khắc phục nhanh:**

### **Tùy chọn 1: Sử dụng script tự động (Khuyến nghị)**
```bash
# Chỉ cần chạy script này, nó sẽ tự động tìm và cấu hình Java
start.bat
```

### **Tùy chọn 2: Cấu hình vĩnh viễn (Administrator)**
```powershell
# Chạy PowerShell as Administrator, sau đó:
.\setup-java.ps1
```

### **Tùy chọn 3: Cấu hình thủ công tạm thời**
```powershell
# Trong PowerShell:
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
.\mvnw.cmd spring-boot:run
```

## ☕ **Kiểm tra Java Installation**

### **Kiểm tra Java đã cài chưa:**
```powershell
# Tìm Java installations
Get-ChildItem "C:\Program Files\Java" -Directory

# Kiểm tra version
java -version
```

### **Java chưa cài đặt?**
1. Download Java JDK 17+ từ: https://www.oracle.com/java/technologies/downloads/
2. Hoặc OpenJDK: https://adoptium.net/
3. Cài đặt và restart terminal

## 📁 **Cấu trúc Java thường gặp:**
```
C:\Program Files\Java\
├── jdk-21\          # Java 21 (được phát hiện tự động)
├── jdk-17\          # Java 17 (backup option)
└── jre-1.8.0_xxx\   # Java 8 (quá cũ)
```

## 🚀 **Scripts đã được cải tiến:**

### **start.bat:**
- ✅ Tự động tìm Java JDK 21 hoặc 17
- ✅ Set JAVA_HOME tạm thời
- ✅ Kiểm tra Java hoạt động
- ✅ Build frontend + start backend

### **build.bat:**
- ✅ Tự động cấu hình Java
- ✅ Build production JAR
- ✅ Error handling

### **setup-java.ps1:**
- ✅ Cấu hình JAVA_HOME vĩnh viễn (requires Admin)
- ✅ Add Java vào system PATH
- ✅ Restart terminal để áp dụng

## 🔍 **Troubleshooting:**

### **Lỗi: "java: command not found"**
```bash
# Java chưa cài hoặc không có trong PATH
# → Chạy start.bat hoặc setup-java.ps1
```

### **Lỗi: "JAVA_HOME not defined"**
```bash
# JAVA_HOME chưa được set
# → Chạy start.bat (tự động fix)
```

### **Lỗi: "Unsupported Java version"**
```bash
# Java version < 17
# → Cài Java 17+ hoặc 21
```

### **Maven download chậm:**
```bash
# Lần đầu tiên Maven sẽ download dependencies
# → Chờ hoặc dùng mvnw clean compile trước
```

## ✅ **Quick Start Commands:**

```bash
# 1. Quick start (tự động setup Java)
start.bat

# 2. Build production
build.bat

# 3. Manual Maven (sau khi Java OK)
mvnw spring-boot:run

# 4. Development mode
dev-start.bat
```

## 💡 **Tips:**

1. **Luôn dùng `start.bat` first** - nó sẽ tự động fix Java issues
2. **Admin rights** chỉ cần cho `setup-java.ps1` (cấu hình vĩnh viễn)
3. **PowerShell execution policy**: Scripts sẽ tự động enable nếu cần
4. **Multiple Java versions**: Script sẽ tự động chọn JDK 21 > JDK 17
