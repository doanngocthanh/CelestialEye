import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Upload, ArrowLeft, CheckCircle, Eye, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { DetectionCanvas } from "@/components/DetectionCanvas";
import { ResultsTable } from "@/components/ResultsTable";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import axios from "axios";

interface OCRDetection {
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

interface ModelInfo {
  id: string;
  name: string;
  fileName: string;
  description: string;
  fileSize: number;
  uploadTime: string;
  type: string;
  status: "ACTIVE" | "INACTIVE";
}

interface APIResponse {
  success: boolean;
  text: string;
  totalDetections: number;
  results: Array<{
    text: string;
    confidence: number;
    boundingBox?: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      width: number;
      height: number;
    };
    className?: string;
    classId?: number;
    // Fallback properties for old format
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  }>;
  processingTime: number;
  fileName: string;
  cccdInfo?: any;
}

const OCRDetection = () => {
  const [file, setFile] = useState<File | null>(null);
  const [selectedModel, setSelectedModel] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [detections, setDetections] = useState<OCRDetection[]>([]);
  const [apiResponse, setApiResponse] = useState<APIResponse | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [ocrModels, setOcrModels] = useState<ModelInfo[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(true);

  // Load OCR models on component mount
  useEffect(() => {
    loadOCRModels();
  }, []);

  const loadOCRModels = async () => {
    try {
      setIsLoadingModels(true);
      const response = await axios.get('/api/models/list');
      
      if (response.data.success) {
        // Filter only OCR models that are ACTIVE
        const ocrOnlyModels = response.data.models.filter(
          (model: ModelInfo) => model.type === "OCR" && model.status === "ACTIVE"
        );
        setOcrModels(ocrOnlyModels);
        
        // Auto-select first model if available
        if (ocrOnlyModels.length > 0 && !selectedModel) {
          setSelectedModel(ocrOnlyModels[0].id);
        }
      } else {
        throw new Error(response.data.message || "Failed to load models");
      }
    } catch (error: any) {
      console.error('Load models error:', error);
      toast({
        title: "Failed to load OCR models",
        description: error.response?.data?.message || error.message || "Cannot connect to backend",
        variant: "destructive",
      });
      
      // Fallback to default models if API fails
      const fallbackModels: ModelInfo[] = [
        {
          id: "DetectCCCD",
          name: "CCCD Detection",
          fileName: "cccd_model.onnx",
          description: "Vietnamese ID Card OCR detection",
          fileSize: 0,
          uploadTime: "",
          type: "OCR",
          status: "ACTIVE"
        }
      ];
      setOcrModels(fallbackModels);
      setSelectedModel(fallbackModels[0].id);
    } finally {
      setIsLoadingModels(false);
    }
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setDetections([]);
      setApiResponse(null);
      
      // Create preview URL
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      
      // Cleanup previous URL
      return () => URL.revokeObjectURL(url);
    }
  };  const processOCR = async () => {
    if (!file) {
      toast({
        title: "No file selected", 
        description: "Please select an image file to process",
        variant: "destructive",
      });
      return;
    }

    if (!selectedModel) {
      toast({
        title: "No model selected", 
        description: "Please select an OCR model to use",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setDetections([]);
    setApiResponse(null);
    
    try {      const formData = new FormData();
      formData.append('file', file);
      formData.append('modelId', selectedModel);

      // Call OCR endpoint with model ID
      const response = await axios.post('/api/ocr/extract', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 second timeout
      });

      console.log('API Response:', response.data);

      if (response.data.success) {
        const apiData: APIResponse = response.data;
        setApiResponse(apiData);        // Convert API response to OCRDetection format for display
        const convertedDetections: OCRDetection[] = [];
        
        if (apiData.results && apiData.results.length > 0) {
          apiData.results.forEach((result, index) => {
            if (result.text && result.text.trim()) {
              // Use boundingBox from API response - should have all fields now
              let boundingBox = { x1: 0, y1: 0, x2: 200, y2: 30 };
              
              if (result.boundingBox) {
                // API should now return x1, y1, x2, y2, width, height
                boundingBox = {
                  x1: result.boundingBox.x1,
                  y1: result.boundingBox.y1,
                  x2: result.boundingBox.x2,
                  y2: result.boundingBox.y2
                };
              } else if (result.x !== undefined && result.y !== undefined) {
                // Fallback to x,y,width,height format (old format)
                boundingBox = {
                  x1: result.x,
                  y1: result.y,
                  x2: result.x + (result.width || 100),
                  y2: result.y + (result.height || 30)
                };
              }
              
              convertedDetections.push({
                content: result.text.trim(),
                format: result.className || "TEXT",
                confidence: result.confidence || 0.0,
                boundingBox: boundingBox
              });
            }
          });
        } else if (apiData.text && apiData.text.trim()) {
          // If no detailed results but has text, create a single detection
          convertedDetections.push({
            content: apiData.text.trim(),
            format: "TEXT",
            confidence: 0.9,
            boundingBox: { x1: 0, y1: 0, x2: 200, y2: 30 }
          });
        }

        setDetections(convertedDetections);
        
        const selectedModelInfo = ocrModels.find(m => m.id === selectedModel);
        toast({
          title: "OCR Processing Complete!",
          description: `Found ${convertedDetections.length} text regions using ${selectedModelInfo?.name}. Processing time: ${apiData.processingTime}ms`,
        });
      } else {
        throw new Error(response.data.message || 'OCR processing failed');
      }
    } catch (error: any) {
      console.error('OCR Error:', error);
      
      let errorMessage = "An error occurred during processing";
      if (error.response?.status === 404) {
        errorMessage = "API endpoint not found. Please ensure the backend server is running.";
      } else if (error.response?.status === 500) {
        errorMessage = "Server error occurred during OCR processing.";
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = "Request timeout. The file might be too large or server is busy.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "OCR Processing Failed",
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">          <Link to="/dashboard" className="flex items-center space-x-2">
            <ArrowLeft className="h-5 w-5" />
            <Eye className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">CelestialEye</span>
          </Link>
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={testApiConnection}>
              Test API
            </Button>
            <Badge className="bg-purple-100 text-purple-700">OCR Detection</Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">OCR Text Recognition</h1>
              <p className="text-gray-600">Extract text from images using advanced OCR models with high accuracy</p>
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
                Select image and OCR model for text extraction
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">              <div className="space-y-2">
                <Label htmlFor="model">OCR Model</Label>
                {isLoadingModels ? (
                  <div className="p-3 border rounded-lg bg-gray-50">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                      <span className="text-sm text-gray-600">Loading OCR models...</span>
                    </div>
                  </div>
                ) : ocrModels.length === 0 ? (
                  <div className="p-3 border rounded-lg bg-yellow-50 border-yellow-200">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm text-yellow-700">No OCR models available</span>
                    </div>
                    <p className="text-xs text-yellow-600 mt-1">
                      Please upload OCR models in Model Management
                    </p>
                  </div>
                ) : (
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select OCR model" />
                    </SelectTrigger>
                    <SelectContent>
                      {ocrModels.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          <div>
                            <div className="font-medium">{model.name}</div>
                            <div className="text-sm text-gray-500">{model.description}</div>
                            <div className="text-xs text-blue-600">ID: {model.id}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">Select Image File</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf,.tiff"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                <p className="text-sm text-gray-500">
                  Supported: JPG, PNG, PDF, TIFF
                </p>
              </div>

              {file && (
                <div className="p-4 bg-gray-50 rounded-lg animate-fade-in">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-8 w-8 text-purple-600" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </div>
              )}              <Button 
                onClick={processOCR} 
                disabled={!file || !selectedModel || isProcessing || ocrModels.length === 0}
                className="w-full bg-purple-600 hover:bg-purple-700"
                size="lg"
              >
                {isProcessing ? "Extracting Text..." : "Extract Text"}
              </Button>
            </CardContent>
          </Card>

          <div className="lg:col-span-2">
            {isProcessing ? (
              <LoadingSpinner text="Processing image with OCR model..." />
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
                    <span>OCR Results Summary</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{apiResponse.totalDetections}</div>
                      <div className="text-sm text-gray-600">Detections</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{apiResponse.processingTime}ms</div>
                      <div className="text-sm text-gray-600">Processing Time</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{apiResponse.text?.length || 0}</div>
                      <div className="text-sm text-gray-600">Characters</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{apiResponse.fileName}</div>
                      <div className="text-sm text-gray-600">File Name</div>
                    </div>
                  </div>
                  
                  {apiResponse.text && (
                    <div className="mt-4">
                      <Label>Extracted Text:</Label>
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg max-h-32 overflow-y-auto">
                        <p className="text-sm whitespace-pre-wrap">{apiResponse.text}</p>
                      </div>
                    </div>
                  )}
                  
                  {apiResponse.cccdInfo && (
                    <div className="mt-4">
                      <Label>CCCD Information:</Label>
                      <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                        <pre className="text-sm">{JSON.stringify(apiResponse.cccdInfo, null, 2)}</pre>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            
            <ResultsTable detections={detections} />
          </div>
        )}        <div className="mt-12">
          <Tabs defaultValue="detect" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="detect">OCR API</TabsTrigger>
              <TabsTrigger value="models">Available Models</TabsTrigger>
              <TabsTrigger value="endpoints">All Endpoints</TabsTrigger>
            </TabsList>
            
            <TabsContent value="detect" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">                    <div>
                      <h3 className="font-semibold mb-2">OCR Extract Endpoint</h3>
                      <code className="bg-gray-100 px-3 py-2 rounded text-sm block">
                        POST /api/ocr/extract
                      </code>
                      <p className="text-sm text-gray-600 mt-2">
                        Extracts text using specified OCR model
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Parameters</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="font-medium">file (multipart)</span>
                          <Badge variant="destructive">required</Badge>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="font-medium">modelId (form-data)</span>
                          <Badge variant="destructive">required</Badge>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Response Format</h3>
                      <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`{
  "success": true,
  "text": "Extracted text content",
  "totalDetections": 5,
  "results": [
    {
      "text": "Individual text region",
      "confidence": 0.95,
      "x": 100, "y": 50,
      "width": 200, "height": 30
    }
  ],
  "processingTime": 1500,
  "fileName": "image.jpg",
  "cccdInfo": { ... }
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
                  <h3 className="font-semibold mb-4">Available OCR Models</h3>
                  <div className="grid gap-3">
                    {ocrModels.map((model) => (
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

            <TabsContent value="endpoints" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">All Available Endpoints</h3>
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg">
                      <code className="text-sm font-medium">GET /api/test</code>
                      <p className="text-sm text-gray-600 mt-1">Test API connection</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <code className="text-sm font-medium">POST /api/ocr/extract</code>
                      <p className="text-sm text-gray-600 mt-1">Simple OCR text extraction</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <code className="text-sm font-medium">POST /api/detection/detect</code>
                      <p className="text-sm text-gray-600 mt-1">Object detection</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <code className="text-sm font-medium">POST /api/barcode/detect</code>
                      <p className="text-sm text-gray-600 mt-1">Barcode/QR code detection</p>
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

export default OCRDetection;
