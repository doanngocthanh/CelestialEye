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
COPY eng.traineddata ./eng.traineddata
COPY vie.traineddata ./vie.traineddata
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:17-jre

# Install Tesseract OCR and its dependencies
RUN apt-get update && apt-get install -y \
	tesseract-ocr \
	tesseract-ocr-eng \
	tesseract-ocr-vie \
	libtesseract-dev \
	&& rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy jar from build stage
COPY --from=build /app/target/*.jar app.jar

# Expose port
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]