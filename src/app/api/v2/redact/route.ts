// app/api/redact/route.ts
import { NextRequest, NextResponse } from "next/server";

import { callGemini } from "@/lib/serverUtils/aiRedaction";

// Initialize Gemini API

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      contentToRedact,
      userId,
      method,
      includeCustomValues,
      customPrompt,
      fileType,
    }: {
      contentToRedact: string | Record<number, string>;
      userId: string;
      method: "mask" | "replace";
      includeCustomValues: string[];
      customPrompt?: string;
      fileType: string;
    } = body;

    if (!contentToRedact || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const options: RedactionOptions = {
      method,
      includeCustomValues: includeCustomValues || [],
      customPrompt,
      includeNames: false,
      includeEmails: false,
      includePhones: false,
      includeAddresses: false,
      includeSsn: false,
      includeCreditCards: false,
      useAI: false,
    };

    const redactedContent = await callGemini(
      contentToRedact,
      options,
      fileType
    );

    return NextResponse.json({
      redactedContent,
      originalFilename: "content.txt",
      originalFileType: "text/plain",
    });
  } catch (err) {
    console.error("Error in redaction handler:", err);
    return NextResponse.json(
      { error: "Internal server error", details: err },
      { status: 500 }
    );
  }
}
