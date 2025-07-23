import { getFileContent } from "@/services/fileService";
import { extractXmlFromDocx, generateFileId } from "./file";

export const convertStoredFileToUploadedFile = async (
  file: StoredFile
): Promise<UploadedFile> => {
  try {
    // Fetch the original content
    const fileUrl = file.originalContentPath;
    const response = await fetch(fileUrl);
    const blob = await response.blob();
    const contentType =
      response.headers.get("content-type") || "application/octet-stream";
    const originalFile = new File([blob], file.originalFileName, {
      type: contentType,
    });
    let content;
    if (file.fileType === "docx") {
      content = await extractXmlFromDocx(originalFile);
    } else {
      content = await getFileContent(file.originalContentPath);
    }
    return {
      id: generateFileId(),
      name: file.originalFileName,
      type: file.fileType,
      content,
      size: new Blob([content]).size,
      uploadedAt: new Date(),
      originalFile,
    };
  } catch (error) {
    console.error("Error converting stored file:", error);
    throw new Error("Failed to prepare file for reprocessing");
  }
};
