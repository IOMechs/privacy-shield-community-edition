const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export const redactWithGemini = async (
  text: string,
  options: RedactionOptions,
  userId: string
): Promise<string> => {
  try {
    if (!userId) throw new Error("User not logged in");
    // For small text content, create a synthetic file
    const blob = new Blob([text], { type: "text/plain" });
    const file = new File([blob], "content.txt", { type: "text/plain" });

    // Create form data for the API call
    const formData = new FormData();
    formData.append("file", file);
    formData.append("method", options.method);
    formData.append("userId", userId);
    if (options.customPrompt) {
      formData.append("customPrompt", options.customPrompt);
    }

    if (options.includeCustomValues.length > 0) {
      formData.append(
        "includeCustomValues",
        JSON.stringify(options.includeCustomValues)
      );
    }

    const response = await fetch(`${API_BASE_URL}/redact`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error: ${errorData.error || response.statusText}`);
    }

    const result = await response.json();
    return result.redactedContent;
  } catch (error) {
    console.error("Error in Gemini API call:", error);
    throw new Error(
      `Gemini API error: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};

export const redactWithGemini2 = async (
  contentToRedact: string | Record<number, string>,
  options: RedactionOptions,
  userId: string,
  fileType: FileType
): Promise<string> => {
  try {
    if (!userId) throw new Error("User not logged in");

    const payload = {
      contentToRedact,
      userId,
      method: options.method,
      includeCustomValues: options.includeCustomValues,
      customPrompt: options.customPrompt,
      fileType,
    };

    const response = await fetch(`${API_BASE_URL}/v2/redact`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(response);
      throw new Error(`API Error: ${errorData.error || response.statusText}`);
    }

    const result = await response.json();
    return result.redactedContent;
  } catch (error) {
    console.error("Error in Gemini API call:", error);
    throw new Error(
      `Gemini API error: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};
