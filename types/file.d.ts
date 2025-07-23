type UploadedFile = {
  id: string;
  name: string;
  type: FileType;
  content: string;
  size: number;
  uploadedAt: Date;
  originalFile?: File;
};

type StoredFile = {
  id: string;
  userId: string;
  originalFileName: string;
  fileType: FileType;
  originalContentPath: string;
  redactedContentPath: string;
  piiCount: number;
  options: RedactionOptions;
  createdAt: Date;
};

type RedactionMethod = "mask" | "replace";

type RedactionOptions = {
  method: RedactionMethod;
  includeNames: boolean;
  includeEmails: boolean;
  includePhones: boolean;
  includeAddresses: boolean;
  includeSsn: boolean;
  includeCreditCards: boolean;
  includeCustomValues: string[];
  useAI: boolean; // Toggle for AI vs Regex
  customPrompt?: string; // Optional custom prompt for Gemini
};

type RedactionResult = {
  originalFile: UploadedFile;
  redactedContent: string;
  redactedAt: Date;
  options: RedactionOptions;
  piiCount: number;
  docRefId: string;
};

type FileType = "text" | "csv" | "pdf" | "docx" | "rtf";
