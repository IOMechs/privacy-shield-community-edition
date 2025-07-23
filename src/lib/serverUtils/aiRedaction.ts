import { GoogleGenAI } from "@google/genai";
import {
  detectDelimiter,
  localRedactCustomValues,
  parseCSVWithDelimitter,
} from "@/lib/utils/redaction";
import { error, log } from "@/lib/utils/logging";
import { individualObjMatch, jsonArrayMatch } from "../utils/regex";
import { sanitizeJson } from "../utils/extraction";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
type RedactionOptions = {
  method: "mask" | "replace";
  includeCustomValues: string[];
  customPrompt?: string;
};

export async function callGemini(
  toRedact: string | Record<number, string>,
  options: RedactionOptions,
  fileType: string
): Promise<string> {
  try {
    const { method, customPrompt, includeCustomValues } = options;

    let redactedContent;
    const isMask = method === "mask";
    if (fileType === "rtf" || fileType === "docx") {
      // Get entries and determine if we need to process in batches
      const entries = Object.entries(toRedact);
      const BATCH_SIZE = 100;
      const redactedMap: Record<number, string> = {};

      // Process in batches if needed, otherwise as a single batch
      for (let i = 0; i < entries.length; i += BATCH_SIZE) {
        const batch = entries.slice(i, i + BATCH_SIZE);
        const batchStructuredInput = batch.map(([key, value]) => ({
          key,
          value,
        }));

        const redactingCharacter = fileType === "rtf" ? "        " : "████████"; // blank spaces for rtf
        const systemPrompt = `You are a data redactor.
Your task is to redact all PII (personally identifiable information) in the values only by replacing PII with${
          isMask ? redactingCharacter : "realistic fake values"
        }.
PII includes names, emails, phone numbers, addresses, locations, dates, education institutes, subjects, occupations, company names, SSNs, credit cards, codes, hash, account numbers and any sensitive info that can cause privacy issues.

IMPORTANT CONSTRAINTS:
1. ONLY return the modified JSON array and NOTHING ELSE
2. DO NOT add any headers, date stamps, explanatory text, or metadata
3. DO NOT include any "Current Date and Time" or user information
4. Your entire response must be valid JSON array of objects that can be parsed directly
5. All strings MUST escape newline, tab, or control characters to remain JSON-safe (e.g., use \\n, \\t)

You must ONLY modify the text in the 'value' field of each object.
You MUST NOT change the 'key' field or add/remove any objects from the array.
DO NOT add any formatting, headers, or explanations to your output.`;

        // Request redaction from Gemini
        const res = await ai.models.generateContent({
          model: "gemini-2.0-flash",
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `${JSON.stringify(batchStructuredInput, null, 2)} ${
                    customPrompt ? "User Prompt: " + customPrompt : ""
                  }`,
                },
              ],
            },
          ],
          config: {
            systemInstruction: systemPrompt,
            maxOutputTokens: 8192, // Ensure we have enough tokens for the response
            temperature: 0.1, // Keep temperature low for deterministic outputs
          },
        });

        // Extract and parse the JSON response
        if (!res.text)
          throw new Error("Error while redacting docx content with Gemini");
        let jsonText = res.text.trim();

        // Clean the response if it contains non-JSON content
        if (!jsonText.startsWith("[")) {
          const jsonMatch = jsonText.match(jsonArrayMatch);
          if (jsonMatch) {
            jsonText = jsonMatch[0];
          } else {
            // If we can't find a JSON array, look for individual objects
            const objectMatches = jsonText.match(individualObjMatch);
            if (objectMatches && objectMatches.length > 0) {
              jsonText = "[" + objectMatches.join(",") + "]";
            }
          }
        }

        // Parse the redacted structure
        const safeJson = sanitizeJson(jsonText);
        const redactedStructure = JSON.parse(safeJson);

        // Process each item in the batch
        redactedStructure.forEach((item: any) => {
          if (item && "key" in item && "value" in item) {
            redactedMap[parseInt(item.key)] = item.value;
          }
        });
      }

      // Handle any missing keys by copying from the original
      Object.keys(toRedact).forEach((key) => {
        if (!(key in redactedMap)) {
          redactedMap[parseInt(key)] = toRedact[parseInt(key)];
        }
      });

      redactedContent = JSON.stringify(redactedMap);
    } else {
      // txt and csv files
      let text = typeof toRedact === "string" ? toRedact : ""; //  blank string in case of toRedact:Record to bypass .length
      const truncatedText =
        text.length > 100000 ? text.slice(0, 100000) + "..." : text;
      if (text.length > 100000) {
        log("Text truncated due to length limit", {
          originalLength: text.length,
          truncatedLength: truncatedText.length,
        });
      }

      const redactingCharacter = fileType === "csv" ? "         " : "████████"; // blank spaces for csv to avoid breaking

      const defaultMaskPrompt = `Redact all PII (personally identifiable information) in the following text by replacing it with ${redactingCharacter} . PII includes people names, emails, phone numbers, addresses, locations, dates, education institute names, subjects, occupation details, company names, SSN, credit card numbers, and other sensitive information. Return only the redacted text, maintaining the exact format of the original text (including line breaks, tabs, etc.). Unless an until, the next sentence in this prompt states otherwise. The language will be English or Swedish.`;
      const defaultReplacePrompt =
        "Replace all PII (personally identifiable information) in the following text with realistic fake values. PII includes people names, emails, phone numbers, addresses, locations, dates, education institute names, subjects, occupation details, company names, SSN, credit card numbers, and other sensitive information. Return only the text with fake values, maintaining the exact format of the original text (including line breaks, tabs, etc.). Unless an until, the next sentence in this prompt states otherwise. The language will be English or Swedish.";

      // Use custom prompt if provided, otherwise use default
      let prompt = isMask ? defaultMaskPrompt : defaultReplacePrompt;
      prompt = customPrompt ? `${prompt}. ${customPrompt}` : prompt;

      let contentToProcess = truncatedText;
      if (fileType === "csv") {
        const delimiter = detectDelimiter(truncatedText);
        const { headers, rows } = parseCSVWithDelimitter(
          truncatedText,
          delimiter
        );
        prompt += `\n\nThis is a CSV file with delimiter "${delimiter}". The columns are: ${headers.join(
          ", "
        )}. Process each row while maintaining the CSV structure.`;
        contentToProcess = rows.map((row) => row.join(delimiter)).join("\n");
      }

      log("Generated Gemini prompt:", prompt);
      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt + "\n\nText to redact:\n" + contentToProcess,
      });
      redactedContent = result.text;

      if (fileType === "csv") {
        const delimiter = detectDelimiter(truncatedText);
        const { headers } = parseCSVWithDelimitter(truncatedText, delimiter);
        redactedContent = [headers.join(delimiter), redactedContent].join("\n");
      }
    }
    // Apply custom value redaction after Gemini processing
    if (!redactedContent)
      throw new Error("Could not redact content with Gemini");
    return localRedactCustomValues(
      redactedContent,
      includeCustomValues,
      fileType === "rtf" || fileType === "csv"
    );
  } catch (err) {
    error("Error in Gemini API call:", err);
    throw new Error(
      `Gemini API error: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}
