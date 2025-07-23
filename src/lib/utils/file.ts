import { pdfjs } from "react-pdf";
import mammoth from "mammoth";
import JSZip from "jszip";

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

// pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export const generateFileId = (): string => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};

export const validateFile = (
  file: File
): { valid: boolean; message?: string } => {
  // Check file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return {
      valid: false,
      message: "File size exceeds 5MB limit",
    };
  }

  // Check file type
  const validTypes = [
    "text/plain",
    "text/csv",
    "application/csv",
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  const validFileExtensions = [".csv", ".pdf", ".txt", ".rtf", ".docx"];
  if (
    !validTypes.includes(file.type) &&
    !validFileExtensions.some((vFile) =>
      file.name.toLowerCase().endsWith(vFile.toLowerCase())
    )
  ) {
    return {
      valid: false,
      message: "Only CSV, TXT, PDF, and DOCX files are supported",
    };
  }

  return { valid: true };
};

export const readFileContent = async (file: File): Promise<string> => {
  if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
    return await extractTextFromPdf(file);
  } else if (
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.name.endsWith(".docx")
  ) {
    //return xml instead of text
    return await extractXmlFromDocx(file);
    // return await extractTextFromDocx(file);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error("Failed to read file content"));
      }
    };
    reader.onerror = () => reject(new Error("File reading error"));
    reader.readAsText(file);
  });
};

export const extractTextFromPdf = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        if (!event.target?.result) {
          throw new Error("Failed to read PDF file");
        }

        const arrayBuffer = event.target.result as ArrayBuffer;
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

        let textContent = "";

        // Extract text from each page
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items.map((item: any) => item.str).join(" ");

          textContent += pageText + "\n\n";
        }

        resolve(textContent.trim());
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error("Error reading PDF file"));
    reader.readAsArrayBuffer(file);
  });
};

export const extractTextFromDocx = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        if (!event.target?.result) {
          throw new Error("Failed to read DOCX file");
        }

        const arrayBuffer = event.target.result as ArrayBuffer;
        const result = await mammoth.extractRawText({ arrayBuffer });
        resolve(result.value);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error("Error reading DOCX file"));
    reader.readAsArrayBuffer(file);
  });
};

export const extractXmlFromDocx = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        if (!event.target?.result) {
          throw new Error("Failed to read DOCX file");
        }

        const arrayBuffer = event.target.result as ArrayBuffer;
        const zip = await JSZip.loadAsync(arrayBuffer);

        const documentXml = zip.file("word/document.xml");
        if (!documentXml) {
          throw new Error("word/document.xml not found in DOCX file");
        }

        const xmlContent = await documentXml.async("text");
        resolve(xmlContent);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error("Error reading DOCX file"));
    reader.readAsArrayBuffer(file);
  });
};

export const determineFileType = (file: File): FileType => {
  if (file.type === "text/csv" || file.name.endsWith(".csv")) {
    return "csv";
  } else if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
    return "pdf";
  } else if (
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.name.endsWith(".docx")
  ) {
    return "docx";
  } else if (
    file.type === "application/rtf" ||
    file.type === "text/rtf" ||
    file.name.endsWith(".rtf")
  ) {
    return "rtf";
  }
  return "text";
};

export const createUploadedFile = async (file: File): Promise<UploadedFile> => {
  const content = await readFileContent(file);

  const res: UploadedFile = {
    id: generateFileId(),
    name: file.name,
    type: determineFileType(file),
    content,
    size: file.size,
    uploadedAt: new Date(),
  };

  if (res.type == "docx") {
    res["originalFile"] = file;
  }

  return res;
};

export const downloadFile = (
  fileUrl: string,
  originalFileName: string
): void => {
  //  Trigger browser download
  const a = document.createElement("a");
  a.href = fileUrl;
  a.download = originalFileName || "redacted-file"; // fallback name
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

export const parseCSV = (csvContent: string): string[][] => {
  // Simple CSV parser (could be replaced with a more robust library)
  return csvContent
    .split("\n")
    .map((row) => row.split(",").map((cell) => cell.trim()));
};

export const csvToString = (csvArray: string[][]): string => {
  return csvArray.map((row) => row.join(",")).join("\n");
};
