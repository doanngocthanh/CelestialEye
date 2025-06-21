
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Eye, Scan, FileText, Users, Search, Zap, Shield, Globe } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Eye className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">CelestialEye</span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/dashboard" className="text-gray-600 hover:text-blue-600 transition-colors">Dashboard</Link>
            <Link to="/documentation" className="text-gray-600 hover:text-blue-600 transition-colors">API Docs</Link>
            <Button asChild>
              <Link to="/dashboard">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-100">
            Computer Vision API
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Advanced Vision
            <span className="text-blue-600 block">Intelligence</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Powerful computer vision APIs for barcode detection, QR code scanning, OCR, 
            face recognition, and object detection. Build intelligent applications with ease.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" asChild className="text-lg px-8 py-6">
              <Link to="/dashboard">
                Explore API Features <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="text-lg px-8 py-6">
              <Link to="/documentation">View Documentation</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Powerful Vision Capabilities</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive computer vision tools to power your applications
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg hover:-translate-y-2">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                  <Scan className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Barcode Detection</CardTitle>
                <CardDescription>
                  Detect and decode various barcode formats including CODE_128, QR codes, and more
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" asChild className="w-full justify-between">
                  <Link to="/barcode">
                    Try Barcode Detection <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg hover:-translate-y-2">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                  <Search className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-xl">QR Code Scanning</CardTitle>
                <CardDescription>
                  Advanced QR code detection with multi-code support and precise bounding boxes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" asChild className="w-full justify-between">
                  <Link to="/qrcode">
                    Try QR Scanner <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg hover:-translate-y-2">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-xl">OCR Text Recognition</CardTitle>
                <CardDescription>
                  Extract text from images with high accuracy using advanced OCR models
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" asChild className="w-full justify-between">
                  <Link to="/ocr">
                    Try OCR <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg hover:-translate-y-2">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-colors">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle className="text-xl">Face Recognition</CardTitle>
                <CardDescription>
                  Register and authenticate faces with high precision and security
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" asChild className="w-full justify-between">
                  <Link to="/face">
                    Try Face Recognition <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg hover:-translate-y-2">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-red-200 transition-colors">
                  <Eye className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle className="text-xl">Object Detection</CardTitle>
                <CardDescription>
                  Detect and classify objects using state-of-the-art YOLO models
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" asChild className="w-full justify-between">
                  <Link to="/detection">
                    Try Object Detection <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg hover:-translate-y-2">
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-200 transition-colors">
                  <FileText className="h-6 w-6 text-indigo-600" />
                </div>
                <CardTitle className="text-xl">Model Management</CardTitle>
                <CardDescription>
                  Upload, manage, and deploy custom ONNX models for specialized tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" asChild className="w-full justify-between">
                  <Link to="/models">
                    Manage Models <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose CelestialEye?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built for developers, designed for scale
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Zap className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">High Performance</h3>
              <p className="text-gray-600">
                Optimized algorithms deliver fast and accurate results for real-time applications
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Secure & Reliable</h3>
              <p className="text-gray-600">
                Enterprise-grade security with robust error handling and data protection
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Globe className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Easy Integration</h3>
              <p className="text-gray-600">
                RESTful APIs and WebSocket support for seamless integration with any platform
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-blue-600">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Explore our powerful computer vision APIs and start building intelligent applications today
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild className="text-lg px-8 py-6">
              <Link to="/dashboard">
                Try Demo <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8 py-6 border-white text-white hover:bg-white hover:text-blue-600">
              <Link to="/documentation">API Documentation</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Eye className="h-6 w-6 text-blue-400" />
            <span className="text-xl font-bold">CelestialEye</span>
          </div>
          <p className="text-gray-400 mb-4">Advanced Computer Vision API Platform</p>
          <div className="flex justify-center space-x-6 text-sm text-gray-400">
            <Link to="/documentation" className="hover:text-white transition-colors">API Docs</Link>
            <Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
            <span>Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
