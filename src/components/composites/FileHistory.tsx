import { useState } from "react";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Trash2,
  RefreshCw,
  Download,
  Info,
  FileType,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { downloadFile } from "@/lib/utils/file";

type FileHistoryProps = {
  files: StoredFile[];
  isLoading: boolean;
  onDeleteFile: (fileId: string) => void;
  onRetryFile: (file: StoredFile) => void;
};

export function FileHistory({
  files,
  isLoading,
  onDeleteFile,
  onRetryFile,
}: FileHistoryProps) {
  const [selectedFile, setSelectedFile] = useState<StoredFile | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async (file: StoredFile) => {
    setIsDownloading(true);

    try {
      //donwloading from firebase storage path
      downloadFile(file.redactedContentPath, file.originalFileName);
      toast.success("File downloaded successfully");
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Failed to download file");
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-8 text-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p>Loading your files...</p>
        </div>
      </Card>
    );
  }

  if (files.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <FileText className="h-12 w-12 text-slate-300" />
          <h3 className="text-lg font-medium">No files yet</h3>
          <p className="text-slate-500">
            Redacted files will appear here after processing
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {files.map((file) => (
        <Card key={file.id} className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">{file.originalFileName}</h3>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span>{format(file.createdAt, "PPP")}</span>
                  <span>•</span>
                  <span className="uppercase">{file.fileType}</span>
                  <span>•</span>
                  <span>{file.piiCount} PII detected</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedFile(file)}
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Redaction Details</DialogTitle>
                  </DialogHeader>
                  {selectedFile && (
                    <div className="space-y-4 pt-4">
                      <div>
                        <h4 className="text-sm font-semibold mb-2">
                          File Information
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <span className="text-slate-500">File Name:</span>
                          <span>{selectedFile.originalFileName}</span>
                          <span className="text-slate-500">File Type:</span>
                          <span className="uppercase">
                            {selectedFile.fileType}
                          </span>
                          <span className="text-slate-500">PII Detected:</span>
                          <span>{selectedFile.piiCount}</span>
                          <span className="text-slate-500">Processed On:</span>
                          <span>{format(selectedFile.createdAt, "PPP p")}</span>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold mb-2">
                          Redaction Options
                        </h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-500">
                              Method:
                            </span>
                            <Badge variant="outline">
                              {selectedFile.options.method === "mask"
                                ? "Masked"
                                : "Replaced"}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-500">
                              Processing:
                            </span>
                            <Badge variant="outline">
                              {selectedFile.options.useAI
                                ? "AI (Gemini)"
                                : "Regex"}
                            </Badge>
                          </div>

                          <h4 className="text-xs font-medium mt-4 mb-2">
                            Redacted Information:
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedFile.options.includeNames && (
                              <Badge variant="secondary">Names</Badge>
                            )}
                            {selectedFile.options.includeEmails && (
                              <Badge variant="secondary">Emails</Badge>
                            )}
                            {selectedFile.options.includePhones && (
                              <Badge variant="secondary">Phones</Badge>
                            )}
                            {selectedFile.options.includeAddresses && (
                              <Badge variant="secondary">Addresses</Badge>
                            )}
                            {selectedFile.options.includeSsn && (
                              <Badge variant="secondary">SSN</Badge>
                            )}
                            {selectedFile.options.includeCreditCards && (
                              <Badge variant="secondary">Credit Cards</Badge>
                            )}
                          </div>

                          {selectedFile.options.includeCustomValues.length >
                            0 && (
                            <div className="mt-2">
                              <h4 className="text-xs font-medium mb-2">
                                Custom Values:
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {selectedFile.options.includeCustomValues.map(
                                  (value, index) => (
                                    <Badge key={index} variant="outline">
                                      {value}
                                    </Badge>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDownload(file)}
                disabled={isDownloading}
              >
                <Download className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRetryFile(file)}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDeleteFile(file.id)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default FileHistory;
