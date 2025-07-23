import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import {
  ref,
  uploadString,
  getDownloadURL,
  deleteObject,
  uploadBytes,
} from "firebase/storage";
import { db, storage } from "@/lib/utils/firebase";
import JSZip from "jszip";
import { generateFileId } from "@/lib/utils/file";

// Replaces the document.xml content in a DOCX file
export const replaceXmlInDocx = async (
  file: File | undefined,
  newXml: string
) => {
  try {
    //  Read the input DOCX as ArrayBuffer
    if (!file) return;
    const arrayBuffer = await file.arrayBuffer();

    //  Load the DOCX as a zip using JSZip
    const zip = await JSZip.loadAsync(arrayBuffer);

    // Replace 'word/document.xml' with the new XML string
    const documentXmlPath = "word/document.xml";
    if (!zip.file(documentXmlPath)) {
      throw new Error(`Missing ${documentXmlPath} in DOCX file.`);
    }
    zip.file(documentXmlPath, newXml);

    //  Generate the updated DOCX file as a Blob
    const updatedBlob = await zip.generateAsync({ type: "blob" });

    return updatedBlob;
  } catch (error) {
    console.error("Error updating DOCX:", error);
  }
};

export const saveRedactionResult = async (
  userId: string,
  result: RedactionResult,
  file: UploadedFile
): Promise<string> => {
  try {
    const originalFileRef = ref(
      storage,
      `users/${userId}/original/${result.originalFile.id}-${result.originalFile.name}`
    );
    const redactedFileRef = ref(
      storage,
      `users/${userId}/redacted/${result.originalFile.id}-${result.originalFile.name}`
    );

    let originalContentPath: string;
    let redactedContentPath: string;
    //storing docx, rtf and txt in their respective formats
    if (file.type === "docx") {
      // Replace the document.xml with redacted content and return a Blob
      const redactedDocxBlob = await replaceXmlInDocx(
        file.originalFile,
        result.redactedContent
      );
      if (!redactedDocxBlob || !file.originalFile)
        throw new Error("Error while saving file");
      // Upload original DOCX file
      await uploadBytes(originalFileRef, file.originalFile, {
        contentType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      originalContentPath = await getDownloadURL(originalFileRef);

      // Upload redacted DOCX Blob
      await uploadBytes(redactedFileRef, redactedDocxBlob, {
        contentType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      redactedContentPath = await getDownloadURL(redactedFileRef);
    } else if (file.type === "rtf") {
      const originalBlob = new Blob([result.originalFile.content], {
        type: "application/rtf",
      });
      await uploadBytes(originalFileRef, originalBlob, {
        contentType: "application/rtf",
      });
      originalContentPath = await getDownloadURL(originalFileRef);
      const encoder = new TextEncoder(); // UTF-8

      const redactedBlob = new Blob([result.redactedContent], {
        type: "text/rtf",
      });

      await uploadBytes(redactedFileRef, redactedBlob, {
        contentType: "application/rtf",
      });
      redactedContentPath = await getDownloadURL(redactedFileRef);
    } else {
      //for txt file
      // Upload original content as string
      await uploadString(originalFileRef, result.originalFile.content, "raw");
      originalContentPath = await getDownloadURL(originalFileRef);

      // Upload redacted content as string
      await uploadString(redactedFileRef, result.redactedContent, "raw");
      redactedContentPath = await getDownloadURL(redactedFileRef);
    }

    // Save metadata to Firestore
    const filesCollection = collection(db, "files");
    const docRef = await addDoc(filesCollection, {
      userId,
      originalFileName: result.originalFile.name,
      fileType: result.originalFile.type,
      originalContentPath,
      redactedContentPath,
      piiCount: result.piiCount,
      options: result.options,
      createdAt: serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    console.error("Error saving file:", error);
    throw new Error("Failed to save file");
  }
};

export const getUserFiles = async (userId: string): Promise<StoredFile[]> => {
  try {
    const filesCollection = collection(db, "files");
    const q = query(
      filesCollection,
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        } as StoredFile)
    );
  } catch (error) {
    console.error("Error fetching files:", error);
    return [];
  }
};

export const getFileContent = async (contentPath: string): Promise<string> => {
  try {
    const response = await fetch(contentPath);
    return await response.text();
  } catch (error) {
    console.error("Error fetching file content:", error);
    throw new Error("Failed to fetch file content");
  }
};

export const deleteUserFile = async (
  userId: string,
  fileId: string
): Promise<void> => {
  try {
    // Get file data first
    const fileRef = doc(db, "files", fileId);
    const fileSnap = await getDoc(fileRef);

    if (!fileSnap.exists()) {
      throw new Error("File not found");
    }

    const fileData = fileSnap.data() as Omit<StoredFile, "id" | "createdAt"> & {
      createdAt: number;
    };

    // Make sure the file belongs to the user
    if (fileData.userId !== userId) {
      throw new Error("Unauthorized");
    }

    // Delete storage files
    const originalFileRef = ref(storage, fileData.originalContentPath);
    const redactedFileRef = ref(storage, fileData.redactedContentPath);

    try {
      await deleteObject(originalFileRef);
    } catch (error) {
      console.error("Error deleting original file:", error);
    }

    try {
      await deleteObject(redactedFileRef);
    } catch (error) {
      console.error("Error deleting redacted file:", error);
    }

    // Delete Firestore document
    await deleteDoc(fileRef);
  } catch (error) {
    console.error("Error deleting file:", error);
    throw new Error("Failed to delete file");
  }
};

export const getFileUrl = async (docRefId: string, isRedacted: boolean) => {
  const docRef = doc(db, "files", docRefId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error("Document not found");
  }
  const data = docSnap.data();
  let fileUrl;
  if (isRedacted) {
    fileUrl = data.redactedContentPath;
  } else {
    fileUrl = data.originalContentPath;
  }

  return { fileUrl, originalFileName: data.originalFileName };
};
