import { useState, useRef, SetStateAction, Dispatch } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, File, X } from "lucide-react";
import { createUploadedFile, validateFile } from "@/lib/utils/file";

interface FileUploadProps {
  onFileUploaded: (file: UploadedFile) => void;
  isLoading: boolean;
  uploadedFile: UploadedFile | null;
  setUploadedFile: Dispatch<SetStateAction<UploadedFile | null>>;
}

export function FileUpload({
  onFileUploaded,
  isLoading,
  uploadedFile,
  setUploadedFile,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const processFile = async (file: File) => {
    const validation = validateFile(file);
    if (!validation.valid) {
      toast.error(validation.message);
      return;
    }

    try {
      toast.info("Processing file...");
      const uploadedFile = await createUploadedFile(file);
      onFileUploaded(uploadedFile);
    } catch (error) {
      toast.error("Error processing file");
      console.error(error);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const clearFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Card className="w-full p-6 bg-white/90 backdrop-blur-sm border border-slate-200 shadow-sm rounded-xl overflow-hidden animate-fade-in">
      <div
        className={`file-drop-area ${isDragging ? "dragging" : ""} ${
          uploadedFile ? "border-primary/50 bg-primary/5" : ""
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".txt,.csv,.pdf,.docx,text/plain,text/csv,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center gap-4 text-center">
          {!uploadedFile ? (
            <>
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Upload a file</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Drag and drop a file here or click to browse
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Supported formats: CSV, TXT, RTF, DOCX (max 5MB)
                </p>
              </div>
              <Button
                onClick={handleButtonClick}
                className="mt-2 bg-primary hover:bg-primary/90"
              >
                Browse Files
              </Button>
            </>
          ) : (
            <div className="w-full flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <File className="h-6 w-6 text-primary" />
                </div>
                <div className="text-left">
                  <h3 className="font-medium truncate max-w-[240px]">
                    {uploadedFile.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {(uploadedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={clearFile}
                disabled={isLoading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export default FileUpload;
