export const jsonArrayMatch = /\[\s*\{[\s\S]*\}\s*\]/;

export const individualObjMatch = /\{[^{}]*"key"[^{}]*"value"[^{}]*\}/g;

export const cellPattern = /\\cell\s*([^\\{}]+?)(?=\\cell|\})/g;

export const insrsidPattern = /\\insrsid\d+\s+([^\\{}\r\n]+)/g;

export const paragraphPattern =
  /(?<=\\[a-z]+(?:\d*)?(?:\s|\}))[^\\{}\r\n]+?(?=\\|\}|\{)/g;

export const charrsidPattern = /\\charrsid\d+\s+([^\\{}\r\n]+)/g;

export const escapeRegexPattern = /[.*+?^${}()|[\]\\]/g;

export const xmlExtractionPattern = /(<w:t(?:\s[^>]*)?>)(.*?)(<\/w:t>)/g;

export const xmlRestorationPattern =
  /(<w:t(?:\s[^>]*)?>)(\{\{\d+\}\})(<\/w:t>)/g;
