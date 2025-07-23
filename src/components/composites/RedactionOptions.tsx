import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Shield, X, MessageSquare } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";

import { toast } from "sonner";
import { log, error } from "@/lib/utils/logging";

import ErrorModal from "./ErrorModal";
import { AppError } from "@/lib/utils/errorClass";

interface RedactionOptionsProps {
  options: RedactionOptions;
  onOptionsChange: (options: RedactionOptions) => void;
  onProcessFile: () => void;
  isLoading: boolean;
  fileSelected: boolean;
}

export function RedactionOptions({
  options,
  onOptionsChange,
  onProcessFile,
  isLoading,
  fileSelected,
}: RedactionOptionsProps) {
  const [customValue, setCustomValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [restrictionMessage, setMessage] = useState("");

  const { user } = useAuth();

  const handleMethodChange = (value: string) => {
    onOptionsChange({
      ...options,
      method: value as "mask" | "replace",
    });
  };

  const handleCheckboxChange = (field: keyof RedactionOptions) => {
    onOptionsChange({
      ...options,
      [field]: !options[field as keyof RedactionOptions],
    });
  };

  const handleCustomPromptChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    onOptionsChange({
      ...options,
      customPrompt: e.target.value,
    });
  };

  const addCustomValue = () => {
    if (
      customValue.trim() &&
      !options.includeCustomValues.includes(customValue.trim())
    ) {
      onOptionsChange({
        ...options,
        includeCustomValues: [
          ...options.includeCustomValues,
          customValue.trim(),
        ],
      });
      setCustomValue("");
    }
  };

  const removeCustomValue = (value: string) => {
    onOptionsChange({
      ...options,
      includeCustomValues: options.includeCustomValues.filter(
        (v) => v !== value
      ),
    });
  };

  const handleRedactionSubmit = async () => {
    if (!user) return;

    try {
      onProcessFile();
    } catch (err) {
      if (err instanceof Error) {
        if (err.message !== restrictionMessage) setMessage(err.message);
        if (!isOpen) setIsOpen(true);
      }
      error(err instanceof Error ? err.message : "Something went wrong");
      toast.error("Could not process your file for redaction.");
    }
  };

  return (
    <Card className="w-full p-6 bg-white/90 backdrop-blur-sm border border-slate-200 shadow-sm rounded-xl overflow-hidden animate-fade-in">
      <ErrorModal
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        restrictionMessage={restrictionMessage}
      />

      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-medium">Redaction Options</h3>
        </div>

        <div className="flex items-center space-x-2 mb-4">
          <Checkbox
            id="useAI"
            checked={options.useAI}
            onCheckedChange={() => handleCheckboxChange("useAI")}
          />
          <Label htmlFor="useAI">Use AI for redaction (Gemini)</Label>
        </div>

        <Tabs
          defaultValue="mask"
          value={options.method}
          onValueChange={handleMethodChange}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="mask">Mask Information</TabsTrigger>
            <TabsTrigger value="replace">Replace with Fake Data</TabsTrigger>
          </TabsList>
          <TabsContent value="mask" className="mt-4">
            <p className="text-sm text-gray-500 mb-4">
              All PII information will be replaced with ████████.
            </p>
          </TabsContent>
          <TabsContent value="replace" className="mt-4">
            <p className="text-sm text-gray-500 mb-4">
              PII will be replaced with realistic but fake values.
            </p>
          </TabsContent>
        </Tabs>

        {options.useAI ? (
          <div className="space-y-4 mt-6">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-medium">Customize AI Prompt</h4>
            </div>
            <Textarea
              placeholder="Add instructions for AI redaction (optional)"
              value={options.customPrompt || ""}
              onChange={handleCustomPromptChange}
              className="min-h-[100px] text-sm"
            />
            <p className="text-xs text-gray-500">
              Customize how the AI should redact or replace personal
              information. Leave empty to use the default prompt.
            </p>
          </div>
        ) : (
          <div className="space-y-4 mt-8">
            <h4 className="text-sm font-medium">Information to Redact</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="names"
                  checked={options.includeNames}
                  onCheckedChange={() => handleCheckboxChange("includeNames")}
                />
                <Label htmlFor="names">Names</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="emails"
                  checked={options.includeEmails}
                  onCheckedChange={() => handleCheckboxChange("includeEmails")}
                />
                <Label htmlFor="emails">Email Addresses</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="phones"
                  checked={options.includePhones}
                  onCheckedChange={() => handleCheckboxChange("includePhones")}
                />
                <Label htmlFor="phones">Phone Numbers</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="addresses"
                  checked={options.includeAddresses}
                  onCheckedChange={() =>
                    handleCheckboxChange("includeAddresses")
                  }
                />
                <Label htmlFor="addresses">Physical Addresses</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ssn"
                  checked={options.includeSsn}
                  onCheckedChange={() => handleCheckboxChange("includeSsn")}
                />
                <Label htmlFor="ssn">Social Security Numbers</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="creditCards"
                  checked={options.includeCreditCards}
                  onCheckedChange={() =>
                    handleCheckboxChange("includeCreditCards")
                  }
                />
                <Label htmlFor="creditCards">Credit Card Numbers</Label>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4 mt-6">
          <h4 className="text-sm font-medium">Custom Values to Redact</h4>
          <div className="flex gap-2">
            <Input
              placeholder="Add specific text to redact"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustomValue();
                }
              }}
            />
            <Button variant="outline" onClick={addCustomValue} type="button">
              Add
            </Button>
          </div>

          {options.includeCustomValues.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {options.includeCustomValues.map((value, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md text-sm"
                >
                  <span>{value}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0"
                    onClick={() => removeCustomValue(value)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button
          className="w-full mt-6 bg-primary hover:bg-primary/90"
          disabled={isLoading || !fileSelected}
          onClick={handleRedactionSubmit}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="spinner"></div>
              <span>Processing...</span>
            </div>
          ) : (
            "Redact File"
          )}
        </Button>
      </div>
    </Card>
  );
}

export default RedactionOptions;
