
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, ArrowLeft, Code, Globe, Zap, Shield } from "lucide-react";
import { Link } from "react-router-dom";

const Documentation = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <ArrowLeft className="h-5 w-5" />
            <Eye className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">CelestialEye</span>
          </Link>
          <Badge className="bg-indigo-100 text-indigo-700">API Documentation</Badge>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Code className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">API Documentation</h1>
              <p className="text-gray-600">Complete reference for CelestialEye computer vision APIs</p>
            </div>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="text-center">
              <Globe className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <CardTitle>Base URL</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <code className="bg-gray-100 px-3 py-2 rounded text-sm">/api</code>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <CardTitle>CORS</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <Badge className="bg-green-100 text-green-700">Enabled for all origins</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Zap className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <CardTitle>Rate Limiting</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <Badge variant="outline">No limits currently</Badge>
            </CardContent>
          </Card>
        </div>

        {/* API Endpoints */}
        <Tabs defaultValue="barcode" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="barcode">Barcode</TabsTrigger>
            <TabsTrigger value="qrcode">QR Code</TabsTrigger>
            <TabsTrigger value="ocr">OCR</TabsTrigger>
            <TabsTrigger value="face">Face</TabsTrigger>
            <TabsTrigger value="detection">Detection</TabsTrigger>
            <TabsTrigger value="models">Models</TabsTrigger>
          </TabsList>

          <TabsContent value="barcode" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Barcode Detection API</CardTitle>
                <CardDescription>Process documents and images to detect various barcode formats</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Process Document</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="mb-3">
                      <Badge className="mr-2">POST</Badge>
                      <code className="text-sm">/api/barcode/process</code>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Content-Type: multipart/form-data
                    </p>
                    <div className="space-y-2">
                      <h4 className="font-medium">Parameters:</h4>
                      <div className="pl-4">
                        <p className="text-sm"><code>file</code> (required) - PDF, TIFF, or image file containing barcodes</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Response Example:</h4>
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
          "content": "123456789",
          "format": "CODE_128",
          "confidence": 0.95,
          "boundingBox": {
            "x1": 100, "y1": 100,
            "x2": 200, "y2": 150
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

          <TabsContent value="qrcode" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>QR Code Detection API</CardTitle>
                <CardDescription>Detect and decode QR codes with precise positioning</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Detect QR Codes</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="mb-3">
                      <Badge className="mr-2">POST</Badge>
                      <code className="text-sm">/api/qrcode/detect</code>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Parameters:</h4>
                      <div className="pl-4">
                        <p className="text-sm"><code>image</code> (required) - Image file containing QR codes</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Get Status</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="mb-3">
                      <Badge variant="secondary" className="mr-2">GET</Badge>
                      <code className="text-sm">/api/qrcode/status</code>
                    </div>
                    <p className="text-sm text-gray-600">
                      Returns service status and capabilities
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">WebSocket Stream</h3>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="mb-3">
                      <Badge variant="outline" className="mr-2">WebSocket</Badge>
                      <code className="text-sm">/ws/detect-stream</code>
                    </div>
                    <p className="text-sm text-gray-600">
                      Real-time QR code and CCCD detection from video frames
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ocr" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>OCR Text Recognition API</CardTitle>
                <CardDescription>Extract text from images with high accuracy</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Perform OCR Detection</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="mb-3">
                      <Badge className="mr-2">POST</Badge>
                      <code className="text-sm">/api/ocr/detect/{`{modelName}`}</code>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Parameters:</h4>
                      <div className="pl-4 space-y-1">
                        <p className="text-sm"><code>modelName</code> (path) - Name of the OCR model to use</p>
                        <p className="text-sm"><code>image</code> (required) - Image file to perform OCR on</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Response Example:</h4>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`{
  "success": true,
  "data": {
    "detections": [
      {
        "text": "Sample text",
        "confidence": 0.95,
        "boundingBox": {
          "x1": 100, "y1": 100,
          "x2": 200, "y2": 150
        }
      }
    ]
  }
}`}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="face" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Face Recognition API</CardTitle>
                <CardDescription>Register and authenticate faces with high precision</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Register Face</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="mb-3">
                        <Badge className="mr-2">POST</Badge>
                        <code className="text-sm">/api/face/register</code>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium">Parameters:</h4>
                        <div className="pl-4 space-y-1">
                          <p className="text-sm"><code>image</code> (required) - Image containing face</p>
                          <p className="text-sm"><code>name</code> (required) - Person's name</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Authenticate Face</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="mb-3">
                        <Badge className="mr-2">POST</Badge>
                        <code className="text-sm">/api/face/authenticate</code>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium">Parameters:</h4>
                        <div className="pl-4">
                          <p className="text-sm"><code>image</code> (required) - Image to authenticate</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">List Registered Faces</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="mb-3">
                      <Badge variant="secondary" className="mr-2">GET</Badge>
                      <code className="text-sm">/api/face/list</code>
                    </div>
                    <p className="text-sm text-gray-600">
                      Returns array of registered face data
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">WebSocket Stream</h3>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="mb-3">
                      <Badge variant="outline" className="mr-2">WebSocket</Badge>
                      <code className="text-sm">/ws/face-stream</code>
                    </div>
                    <p className="text-sm text-gray-600">
                      Real-time face registration and authentication from video frames
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="detection" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Object Detection API</CardTitle>
                <CardDescription>Detect and classify objects using YOLO models</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Detect Objects</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="mb-3">
                      <Badge className="mr-2">POST</Badge>
                      <code className="text-sm">/api/detection/detect/{`{modelName}`}</code>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Parameters:</h4>
                      <div className="pl-4 space-y-1">
                        <p className="text-sm"><code>modelName</code> (path) - Detection model name</p>
                        <p className="text-sm"><code>image</code> (required) - Image file</p>
                        <p className="text-sm"><code>classNames</code> (optional) - Comma-separated class names</p>
                        <p className="text-sm"><code>confThreshold</code> (optional) - Confidence threshold</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">List Models</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="mb-3">
                        <Badge variant="secondary" className="mr-2">GET</Badge>
                        <code className="text-sm">/api/detection/models</code>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Health Check</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="mb-3">
                        <Badge variant="secondary" className="mr-2">GET</Badge>
                        <code className="text-sm">/api/detection/health</code>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Clear Model Cache</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="mb-3">
                        <Badge variant="destructive" className="mr-2">DELETE</Badge>
                        <code className="text-sm">/api/detection/cache/{`{modelName}`}</code>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Clear All Cache</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="mb-3">
                        <Badge variant="destructive" className="mr-2">DELETE</Badge>
                        <code className="text-sm">/api/detection/cache</code>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="models" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Model Management API</CardTitle>
                <CardDescription>Upload and manage custom ONNX models</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Upload Model</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="mb-3">
                      <Badge className="mr-2">POST</Badge>
                      <code className="text-sm">/api/models/upload</code>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Parameters:</h4>
                      <div className="pl-4 space-y-1">
                        <p className="text-sm"><code>file</code> (required) - ONNX model file</p>
                        <p className="text-sm"><code>name</code> (required) - Model name</p>
                        <p className="text-sm"><code>description</code> (optional) - Model description</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">List Models</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="mb-3">
                        <Badge variant="secondary" className="mr-2">GET</Badge>
                        <code className="text-sm">/api/models/list</code>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Get Model Info</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="mb-3">
                        <Badge variant="secondary" className="mr-2">GET</Badge>
                        <code className="text-sm">/api/models/{`{modelName}`}</code>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Delete Model</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="mb-3">
                      <Badge variant="destructive" className="mr-2">DELETE</Badge>
                      <code className="text-sm">/api/models/{`{modelName}`}</code>
                    </div>
                    <p className="text-sm text-gray-600">
                      Permanently delete a model from the system
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="font-medium mb-2">Example cURL Request:</h4>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`curl -X POST \\
  -F "file=@model.onnx" \\
  -F "name=my_yolo_model" \\
  -F "description=YOLOv8 model" \\
  /api/models/upload`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Error Handling */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Error Handling</CardTitle>
            <CardDescription>HTTP status codes and error responses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">HTTP Status Codes</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                    <span className="font-medium">200</span>
                    <span className="text-sm text-green-700">Success</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                    <span className="font-medium">400</span>
                    <span className="text-sm text-yellow-700">Bad Request</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-orange-50 rounded">
                    <span className="font-medium">404</span>
                    <span className="text-sm text-orange-700">Not Found</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                    <span className="font-medium">500</span>
                    <span className="text-sm text-red-700">Internal Server Error</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Error Response Format</h3>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm">
{`{
  "success": false,
  "error": "Error description"
}`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Documentation;
