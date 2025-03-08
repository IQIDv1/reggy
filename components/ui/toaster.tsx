"use client";

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastPrimitiveProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import { ToastProvider as ToastPositionProvider } from "@/components/ui/toast-context";

export function Toaster({
  position = "top-right",
}: {
  position?:
    | "top-right"
    | "top-left"
    | "bottom-right"
    | "bottom-left"
    | "top-center"
    | "bottom-center";
}) {
  const { toasts } = useToast();

  return (
    <ToastPositionProvider defaultPosition={position}>
      <ToastPrimitiveProvider>
        {toasts.map(({ id, title, description, action, ...props }) => (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        ))}
        <ToastViewport />
      </ToastPrimitiveProvider>
    </ToastPositionProvider>
  );
}
