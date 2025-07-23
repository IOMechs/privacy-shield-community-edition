import { parseCSV, csvToString } from "./file";
import { redactWithGemini2 } from "@/services/geminiService";
import { log } from "./logging";
import {
  extractTextFromRtfWithKeys,
  extractTextWithKeys,
  restoreTextFromKeys,
  restoreTextToRtf,
} from "./extraction";
import Papa from "papaparse";

export const redactText = async (
  text: string,
  options: RedactionOptions,
  userId: string,
  fileType: FileType
): Promise<string> => {
  if (options.useAI) {
    return await redactWithGemini2(text, options, userId, fileType);
  }

  const patterns = {
    names: options.includeNames ? /\b([A-Z][a-z]+ [A-Z][a-z]+)\b/g : null,
    emails: options.includeEmails
      ? /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g
      : null,
    phones: options.includePhones
      ? /\b(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g
      : null,
    addresses: options.includeAddresses
      ? /\b\d+\s+[A-Za-z]+\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Court|Ct|Lane|Ln|Way|Parkway|Pkwy)\b/gi
      : null,
    ssn: options.includeSsn ? /\b\d{3}[-]?\d{2}[-]?\d{4}\b/g : null,
    creditCards: options.includeCreditCards
      ? /\b(?:\d{4}[-]?){3}\d{4}\b/g
      : null,
  };

  let redactedText = text;

  const redactingCharacter = fileType === "csv" ? "         " : "████████"; // blank spaces for csv to avoid breaking

  if (options.method === "mask") {
    Object.values(patterns).forEach((pattern) => {
      if (pattern) {
        redactedText = redactedText.replace(pattern, redactingCharacter);
      }
    });

    options.includeCustomValues.forEach((customValue) => {
      if (customValue.trim()) {
        const customPattern = new RegExp(
          escapeRegExp(customValue.trim()),
          "gi"
        );
        redactedText = redactedText.replace(customPattern, redactingCharacter);
      }
    });
  } else if (options.method === "replace") {
    if (patterns.names) {
      redactedText = redactedText.replace(patterns.names, "John Doe");
    }
    if (patterns.emails) {
      redactedText = redactedText.replace(patterns.emails, "user@example.com");
    }
    if (patterns.phones) {
      redactedText = redactedText.replace(patterns.phones, "(555) 555-5555");
    }
    if (patterns.addresses) {
      redactedText = redactedText.replace(
        patterns.addresses,
        "123 Example Street"
      );
    }
    if (patterns.ssn) {
      redactedText = redactedText.replace(patterns.ssn, "000-00-0000");
    }
    if (patterns.creditCards) {
      redactedText = redactedText.replace(
        patterns.creditCards,
        "0000-0000-0000-0000"
      );
    }

    options.includeCustomValues.forEach((customValue) => {
      if (customValue.trim()) {
        const customPattern = new RegExp(
          escapeRegExp(customValue.trim()),
          "gi"
        );
        redactedText = redactedText.replace(customPattern, "[REDACTED]");
      }
    });
  }

  return redactedText;
};

export const redactCSV = async (
  csvContent: string,
  options: RedactionOptions,
  userId: string,
  fileType: FileType
): Promise<string> => {
  // Always process the entire CSV as a single text to avoid multiple API calls
  if (options.useAI) {
    const redactedContent = await redactWithGemini2(
      csvContent,
      options,
      userId,
      fileType
    );
    return redactedContent;
  }

  // For regex processing, handle each cell individually
  const parsedCsv = parseCSV(csvContent);

  const redactedCsv = await Promise.all(
    parsedCsv.map(async (row) => {
      return await Promise.all(
        row.map(async (cell) => {
          return await redactText(cell, options, userId, fileType);
        })
      );
    })
  );

  return csvToString(redactedCsv);
};

export const redactDocx = async (
  xmlContent: string,
  options: RedactionOptions,
  userId: string,
  fileType: FileType
) => {
  log("Redacting Docx");
  const { updatedXml, textMap } = extractTextWithKeys(xmlContent);
  // send this text map for redaction and then give it to the restore function
  if (options.useAI) {
    let redactedMap = await redactWithGemini2(
      textMap,
      options,
      userId,
      fileType
    );
    redactedMap = JSON.parse(redactedMap);
    const redactedXml = restoreTextFromKeys(updatedXml, redactedMap);
    return redactedXml;
  }

  const patterns = {
    names: options.includeNames ? /\b([A-Z][a-z]+ [A-Z][a-z]+)\b/g : null,
    emails: options.includeEmails
      ? /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g
      : null,
    phones: options.includePhones
      ? /\b(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g
      : null,
    addresses: options.includeAddresses
      ? /\b\d+\s+[A-Za-z]+\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Court|Ct|Lane|Ln|Way|Parkway|Pkwy)\b/gi
      : null,
    ssn: options.includeSsn ? /\b\d{3}[-]?\d{2}[-]?\d{4}\b/g : null,
    creditCards: options.includeCreditCards
      ? /\b(?:\d{4}[-]?){3}\d{4}\b/g
      : null,
  };

  const redactedMap: Record<number, string> = {};

  for (const [key, originalText] of Object.entries(textMap)) {
    let redacted = originalText;

    if (options.method === "mask") {
      Object.values(patterns).forEach((pattern) => {
        if (pattern) {
          redacted = redacted.replace(pattern, "         "); // blank spaces for redaction in csv
        }
      });

      for (const custom of options.includeCustomValues) {
        if (custom.trim()) {
          const customPattern = new RegExp(escapeRegExp(custom.trim()), "gi");
          redacted = redacted.replace(customPattern, "         ");
        }
      }
    } else if (options.method === "replace") {
      if (patterns.names) {
        redacted = redacted.replace(patterns.names, "John Doe");
      }
      if (patterns.emails) {
        redacted = redacted.replace(patterns.emails, "user@example.com");
      }
      if (patterns.phones) {
        redacted = redacted.replace(patterns.phones, "(555) 555-5555");
      }
      if (patterns.addresses) {
        redacted = redacted.replace(patterns.addresses, "123 Example Street");
      }
      if (patterns.ssn) {
        redacted = redacted.replace(patterns.ssn, "000-00-0000");
      }
      if (patterns.creditCards) {
        redacted = redacted.replace(
          patterns.creditCards,
          "0000-0000-0000-0000"
        );
      }

      for (const custom of options.includeCustomValues) {
        if (custom.trim()) {
          const customPattern = new RegExp(escapeRegExp(custom.trim()), "gi");
          redacted = redacted.replace(customPattern, "[REDACTED]");
        }
      }
    }

    redactedMap[Number(key)] = redacted;
  }

  const res = restoreTextFromKeys(updatedXml, redactedMap);

  return res;
};

export const redactRtf = async (
  rtfContent: string,
  options: RedactionOptions,
  userId: string,
  fileType: FileType
): Promise<string> => {
  if (options.useAI) {
    //extract text from rtf in a map
    const { updatedRtf, textMap } = extractTextFromRtfWithKeys(rtfContent);
    //redact that map
    const redactedMap = await redactWithGemini2(
      textMap,
      options,
      userId,
      fileType
    );
    let objMap = JSON.parse(redactedMap);
    // reconstruct the rtf from the redacted map
    const finalRtf = restoreTextToRtf(updatedRtf, objMap);

    return finalRtf;
  }

  // Helper function to avoid regex escaping RTF control words
  const createRtfSafeRegex = (pattern: string, flags: string): RegExp => {
    // Negative lookbehind to avoid matching after backslash (RTF control words)
    // Negative lookahead to avoid matching before control word parameters
    return new RegExp(`(?<!\\\\)${pattern}(?!\\w*\\s?[-\\d]+)`, flags);
  };

  // RTF-safe patterns that won't match RTF control words
  const patterns = {
    names: options.includeNames
      ? createRtfSafeRegex("\\b([A-Z][a-z]+ [A-Z][a-z]+)\\b", "g")
      : null,
    emails: options.includeEmails
      ? createRtfSafeRegex(
          "\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b",
          "g"
        )
      : null,
    phones: options.includePhones
      ? createRtfSafeRegex(
          "\\b(\\+\\d{1,2}\\s)?\\(?\\d{3}\\)?[\\s.-]?\\d{3}[\\s.-]?\\d{4}\\b",
          "g"
        )
      : null,
    addresses: options.includeAddresses
      ? createRtfSafeRegex(
          "\\b\\d+\\s+[A-Za-z]+\\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Court|Ct|Lane|Ln|Way|Parkway|Pkwy)\\b",
          "gi"
        )
      : null,
    ssn: options.includeSsn
      ? createRtfSafeRegex("\\b\\d{3}[-]?\\d{2}[-]?\\d{4}\\b", "g")
      : null,
    creditCards: options.includeCreditCards
      ? createRtfSafeRegex("\\b(?:\\d{4}[-]?){3}\\d{4}\\b", "g")
      : null,
  };

  let redactedRtf = rtfContent;

  const processRtfSections = (
    text: string,
    processor: (section: string) => string
  ): string => {
    // Parse RTF into sections (RTF controls vs. plain text)
    const rtfSections: { isControl: boolean; content: string }[] = [];
    let currentSection = { isControl: false, content: "" };
    let inControl = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      if (char === "\\") {
        // Start of control word
        if (!inControl) {
          // End previous section if not empty
          if (currentSection.content) {
            rtfSections.push({ ...currentSection });
            currentSection.content = "";
          }

          inControl = true;
          currentSection.isControl = true;
        }
        currentSection.content += char;
      } else if (inControl && !/[a-zA-Z]/.test(char)) {
        // End of control word
        currentSection.content += char;
        rtfSections.push({ ...currentSection });
        currentSection = { isControl: false, content: "" };
        inControl = false;
      } else {
        currentSection.content += char;

        // Handle special cases like { and } which should be treated as control
        if ((char === "{" || char === "}") && !inControl) {
          if (currentSection.content.length > 1) {
            const nonControlContent = currentSection.content.slice(0, -1);
            rtfSections.push({ isControl: false, content: nonControlContent });
          }
          rtfSections.push({ isControl: true, content: char });
          currentSection = { isControl: false, content: "" };
        }
      }
    }

    // Add the last section
    if (currentSection.content) {
      rtfSections.push(currentSection);
    }

    // Process only non-control sections
    return rtfSections
      .map((section) => {
        if (!section.isControl) {
          return processor(section.content);
        }
        return section.content;
      })
      .join("");
  };

  if (options.method === "mask") {
    redactedRtf = processRtfSections(redactedRtf, (textSection) => {
      let processed = textSection;
      Object.values(patterns).forEach((pattern) => {
        if (pattern) {
          processed = processed.replace(pattern, "         "); // blank spaces for redaction in rtf
        }
      });

      options.includeCustomValues.forEach((customValue) => {
        if (customValue.trim()) {
          // Create a safe pattern for custom values
          const escapedValue = escapeRegExp(customValue.trim());
          const customPattern = createRtfSafeRegex(escapedValue, "gi");
          processed = processed.replace(customPattern, "         ");
        }
      });

      return processed;
    });
  } else if (options.method === "replace") {
    redactedRtf = processRtfSections(redactedRtf, (textSection) => {
      let processed = textSection;

      if (patterns.names) {
        processed = processed.replace(patterns.names, "John Doe");
      }
      if (patterns.emails) {
        processed = processed.replace(patterns.emails, "user@example.com");
      }
      if (patterns.phones) {
        processed = processed.replace(patterns.phones, "(555) 555-5555");
      }
      if (patterns.addresses) {
        processed = processed.replace(patterns.addresses, "123 Example Street");
      }
      if (patterns.ssn) {
        processed = processed.replace(patterns.ssn, "000-00-0000");
      }
      if (patterns.creditCards) {
        processed = processed.replace(
          patterns.creditCards,
          "0000-0000-0000-0000"
        );
      }

      options.includeCustomValues.forEach((customValue) => {
        if (customValue.trim()) {
          const escapedValue = escapeRegExp(customValue.trim());
          const customPattern = createRtfSafeRegex(escapedValue, "gi");
          processed = processed.replace(customPattern, "[REDACTED]");
        }
      });

      return processed;
    });
  }

  return redactedRtf;
};

export const processFile = async (
  file: UploadedFile,
  options: RedactionOptions,
  userId: string
): Promise<RedactionResult> => {
  let redactedContent: string;

  if (file.type === "csv") {
    redactedContent = await redactCSV(file.content, options, userId, file.type);
  } else if (file.type === "docx") {
    redactedContent = await redactDocx(
      file.content,
      options,
      userId,
      file.type
    );
  } else if (file.type === "rtf") {
    redactedContent = await redactRtf(file.content, options, userId, file.type);
  } else {
    // Handle text, PDF, and others
    redactedContent = await redactText(
      file.content,
      options,
      userId,
      file.type
    );
  }

  const piiCount = countPiiInstances(file.content, redactedContent);

  return {
    originalFile: file,
    redactedContent,
    redactedAt: new Date(),
    options,
    piiCount,
    docRefId: "",
  };
};

const countPiiInstances = (original: string, redacted: string): number => {
  // For AI-redacted content, this is just an estimate
  if (redacted.includes("█████████")) {
    return (redacted.match(/█████████/g) || []).length;
  }

  // For replaced content, count the number of standard replacement values
  const replacements = [
    "John Doe",
    "user@example.com",
    "(555) 555-5555",
    "123 Example Street",
    "000-00-0000",
    "0000-0000-0000-0000",
  ];

  let count = 0;
  replacements.forEach((replacement) => {
    const regex = new RegExp(escapeRegExp(replacement), "g");
    const matches = redacted.match(regex);
    if (matches) {
      count += matches.length;
    }
  });

  // Count long sequences of spaces (7+ spaces considered redacted in csv and rtf)
  const spaceRedactions = redacted.match(/ {7,}/g); // adjust threshold if needed
  if (spaceRedactions) {
    count += spaceRedactions.length;
  }

  return count || Math.abs(original.length - redacted.length) / 10;
};

export const escapeRegExp = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

export function localRedactCustomValues(
  text: string,
  values: string[],
  isCsvOrRtf: boolean
): string {
  if (!values.length) return text;

  const redactingCharacter = isCsvOrRtf ? "         " : "████████";

  const redacted = values.reduce((acc, value) => {
    if (!value.trim()) return acc;
    const regex = new RegExp(`\\b${escapeRegExp(value)}\\b`, "gi");
    return acc.replace(regex, redactingCharacter);
  }, text);

  log("Custom value redaction complete", {
    valuesCount: values.length,
    textLengthBefore: text.length,
    textLengthAfter: redacted.length,
  });

  return redacted;
}
export function detectDelimiter(content: string): string {
  const firstLine = content.split("\n")[0];
  const delimiters = [",", ";", "\t"];
  const counts = delimiters.map(
    (d) => (firstLine.match(new RegExp(d, "g")) || []).length
  );
  const maxCount = Math.max(...counts);
  return delimiters[counts.indexOf(maxCount)] || ",";
}

export function parseCSVWithDelimitter(
  content: string,
  delimiter: string
): { headers: string[]; rows: string[][] } {
  const parsedData = Papa.parse(content, { delimiter, header: false });
  const headers = parsedData.data[0] as string[];
  const rows = parsedData.data.slice(1) as string[][];
  return { headers, rows };
}
