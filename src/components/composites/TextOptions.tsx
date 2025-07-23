import React, { useContext, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { Plus, X } from "lucide-react";
import { ImgContext } from "@/contexts/RedactedImageContext";

function TextOptions() {
  const { onAddValue, isRedactAll, setIsRedactAll, values, onRemoveValue } =
    useContext(ImgContext);

  const [inputValue, setInputValue] = useState("");
  const handleAdd = () => {
    if (inputValue.trim()) {
      onAddValue?.(inputValue);
      setInputValue("");
    }
  };
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAdd();
    }
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Checkbox
          id="useAI"
          checked={isRedactAll}
          onCheckedChange={() =>
            setIsRedactAll((previous: boolean) => !previous)
          }
          className="cursor-pointer"
        />
        <Label htmlFor="useAI" className="cursor-pointer">
          Redact all text in image (except the ignored values)
        </Label>
      </div>

      <h3 className="sm:text-lg text-md font-medium text-foreground">
        Custom Values to Ignore
      </h3>

      <div className="flex gap-2 sm:flex-row flex-col">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={"Enter specific words to not redact"}
          className="flex-1 border-gray-200 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white/70"
        />
        <Button
          onClick={handleAdd}
          className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {values?.map((value) => (
          <div
            key={value}
            className="flex items-center gap-2 bg-slate-100 px-2 py-1 rounded-md text-sm"
          >
            <span>{value}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0 m-0 cursor-pointer"
              onClick={() => onRemoveValue?.(value)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TextOptions;
