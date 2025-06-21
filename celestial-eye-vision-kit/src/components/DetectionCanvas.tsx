
import React, { useRef, useEffect } from "react";

interface BarcodeDetection {
  content: string;
  format: string;
  confidence: number;
  boundingBox: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
}

interface DetectionCanvasProps {
  imageFile: File | null;
  detections: BarcodeDetection[];
  isProcessing: boolean;
}

export const DetectionCanvas: React.FC<DetectionCanvasProps> = ({
  imageFile,
  detections,
  isProcessing,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imageFile && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        // Set canvas size to match image
        canvas.width = Math.min(img.width, 600);
        canvas.height = (img.height * canvas.width) / img.width;

        // Draw image
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Draw detection boxes
        if (detections.length > 0 && ctx) {
          const scaleX = canvas.width / img.width;
          const scaleY = canvas.height / img.height;          detections.forEach((detection, index) => {
            const { x1, y1, x2, y2 } = detection.boundingBox;
            
            // Scale coordinates to canvas size
            const scaledX1 = x1 * scaleX;
            const scaledY1 = y1 * scaleY;
            const scaledX2 = x2 * scaleX;
            const scaledY2 = y2 * scaleY;
            
            // Calculate width and height for rectangle
            const rectWidth = scaledX2 - scaledX1;
            const rectHeight = scaledY2 - scaledY1;

            // Draw bounding box rectangle
            ctx.strokeStyle = `hsl(${index * 60}, 70%, 50%)`;
            ctx.lineWidth = 3;
            ctx.strokeRect(scaledX1, scaledY1, rectWidth, rectHeight);

            // Draw label background
            const label = `${detection.format} (${(detection.confidence * 100).toFixed(1)}%)`;
            ctx.font = "14px Arial";
            const textWidth = ctx.measureText(label).width;
            
            ctx.fillStyle = `hsla(${index * 60}, 70%, 50%, 0.8)`;
            ctx.fillRect(scaledX1, scaledY1 - 25, textWidth + 10, 20);

            // Draw label text
            ctx.fillStyle = "white";
            ctx.fillText(label, scaledX1 + 5, scaledY1 - 10);
          });
        }
      };

      img.src = URL.createObjectURL(imageFile);
      imageRef.current = img;

      return () => {
        URL.revokeObjectURL(img.src);
      };
    }
  }, [imageFile, detections]);

  if (!imageFile) {
    return (
      <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-lg flex items-center justify-center">
            📊
          </div>
          <p>Upload an image to see detection visualization</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="w-full border rounded-lg shadow-lg bg-white"
        style={{ maxWidth: "100%" }}
      />
      {isProcessing && (
        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Processing...</p>
          </div>
        </div>
      )}
    </div>
  );
};
