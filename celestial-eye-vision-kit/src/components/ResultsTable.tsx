
import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Copy, Eye } from "lucide-react";
import { toast } from "@/hooks/use-toast";

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

interface ResultsTableProps {
  detections: BarcodeDetection[];
}

export const ResultsTable: React.FC<ResultsTableProps> = ({ detections }) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Barcode content copied to clipboard",
    });
  };

  if (detections.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No barcode detections to display</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Eye className="h-5 w-5" />
        Detection Results ({detections.length})
      </h3>
      
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-12">#</TableHead>
              <TableHead>Content</TableHead>
              <TableHead>Format</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead>Position</TableHead>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {detections.map((detection, index) => (
              <TableRow 
                key={index}
                className="hover:bg-blue-50 transition-colors duration-200 cursor-pointer group"
              >
                <TableCell className="font-medium">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white`}
                       style={{ backgroundColor: `hsl(${index * 60}, 70%, 50%)` }}>
                    {index + 1}
                  </div>
                </TableCell>
                
                <TableCell>
                  <HoverCard>
                    <HoverCardTrigger>
                      <div className="font-mono text-sm max-w-xs truncate group-hover:text-blue-600 transition-colors">
                        {detection.content}
                      </div>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80">
                      <div className="space-y-2">
                        <h4 className="font-semibold">Full Content</h4>
                        <p className="font-mono text-sm break-all">{detection.content}</p>
                        <div className="text-sm text-gray-500">
                          Length: {detection.content.length} characters
                        </div>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                </TableCell>
                
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className="group-hover:border-blue-300 group-hover:text-blue-700 transition-colors"
                  >
                    {detection.format}
                  </Badge>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all duration-500"
                        style={{ width: `${detection.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">
                      {(detection.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>x: {detection.boundingBox.x1}-{detection.boundingBox.x2}</div>
                    <div>y: {detection.boundingBox.y1}-{detection.boundingBox.y2}</div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <button
                    onClick={() => copyToClipboard(detection.content)}
                    className="p-2 hover:bg-blue-100 rounded-lg transition-colors group/btn"
                    title="Copy content"
                  >
                    <Copy className="h-4 w-4 text-gray-500 group-hover/btn:text-blue-600 transition-colors" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
