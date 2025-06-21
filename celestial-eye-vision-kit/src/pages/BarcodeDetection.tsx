
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Scan, Upload, ArrowLeft, CheckCircle, FileText, BarChart3, AlertCircle } from "lucide-react";
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

interface BarcodeResult {
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

const BarcodeDetection = () => {
  const [file, setFile] = useState<File | null>(null);
  const [selectedModel, setSelectedModel] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<BarcodeResult | null>(null);
  const [barcodeModels, setBarcodeModels] = useState<ModelInfo[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(true);

  // Load Barcode models on component mount
  useEffect(() => {
    loadBarcodeModels();
  }, []);

  const loadBarcodeModels = async () => {
    try {
      setIsLoadingModels(true);
      const response = await axios.get('/api/models/list');
      
      if (response.data.success) {
        // Filter only Barcode Detection models that are ACTIVE
        const barcodeOnlyModels = response.data.models.filter(
          (model: ModelInfo) => model.type === "Barcode Detection" && model.status === "ACTIVE"
        );
        setBarcodeModels(barcodeOnlyModels);
        
        // Auto-select first model if available
        if (barcodeOnlyModels.length > 0 && !selectedModel) {
          setSelectedModel(barcodeOnlyModels[0].id);
        }
      } else {
        throw new Error(response.data.message || "Failed to load models");
      }
    } catch (error: any) {
      console.error('Error loading barcode models:', error);
      toast({
        title: "Failed to load models",
        description: error.message || "Could not load barcode detection models",
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
      setResults(null);
    }
  };
  const processBarcodes = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file to process",
        variant: "destructive",
      });
      return;
    }

    if (!selectedModel) {
      toast({
        title: "No model selected",
        description: "Please select a barcode detection model",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setResults(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('modelId', selectedModel);

      const response = await axios.post('/api/barcode/process', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 second timeout for larger files
      });

      console.log('Barcode API Response:', response.data);

      if (response.data.success) {
        setResults(response.data);
        
        toast({
          title: "Barcode Processing Complete!",
          description: `Found ${response.data.totalBarcodes} barcodes in ${response.data.detectedPages} pages`,
        });
      } else {
        throw new Error(response.data.error || 'Barcode processing failed');
      }
    } catch (error: any) {
      console.error('Barcode Processing Error:', error);
      
      let errorMessage = "An error occurred during barcode processing";
      if (error.response?.status === 404) {
        errorMessage = "Barcode API endpoint not found. Please ensure the backend server is running.";
      } else if (error.response?.status === 500) {
        errorMessage = "Server error occurred during barcode processing.";
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = "Request timeout. The file might be too large or server is busy.";
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Barcode Processing Failed",
        description: errorMessage,
        variant: "destructive",
      });
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}      <header className="bg-white border-b sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <ArrowLeft className="h-5 w-5" />
            <Eye className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">CelestialEye</span>
          </Link>
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={testApiConnection}>
              Test API
            </Button>
            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors">
              <Scan className="h-4 w-4 mr-1" />
              Barcode Detection
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
              <Scan className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Barcode Detection</h1>
              <p className="text-gray-600">Advanced barcode and QR code detection with AI-powered analysis</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Upload Section */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="h-5 w-5 text-blue-600" />
                <span>Upload Document</span>
              </CardTitle>
              <CardDescription>
                Support for PDF, TIFF, and image files containing barcodes
              </CardDescription>
            </CardHeader>            <CardContent className="space-y-6">
              {/* Model Selection */}
              <div className="space-y-2">
                <Label htmlFor="model">Barcode Detection Model</Label>
                {isLoadingModels ? (
                  <div className="flex items-center space-x-2 p-3 border rounded-md">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                    <span className="text-sm text-gray-600">Loading models...</span>
                  </div>
                ) : barcodeModels.length === 0 ? (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm text-yellow-800">
                        No active barcode detection models found.
                      </span>
                    </div>
                    <p className="text-xs text-yellow-700 mt-1">
                      Please upload a barcode detection model in Model Management.
                    </p>
                  </div>
                ) : (
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a barcode detection model" />
                    </SelectTrigger>
                    <SelectContent>
                      {barcodeModels.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          <div className="flex items-center justify-between w-full">
                            <span className="font-medium">{model.name}</span>
                            <Badge variant="outline" className="ml-2 text-xs">
                              {(model.fileSize / 1024 / 1024).toFixed(1)}MB
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                
                {selectedModel && barcodeModels.length > 0 && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    {(() => {
                      const model = barcodeModels.find(m => m.id === selectedModel);
                      return model ? (
                        <div className="text-sm">
                          <p className="font-medium text-blue-900">{model.name}</p>
                          <p className="text-blue-700">{model.description}</p>
                          <p className="text-blue-600 text-xs mt-1">
                            Size: {(model.fileSize / 1024 / 1024).toFixed(2)} MB • 
                            Uploaded: {new Date(model.uploadTime).toLocaleDateString()}
                          </p>
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">Select File</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.tiff,.tif,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="cursor-pointer hover:border-blue-300 transition-colors"
                />
                <p className="text-sm text-gray-500">
                  Supported formats: PDF, TIFF, JPG, PNG (Max: 10MB)
                </p>
              </div>

              {file && (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 hover:border-blue-300 transition-colors">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type}
                      </p>
                    </div>
                  </div>
                </div>
              )}              <Button 
                onClick={processBarcodes} 
                disabled={!file || !selectedModel || isProcessing || barcodeModels.length === 0}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
                size="lg"
              >
                {isProcessing ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Scan className="h-4 w-4" />
                    <span>Detect Barcodes</span>
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Summary Stats */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                <span>Detection Summary</span>
              </CardTitle>
              <CardDescription>
                Overview of detection results and statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!results ? (
                <div className="text-center py-12 text-gray-500">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Upload and process a file to see detection statistics</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg hover:shadow-md transition-shadow">
                      <div className="text-2xl font-bold text-blue-600">{results.totalPages}</div>
                      <div className="text-sm text-gray-600">Total Pages</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg hover:shadow-md transition-shadow">
                      <div className="text-2xl font-bold text-green-600">{results.totalBarcodes}</div>
                      <div className="text-sm text-gray-600">Barcodes Found</div>
                    </div>
                  </div>                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900">Format Distribution:</h4>
                    {/* Format breakdown */}
                    {results.results.length > 0 && results.results[0].barcodes.length > 0 ? (
                      Object.entries(
                        results.results[0].barcodes.reduce((acc: any, barcode: any) => {
                          acc[barcode.format] = (acc[barcode.format] || 0) + 1;
                          return acc;
                        }, {})
                      ).map(([format, count]: [string, any]) => (
                        <div key={format} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <Badge variant="outline">{format}</Badge>
                          <span className="text-sm font-medium">{count}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No barcodes detected</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detection Visualization */}
        {(file || isProcessing) && (
          <Card className="mb-8 hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5 text-purple-600" />
                <span>Detection Visualization</span>
              </CardTitle>
              <CardDescription>
                Visual representation of detected barcodes with bounding boxes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isProcessing ? (
                <LoadingSpinner size="lg" text="Analyzing image and detecting barcodes..." />
              ) : (                <DetectionCanvas
                  imageFile={file}
                  detections={results?.results?.[0]?.barcodes?.map(barcode => ({
                    content: barcode.content,
                    format: barcode.format,
                    confidence: barcode.confidence,
                    boundingBox: barcode.boundingBox
                  })) || []}
                  isProcessing={isProcessing}
                />
              )}
            </CardContent>
          </Card>
        )}

        {/* Results Table */}
        {results && (
          <Card className="mb-8 hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>Detection Results</span>
              </CardTitle>
              <CardDescription>
                Detailed information about each detected barcode
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResultsTable detections={results.results?.[0]?.barcodes?.map(barcode => ({
                content: barcode.content,
                format: barcode.format,
                confidence: barcode.confidence,
                boundingBox: barcode.boundingBox
              })) || []} />
            </CardContent>
          </Card>
        )}

        {/* API Information */}        <div className="mt-12">
          <Tabs defaultValue="endpoint" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="endpoint">API Endpoints</TabsTrigger>
              <TabsTrigger value="request">Request Format</TabsTrigger>
              <TabsTrigger value="response">Response Format</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
            </TabsList>
            
            <TabsContent value="endpoint" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Document Processing Endpoint</h3>
                      <code className="bg-gray-100 px-3 py-2 rounded text-sm block">
                        POST /api/barcode/process
                      </code>
                      <p className="text-sm text-gray-600 mt-2">
                        Process PDF, TIFF, or image files containing barcodes
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Simple Detection Endpoint</h3>
                      <code className="bg-gray-100 px-3 py-2 rounded text-sm block">
                        POST /api/barcode/detect
                      </code>
                      <p className="text-sm text-gray-600 mt-2">
                        Simple barcode detection for single images
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Content-Type</h3>
                      <code className="bg-gray-100 px-3 py-2 rounded text-sm block">
                        multipart/form-data
                      </code>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
              <TabsContent value="request" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Request Parameters</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-medium">file</span>
                      <Badge variant="destructive">required</Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      PDF, TIFF, or image file containing barcodes to be processed
                    </p>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-medium">modelId</span>
                      <Badge variant="outline">optional</Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      ID of the barcode detection model to use. If not provided, uses ZXing library only
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="response" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Response Example</h3>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
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
          "content": "123456789012",
          "format": "CODE_128",
          "confidence": 0.95,
          "boundingBox": {
            "x1": 100,
            "y1": 100,
            "x2": 300,
            "y2": 150
          }
        }
      ]
    }
  ]
}`}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>            <TabsContent value="features" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Supported Features</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Supported Formats</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• CODE_128</li>
                        <li>• EAN_13 / UPC_A</li>
                        <li>• QR Code</li>
                        <li>• Data Matrix</li>
                        <li>• PDF417</li>
                        <li>• And more...</li>
                      </ul>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">File Types</h4>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li>• PDF documents</li>
                        <li>• TIFF images</li>
                        <li>• JPEG/JPG images</li>
                        <li>• PNG images</li>
                        <li>• Multi-page support</li>
                      </ul>
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

export default BarcodeDetection;
