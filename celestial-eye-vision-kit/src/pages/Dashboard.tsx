
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Scan, FileText, Users, Search, Upload, ArrowRight, Activity, Clock, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <Eye className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">CelestialEye</span>
          </Link>
          <nav className="flex items-center space-x-6">
            <Link to="/" className="text-gray-600 hover:text-blue-600 transition-colors">Home</Link>
            <Link to="/documentation" className="text-gray-600 hover:text-blue-600 transition-colors">API Docs</Link>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">API Dashboard</h1>
          <p className="text-gray-600">Explore and test CelestialEye computer vision capabilities</p>
        </div>

        {/* Status Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">API Status</CardTitle>
              <Activity className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-2xl font-bold text-green-600">Online</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">All services operational</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Time</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">~150ms</div>
              <p className="text-xs text-muted-foreground">Average processing time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Models</CardTitle>
              <Upload className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">5+</div>
              <p className="text-xs text-muted-foreground">Pre-trained models ready</p>
            </CardContent>
          </Card>
        </div>

        {/* API Modules */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <Scan className="h-6 w-6 text-blue-600" />
                </div>
                <Badge variant="secondary">REST API</Badge>
              </div>
              <CardTitle className="text-xl">Barcode Detection</CardTitle>
              <CardDescription>
                Process documents and images to detect various barcode formats including CODE_128, QR codes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="text-sm text-gray-600">
                  <strong>Endpoint:</strong> /api/barcode/process
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Method:</strong> POST (multipart/form-data)
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Supports:</strong> PDF, TIFF, Images
                </div>
              </div>
              <Button asChild className="w-full">
                <Link to="/barcode">
                  Try Barcode Detection <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <Search className="h-6 w-6 text-green-600" />
                </div>
                <Badge variant="secondary">REST + WebSocket</Badge>
              </div>
              <CardTitle className="text-xl">QR Code Detection</CardTitle>
              <CardDescription>
                Detect and decode QR codes with precise bounding box coordinates and content extraction
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="text-sm text-gray-600">
                  <strong>Endpoint:</strong> /api/qrcode/detect
                </div>
                <div className="text-sm text-gray-600">
                  <strong>WebSocket:</strong> /ws/detect-stream
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Features:</strong> Multi-QR support, Real-time
                </div>
              </div>
              <Button asChild className="w-full">
                <Link to="/qrcode">
                  Try QR Scanner <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <Badge variant="secondary">REST API</Badge>
              </div>
              <CardTitle className="text-xl">OCR Text Recognition</CardTitle>
              <CardDescription>
                Extract text from images using advanced OCR models with high accuracy and confidence scores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="text-sm text-gray-600">
                  <strong>Endpoint:</strong> /api/ocr/detect/{`{modelName}`}
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Method:</strong> POST (multipart/form-data)
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Output:</strong> Text + Confidence + Bounding Box
                </div>
              </div>
              <Button asChild className="w-full">
                <Link to="/ocr">
                  Try OCR <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
                <Badge variant="secondary">REST + WebSocket</Badge>
              </div>
              <CardTitle className="text-xl">Face Recognition</CardTitle>
              <CardDescription>
                Register new faces and authenticate existing ones with high precision and security
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="text-sm text-gray-600">
                  <strong>Register:</strong> /api/face/register
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Authenticate:</strong> /api/face/authenticate
                </div>
                <div className="text-sm text-gray-600">
                  <strong>WebSocket:</strong> /ws/face-stream
                </div>
              </div>
              <Button asChild className="w-full">
                <Link to="/face">
                  Try Face Recognition <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                  <Eye className="h-6 w-6 text-red-600" />
                </div>
                <Badge variant="secondary">REST API</Badge>
              </div>
              <CardTitle className="text-xl">Object Detection</CardTitle>
              <CardDescription>
                Detect and classify objects using state-of-the-art YOLO models with customizable parameters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="text-sm text-gray-600">
                  <strong>Endpoint:</strong> /api/detection/detect/{`{model}`}
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Models:</strong> YOLO v8, Custom ONNX
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Features:</strong> Class filtering, Confidence threshold
                </div>
              </div>
              <Button asChild className="w-full">
                <Link to="/detection">
                  Try Object Detection <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                  <Upload className="h-6 w-6 text-indigo-600" />
                </div>
                <Badge variant="secondary">REST API</Badge>
              </div>
              <CardTitle className="text-xl">Model Management</CardTitle>
              <CardDescription>
                Upload, manage, and deploy custom ONNX models for specialized computer vision tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="text-sm text-gray-600">
                  <strong>Upload:</strong> /api/models/upload
                </div>
                <div className="text-sm text-gray-600">
                  <strong>List:</strong> /api/models/list
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Format:</strong> ONNX models
                </div>
              </div>
              <Button asChild className="w-full">
                <Link to="/models">
                  Manage Models <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="mt-12 bg-white rounded-lg p-6 border">
          <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Button variant="outline" asChild className="justify-start">
              <Link to="/documentation">
                <FileText className="mr-2 h-4 w-4" />
                View Full API Documentation
              </Link>
            </Button>
            <Button variant="outline" asChild className="justify-start">
              <Link to="/models">
                <Upload className="mr-2 h-4 w-4" />
                Upload Custom Models
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
