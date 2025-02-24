"use client";

import React from "react";

import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

interface ChatTextareaProps {
  onSendMessage: () => void;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
  message: string;
  isSendDisabled: boolean;
}

export default function ChatTextarea({
  message,
  setMessage,
  onSendMessage,
  isSendDisabled,
}: ChatTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (isSendDisabled) return;
      onSendMessage();
    }
  };

  return (
    <div className="flex items-end space-x-2 bg-background rounded-lg border p-2 w-full">
      <Textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={`Ask ${APP_NAME}`}
        className="flex-1 resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
        style={{ minHeight: "40px", maxHeight: "200px" }}
      />
      <Button
        disabled={isSendDisabled}
        onClick={onSendMessage}
        size="icon"
        className="shrink-0"
      >
        <Send className="h-4 w-4" />
        <span className="sr-only">Send</span>
      </Button>
    </div>
  );
}
