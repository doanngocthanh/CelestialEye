# Multi-stage build
FROM maven:3.8.4-openjdk-17 AS build

# Set working directory
WORKDIR /app

# Copy pom.xml and download dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build
COPY src ./src
COPY models ./models
RUN mvn clean package -DskipTests

# Runtime stage
FROM openjdk:17-jdk-slim

# Install Tesseract and Vietnamese language pack
RUN apt-get update && \
    apt-get install -y tesseract-ocr tesseract-ocr-vie && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set Tesseract environment
ENV TESSDATA_PREFIX=/usr/share/tessdata

# Copy custom traineddata files to Tesseract directory
COPY eng.traineddata /usr/share/tessdata/
COPY vie.traineddata /usr/share/tessdata/

# Create app user and directories
RUN useradd -m -u 1001 appuser
RUN mkdir -p /app/uploads/models /app/data && \
    chown -R appuser:appuser /app

# Copy application JAR
COPY --from=build /app/target/*.jar /app/app.jar
RUN chown appuser:appuser /app/app.jar

# Create volume for persistent data
VOLUME ["/app/uploads", "/app/data"]

# Switch to non-root user
USER appuser

WORKDIR /app

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/actuator/health || exit 1

CMD ["java", "-jar", "app.jar"]