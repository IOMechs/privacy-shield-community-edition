import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, FileText } from "lucide-react";
import { downloadFile } from "@/lib/utils/file";
import { getFileUrl } from "@/services/fileService";
import { toast } from "sonner";
import {
  extractTextFromRtf,
  extractTextWithKeys,
} from "@/lib/utils/extraction";

interface FilePreviewProps {
  result: RedactionResult | null;
}

const detectDelimiter = (content: string): string => {
  const firstLine = content.split("\n")[0];
  const delimiters = [",", ";", "\t"];
  const counts = delimiters.map(
    (d) => (firstLine.match(new RegExp(d, "g")) || []).length
  );
  const maxCount = Math.max(...counts);
  return delimiters[counts.indexOf(maxCount)] || ",";
};

export function FilePreview({ result }: FilePreviewProps) {
  const [view, setView] = useState<"redacted" | "original">("redacted");
  const [delimiter, setDelimiter] = useState<string>(",");

  useEffect(() => {
    if (result && result.originalFile.type === "csv") {
      const detectedDelimiter = detectDelimiter(result.originalFile.content);
      setDelimiter(detectedDelimiter);
    }
  }, [result]);

  if (!result) {
    return null;
  }

  const handleDelimiterChange = (value: string) => {
    setDelimiter(value);
  };

  const handleDownload = async () => {
    try {
      const { fileUrl, originalFileName } = await getFileUrl(
        result.docRefId,
        view === "redacted"
      );
      downloadFile(fileUrl, originalFileName);
    } catch (e) {
      toast.error("Error while downloading file");
    }
  };

  // for each file type make a readable preview
  const renderContent = (content: string, fileType: FileType) => {
    if (fileType === "csv") {
      return (
        <div className="overflow-auto max-h-[400px]">
          <table className="min-w-full border border-slate-200">
            <tbody>
              {content.split("\n").map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={rowIndex % 2 === 0 ? "bg-slate-50" : ""}
                >
                  {row.split(delimiter).map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="border border-slate-200 px-3 py-2 text-sm"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    } else if (fileType === "docx") {
      const { textMap } = extractTextWithKeys(content);
      const concatenated = Object.values(textMap).join("\n");
      return (
        <pre className="bg-slate-50 p-4 rounded-md overflow-auto max-h-[400px] text-sm whitespace-pre-wrap">
          {concatenated}
        </pre>
      );
    } else if (fileType === "rtf") {
      const parsedText = extractTextFromRtf(content);
      return (
        <pre className="bg-slate-50 p-4 rounded-md overflow-auto max-h-[400px] text-sm whitespace-pre-wrap">
          {parsedText}
        </pre>
      );
    } else {
      return (
        <pre className="bg-slate-50 p-4 rounded-md overflow-auto max-h-[400px] text-sm whitespace-pre-wrap">
          {content}
        </pre>
      );
    }
  };

  return (
    <Card className="w-full p-6 bg-white/90 backdrop-blur-sm border border-slate-200 shadow-sm rounded-xl overflow-hidden animate-fade-in">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-medium">File Preview</h3>
          </div>
          <Button variant="outline" className="gap-2" onClick={handleDownload}>
            <Download className="h-4 w-4" />
            Download
          </Button>
        </div>

        <Tabs
          defaultValue="redacted"
          value={view}
          onValueChange={(v) => setView(v as "redacted" | "original")}
        >
          <div className="flex justify-between items-center mb-4">
            <TabsList className="grid w-1/2 grid-cols-2">
              <TabsTrigger value="redacted">Redacted</TabsTrigger>
              <TabsTrigger value="original">Original</TabsTrigger>
            </TabsList>
            {result.originalFile.type === "csv" && (
              <Select value={delimiter} onValueChange={handleDelimiterChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select delimiter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=",">Comma (,)</SelectItem>
                  <SelectItem value=";">Semicolon (;)</SelectItem>
                  <SelectItem value="\t">Tab (\t)</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          <TabsContent value="redacted" className="mt-4">
            <div className="mb-4">
              <p className="text-sm text-slate-500">
                Redacted {result.originalFile.type.toUpperCase()} file with{" "}
                {result.piiCount} instances of PII removed
              </p>
            </div>

            {renderContent(result.redactedContent, result.originalFile.type)}
          </TabsContent>
          <TabsContent value="original" className="mt-4">
            <div className="mb-4">
              <p className="text-sm text-slate-500">
                Original content of {result.originalFile.name}
              </p>
            </div>
            {renderContent(
              result.originalFile.content,
              result.originalFile.type
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
}

export default FilePreview;
