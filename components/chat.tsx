"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import ChatSidebar from "./chat-sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, LogOut, AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ChatMessageComponent from "./chat-message";
import ChatTextarea from "./chat-textarea";
import { ChatMessage, ChatSession, FeedbackRating, Profile } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { API_ROUTES, APP_LOGO, APP_NAME, PAGE_ROUTES } from "@/lib/constants";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ThemeToggle } from "./theme-toggle";
import { ChatSkeleton } from "./chat-skeleton";
import Image from "next/image";

interface ChatProps {
  user: Profile;
}

export default function Chat({ user }: ChatProps) {
  const router = useRouter();
  const supabase = createClient();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(
    null
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thinkingText, setThinkingText] = useState<string>(
    `${APP_NAME} is thinking`
  );
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editedSessionTitle, setEditedSessionTitle] = useState<string>("");
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [isSessionSwitching, setIsSessionSwitching] = useState<boolean>(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  // useEffect(() => {
  //   if (currentSession) {
  //     fetchMessages(currentSession.id);
  //   }
  // }, [currentSession]);

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setThinkingText((prev) =>
          prev.length < 20 ? prev + "." : `${APP_NAME} is thinking`
        );
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  const fetchSessions = async (currentSessionId?: string) => {
    const { data, error: sessionsError } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    if (sessionsError) {
      console.error("Error fetching sessions:", sessionsError);
      setError("Failed to load chat sessions. Please try again.");
    } else {
      if (currentSessionId) {
        const curr = data.find((s) => s.id === currentSessionId);
        if (curr) {
          setCurrentSession(curr);
          await fetchMessages(curr.id);
          setIsSessionSwitching(false);
        }
      }
      setSessions(data);
      setIsInitialLoading(false);
    }
  };

  const fetchMessages = async (sessionId: string) => {
    const { data, error: messagesError } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (messagesError) {
      console.error("Error fetching messages:", messagesError);
      setError("Failed to load messages. Please try again.");
    } else {
      setMessages(data);
      setIsSessionSwitching(false);
    }
  };

  const createOrSwitchSession = async (session?: ChatSession) => {
    if (session) {
      if (currentSession?.id === session.id) return;
      setIsSessionSwitching(true);
      setError(null);
      setCurrentSession(session);
      setMessages([]);
      await fetchMessages(session.id);
    } else {
      setError(null);
      const { data, error: sessionsError } = await supabase
        .from("chat_sessions")
        .insert({ user_id: user.id })
        .select("*")
        .single();

      if (sessionsError) {
        console.error("Error creating new session:", sessionsError);
        setError("Failed to create a new chat session. Please try again.");
      } else {
        setIsSessionSwitching(true);
        fetchSessions(data.id);
      }
    }
  };

  const handleDeleteSession = async (session: ChatSession) => {
    if (session) {
      const { data, error: deleteError } = await supabase
        .from("chat_sessions")
        .delete()
        .match({ id: session.id, user_id: user.id });

      if (deleteError) {
        console.error("Error deleting session:", deleteError);
        setError("Failed to delete chat session. Please try again.");
      } else {
        setError(null);
        setCurrentSession(null);
        setMessages([]);
        fetchSessions();
      }
    }
  };

  const handleSendMessage = async () => {
    if (isLoading) return;
    try {
      setError(null);
      setIsLoading(true);
      if (!message.trim()) throw new Error("Message cannot be empty");

      let currSession: ChatSession | null = currentSession;

      if (!currSession) {
        const { data: newSession, error: insertError } = await supabase
          .from("chat_sessions")
          .insert({ user_id: user.id })
          .select("*")
          .single();

        if (!newSession || insertError)
          throw new Error("Failed to create chat session");

        setMessages([]);
        setCurrentSession(newSession);
        fetchSessions();
        currSession = newSession;
      }

      const response = await fetch(API_ROUTES.QUERY, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: message.trim(),
          session_id: currSession.id,
        }),
      });

      if (!response.ok)
        throw new Error(`Failed to get response from ${APP_NAME}`);

      await fetchMessages(currSession.id);
      setMessage("");
    } catch (err) {
      console.log(err);
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = async (messageId: string, rating: FeedbackRating) => {
    try {
      const { error: feedbackError } = await supabase
        .from("feedback")
        .insert({
          message_id: messageId,
          user_id: user.id,
          rating: rating,
          // comment: validatedData.comment,
        })
        .select("*")
        .single();

      if (feedbackError) throw new Error("Failed to submit feedback");

      // Optionally, update UI to show feedback was received
    } catch (error) {
      console.error("Error submitting feedback:", error);
      setError("Failed to submit feedback. Please try again.");
    }
  };

  const startEditingSession = (session: ChatSession) => {
    setEditingSessionId(session.id);
    setEditedSessionTitle(session.title || "");
  };

  const saveEditedSession = async () => {
    if (editingSessionId) {
      const { error: sessionsError } = await supabase
        .from("chat_sessions")
        .update({ title: editedSessionTitle })
        .eq("id", editingSessionId);

      if (sessionsError) {
        console.error("Error updating session title:", sessionsError);
        setError("Failed to update session title. Please try again.");
      } else {
        fetchSessions(editingSessionId);
      }
    }
    setEditingSessionId(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push(PAGE_ROUTES.LOGIN);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar>
        <SidebarContent>
          <ChatSidebar
            chatSessions={sessions}
            currentSession={currentSession}
            onCreateOrSwitchSession={createOrSwitchSession}
            onDeleteChatSession={handleDeleteSession}
            onStartEditingSession={startEditingSession}
            onSaveEditedSession={saveEditedSession}
            editingSessionId={editingSessionId}
            //   setEditingSessionId,
            editedSessionTitle={editedSessionTitle}
            setEditedSessionTitle={setEditedSessionTitle}
          />
        </SidebarContent>
      </Sidebar>
      <div className="flex flex-col flex-1 w-full overflow-hidden">
        <header className="flex items-center gap-2 px-4 py-2 border-b">
          {/* <header className="flex items-center justify-between px-4 py-2 border-b"> */}
          <SidebarTrigger style={{ marginRight: "auto" }} />
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full bg-primary text-primary-foreground"
              >
                {user.name
                  ? user.name[0]
                  : user.email
                  ? user.email[0].toUpperCase()
                  : "U"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {/* <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem> */}
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex-1 w-full overflow-auto">
          {isInitialLoading ||
            (isSessionSwitching && (
              <div className="flex flex-col h-full w-full">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <ChatSkeleton />
                </div>
              </div>
            ))}
          {!(isInitialLoading || isSessionSwitching) && (
            <div className="flex flex-col h-full w-full">
              <div className="flex-1 overflow-y-auto">
                {messages.length > 0 ? (
                  <div className="p-4 space-y-4">
                    {messages.map((message) => (
                      <ChatMessageComponent
                        key={`message-${message.id}`}
                        chatMessage={message}
                        onHandleFeedback={handleFeedback}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto px-4 space-y-6">
                    <div className="flex items-center gap-4">
                      <Image
                        src={APP_LOGO}
                        alt="IQ/ID Logo"
                        width={120}
                        height={40}
                        priority
                        className="h-10 w-auto"
                      />
                      <h1 className="text-xl font-medium text-secondary dark:text-primary">
                        {APP_NAME}, your regulatory research partner
                      </h1>
                    </div>
                    {isLoading && (
                      <div className="text-left w-full">
                        <div className="inline-flex items-center p-3 rounded-lg bg-muted text-black dark:bg-secondary dark:text-secondary-foreground">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          <span className="inline-block w-36 overflow-hidden whitespace-nowrap border-r-2 pr-1 animate-typing">
                            {thinkingText}
                          </span>
                        </div>
                      </div>
                    )}
                    {error && (
                      <div className="w-full">
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Error</AlertTitle>
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      </div>
                    )}
                    <div className="w-full">
                      <ChatTextarea
                        message={message}
                        setMessage={setMessage}
                        isSendDisabled={isLoading || !message.trim()}
                        onSendMessage={handleSendMessage}
                      />
                    </div>
                  </div>
                )}
              </div>
              {messages.length > 0 && (
                <>
                  {isLoading && (
                    <div className="text-left w-full p-4">
                      <div className="inline-flex items-center p-3 rounded-lg bg-muted text-black dark:bg-secondary dark:text-secondary-foreground">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span className="inline-block w-36 overflow-hidden whitespace-nowrap border-r-2 pr-1 animate-typing">
                          {thinkingText}
                        </span>
                      </div>
                    </div>
                  )}
                  {error && (
                    <div className="w-full p-4">
                      <Alert variant="destructive" className="w-fit">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    </div>
                  )}
                  <div className="p-4 bg-background border-t">
                    <ChatTextarea
                      message={message}
                      setMessage={setMessage}
                      isSendDisabled={isLoading || !message.trim()}
                      onSendMessage={handleSendMessage}
                    />
                  </div>
                </>
              )}
            </div>
          )}
          {/* <div className="flex flex-col h-full w-full">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isInitialLoading ? (
                <ChatSkeleton />
              ) : (
                messages.map((message) => (
                  <ChatMessageComponent
                    key={`message-${message.id}`}
                    chatMessage={message}
                    onHandleFeedback={handleFeedback}
                  />
                ))
              )}
            </div>
            {isLoading && (
              <div className="text-left w-full p-4">
                <div className="inline-flex items-center p-3 rounded-lg bg-muted text-black dark:bg-secondary dark:text-secondary-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span className="inline-block w-36 overflow-hidden whitespace-nowrap border-r-2 pr-1 animate-typing">
                    {thinkingText}
                  </span>
                </div>
              </div>
            )}
            {error && (
              <div className="w-full p-4">
                <Alert variant="destructive" className="w-fit">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </div>
            )}
            <div className="p-4 bg-background border-t">
              <ChatTextarea
                message={message}
                setMessage={setMessage}
                isSendDisabled={isLoading || !message.trim()}
                onSendMessage={handleSendMessage}
              />
            </div>
          </div> */}
        </main>
      </div>
    </div>
  );
}
