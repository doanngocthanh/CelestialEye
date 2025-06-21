import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Users, Upload, ArrowLeft, CheckCircle, Eye, UserPlus, UserCheck, 
  Camera, CameraOff, Wifi, WifiOff, Play, Square, Settings,
  AlertCircle, Clock, User, Activity, X, Check, AlertTriangle
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import axios from "axios";

interface FaceResult {
  success: boolean;
  action: "register" | "authenticate";
  personName?: string;
  id?: string;
  authenticated?: boolean;
  confidence?: number;
  message?: string;
  timestamp: string;
  source: "api" | "webcam";
}

const FaceRecognition = () => {  // Basic states
  const [file, setFile] = useState<File | null>(null);
  const [personName, setPersonName] = useState("");
  const [mode, setMode] = useState<"register" | "authenticate">("register");
  const [inputMethod, setInputMethod] = useState<"upload" | "webcam">("upload");
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<FaceResult | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  
  // WebSocket and Camera states
  const [wsConnected, setWsConnected] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [webSocket, setWebSocket] = useState<WebSocket | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Real registered faces loaded from API
  const [registeredFaces, setRegisteredFaces] = useState<Array<{
    id: string;
    name: string;
    registeredAt: string;
    confidence: number;
  }>>([]);
  const [loadingFaces, setLoadingFaces] = useState(true);  
  // Load registered faces from API
  useEffect(() => {
    loadRegisteredFaces();
  }, []);

  const loadRegisteredFaces = async () => {
    try {
      setLoadingFaces(true);
      const response = await axios.get('/api/face/list');
      if (response.data && Array.isArray(response.data)) {
        const faces = response.data.map((face: any) => ({
          id: face.id,
          name: face.personName,
          registeredAt: new Date(face.timestamp).toLocaleDateString(),
          confidence: 1.0 // Default confidence
        }));
        setRegisteredFaces(faces);
      }
    } catch (error) {
      console.error('Error loading registered faces:', error);
      // Keep empty array if API fails
      setRegisteredFaces([]);
    } finally {
      setLoadingFaces(false);
    }
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (webSocket) {
        webSocket.close();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [webSocket]);

  // WebSocket connection
  const connectWebSocket = () => {
    try {
      const ws = new WebSocket('ws://localhost:8080/ws/face-stream');
        ws.onopen = () => {
        console.log('WebSocket connected successfully');
        console.log('WebSocket ready state:', ws.readyState);
        setWsConnected(true);
        setWebSocket(ws);
        toast({
          title: "WebSocket Connected",
          description: "Real-time face recognition is now available",
        });
      };      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          
          if (data.type === 'face_detected') {
            setResults({
              ...data,
              timestamp: new Date().toISOString(),
              source: 'webcam'
            });

            // Play sound alert
            playAlert(data.success);

            // Auto-stop streaming after successful result
            if (data.success) {
              console.log('Face processing successful, stopping stream');
              setIsStreaming(false);
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
              
              // Show result modal for better visibility
              setShowResultModal(true);
              
              // Also show toast for immediate feedback
              toast({
                title: data.action === 'register' ? "🎉 Đăng ký thành công!" : "✅ Xác thực thành công!",
                description: data.message,
                duration: 5000,
              });
            } else {
              // For failed attempts, keep streaming but show error with modal
              setShowResultModal(true);
              
              toast({
                title: "⚠️ Thử lại",
                description: data.message,
                variant: "destructive",
                duration: 3000,
              });
            }

            // Reload registered faces if registration was successful
            if (data.action === 'register' && data.success) {
              loadRegisteredFaces();
            }
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };ws.onclose = (event) => {
        console.log('WebSocket disconnected. Code:', event.code, 'Reason:', event.reason);
        setWsConnected(false);
        setWebSocket(null);
        setIsStreaming(false);
        
        let message = "Real-time face recognition is not available";
        if (event.code === 1009) {
          message = "Message size too large. Image quality has been reduced automatically.";
        } else if (event.code === 1006) {
          message = "Connection failed - Backend server may not be running on port 8080";
        } else if (event.code === 1011) {
          message = "Server error occurred";
        } else if (event.reason) {
          message = `Connection closed: ${event.reason}`;
        }
        
        toast({
          title: "WebSocket Disconnected",
          description: message,
          variant: "destructive",
        });
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        toast({
          title: "WebSocket Error",
          description: "Failed to connect to face recognition service. Make sure backend is running on port 8080.",
          variant: "destructive",
        });
      };
      
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      toast({
        title: "Connection Failed",
        description: "Unable to establish WebSocket connection",
        variant: "destructive",
      });
    }
  };
  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 320, max: 640 }, 
          height: { ideal: 240, max: 480 },
          facingMode: 'user'
        },
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
        
        toast({
          title: "Camera Started",
          description: "Webcam is now active for face recognition",
        });
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Error",
        description: "Failed to access webcam. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setCameraActive(false);
    setIsStreaming(false);
    toast({
      title: "Camera Stopped",
      description: "Webcam has been deactivated",
    });
  };
  // Start/Stop streaming to WebSocket
  const toggleStreaming = () => {
    console.log("Toggle streaming called, current state:", isStreaming);
    
    if (isStreaming) {
      console.log("Stopping streaming...");
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsStreaming(false);
      toast({
        title: "Streaming Stopped",
        description: "Face recognition streaming has been stopped",
      });
    } else {
      console.log("Starting streaming...");
      console.log("Mode:", mode);
      console.log("Person name:", personName);
      console.log("WebSocket connected:", wsConnected);
      console.log("Camera active:", cameraActive);
      
      startFrameCapture();
      setIsStreaming(true);
      toast({
        title: "Streaming Started",
        description: `Real-time ${mode} is now active`,
      });
    }
  };// Capture and send frames to WebSocket
  const startFrameCapture = () => {
    console.log("Starting frame capture...");
    console.log("Video ref:", !!videoRef.current);
    console.log("Canvas ref:", !!canvasRef.current);
    console.log("WebSocket:", !!webSocket);
    console.log("Camera active:", cameraActive);
    
    if (!videoRef.current || !canvasRef.current || !webSocket || !cameraActive) {
      console.error("Missing required refs or connections for frame capture");
      return;
    }
    
    intervalRef.current = setInterval(() => {
      console.log("Frame capture interval triggered");
      console.log("Camera active:", cameraActive);
      console.log("WS connected:", wsConnected);
      console.log("WebSocket ready state:", webSocket?.readyState);
      
      if (!cameraActive || !wsConnected || webSocket.readyState !== WebSocket.OPEN) {
        console.warn("Skipping frame capture - conditions not met");
        return;
      }
      
      const video = videoRef.current!;
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d')!;
      
      console.log("Video dimensions:", video.videoWidth, "x", video.videoHeight);
      
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.warn("Video dimensions are 0, skipping frame");
        return;
      }
        // Resize to smaller dimensions to reduce message size
      const maxWidth = 320;
      const maxHeight = 240;
      let width = video.videoWidth;
      let height = video.videoHeight;
      
      console.log("Original video dimensions:", width, "x", height);
      
      // Calculate aspect ratio and resize
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }
      
      // Ensure dimensions are at least 1
      width = Math.max(1, Math.round(width));
      height = Math.max(1, Math.round(height));
      
      console.log("Resized dimensions:", width, "x", height);
      
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(video, 0, 0, width, height);
      
      // Convert to base64 and send via WebSocket with lower quality
      canvas.toBlob((blob) => {
        if (blob && webSocket && webSocket.readyState === WebSocket.OPEN) {
          console.log("Blob created, size:", blob.size);
          
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64data = reader.result as string;
            const messageData = {
              type: mode,
              image: base64data.split(',')[1],
              personName: mode === 'register' ? personName : undefined
            };
            
            // Check message size before sending
            const messageString = JSON.stringify(messageData);
            const messageSizeKB = Math.round(messageString.length / 1024);
            console.log(`Preparing WebSocket message: ${messageSizeKB}KB, type: ${mode}, personName: ${messageData.personName}`);
            
            if (messageSizeKB > 500) { // If message > 500KB, warn and skip
              console.warn(`Message too large (${messageSizeKB}KB), skipping frame`);
              return;
            }
            
            console.log("Sending WebSocket message...");
            webSocket.send(messageString);
            console.log("WebSocket message sent successfully");
          };
          
          reader.onerror = (error) => {
            console.error("FileReader error:", error);
          };
          
          reader.readAsDataURL(blob);
        } else {
          console.error("Cannot send message - blob or websocket unavailable");
          console.log("Blob:", !!blob);
          console.log("WebSocket:", !!webSocket);
          console.log("WebSocket ready state:", webSocket?.readyState);
        }
      }, 'image/jpeg', 0.5); // Lower quality (0.5 instead of 0.8)
    }, 3000); // Capture every 3 seconds (increased interval)
    
    console.log("Frame capture interval set");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResults(null);
    }
  };

  // API processing for file upload
  const processWithAPI = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select an image file to process",
        variant: "destructive",
      });
      return;
    }

    if (mode === "register" && !personName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a person name for registration",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      if (mode === 'register') {
        formData.append('name', personName);
      }
      
      const endpoint = mode === 'register' ? '/api/face/register' : '/api/face/authenticate';
      const response = await axios.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });

      console.log('Face API Response:', response.data);      if (response.data.success) {
        setResults({
          ...response.data,
          action: mode,
          source: 'api',
          timestamp: new Date().toISOString()
        });
        
        // Play sound and show modal
        playAlert(true);
        setShowResultModal(true);
        
        toast({
          title: mode === 'register' ? "🎉 Đăng ký thành công!" : "✅ Xác thực hoàn tất!",
          description: response.data.message || (mode === 'register' 
            ? `Khuôn mặt đã được đăng ký cho ${personName}` 
            : `Kết quả nhận diện: ${response.data.personName || 'Không xác định'}`),
          duration: 5000,
        });

        // Reload registered faces if registration was successful
        if (mode === 'register' && response.data.success) {
          loadRegisteredFaces();
        }
      } else {
        // Show error modal
        setResults({
          ...response.data,
          action: mode,
          source: 'api',
          timestamp: new Date().toISOString()
        });
        playAlert(false);
        setShowResultModal(true);
        throw new Error(response.data.message || 'Face processing failed');
      }
    } catch (error: any) {
      console.error('Face processing error:', error);
      
      let errorMessage = "An error occurred during face processing";
      if (error.response?.status === 404) {
        errorMessage = "Face API endpoint not found. Please ensure the backend server is running.";
      } else if (error.response?.status === 500) {
        errorMessage = "Server error occurred during face processing.";
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = "Request timeout. Please try again.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Face Processing Failed",
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
      const response = await axios.get('/api/face/test');
      toast({
        title: "API Connection Successful",
        description: `Face recognition backend is running. ${response.data.message}`,
      });
    } catch (error: any) {
      console.error('API test failed:', error);
      toast({
        title: "API Connection Failed",
        description: "Cannot connect to face recognition backend server. Please ensure it's running on port 8080.",
        variant: "destructive",
      });
    }
  };

  // Test WebSocket connection
  const testWebSocketMessage = () => {
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) {
      toast({
        title: "WebSocket Not Connected",
        description: "Please connect to WebSocket first",
        variant: "destructive",
      });
      return;
    }
    
    console.log("Sending test WebSocket message...");
    const testMessage = {
      type: "test",
      message: "Hello from frontend"
    };
    
    try {
      webSocket.send(JSON.stringify(testMessage));
      console.log("Test message sent successfully");
      toast({
        title: "Test Message Sent",
        description: "Check backend console for response",
      });
    } catch (error) {
      console.error("Error sending test message:", error);
      toast({
        title: "Test Message Failed",
        description: "Error sending test message",
        variant: "destructive",
      });
    }
  };
  // Play sound alert
  const playAlert = (success: boolean) => {
    try {
      // Vibration for mobile devices
      if ('vibrate' in navigator) {
        if (success) {
          navigator.vibrate([200, 100, 200]); // Success pattern
        } else {
          navigator.vibrate([500]); // Error pattern
        }
      }
      
      // Create audio context for sound alert
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      if (success) {
        // Success sound: pleasant double beep
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      } else {
        // Error sound: lower frequency beep
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      }
    } catch (error) {
      console.log("Audio/Vibration not supported or permission denied");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-orange-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <ArrowLeft className="h-5 w-5 text-orange-600" />
              <div className="flex items-center space-x-2">
                <Eye className="h-8 w-8 text-orange-600" />
                <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                  CelestialEye
                </span>
              </div>
            </Link>
              <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" onClick={testApiConnection} className="border-orange-200 hover:bg-orange-50">
                <Activity className="h-4 w-4 mr-1" />
                Test API
              </Button>
              <Button variant="outline" size="sm" onClick={testWebSocketMessage} disabled={!wsConnected} className="border-purple-200 hover:bg-purple-50">
                <Settings className="h-4 w-4 mr-1" />
                Test WS
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={wsConnected ? () => webSocket?.close() : connectWebSocket}
                className={`${wsConnected ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}
              >
                {wsConnected ? <Wifi className="h-4 w-4 mr-1" /> : <WifiOff className="h-4 w-4 mr-1" />}
                {wsConnected ? "Connected" : "Connect WS"}
              </Button>
              <Badge className="bg-gradient-to-r from-orange-500 to-purple-500 text-white px-3 py-1">
                <Users className="h-4 w-4 mr-1" />
                Face Recognition
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Page Title */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-purple-500 rounded-2xl mb-4 shadow-lg">
            <Users className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Face Recognition System
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Advanced face registration and authentication with real-time webcam support and secure API processing
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Control Panel */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-purple-500 text-white rounded-t-lg">
                <CardTitle className="flex items-center space-x-2 text-xl">
                  <Settings className="h-6 w-6" />
                  <span>Face Processing Control</span>
                </CardTitle>
                <CardDescription className="text-orange-100">
                  Choose your input method and processing mode for face recognition
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-8 space-y-8">
                {/* Method Selection */}
                <div className="space-y-4">
                  <Label className="text-lg font-semibold text-gray-800">Input Method</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant={inputMethod === "upload" ? "default" : "outline"}
                      onClick={() => setInputMethod("upload")}
                      className={`h-16 text-base ${inputMethod === "upload" 
                        ? 'bg-gradient-to-r from-orange-500 to-purple-500 text-white' 
                        : 'border-2 border-orange-200 hover:bg-orange-50'}`}
                    >
                      <Upload className="h-6 w-6 mr-3" />
                      Upload Image
                    </Button>
                    <Button
                      variant={inputMethod === "webcam" ? "default" : "outline"}
                      onClick={() => setInputMethod("webcam")}
                      className={`h-16 text-base ${inputMethod === "webcam" 
                        ? 'bg-gradient-to-r from-orange-500 to-purple-500 text-white' 
                        : 'border-2 border-orange-200 hover:bg-orange-50'}`}
                    >
                      <Camera className="h-6 w-6 mr-3" />
                      Use WebCam
                    </Button>
                  </div>
                </div>

                {/* Mode Selection */}
                <div className="space-y-4">
                  <Label className="text-lg font-semibold text-gray-800">Processing Mode</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant={mode === "register" ? "default" : "outline"}
                      onClick={() => setMode("register")}
                      className={`h-16 text-base ${mode === "register" 
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' 
                        : 'border-2 border-blue-200 hover:bg-blue-50'}`}
                    >
                      <UserPlus className="h-6 w-6 mr-3" />
                      Register New Face
                    </Button>
                    <Button
                      variant={mode === "authenticate" ? "default" : "outline"}
                      onClick={() => setMode("authenticate")}
                      className={`h-16 text-base ${mode === "authenticate" 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                        : 'border-2 border-green-200 hover:bg-green-50'}`}
                    >
                      <UserCheck className="h-6 w-6 mr-3" />
                      Authenticate Face
                    </Button>
                  </div>
                </div>

                {/* Person Name Input for Registration */}
                {mode === "register" && (
                  <div className="space-y-3">
                    <Label htmlFor="personName" className="text-lg font-semibold text-gray-800">
                      Person Name *
                    </Label>
                    <Input
                      id="personName"
                      value={personName}
                      onChange={(e) => setPersonName(e.target.value)}
                      placeholder="Enter the person's full name"
                      className="h-12 text-base border-2 border-gray-200 focus:border-orange-400"
                    />
                  </div>
                )}

                {/* Upload Method */}
                {inputMethod === "upload" && (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="file" className="text-lg font-semibold text-gray-800">
                        Select Image File
                      </Label>
                      <Input
                        id="file"
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        onChange={handleFileChange}
                        className="h-12 text-base border-2 border-gray-200 cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-orange-50 file:text-orange-700"
                      />
                      <p className="text-sm text-gray-500">
                        Supported formats: JPG, JPEG, PNG (Max: 10MB)
                      </p>
                    </div>

                    {file && (
                      <div className="p-6 bg-gradient-to-r from-orange-50 to-purple-50 rounded-xl border-2 border-orange-200">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-purple-500 rounded-lg flex items-center justify-center">
                            <Upload className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">{file.name}</p>
                            <p className="text-sm text-gray-600">
                              {(file.size / 1024 / 1024).toFixed(2)} MB • Ready for processing
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <Button 
                      onClick={processWithAPI} 
                      disabled={!file || isProcessing || (mode === "register" && !personName.trim())}
                      className="w-full h-14 text-lg bg-gradient-to-r from-orange-500 to-purple-500 hover:from-orange-600 hover:to-purple-600 text-white shadow-lg"
                      size="lg"
                    >
                      {isProcessing ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Processing...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          {mode === "register" ? <UserPlus className="h-5 w-5" /> : <UserCheck className="h-5 w-5" />}
                          <span>{mode === "register" ? "Register Face" : "Authenticate Face"}</span>
                        </div>
                      )}
                    </Button>
                  </div>
                )}

                {/* WebCam Method */}
                {inputMethod === "webcam" && (
                  <div className="space-y-6">
                    {/* Connection Status */}
                    <Alert className={`border-2 ${wsConnected ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                      <AlertCircle className={`h-4 w-4 ${wsConnected ? 'text-green-600' : 'text-red-600'}`} />
                      <AlertTitle className={wsConnected ? 'text-green-800' : 'text-red-800'}>
                        WebSocket Status
                      </AlertTitle>
                      <AlertDescription className={wsConnected ? 'text-green-700' : 'text-red-700'}>
                        {wsConnected 
                          ? "Connected to real-time face recognition service" 
                          : "Please connect to WebSocket service for real-time processing"}
                      </AlertDescription>
                    </Alert>                    {/* Video Preview */}
                    <div className="relative">
                      <div className={`aspect-video bg-gray-900 rounded-xl overflow-hidden transition-all duration-300 ${
                        isStreaming ? 'border-4 border-green-400 shadow-lg shadow-green-400/50' : 'border-4 border-gray-300'
                      }`}>
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className={`w-full h-full object-cover transition-all duration-300 ${
                            isStreaming ? 'brightness-110 contrast-110' : ''
                          }`}
                          style={{ display: cameraActive ? 'block' : 'none' }}
                        />
                        {!cameraActive && (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900">
                            <div className="text-center text-gray-300">
                              <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
                              <p className="text-xl font-medium">Camera Preview</p>
                              <p className="text-sm opacity-75">Click start camera to begin</p>
                            </div>
                          </div>
                        )}
                        
                        {/* Processing Overlay */}
                        {isStreaming && (
                          <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute top-4 left-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium animate-pulse">
                              🔍 Đang phân tích khuôn mặt...
                            </div>
                            {/* Scanning animation */}
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-400/20 to-transparent h-full w-full animate-pulse"></div>
                          </div>
                        )}
                      </div>
                      
                      {/* Stream Status Indicator */}
                      {cameraActive && (
                        <div className="absolute top-4 right-4">
                          <Badge className={`${isStreaming ? 'bg-red-500 animate-pulse' : 'bg-gray-500'} text-white px-3 py-1 shadow-lg`}>
                            <div className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-white animate-ping' : 'bg-gray-300'} mr-2`}></div>
                            {isStreaming ? 'ĐANG XỬ LÝ' : 'STANDBY'}
                          </Badge>
                        </div>
                      )}
                    </div>
                    
                    {/* Camera Controls */}
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        variant="outline"
                        onClick={cameraActive ? stopCamera : startCamera}
                        className="h-12 border-2 border-blue-200 hover:bg-blue-50"
                      >
                        {cameraActive ? <CameraOff className="h-5 w-5 mr-2" /> : <Camera className="h-5 w-5 mr-2" />}
                        {cameraActive ? "Stop Camera" : "Start Camera"}
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={toggleStreaming}
                        disabled={!wsConnected || !cameraActive}
                        className={`h-12 border-2 ${isStreaming ? 'border-red-200 hover:bg-red-50' : 'border-green-200 hover:bg-green-50'}`}
                      >
                        {isStreaming ? <Square className="h-5 w-5 mr-2" /> : <Play className="h-5 w-5 mr-2" />}
                        {isStreaming ? "Stop Stream" : "Start Stream"}
                      </Button>
                    </div>

                    {/* WebCam Process Button */}
                    <Button 
                      onClick={toggleStreaming}
                      disabled={!wsConnected || !cameraActive || (mode === "register" && !personName.trim())}
                      className="w-full h-14 text-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg"
                      size="lg"
                    >
                      <div className="flex items-center space-x-2">
                        <Camera className="h-5 w-5" />
                        <span>
                          {isStreaming 
                            ? `Stop ${mode === "register" ? "Registration" : "Authentication"}` 
                            : `Start ${mode === "register" ? "Registration" : "Authentication"}`}
                        </span>
                      </div>
                    </Button>
                  </div>
                )}                {/* Results Display */}
                {results && (
                  <div className="mt-8 p-6 bg-white rounded-xl border-2 border-gray-200 shadow-lg">
                    <div className="flex items-center space-x-3 mb-4">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                      <span className="text-xl font-semibold text-gray-800">
                        {results.action === "register" ? "Kết quả đăng ký" : "Kết quả xác thực"}
                      </span>
                      <Badge variant="outline" className="text-sm">
                        {results.source === 'webcam' ? 'WebCam' : 'API'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">Trạng thái:</span>
                        <Badge className={`${results.success && (results.action === 'register' || results.authenticated) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} px-3 py-1`}>
                          {results.success && (results.action === 'register' || results.authenticated) ? "Thành công" : "Thất bại"}
                        </Badge>
                      </div>
                      
                      {results.personName && (
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-700">Người dùng:</span>
                          <span className="text-gray-900 font-semibold">{results.personName}</span>
                        </div>
                      )}
                      
                      {results.confidence !== undefined && results.confidence > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-700">Độ tin cậy:</span>
                          <span className="text-gray-900 font-semibold">{(results.confidence * 100).toFixed(1)}%</span>
                        </div>
                      )}
                      
                      {results.message && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <span className="font-medium text-blue-800">Thông báo:</span>
                          <p className="text-blue-700 mt-1">{results.message}</p>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">Thời gian:</span>
                        <span className="text-gray-600 text-sm">{new Date(results.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}

                <canvas ref={canvasRef} style={{ display: 'none' }} />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Registered Faces */}            <Card className="shadow-xl border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-t-lg">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Registered Faces</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={loadRegisteredFaces}
                    disabled={loadingFaces}
                    className="text-white hover:bg-white/20 p-1"
                  >
                    <Activity className={`h-4 w-4 ${loadingFaces ? 'animate-spin' : ''}`} />
                  </Button>
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Currently registered in the system ({registeredFaces.length})
                </CardDescription>
              </CardHeader><CardContent className="p-6">
                {loadingFaces ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3"></div>
                    <span className="text-gray-600">Loading registered faces...</span>
                  </div>
                ) : registeredFaces.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No registered faces yet</p>
                    <p className="text-sm">Register your first face to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {registeredFaces.map((face) => (
                      <div key={face.id} className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-800">{face.name}</p>
                            <p className="text-sm text-gray-600">ID: {face.id.substring(0, 8)}...</p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            Active
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {face.registeredAt}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* System Status */}
            <Card className="shadow-xl border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-t-lg">
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>System Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">WebSocket</span>
                    <Badge className={`${wsConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {wsConnected ? 'Connected' : 'Disconnected'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Camera</span>
                    <Badge className={`${cameraActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                      {cameraActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Streaming</span>
                    <Badge className={`${isStreaming ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'}`}>
                      {isStreaming ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Input Method</span>
                    <Badge variant="outline" className="text-xs">
                      {inputMethod === 'upload' ? 'File Upload' : 'WebCam'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Mode</span>
                    <Badge variant="outline" className="text-xs">
                      {mode === 'register' ? 'Register' : 'Authenticate'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Registered Count</span>
                    <Badge variant="outline" className="text-xs">
                      {registeredFaces.length} faces
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* API Documentation */}
        <div className="mt-16">
          <Tabs defaultValue="register" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-white/70 backdrop-blur-sm border border-gray-200">
              <TabsTrigger value="register" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white">
                Register API
              </TabsTrigger>
              <TabsTrigger value="authenticate" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white">
                Authenticate API
              </TabsTrigger>
              <TabsTrigger value="websocket" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white">
                WebSocket API
              </TabsTrigger>
              <TabsTrigger value="status" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white">
                Instructions
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="register" className="mt-6">
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold mb-3 text-gray-800">Face Registration Endpoint</h3>
                      <code className="bg-gradient-to-r from-blue-50 to-cyan-50 px-4 py-3 rounded-lg text-sm block border border-blue-200">
                        POST /api/face/register
                      </code>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-gray-800">Parameters</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
                          <span className="font-medium">image (multipart file)</span>
                          <Badge variant="destructive">required</Badge>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
                          <span className="font-medium">name (form data)</span>
                          <Badge variant="destructive">required</Badge>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-gray-800">Response Example</h3>
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`{
  "success": true,
  "message": "Face registered successfully",
  "personName": "John Doe",
  "id": "uuid-string",
  "timestamp": "2024-01-15T10:30:00Z"
}`}
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="authenticate" className="mt-6">
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold mb-3 text-gray-800">Face Authentication Endpoint</h3>
                      <code className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3 rounded-lg text-sm block border border-green-200">
                        POST /api/face/authenticate
                      </code>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-gray-800">Parameters</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
                          <span className="font-medium">image (multipart file)</span>
                          <Badge variant="destructive">required</Badge>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-gray-800">Response Example</h3>
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`{
  "success": true,
  "authenticated": true,
  "personName": "John Doe",
  "confidence": 0.92,
  "message": "Face recognized successfully"
}`}
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="websocket" className="mt-6">
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold mb-3 text-gray-800">WebSocket Real-time API</h3>
                      <code className="bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-3 rounded-lg text-sm block border border-purple-200">
                        ws://localhost:8080/ws/face-stream
                      </code>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-gray-800">Send Message Format</h3>
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`{
  "type": "register" | "authenticate",
  "image": "base64-encoded-image",
  "personName": "John Doe" // Only for register
}`}
                      </pre>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-gray-800">Receive Message Format</h3>
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`{
  "type": "face_detected",
  "success": true,
  "personName": "John Doe",
  "confidence": 0.92,
  "message": "Face recognized"
}`}
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="status" className="mt-6">
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">How to Use Face Recognition System</h3>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-blue-600">📤 Upload Method</h4>
                        <ol className="space-y-2 text-sm text-gray-700">
                          <li>1. Select "Upload Image" method</li>
                          <li>2. Choose Register or Authenticate mode</li>
                          <li>3. Enter person name (for registration)</li>
                          <li>4. Select image file (JPG, PNG)</li>
                          <li>5. Click process button</li>
                        </ol>
                      </div>
                      
                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-purple-600">📹 WebCam Method</h4>
                        <ol className="space-y-2 text-sm text-gray-700">
                          <li>1. Click "Connect WS" in header</li>
                          <li>2. Select "Use WebCam" method</li>
                          <li>3. Choose Register or Authenticate mode</li>
                          <li>4. Enter person name (for registration)</li>
                          <li>5. Start camera and begin streaming</li>
                        </ol>
                      </div>
                    </div>
                    
                    <Alert className="border-2 border-orange-200 bg-orange-50">
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                      <AlertTitle className="text-orange-800">Important Notes</AlertTitle>
                      <AlertDescription className="text-orange-700">
                        <ul className="mt-2 space-y-1 text-sm">
                          <li>• WebSocket connection is required for real-time webcam processing</li>
                          <li>• Camera permissions must be granted for webcam functionality</li>
                          <li>• Upload method works independently without WebSocket</li>
                          <li>• Person names are required for face registration</li>
                        </ul>
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>          </Tabs>
        </div>

        {/* Result Modal */}
        <Dialog open={showResultModal} onOpenChange={setShowResultModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-3">
                {results?.success ? (
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="h-6 w-6 text-green-600" />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                )}
                <span className={`text-xl font-bold ${results?.success ? 'text-green-800' : 'text-red-800'}`}>
                  {results?.action === 'register' 
                    ? (results?.success ? 'Đăng ký thành công!' : 'Đăng ký thất bại') 
                    : (results?.success ? 'Xác thực thành công!' : 'Xác thực thất bại')}
                </span>
              </DialogTitle>
              <DialogDescription>
                <div className="space-y-4 mt-4">
                  {/* Result Message */}
                  <div className={`p-4 rounded-lg ${results?.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <p className={`text-sm font-medium ${results?.success ? 'text-green-800' : 'text-red-800'}`}>
                      {results?.message}
                    </p>
                  </div>

                  {/* Person Info */}
                  {results?.personName && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-700">Người dùng:</span>
                      <span className="text-gray-900 font-semibold">{results.personName}</span>
                    </div>
                  )}

                  {/* Confidence */}
                  {results?.confidence && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-700">Độ tin cậy:</span>
                      <span className="text-gray-900 font-semibold">{(results.confidence * 100).toFixed(1)}%</span>
                    </div>
                  )}

                  {/* Source */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">Phương thức:</span>
                    <Badge variant="outline" className="text-sm">
                      {results?.source === 'webcam' ? 'WebCam Real-time' : 'Upload File'}
                    </Badge>
                  </div>

                  {/* Timestamp */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">Thời gian:</span>
                    <span className="text-gray-600 text-sm">
                      {results?.timestamp ? new Date(results.timestamp).toLocaleString('vi-VN') : ''}
                    </span>
                  </div>
                </div>
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => setShowResultModal(false)}>
                Đóng
              </Button>
              {results?.success && results?.action === 'register' && (
                <Button onClick={() => {
                  setShowResultModal(false);
                  setMode('authenticate');
                  toast({
                    title: "Chuyển sang chế độ xác thực",
                    description: "Bạn có thể thử xác thực khuôn mặt vừa đăng ký",
                  });
                }}>
                  Thử xác thực ngay
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default FaceRecognition;
