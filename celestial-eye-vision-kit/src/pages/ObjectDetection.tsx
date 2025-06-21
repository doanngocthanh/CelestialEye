
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Upload, ArrowLeft, CheckCircle, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { DetectionCanvas } from "@/components/DetectionCanvas";
import { ResultsTable } from "@/components/ResultsTable";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import axios from "axios";

interface ObjectDetection {
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

interface DetectionAPIResponse {
  success: boolean;
  modelName: string;
  detections: Array<{
    className: string;
    confidence: number;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
  totalDetections: number;
  imageWidth: number;
  imageHeight: number;
  fileName: string;
}

const ObjectDetection = () => {
  const [file, setFile] = useState<File | null>(null);
  const [selectedModel, setSelectedModel] = useState("DetectCCCD");
  const [confidenceThreshold, setConfidenceThreshold] = useState([0.5]);
  const [classFilter, setClassFilter] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [detections, setDetections] = useState<ObjectDetection[]>([]);
  const [apiResponse, setApiResponse] = useState<DetectionAPIResponse | null>(null);

  const detectionModels = [
    { id: "DetectCCCD", name: "CCCD Detection", description: "Vietnamese ID Card detection model" },
    { id: "DetectBarCode", name: "Barcode Detection", description: "Barcode and QR code detection model" },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setDetections([]);
    }
  };
  const processDetection = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select an image file to process",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setDetections([]);
    setApiResponse(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Call the simple detection endpoint
      const response = await axios.post('/api/detection/detect', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 second timeout
      });

      console.log('Detection API Response:', response.data);

      if (response.data.success) {
        const apiData: DetectionAPIResponse = response.data;
        setApiResponse(apiData);

        // Convert API response to ObjectDetection format for display
        const convertedDetections: ObjectDetection[] = [];
        
        if (apiData.detections && apiData.detections.length > 0) {
          apiData.detections.forEach((detection) => {
            // Apply confidence threshold and class filter
            if (detection.confidence >= confidenceThreshold[0]) {
              const classMatch = !classFilter || 
                classFilter.split(',').some(cls => 
                  detection.className.toLowerCase().includes(cls.trim().toLowerCase())
                );
              
              if (classMatch) {
                convertedDetections.push({
                  content: detection.className || "unknown",
                  format: "OBJECT",
                  confidence: detection.confidence || 0.0,
                  boundingBox: {
                    x1: detection.x || 0,
                    y1: detection.y || 0,
                    x2: (detection.x || 0) + (detection.width || 100),
                    y2: (detection.y || 0) + (detection.height || 100)
                  }
                });
              }
            }
          });
        }

        setDetections(convertedDetections);
        
        toast({
          title: "Object Detection Complete!",
          description: `Found ${convertedDetections.length} objects using ${apiData.modelName}`,
        });
      } else {
        throw new Error(response.data.message || 'Object detection failed');
      }
    } catch (error: any) {
      console.error('Detection Error:', error);
      
      let errorMessage = "An error occurred during object detection";
      if (error.response?.status === 404) {
        errorMessage = "Detection API endpoint not found. Please ensure the backend server is running.";
      } else if (error.response?.status === 500) {
        errorMessage = "Server error occurred during object detection.";
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = "Request timeout. The file might be too large or server is busy.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Object Detection Failed",
        description: errorMessage,
        variant: "destructive",
      });
      setDetections([]);
      setApiResponse(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const testApiConnection = async () => {
    try {
      const response = await axios.get('/api/test');
      toast({
        title: "API Connection Successful",
        description: `Backend is running. ${response.data.message}`,
      });
    } catch (error: any) {
      toast({
        title: "API Connection Failed",
        description: "Cannot connect to backend server. Please ensure it's running on port 8080.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <ArrowLeft className="h-5 w-5" />
            <Eye className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">CelestialEye</span>
          </Link>
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={testApiConnection}>
              Test API
            </Button>
            <Badge className="bg-red-100 text-red-700">Object Detection</Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <Eye className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Object Detection</h1>
              <p className="text-gray-600">Detect and classify objects using state-of-the-art YOLO models</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="h-5 w-5" />
                <span>Upload & Configure</span>
              </CardTitle>
              <CardDescription>
                Select image and detection parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="model">Detection Model</Label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select detection model" />
                  </SelectTrigger>
                  <SelectContent>
                    {detectionModels.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        <div>
                          <div className="font-medium">{model.name}</div>
                          <div className="text-sm text-gray-500">{model.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Confidence Threshold: {confidenceThreshold[0].toFixed(2)}</Label>
                <Slider
                  value={confidenceThreshold}
                  onValueChange={setConfidenceThreshold}
                  max={1}
                  min={0.1}
                  step={0.05}
                  className="w-full"
                />
                <p className="text-sm text-gray-500">
                  Only show detections above this confidence level
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="classFilter">Class Filter (optional)</Label>
                <Input
                  id="classFilter"
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  placeholder="e.g., person,car,dog"
                />
                <p className="text-sm text-gray-500">
                  Comma-separated class names to filter
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">Select Image File</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".jpg,.jpeg,.png,.bmp"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                <p className="text-sm text-gray-500">
                  Supported: JPG, PNG, BMP
                </p>
              </div>

              {file && (
                <div className="p-4 bg-gray-50 rounded-lg animate-fade-in">
                  <div className="flex items-center space-x-3">
                    <Eye className="h-8 w-8 text-red-600" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </div>
              )}              <Button 
                onClick={processDetection} 
                disabled={!file || isProcessing}
                className="w-full bg-red-600 hover:bg-red-700"
                size="lg"
              >
                {isProcessing ? "Detecting Objects..." : "Detect Objects"}
              </Button>
            </CardContent>
          </Card>

          <div className="lg:col-span-2">
            {isProcessing ? (
              <LoadingSpinner text="Running object detection model..." />
            ) : (
              <DetectionCanvas 
                imageFile={file} 
                detections={detections}
                isProcessing={isProcessing}
              />
            )}
          </div>
        </div>        {detections.length > 0 && (
          <div className="animate-fade-in space-y-6">
            {apiResponse && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Detection Results Summary</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{apiResponse.totalDetections}</div>
                      <div className="text-sm text-gray-600">Total Detections</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{detections.length}</div>
                      <div className="text-sm text-gray-600">Filtered Results</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{apiResponse.modelName}</div>
                      <div className="text-sm text-gray-600">Model Used</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{apiResponse.imageWidth}×{apiResponse.imageHeight}</div>
                      <div className="text-sm text-gray-600">Image Size</div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex flex-wrap gap-2">
                    {Array.from(new Set(detections.map(d => d.content))).map((className) => (
                      <Badge key={className} variant="outline" className="bg-red-50 text-red-700">
                        {className} ({detections.filter(d => d.content === className).length})
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            <ResultsTable detections={detections} />
          </div>
        )}

        <div className="mt-12">
          <Tabs defaultValue="detect" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="detect">Detection API</TabsTrigger>
              <TabsTrigger value="models">Available Models</TabsTrigger>
              <TabsTrigger value="cache">Cache Management</TabsTrigger>
            </TabsList>
              <TabsContent value="detect" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Simple Detection Endpoint</h3>
                      <code className="bg-gray-100 px-3 py-2 rounded text-sm block">
                        POST /api/detection/detect
                      </code>
                      <p className="text-sm text-gray-600 mt-2">
                        Uses default model for object detection
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Model-Specific Detection Endpoint</h3>
                      <code className="bg-gray-100 px-3 py-2 rounded text-sm block">
                        POST /api/detection/detect/{`{modelName}`}
                      </code>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Parameters</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="font-medium">file (multipart)</span>
                          <Badge variant="destructive">required</Badge>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="font-medium">modelName (path)</span>
                          <Badge variant="secondary">optional</Badge>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="font-medium">classNames</span>
                          <Badge variant="secondary">optional</Badge>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="font-medium">confThreshold</span>
                          <Badge variant="secondary">optional</Badge>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Response Format</h3>
                      <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`{
  "success": true,
  "modelName": "DetectCCCD",
  "detections": [
    {
      "className": "person",
      "confidence": 0.95,
      "x": 100, "y": 50,
      "width": 200, "height": 300
    }
  ],
  "totalDetections": 3,
  "imageWidth": 800,
  "imageHeight": 600,
  "fileName": "image.jpg"
}`}
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="models" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Available Detection Models</h3>
                  <div className="grid gap-3">
                    {detectionModels.map((model) => (
                      <div key={model.id} className="p-3 border rounded-lg">
                        <div className="font-medium">{model.name}</div>
                        <div className="text-sm text-gray-500">{model.description}</div>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded mt-1 inline-block">
                          {model.id}
                        </code>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
              <TabsContent value="cache" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-4">Cache Management Endpoints</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="p-3 border rounded-lg">
                        <code className="text-sm font-medium">GET /api/detection/health</code>
                        <p className="text-sm text-gray-600 mt-1">Check detection service health</p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <code className="text-sm font-medium">GET /api/detection/models</code>
                        <p className="text-sm text-gray-600 mt-1">Get available detection models</p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <code className="text-sm font-medium">DELETE /api/detection/cache/{`{modelName}`}</code>
                        <p className="text-sm text-gray-600 mt-1">Clear cache for specific model</p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <code className="text-sm font-medium">DELETE /api/detection/cache</code>
                        <p className="text-sm text-gray-600 mt-1">Clear all detection cache</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ObjectDetection;
