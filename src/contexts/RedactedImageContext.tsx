import React, { createContext, ReactNode } from "react";

export const ImgContext = createContext<ImgContextType>({});
function RedactedImageContext({
  children,
  value,
}: {
  children: ReactNode;
  value: ImgContextType;
}) {
  return <ImgContext.Provider value={value}>{children}</ImgContext.Provider>;
}

export default RedactedImageContext;
