import React, { Dispatch, SetStateAction } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
} from "../ui/dialog";
import { cn } from "@/lib/utils/shadcn";

function ErrorModal({
  isOpen,
  setIsOpen,
  restrictionMessage,
}: {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  restrictionMessage: string;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Feature Unavailable</DialogTitle>
          <DialogDescription className={cn("text-sm text-muted-foreground")}>
            {restrictionMessage}
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}

export default ErrorModal;
