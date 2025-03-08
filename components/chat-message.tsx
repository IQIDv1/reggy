"use client";

import { CHAT_ROLES, FEEDBACK_RATING } from "@/lib/constants";
import { FeedbackRating, type ChatMessage } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "./ui/use-toast";
import { createClient } from "@/lib/supabase/client";

interface ChatMessageProps {
  chatMessage: ChatMessage;
  user_id: string;
}

export default function ChatMessage({
  chatMessage,
  user_id,
}: ChatMessageProps) {
  const supabase = createClient();
  const [feedback, setFeedback] = useState<FeedbackRating | null>(null);
  const [feedbackText, setFeedbackText] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { toast } = useToast();

  const handleFeedback = async (rating: FeedbackRating) => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);

      const { error: feedbackError } = await supabase.from("feedback").upsert(
        {
          message_id: chatMessage.id,
          user_id,
          rating,
        },
        { onConflict: "message_id" }
      );

      if (feedbackError) throw feedbackError;

      setFeedback(rating);

      if (rating === "positive") {
        toast({
          title: "Thank you for your feedback",
          description: "We appreciate your positive feedback!",
        });
      } else {
        setDialogOpen(true);
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);

      if (feedbackText.trim().length > 0) {
        const { error: feedbackError } = await supabase
          .from("feedback")
          .update({ comment: feedbackText.trim() })
          .eq("message_id", chatMessage.id);

        if (feedbackError) throw feedbackError;
      }

      setDialogOpen(false);
      toast({
        title: "Feedback submitted",
        description: "Thank you for helping us improve!",
      });
      setFeedbackText("");
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col relative group",
        chatMessage.role === CHAT_ROLES.USER ? "mb-7" : ""
      )}
    >
      <div
        className={cn(
          "rounded-lg p-4 max-w-[80%]",
          chatMessage.role === CHAT_ROLES.ASSISTANT
            ? "bg-muted text-black dark:bg-secondary dark:text-secondary-foreground mr-auto"
            : "border border-input bg-background ml-auto"
        )}
      >
        <ReactMarkdown className="prose dark:prose-invert max-w-none">
          {chatMessage.content || ""}
        </ReactMarkdown>
      </div>
      {chatMessage.role === CHAT_ROLES.ASSISTANT && (
        <div
          className={cn(
            "flex w-full justify-start pt-1 gap-1",
            "opacity-0 group-hover:opacity-100",
            "pointer-events-none group-hover:pointer-events-auto",
            "transition-opacity duration-300"
          )}
          style={{ zIndex: 2 }}
        >
          <TooltipProvider delayDuration={0} skipDelayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={isSubmitting}
                  className={cn(
                    "h-6 w-6",
                    feedback === FEEDBACK_RATING.POSITIVE && "text-green-500"
                  )}
                  onClick={() => handleFeedback(FEEDBACK_RATING.POSITIVE)}
                >
                  <ThumbsUp className="h-4 w-4" />
                  <span className="sr-only">Mark as helpful</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Mark as helpful</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <TooltipProvider delayDuration={0} skipDelayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={isSubmitting}
                      className={cn(
                        "h-6 w-6",
                        feedback === FEEDBACK_RATING.NEGATIVE && "text-red-500"
                      )}
                      onClick={() => handleFeedback(FEEDBACK_RATING.NEGATIVE)}
                    >
                      <ThumbsDown className="h-4 w-4" />
                      <span className="sr-only">Mark as not helpful</span>
                    </Button>
                  </DialogTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Mark as not helpful</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Provide feedback</DialogTitle>
                <DialogDescription>
                  What was wrong with this response? How could it be improved?
                </DialogDescription>
              </DialogHeader>
              <Textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Your feedback (optional)"
                className="min-h-[100px]"
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button disabled={isSubmitting} onClick={handleSubmitFeedback}>
                  Submit feedback
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
