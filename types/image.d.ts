type ImgContextType = {
  redactedFile?: File;
  isProcessing?: boolean;
  docRefId?: string;
  onImageUpload?: (imageUrl: File) => void;
  onImageDelete?: () => void;
  onImageRedact?: () => void;
  onAddValue?: (value: string) => void;
  onRemoveValue?: (value: string) => void;
  isRedactAll?: boolean;
  setIsRedactAll?: Dispatch<SetStateAction<boolean>>;
  setTab?: Dispatch<SetStateAction<"face" | "text">>;
  onFaceImagesUpload?: (files: FaceFileType[]) => void;
  onFaceImagesDelete?: (src: string) => void;
  values?: string[];
  tab?: RedactionTabOptions;
}; // all fields are kept optional to allow initializing of context with empty object
type ImagePreviewProps = {
  originalImage: File;
};

type FaceFileType = {
  file: File;
  id: string;
};

type RedactionTabOptions = "face" | "text";
