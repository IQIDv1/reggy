"use client";

import type React from "react";
import { createContext, useContext, useState } from "react";

type ToastPosition =
  | "top-right"
  | "top-left"
  | "bottom-right"
  | "bottom-left"
  | "top-center"
  | "bottom-center";

interface ToastContextProps {
  position: ToastPosition;
  setPosition: (position: ToastPosition) => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export function ToastProvider({
  children,
  defaultPosition = "top-right",
}: {
  children: React.ReactNode;
  defaultPosition?: ToastPosition;
}) {
  const [position, setPosition] = useState<ToastPosition>(defaultPosition);

  return (
    <ToastContext.Provider value={{ position, setPosition }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToastPosition() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToastPosition must be used within a ToastProvider");
  }
  return context;
}
