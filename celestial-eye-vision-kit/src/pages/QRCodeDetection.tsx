
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Upload, ArrowLeft, CheckCircle, Eye, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { DetectionCanvas } from "@/components/DetectionCanvas";
import { ResultsTable } from "@/components/ResultsTable";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import axios from "axios";

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

interface QRDetection {
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

interface QRResult {
  success: boolean;
  totalPages: number;
  detectedPages: number;
  totalBarcodes: number;
  results: Array<{
    pageNumber: number;
    barcodes: Array<{
      content: string;
      format: string;
      confidence: number;
      boundingBox: {
        x1: number;
        y1: number;
        x2: number;
        y2: number;
      };
    }>;
  }>;
}

const QRCodeDetection = () => {
  const [file, setFile] = useState<File | null>(null);
  const [selectedModel, setSelectedModel] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [detections, setDetections] = useState<QRDetection[]>([]);
  const [results, setResults] = useState<QRResult | null>(null);
  const [qrModels, setQrModels] = useState<ModelInfo[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(true);

  // Load QR models on component mount
  useEffect(() => {
    loadQRModels();
  }, []);

  const loadQRModels = async () => {
    try {
      setIsLoadingModels(true);
      const response = await axios.get('/api/models/list');

      if (response.data.success) {
        // Filter QR Code Detection models that are ACTIVE
        const qrOnlyModels = response.data.models.filter(
          (model: ModelInfo) =>
            (model.type === "QR Detection" || model.type === "Barcode Detection") &&
            model.status === "ACTIVE"
        );
        setQrModels(qrOnlyModels);

        // Auto-select first model if available
        if (qrOnlyModels.length > 0 && !selectedModel) {
          setSelectedModel(qrOnlyModels[0].id);
        }
      } else {
        throw new Error(response.data.message || "Failed to load models");
      }
    } catch (error: any) {
      console.error('Error loading QR models:', error);
      toast({
        title: "Failed to load models",
        description: error.message || "Could not load QR detection models",
        variant: "destructive",
      });
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setDetections([]);
      setResults(null);
    }
  };
  const processQRCodes = async () => {
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
        description: "Please select a QR detection model",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setDetections([]);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('modelId', selectedModel);

      const response = await axios.post('/api/barcode/process', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });

      console.log('QR API Response:', response.data);

      if (response.data.success) {
        const apiData: QRResult = response.data;
        setResults(apiData);

        // Filter only QR codes from the results
        const qrDetections: QRDetection[] = [];
        if (apiData.results && apiData.results.length > 0) {
          apiData.results.forEach((pageResult) => {
            pageResult.barcodes.forEach((barcode) => {
              if (barcode.format.includes('QR') || barcode.format === 'QR_CODE') {
                qrDetections.push({
                  content: barcode.content,
                  format: barcode.format,
                  confidence: barcode.confidence,
                  boundingBox: barcode.boundingBox
                });
              }
            });
          });
        }

        setDetections(qrDetections);

        const selectedModelInfo = qrModels.find(m => m.id === selectedModel);
        toast({
          title: "QR Code Processing Complete!",
          description: `Found ${qrDetections.length} QR codes using ${selectedModelInfo?.name}`,
        });
      } else {
        throw new Error(response.data.error || 'QR code processing failed');
      }
    } catch (error: any) {
      console.error('QR Processing Error:', error);

      let errorMessage = "An error occurred during QR code processing";
      if (error.response?.status === 404) {
        errorMessage = "QR API endpoint not found. Please ensure the backend server is running.";
      } else if (error.response?.status === 500) {
        errorMessage = "Server error occurred during QR code processing.";
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = "Request timeout. The file might be too large or server is busy.";
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "QR Code Processing Failed",
        description: errorMessage,
        variant: "destructive",
      });
      setDetections([]);
      setResults(null);
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
          <Badge className="bg-green-100 text-green-700">QR Code Detection</Badge>
        </div>
      </div>
    </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Search className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">QR Code Detection</h1>
              <p className="text-gray-600">Detect and decode QR codes with precise positioning and content extraction</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="h-5 w-5" />
                <span>Upload Image</span>
              </CardTitle>
              <CardDescription>
                Select an image containing QR codes for detection
              </CardDescription>
            </CardHeader>            <CardContent className="space-y-4">
              {/* Model Selection */}
              <div className="space-y-2">
                <Label htmlFor="model">QR Detection Model</Label>
                {isLoadingModels ? (
                  <div className="flex items-center space-x-2 p-3 border rounded-md">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin"></div>
                    <span className="text-sm text-gray-600">Loading models...</span>
                  </div>
                ) : qrModels.length === 0 ? (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm text-yellow-800">
                        No QR detection models found.
                      </span>
                    </div>
                    <p className="text-xs text-yellow-700 mt-1">
                      Please upload QR detection models in Model Management.
                    </p>
                  </div>
                ) : (
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select QR detection model" />
                    </SelectTrigger>
                    <SelectContent>
                      {qrModels.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          <div>
                            <div className="font-medium">{model.name}</div>
                            <div className="text-sm text-gray-500">{model.description}</div>
                            <div className="text-xs text-green-600">
                              {(model.fileSize / 1024 / 1024).toFixed(1)}MB • {model.type}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {selectedModel && qrModels.length > 0 && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    {(() => {
                      const model = qrModels.find(m => m.id === selectedModel);
                      return model ? (
                        <div className="text-sm">
                          <p className="font-medium text-green-900">{model.name}</p>
                          <p className="text-green-700">{model.description}</p>
                          <p className="text-green-600 text-xs mt-1">
                            Size: {(model.fileSize / 1024 / 1024).toFixed(2)} MB •
                            Type: {model.type} •
                            Uploaded: {new Date(model.uploadTime).toLocaleDateString()}
                          </p>
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">Select Image File</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".jpg,.jpeg,.png,.gif,.bmp"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                <p className="text-sm text-gray-500">
                  Supported: JPG, PNG, GIF, BMP
                </p>
              </div>

              {file && (
                <div className="p-4 bg-gray-50 rounded-lg animate-fade-in">
                  <div className="flex items-center space-x-3">
                    <Search className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </div>
              )}              <Button
                onClick={processQRCodes}
                disabled={!file || !selectedModel || isProcessing || qrModels.length === 0}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                {isProcessing ? "Detecting QR Codes..." : "Detect QR Codes"}
              </Button>
            </CardContent>
          </Card>

          <div className="lg:col-span-2">
            {isProcessing ? (
              <LoadingSpinner text="Analyzing image for QR codes..." />
            ) : (
              <DetectionCanvas
                imageFile={file}
                detections={detections}
                isProcessing={isProcessing}
              />
            )}
          </div>
        </div>

        {detections.length > 0 && (
          <div className="animate-fade-in">
            <ResultsTable detections={detections} />
          </div>
        )}        <div className="mt-12">
          <Tabs defaultValue="detect" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="detect">Detection API</TabsTrigger>
              <TabsTrigger value="models">Available Models</TabsTrigger>
              <TabsTrigger value="endpoints">All Endpoints</TabsTrigger>
            </TabsList>
            <TabsContent value="detect" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Endpoint URL</h3>
                      <code className="bg-gray-100 px-3 py-2 rounded text-sm block">
                        POST /api/barcode/process
                      </code>
                      <p className="text-sm text-gray-600 mt-2">
                        Process images for QR code detection using selected model
                      </p>
                    </div>                    <div>
                      <h3 className="font-semibold mb-2">Parameters</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="font-medium">file (multipart)</span>
                          <Badge variant="destructive">required</Badge>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="font-medium">modelId (form-data)</span>
                          <Badge variant="outline">optional</Badge>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Response Format</h3>
                      <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                        {`{
  "success": true,
  "totalPages": 1,
  "detectedPages": 1,
  "totalBarcodes": 2,
  "results": [
    {
      "pageNumber": 1,
      "barcodes": [
        {
          "content": "https://example.com",
          "format": "QR_CODE",
          "confidence": 0.98,
          "boundingBox": {
            "x1": 100, "y1": 100,
            "x2": 200, "y2": 200
          }
        }
      ]
    }
  ]
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
                  <h3 className="font-semibold mb-4">Available QR Detection Models</h3>
                  <div className="grid gap-3">
                    {qrModels.map((model) => (
                      <div key={model.id} className="p-3 border rounded-lg">
                        <div className="font-medium">{model.name}</div>
                        <div className="text-sm text-gray-500">{model.description}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {model.id}
                          </code>
                          <Badge variant="outline" className="text-xs">
                            {model.type}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {(model.fileSize / 1024 / 1024).toFixed(1)}MB
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {qrModels.length === 0 && (
                      <p className="text-gray-500 text-center py-4">
                        No QR detection models available. Please upload models in Model Management.
                      </p>
                    )}
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
                      <code className="text-sm font-medium">POST /api/barcode/process</code>
                      <p className="text-sm text-gray-600 mt-1">Process documents for QR code detection</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <code className="text-sm font-medium">POST /api/barcode/detect</code>
                      <p className="text-sm text-gray-600 mt-1">Simple QR code detection for images</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <code className="text-sm font-medium">GET /api/models/list</code>
                      <p className="text-sm text-gray-600 mt-1">List all available detection models</p>
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

export default QRCodeDetection;
