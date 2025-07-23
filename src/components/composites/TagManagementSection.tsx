"use client";

import { memo, useContext, useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TextOptions from "./TextOptions";
import ImageOptions from "./ImageOptions";
import { ImgContext } from "@/contexts/RedactedImageContext";

export default memo(function TagManagementSection() {
  const { tab, setTab } = useContext(ImgContext);

  return (
    <div className="space-y-6 pt-6">
      <Tabs defaultValue="text" value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-2 w-full mb-6 rounded-md border bg-muted p-1">
          <TabsTrigger value="text">Text Redaction</TabsTrigger>
          <TabsTrigger value="face">Face Redaction</TabsTrigger>
        </TabsList>

        <TabsContent value="text">
          <TextOptions />
        </TabsContent>

        {/* Force mount to avoid unmounting on tab change which will discard the preview images */}
        <TabsContent value="face" forceMount>
          <ImageOptions />
        </TabsContent>
      </Tabs>
    </div>
  );
});
