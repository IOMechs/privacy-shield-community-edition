"use client";

import { useCallback, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { processFile } from "@/lib/utils/redaction";
import FileUpload from "@/components/composites/FileUpload";
import RedactionOptions from "@/components/composites/RedactionOptions";
import FilePreview from "@/components/composites/FilePreview";
import FileHistory from "@/components/composites/FileHistory";
import {
  deleteUserFile,
  getUserFiles,
  saveRedactionResult,
} from "@/services/fileService";
import { convertStoredFileToUploadedFile } from "@/lib/utils/fileReprocessing";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import LoadingBar from "@/components/composites/LoadingBar";
import { useRouter } from "next/navigation";

const Dashboard = () => {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);

  const [isRedacting, setIsRedacting] = useState(false); //for delayed loading bar

  const [activeTab, setActiveTab] = useState<"upload" | "history">("upload");

  const [redactionOptions, setRedactionOptions] = useState<RedactionOptions>({
    method: "mask",
    includeNames: true,
    includeEmails: true,
    includePhones: true,
    includeAddresses: true,
    includeSsn: true,
    includeCreditCards: true,
    includeCustomValues: [],
    useAI: true,
  });

  const router = useRouter();

  const { user } = useAuth();
  const queryClient = useQueryClient();

  const loadUserFiles = useCallback(async () => {
    if (!user) return [];

    try {
      const files = await getUserFiles(user.uid);
      return files;
    } catch (error) {
      toast.error("Failed to load your files");
      console.error(error);
    } finally {
    }
  }, [user]);
  const { data, error, isLoading, isError } = useQuery({
    queryKey: ["files"],
    queryFn: loadUserFiles,
    enabled: !!user,
  });

  if (isError) {
    toast.error(error.message);
  }

  const {
    mutate: deleteFile,
    isPending: isDeleting,
    isSuccess: isDeleteSuccess,
    isError: isDeleteError,
  } = useMutation({
    mutationFn: (fileId: string) => {
      if (!user) {
        throw new Error("User not authenticated");
      }
      return deleteUserFile(user.uid, fileId);
    },
    onSuccess: (_, fileId) => {
      toast.success("File deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
    onError: () => {
      toast.error("Failed to delete file");
    },
  });

  const handleDeleteFile = (fileId: string) => {
    if (user) deleteFile(fileId);
  };

  const handleFileUploaded = (file: UploadedFile) => {
    setUploadedFile(file);
    resetProcess();
    toast.success("File uploaded successfully");
  };

  const handleOptionChange = (options: RedactionOptions) => {
    setRedactionOptions(options);
  };

  const {
    mutate: mutateFile,
    data: processedData,
    isPending: isProcessing,
    isSuccess: isProcessSuccess,
    isError: isProcessError,
    error: processError,
    reset: resetProcess,
    status: stage,
  } = useMutation<
    RedactionResult, // return type
    Error, // error type
    UploadedFile // input type
  >({
    mutationFn: async (file) => {
      if (!user) throw new Error("User not found");
      setIsRedacting(true);
      const result = await processFile(file, redactionOptions, user.uid);
      const docRefId = await saveRedactionResult(user.uid, result, file);

      const response = { ...result, docRefId };
      return response;
    },
    onSuccess: (result) => {
      toast.success(
        `File processed successfully. ${result.piiCount} PII instances detected.`
      );
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
    onError: (error) => {
      console.error("Error processing file:", error);
      toast.error("Error processing file");
    },
  });

  const retryProcessingMutation = useMutation({
    mutationFn: async (file: StoredFile) => {
      const uploadedFile = await convertStoredFileToUploadedFile(file);
      return { uploadedFile, options: file.options };
    },
    onSuccess: ({ uploadedFile, options }) => {
      setUploadedFile(uploadedFile);
      setRedactionOptions(options);
      setActiveTab("upload");

      toast.success("File loaded for reprocessing");
    },
    onError: (error) => {
      console.error("Error preparing file:", error);
      toast.error("Failed to load file for reprocessing");
    },
  });

  const handleProcessFile = () => {
    if (!uploadedFile || !user) return;
    resetProcess();
    mutateFile(uploadedFile);
  };

  const handleRetryProcessing = (file: StoredFile) => {
    if (!user) return;
    retryProcessingMutation.mutate(file);
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <LoadingBar
        stage={stage}
        isOpen={isRedacting}
        onClose={() => setIsRedacting(false)}
        isError={isProcessError}
      />
      <div className="container px-4 pt-24 pb-16 mx-auto">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col gap-2 mb-6 animate-slide-down">
            <h1 className="text-3xl font-bold">PII Redaction Dashboard</h1>
            <p className="text-slate-600">
              Upload a file, configure redaction options, and download the
              processed result.
            </p>
          </div>

          <Tabs
            defaultValue="upload"
            value={activeTab}
            onValueChange={(value) =>
              setActiveTab(value as "upload" | "history")
            }
            className="mb-6"
          >
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="upload">Upload & Process</TabsTrigger>
              <TabsTrigger value="history">File History</TabsTrigger>
            </TabsList>

            <TabsContent value="upload">
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <FileUpload
                  onFileUploaded={handleFileUploaded}
                  isLoading={isProcessing}
                  uploadedFile={uploadedFile}
                  setUploadedFile={setUploadedFile}
                />

                <RedactionOptions
                  options={redactionOptions}
                  onOptionsChange={handleOptionChange}
                  onProcessFile={handleProcessFile}
                  isLoading={isProcessing}
                  fileSelected={!!uploadedFile}
                />
              </div>

              {processedData && (
                <div className="mt-8">
                  <FilePreview result={processedData} />
                </div>
              )}
            </TabsContent>

            <TabsContent value="history">
              {data && (
                <FileHistory
                  files={data}
                  isLoading={isProcessing}
                  onDeleteFile={handleDeleteFile}
                  onRetryFile={handleRetryProcessing}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
