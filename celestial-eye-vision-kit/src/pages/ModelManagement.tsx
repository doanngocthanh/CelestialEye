import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, ArrowLeft, CheckCircle, Eye, Trash2, Download, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
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

interface APIResponse {
  success: boolean;
  models: ModelInfo[];
  message?: string;
}

const ModelManagement = () => {
  const [file, setFile] = useState<File | null>(null);
  const [modelName, setModelName] = useState("");
  const [modelDescription, setModelDescription] = useState("");
  const [modelType, setModelType] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [models, setModels] = useState<ModelInfo[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };  const handleUpload = async () => {
    if (!file || !modelName.trim() || !modelType) {
      toast({
        title: "Missing information",
        description: "Please select a file, enter a model name, and choose a model type",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', modelName.trim());
      formData.append('type', modelType);
      if (modelDescription.trim()) {
        formData.append('description', modelDescription.trim());
      }

      const response = await axios.post('/api/models/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 second timeout for large files
      });

      if (response.data.success) {
        // Reload models list
        await loadModels();
        
        // Clear form
        setFile(null);
        setModelName("");
        setModelDescription("");
        setModelType("");
        
        toast({
          title: "Model uploaded successfully!",
          description: `${response.data.modelName} is now available for use`,
        });
      } else {
        throw new Error(response.data.message || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      
      let errorMessage = "An error occurred during upload";
      if (error.response?.status === 400) {
        errorMessage = error.response.data.message || "Invalid file or parameters";
      } else if (error.response?.status === 500) {
        errorMessage = "Server error during upload";
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = "Upload timeout. The file might be too large.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };
  const handleDeleteModel = async (modelId: string) => {
    try {
      const response = await axios.delete(`/api/models/${modelId}`);
      
      // Remove from local state regardless of API response
      setModels(prev => prev.filter(model => model.id !== modelId));
      
      toast({
        title: "Model deleted",
        description: "Model has been removed from the system",
      });
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: "Delete failed", 
        description: error.response?.data?.message || error.message || "Failed to delete model",
        variant: "destructive",
      });
    }
  };
  const toggleModelStatus = async (modelId: string) => {
    try {
      const response = await axios.put(`/api/models/${modelId}/status`);
      
      if (response.data.success) {
        // Update local state
        setModels(prev => prev.map(model => 
          model.id === modelId 
            ? { ...model, status: model.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" }
            : model
        ));
        
        toast({
          title: "Status updated",
          description: `Model is now ${response.data.status.toLowerCase()}`,
        });
      }
    } catch (error: any) {
      console.error('Toggle status error:', error);
      toast({
        title: "Status update failed",
        description: error.response?.data?.message || error.message || "Failed to update model status",
        variant: "destructive",
      });
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

  const formatFileSize = (bytes: number): string => {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  // Load models on component mount
  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/models/list');
      
      if (response.data.success) {
        setModels(response.data.models);
      } else {
        toast({
          title: "Failed to load models",
          description: response.data.message || "Unknown error",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Load models error:', error);
      toast({
        title: "Failed to load models",
        description: error.response?.data?.message || error.message || "Cannot connect to backend",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
            <Badge className="bg-indigo-100 text-indigo-700">Model Management</Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Upload className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Model Management</h1>
              <p className="text-gray-600">Upload, manage, and deploy custom ONNX models for specialized tasks</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="h-5 w-5" />
                <span>Upload Model</span>
              </CardTitle>
              <CardDescription>
                Upload a new ONNX model to the system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">              <div className="space-y-2">
                <Label htmlFor="modelName">Model Name</Label>
                <Input
                  id="modelName"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="Enter model name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="modelType">Model Type</Label>
                <Select value={modelType} onValueChange={setModelType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select model type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OCR">OCR (Text Recognition)</SelectItem>
                    <SelectItem value="Object Detection">Object Detection</SelectItem>
                    <SelectItem value="Barcode Detection">Barcode Detection</SelectItem>
                    <SelectItem value="QR Code Detection">QR Code Detection</SelectItem>
                    <SelectItem value="Face Recognition">Face Recognition</SelectItem>
                    <SelectItem value="Document Analysis">Document Analysis</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={modelDescription}
                  onChange={(e) => setModelDescription(e.target.value)}
                  placeholder="Describe the model's purpose and capabilities"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">Select ONNX Model File</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".onnx"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                <p className="text-sm text-gray-500">
                  Only ONNX format supported
                </p>
              </div>

              {file && (
                <div className="p-4 bg-gray-50 rounded-lg animate-fade-in">
                  <div className="flex items-center space-x-3">
                    <Upload className="h-8 w-8 text-indigo-600" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </div>
              )}              <Button 
                onClick={handleUpload} 
                disabled={!file || !modelName.trim() || !modelType || isUploading}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                size="lg"
              >
                {isUploading ? "Uploading Model..." : "Upload Model"}
              </Button>
            </CardContent>
          </Card>          <div className="lg:col-span-2">
            {isUploading ? (
              <LoadingSpinner text="Uploading and validating model..." />
            ) : isLoading ? (
              <LoadingSpinner text="Loading models..." />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Info className="h-5 w-5" />
                    <span>Uploaded Models ({models.length})</span>
                  </CardTitle>
                  <CardDescription>
                    Manage your uploaded and pre-trained models
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {models.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No models uploaded yet. Upload your first model to get started.</p>
                      </div>
                    ) : (
                      models.map((model) => (
                        <div 
                          key={model.id} 
                          className="p-4 border rounded-lg hover:shadow-md transition-all duration-200 group"
                        >                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="font-semibold text-lg group-hover:text-indigo-600 transition-colors">
                                  {model.name}
                                </h3>
                                <Badge 
                                  variant={model.status === "ACTIVE" ? "default" : "secondary"}
                                  className={model.status === "ACTIVE" ? "bg-green-100 text-green-700" : ""}
                                >
                                  {model.status.toLowerCase()}
                                </Badge>
                              </div>
                              <div className="mb-3">
                                <Badge variant="outline" className="text-indigo-600 border-indigo-200 bg-indigo-50">
                                  {model.type}
                                </Badge>
                              </div>
                              <p className="text-gray-600 mb-3">{model.description}</p>
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span>Size: {formatFileSize(model.fileSize)}</span>
                                <span>Uploaded: {formatDate(model.uploadTime)}</span>
                                <span className="text-xs text-gray-400">ID: {model.id}</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleModelStatus(model.id)}
                              >
                                {model.status === "ACTIVE" ? "Deactivate" : "Activate"}
                              </Button>
                              <Button
                                variant="outline" 
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDeleteModel(model.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>        <div className="mt-12">
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="upload">Upload API</TabsTrigger>
              <TabsTrigger value="list">List API</TabsTrigger>
              <TabsTrigger value="info">Info API</TabsTrigger>
              <TabsTrigger value="delete">Delete API</TabsTrigger>
              <TabsTrigger value="status">Status API</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Endpoint URL</h3>                      <code className="bg-gray-100 px-3 py-2 rounded text-sm block">
                        POST /api/models/upload
                      </code>
                    </div>                    <div>
                      <h3 className="font-semibold mb-2">Parameters</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="font-medium">file (multipart)</span>
                          <Badge variant="destructive">required</Badge>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="font-medium">name (form-data)</span>
                          <Badge variant="destructive">required</Badge>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="font-medium">type (form-data)</span>
                          <Badge variant="destructive">required</Badge>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="font-medium">description (form-data)</span>
                          <Badge variant="outline">optional</Badge>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Response Format</h3>
                      <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`{
  "success": true,
  "message": "Model uploaded successfully",
  "modelId": "mo_hinh_nhan_dien_1234567",
  "modelName": "Mô Hình Nhận Diện",
  "model": {
    "id": "mo_hinh_nhan_dien_1234567",
    "name": "Mô Hình Nhận Diện", 
    "fileName": "model.onnx",
    "description": "Model nhận diện vật thể",
    "type": "Object Detection",
    "status": "ACTIVE",
    "fileSize": 42500000,
    "uploadTime": "2024-01-10T10:30:00"
  }
}`}
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
              <TabsContent value="list" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Endpoint URL</h3>
                      <code className="bg-gray-100 px-3 py-2 rounded text-sm block">
                        GET /api/models/list
                      </code>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Response Format</h3>
                      <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`{
  "success": true,
  "models": [
    {
      "id": "mo_hinh_ocr_tieng_viet",
      "name": "Mô Hình OCR Tiếng Việt", 
      "fileName": "ocr_model.onnx",
      "description": "Nhận dạng văn bản tiếng Việt",
      "type": "OCR",
      "status": "ACTIVE",
      "fileSize": 25600000,
      "uploadTime": "2024-01-08T14:20:00"
    }
  ]
}`}
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="info" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Endpoint URL</h3>
                      <code className="bg-gray-100 px-3 py-2 rounded text-sm block">
                        GET /api/models/{`{modelName}`}
                      </code>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Parameters</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="font-medium">modelName (path)</span>
                          <Badge variant="destructive">required</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="delete" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Endpoint URL</h3>
                      <code className="bg-gray-100 px-3 py-2 rounded text-sm block">
                        DELETE /api/models/{`{modelName}`}
                      </code>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Parameters</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="font-medium">modelName (path)</span>
                          <Badge variant="destructive">required</Badge>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Warning</h3>
                      <p className="text-sm text-red-600">
                        This action permanently deletes the model and cannot be undone
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="status" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Endpoint URL</h3>
                      <code className="bg-gray-100 px-3 py-2 rounded text-sm block">
                        PUT /api/models/{`{modelId}`}/status
                      </code>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Parameters</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="font-medium">modelId (path)</span>
                          <Badge variant="destructive">required</Badge>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Response Format</h3>
                      <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`{
  "success": true,
  "message": "Model status updated",
  "modelId": "mo_hinh_nhan_dien_1234567",
  "status": "INACTIVE"
}`}
                      </pre>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Description</h3>
                      <p className="text-sm text-gray-600">
                        Toggle model status between ACTIVE and INACTIVE. Only ACTIVE models can be used for inference.
                      </p>
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

export default ModelManagement;
