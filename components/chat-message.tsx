"use client";

import { CHAT_ROLES, FEEDBACK_RATING } from "@/lib/constants";
import { FeedbackRating, type ChatMessage } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { ThumbsUp, ThumbsDown } from "lucide-react";

interface ChatMessageProps {
  chatMessage: ChatMessage;
  onHandleFeedback: (messageId: string, rating: FeedbackRating) => void;
}

export default function ChatMessage({
  chatMessage,
  onHandleFeedback,
}: ChatMessageProps) {
  return (
    <div
      className={cn(
        "flex items-start space-x-4",
        chatMessage.role === CHAT_ROLES.USER && "justify-end"
      )}
    >
      <div
        // className={cn(
        //   "rounded-lg p-4 max-w-[80%]",
        //   chatMessage.role === CHAT_ROLES.ASSISTANT
        //     ? "bg-primary text-primary-foreground"
        //     : "bg-muted"
        // )}
        className={cn(
          "rounded-lg p-4 max-w-[80%]",
          chatMessage.role === CHAT_ROLES.ASSISTANT
            ? "bg-muted text-black dark:bg-secondary dark:text-secondary-foreground"
            : "border border-input bg-background"
        )}
      >
        <ReactMarkdown className="prose dark:prose-invert max-w-none">
          {chatMessage.content || ""}
        </ReactMarkdown>
      </div>
      {/* {chatMessage.role === CHAT_ROLES.ASSISTANT && (
        <div className="mt-1 flex justify-start space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              onHandleFeedback(chatMessage.id, FEEDBACK_RATING.POSITIVE)
            }
            title="Mark as helpful"
          >
            <ThumbsUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              onHandleFeedback(chatMessage.id, FEEDBACK_RATING.NEGATIVE)
            }
            title="Mark as not helpful"
          >
            <ThumbsDown className="h-4 w-4" />
          </Button>
        </div>
      )} */}
    </div>
  );
}
