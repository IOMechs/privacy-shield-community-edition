/**
 * Extracts plain text from an RTF file, focusing on the body content if full extraction isn't possible
 * @param {string} rtfContent - The RTF file content as a string
 * @returns {string} - The extracted plain text
 */

import {
  cellPattern,
  charrsidPattern,
  escapeRegexPattern,
  insrsidPattern,
  paragraphPattern,
  xmlExtractionPattern,
  xmlRestorationPattern,
} from "./regex";

//Extracts text from rtf file to show preview
export function extractTextFromRtf(rtfContent: string) {
  // Return empty string if input is null/undefined
  if (!rtfContent) {
    return "";
  }

  let result = "";
  let inControl = false;
  let inControlWord = false;
  let controlWord = "";
  let braceLevel = 0;
  let skipUntilBraceLevel = -1;
  let unicodeCharBuffer = [];
  let unicodeCharCount = 0;
  let i = 0;

  // These control words should be replaced with specific characters
  const specialCharMap: Record<string, string> = {
    par: "\n",
    tab: "\t",
    line: "\n",
  };

  // These groups should be ignored
  const ignoreGroups = [
    "fonttbl",
    "colortbl",
    "stylesheet",
    "info",
    "header",
    "footer",
    "pict",
    "filetbl",
    "datastore",
  ];

  // Check if we're in a group to ignore
  const isInIgnoreGroup = () => {
    return skipUntilBraceLevel >= 0 && braceLevel >= skipUntilBraceLevel;
  };

  while (i < rtfContent.length) {
    const char = rtfContent[i];

    // Handle nested groups with braces
    if (char === "{") {
      braceLevel++;

      // Check if this is the start of a group we want to ignore
      for (const group of ignoreGroups) {
        if (
          rtfContent.substring(i + 1, i + group.length + 2) ===
          "\\" + group
        ) {
          skipUntilBraceLevel = braceLevel;
          break;
        }
      }

      i++;
      continue;
    }

    if (char === "}") {
      braceLevel--;

      // If we're exiting an ignore group
      if (skipUntilBraceLevel > braceLevel) {
        skipUntilBraceLevel = -1;
      }

      i++;
      continue;
    }

    // Skip if we're in an ignore group
    if (isInIgnoreGroup()) {
      i++;
      continue;
    }

    // Handle control words and control symbols
    if (char === "\\") {
      inControl = true;
      inControlWord = false;
      controlWord = "";
      i++;

      // Check for control symbol (single character after backslash)
      if (i < rtfContent.length) {
        const nextChar = rtfContent[i];

        // Handle control symbols directly
        if (nextChar === "'") {
          // Hex encoded character: skip the ' and read 2 hex digits
          i++;
          if (i + 1 < rtfContent.length) {
            const hexCode = rtfContent.substring(i, i + 2);
            try {
              const charCode = parseInt(hexCode, 16);
              result += String.fromCharCode(charCode);
            } catch (e) {
              // Ignore if not valid hex
            }
            i += 2;
          }
          inControl = false;
          continue;
        } else if ("\\{}".includes(nextChar)) {
          // These control symbols represent literal characters
          result += nextChar;
          i++;
          inControl = false;
          continue;
        } else if (/[a-zA-Z]/.test(nextChar)) {
          inControlWord = true;
          controlWord = nextChar;
          i++;

          // Continue reading the control word
          while (i < rtfContent.length && /[a-zA-Z]/.test(rtfContent[i])) {
            controlWord += rtfContent[i];
            i++;
          }

          // Handle special control words that represent characters
          if (specialCharMap[controlWord]) {
            result += specialCharMap[controlWord];
          }

          // Handle Unicode character
          if (controlWord === "u") {
            let unicodeValue = "";
            while (i < rtfContent.length && /[-\d]/.test(rtfContent[i])) {
              unicodeValue += rtfContent[i];
              i++;
            }

            if (unicodeValue) {
              const charCode = parseInt(unicodeValue, 10);
              if (!isNaN(charCode)) {
                result += String.fromCharCode(charCode);

                // Skip the substitution character that typically follows
                unicodeCharCount = 1;
              }
            }
          }

          // Skip parameter if present
          if (i < rtfContent.length && rtfContent[i] === " ") {
            i++; // Skip the space after control word
          }

          inControl = false;
          continue;
        }
      }
    }

    // Handle regular text
    if (!inControl) {
      if (unicodeCharCount > 0) {
        // Skip substitute characters that follow Unicode control words
        unicodeCharCount--;
      } else if (char !== "\r" && char !== "\n") {
        result += char;
      }
    }

    i++;
  }

  return result.trim();
}

// Advanced RTF parser for text extraction and mapping
export function extractTextFromRtfWithKeys(rtfContent: string): {
  updatedRtf: string;
  textMap: Record<number, string>;
} {
  // Return empty objects if input is null/undefined
  if (!rtfContent) {
    return { updatedRtf: "", textMap: {} };
  }

  const textMap: Record<number, string> = {};
  let keyCounter = 0;

  // Step 1: Parse RTF with proper syntax understanding
  let inControlWord = false;
  let bracketLevel = 0;
  let skipGroup = false;
  let currentGroupStart = -1;
  let buffer = "";
  let updatedRtf = rtfContent;

  // These groups should be ignored for text extraction - BUT we need to precisely identify them
  // RTF control groups always start with \groupname (right after an opening brace)
  const ignoreGroups = [
    "fonttbl",
    "colortbl",
    "stylesheet",
    "info",
    "revtbl",
    "pict",
    "filetbl",
    "datastore",
    "themedata",
    "colorschememapping",
    "header",
    "footer",
  ];

  // First, properly capture and extract actual text content, not RTF commands
  // We'll use multiple strategies to identify real text

  // 1. Extract text content from table cells

  let cellMatch;
  while ((cellMatch = cellPattern.exec(updatedRtf)) !== null) {
    if (cellMatch[1] && cellMatch[1].trim()) {
      const content = cellMatch[1].trim();
      // Skip numeric-only cells, they're likely just indexes
      if (!/^\d+$/.test(content) && content.length > 1) {
        textMap[keyCounter] = content;

        // Replace with placeholder
        const placeholder = `<<${keyCounter.toString().padStart(8, "0")}>>`;
        updatedRtf = updatedRtf.replace(cellMatch[1], placeholder);
        keyCounter++;
      }
    }
  }

  // 2. Extract text after insrsid markers (common RTF content indicator)

  let insrsidMatch;
  while ((insrsidMatch = insrsidPattern.exec(updatedRtf)) !== null) {
    if (insrsidMatch[1] && insrsidMatch[1].trim()) {
      const content = insrsidMatch[1].trim();
      // Exclude control word sequences and short content
      if (!content.startsWith("\\") && content.length > 3) {
        textMap[keyCounter] = content;

        // Replace with placeholder
        const placeholder = `<<${keyCounter.toString().padStart(8, "0")}>>`;
        updatedRtf = updatedRtf.replace(insrsidMatch[1], placeholder);
        keyCounter++;
      }
    }
  }

  // 3. Extract paragraph content (long text between RTF controls)
  // This pattern more precisely targets actual content between RTF commands

  let paragraphMatch;
  while ((paragraphMatch = paragraphPattern.exec(updatedRtf)) !== null) {
    const content = paragraphMatch[0].trim();
    if (content && content.length > 5) {
      // Skip content that looks like RTF control words
      if (!content.includes("\\") && !/^[a-z]+\d*$/.test(content)) {
        textMap[keyCounter] = content;

        // Replace with placeholder
        const placeholder = `<<${keyCounter.toString().padStart(8, "0")}>>`;
        updatedRtf = updatedRtf.replace(content, placeholder);
        keyCounter++;
      }
    }
  }

  // 4. Extract text in charrsid sections (often contains document text)

  let charrsidMatch;
  while ((charrsidMatch = charrsidPattern.exec(updatedRtf)) !== null) {
    if (charrsidMatch[1] && charrsidMatch[1].trim()) {
      const content = charrsidMatch[1].trim();
      if (content.length > 3) {
        textMap[keyCounter] = content;

        // Replace with placeholder
        const placeholder = `<<${keyCounter.toString().padStart(8, "0")}>>`;
        updatedRtf = updatedRtf.replace(charrsidMatch[1], placeholder);
        keyCounter++;
      }
    }
  }

  // 5. More precise RTF structure parsing for remaining text
  // Now we'll use a character-by-character parser to catch anything we missed
  let i = 0;
  const rtfChars = updatedRtf.split("");

  while (i < rtfChars.length) {
    const char = rtfChars[i];

    // Track group nesting
    if (char === "{") {
      bracketLevel++;

      // Check if this is the start of a group we want to ignore
      // IMPORTANT: We now specifically check for RTF control word format
      if (!skipGroup && i + 1 < rtfChars.length && rtfChars[i + 1] === "\\") {
        let j = i + 2;
        let possibleGroup = "";

        // Build the potential group name
        while (j < rtfChars.length && /[a-z]/.test(rtfChars[j])) {
          possibleGroup += rtfChars[j];
          j++;
        }

        // Only mark as an ignore group if it EXACTLY matches the pattern {\\groupname
        if (ignoreGroups.includes(possibleGroup)) {
          skipGroup = true;
          currentGroupStart = bracketLevel;
        }
      }

      i++;
      continue;
    }

    if (char === "}") {
      bracketLevel--;

      // Exit ignore group if we've closed its containing bracket
      if (skipGroup && bracketLevel < currentGroupStart) {
        skipGroup = false;
      }

      i++;
      continue;
    }

    // In text content mode (not in a control group)
    if (!skipGroup) {
      // Check if this is the start of a control word/symbol
      if (char === "\\") {
        // Skip over RTF control sequences
        i++;
        if (i < rtfChars.length) {
          // Skip hex character encoding
          if (rtfChars[i] === "'") {
            i += 3; // Skip \' and hex digits
          }
          // Skip control word
          else if (/[a-z]/i.test(rtfChars[i])) {
            while (i < rtfChars.length && /[a-z]/i.test(rtfChars[i])) {
              i++;
            }
            // Skip control word parameter if present
            while (i < rtfChars.length && /[0-9-]/.test(rtfChars[i])) {
              i++;
            }
            // Skip space after control word
            if (i < rtfChars.length && rtfChars[i] === " ") {
              i++;
            }
          } else {
            // Control symbol (single character)
            i++;
          }
        }
        continue;
      }

      // Accumulate text content (regular characters, not control words)
      if (!/[\r\n]/.test(char)) {
        let textStart = i;
        buffer = "";

        // Collect characters until we hit an RTF control character or group marker
        while (
          i < rtfChars.length &&
          rtfChars[i] !== "\\" &&
          rtfChars[i] !== "{" &&
          rtfChars[i] !== "}" &&
          !/[\r\n]/.test(rtfChars[i])
        ) {
          buffer += rtfChars[i];
          i++;
        }

        // Process accumulated text if it's meaningful
        if (buffer.trim() && buffer.trim().length > 3) {
          const trimmed = buffer.trim();

          // Skip if it looks like a control word or number sequence
          if (!/^[\\{}\s\d]+$/.test(trimmed) && !/^<<\d{8}>>$/.test(trimmed)) {
            textMap[keyCounter] = trimmed;

            // Create a replacement that doesn't affect document structure
            const placeholder = `<<${keyCounter.toString().padStart(8, "0")}>>`;

            // Replace in original text
            const bufferRegex = new RegExp(escapeRegExp(buffer), "g");
            updatedRtf = updatedRtf.replace(bufferRegex, placeholder);

            keyCounter++;
          }
        }
        continue;
      }
    }

    i++;
  }

  // Filter text map to remove any remaining RTF artifacts
  const finalTextMap: Record<number, string> = {};
  for (const [key, value] of Object.entries(textMap)) {
    const cleanValue = value.trim();

    // Only keep entries that are likely real text content
    // Exclude RTF control sequences, numbers, placeholders, and very short text
    if (
      cleanValue.length > 3 &&
      !/^\\/.test(cleanValue) &&
      !/^<<\d{8}>>$/.test(cleanValue) &&
      !ignoreGroups.includes(cleanValue)
    ) {
      finalTextMap[parseInt(key)] = cleanValue;
    }
  }

  return { updatedRtf, textMap: finalTextMap };
}
// Helper function to escape regex special characters
function escapeRegExp(string: string) {
  return string.replace(escapeRegexPattern, "\\$&");
}

// Reconstructs the rtf from redacted text map
export function restoreTextToRtf(
  rtfContent: string,
  textMap: Record<number, string>
): string {
  let result = rtfContent;

  // Replace all placeholders with their corresponding text
  result = result.replace(/<<(\d{8})>>/g, (match, key) => {
    const index = parseInt(key, 10);
    if (textMap[index] !== undefined) {
      // Properly escape special RTF characters in the replacement text
      return escapeRtfText(textMap[index]);
    }
    return match;
  });

  return result;
}

// Helper function to escape RTF special characters
function escapeRtfText(text: string): string {
  // Escape RTF special characters
  return text
    .replace(/\\/g, "\\\\") // Escape backslashes
    .replace(/\{/g, "\\{") // Escape opening braces
    .replace(/\}/g, "\\}"); // Escape closing braces
}
// Contructs a text map from XML which will be redacted
export function extractTextWithKeys(xml: string): {
  updatedXml: string;
  textMap: Record<number, string>;
} {
  const textMap: Record<number, string> = {};
  let index = 0;

  const updatedXml = xml.replace(
    xmlExtractionPattern,
    (_, openTag, content, closeTag) => {
      textMap[index] = content;
      return `${openTag}{{${index++}}}${closeTag}`;
    }
  );

  return { updatedXml, textMap };
}

// reconstructs the XML from redacted map which will be redacted
export function restoreTextFromKeys(
  xml: string,
  textMap: Record<number, string>
): string {
  return xml.replace(
    xmlRestorationPattern,
    (_, openTag, placeholder, closeTag) => {
      const keyMatch = placeholder.match(/^\{\{(\d+)\}\}$/);
      if (!keyMatch) return `${openTag}${placeholder}${closeTag}`; // Not a valid placeholder

      const key = Number(keyMatch[1]);
      const original = textMap[key] ?? "";
      return `${openTag}${original}${closeTag}`;
    }
  );
}

export function sanitizeJson(raw: string): string {
  return raw
    .replace(/[\x00-\x1F\x7F]/g, " ") // Replace control characters with space
    .replace(/\n/g, "\\n") // Escape newlines inside strings
    .replace(/\r/g, "\\r") // Escape carriage returns
    .replace(/\t/g, "\\t"); // Escape tabs
}
