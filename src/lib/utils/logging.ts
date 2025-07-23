// Logging utility
const isProduction = process.env.NODE_ENV === "production";

export const log = (message: string, ...args: unknown[]) => {
  if (!isProduction) console.log(`[DEBUG] ${message}`, ...args);
};

export const error = (message: string, ...args: unknown[]) => {
  if (!isProduction) console.error(`[ERROR] ${message}`, ...args);
};
