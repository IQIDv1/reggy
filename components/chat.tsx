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
import { LogOut, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ChatMessageComponent from "./chat-message";
import ChatTextarea from "./chat-textarea";
import { ChatMessage, ChatSession, Profile } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import {
  API_ROUTES,
  APP_LOGO,
  APP_LOGO_CIRCLE,
  APP_NAME,
  PAGE_ROUTES,
} from "@/lib/constants";
import { ThemeToggle } from "./theme-toggle";
import { ChatSkeleton } from "./chat-skeleton";
import Image from "next/image";
import { useToast } from "./ui/use-toast";

interface ChatProps {
  user: Profile;
}

export default function Chat({ user }: ChatProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isAtBottom, setIsAtBottom] = useState<boolean>(true);
  const router = useRouter();
  const supabase = createClient();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(
    null
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingText, setThinkingText] = useState<string>(
    `${APP_NAME} is thinking`
  );
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editedSessionTitle, setEditedSessionTitle] = useState<string>("");
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [isSessionSwitching, setIsSessionSwitching] = useState<boolean>(false);
  const { toast } = useToast();

  const fetchMessages = useCallback(
    async (sessionId: string) => {
      const { data, error: messagesError } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      if (messagesError) {
        console.error("Error fetching messages:", messagesError);
        toast({
          title: "Failed to load messages. Please try again.",
          variant: "destructive",
        });
      } else {
        setMessages(data);
        setIsSessionSwitching(false);
        try {
          const messagesContainer = document.getElementById(
            "chat-messages-container"
          );
          if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
          }
        } catch (error) {}
      }
    },
    [supabase, toast]
  );

  const fetchSessions = useCallback(
    async (currentSessionId?: string) => {
      const { data, error: sessionsError } = await supabase
        .from("chat_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });
      if (sessionsError) {
        console.error("Error fetching sessions:", sessionsError);
        toast({
          title: "Failed to load chat sessions. Please try again.",
          variant: "destructive",
        });
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
    },
    [supabase, fetchMessages, user?.id, toast]
  );

  const createOrSwitchSession = async (session?: ChatSession) => {
    if (session) {
      if (currentSession?.id === session.id) return;
      setIsSessionSwitching(true);
      setCurrentSession(session);
      setMessages([]);
      await fetchMessages(session.id);
    } else {
      const { data, error: sessionsError } = await supabase
        .from("chat_sessions")
        .insert({ user_id: user.id })
        .select("*")
        .single();

      if (sessionsError) {
        console.error("Error creating new session:", sessionsError);
        toast({
          title: "Failed to create a new chat session. Please try again.",
          variant: "destructive",
        });
      } else {
        setIsSessionSwitching(true);
        fetchSessions(data.id);
      }
    }
  };

  const handleDeleteSession = async (session: ChatSession) => {
    if (session) {
      const { error: deleteError } = await supabase
        .from("chat_sessions")
        .delete()
        .match({ id: session.id, user_id: user.id });

      if (deleteError) {
        console.error("Error deleting session:", deleteError);
        toast({
          title: "Failed to delete chat session. Please try again.",
          variant: "destructive",
        });
      } else {
        setCurrentSession(null);
        setMessages([]);
        fetchSessions();
      }
    }
  };

  const handleSendMessage = async () => {
    if (isLoading) return;
    try {
      setIsLoading(true);

      const newMessage = message.trim();

      if (!newMessage) throw new Error("Message cannot be empty");

      setMessage("");

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

      const newDateISO = new Date().toISOString();
      setMessages((prev) => [
        ...prev,
        {
          content: newMessage,
          created_at: newDateISO,
          id: `${Math.floor(Math.random() * (10000 - 1000 + 1)) + 1000}`,
          role: "user",
          session_id: currSession.id,
          updated_at: newDateISO,
        },
      ]);

      const response = await fetch(API_ROUTES.QUERY, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: newMessage,
          session_id: currSession.id,
        }),
      });

      if (!response.ok)
        throw new Error(`Failed to get response from ${APP_NAME}`);

      await fetchMessages(currSession.id);
    } catch (err) {
      console.log(err);
      toast({
        title:
          err instanceof Error ? err.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
        toast({
          title: "Failed to update session title. Please try again.",
          variant: "destructive",
        });
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

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    if (isLoading) {
      containerRef.current?.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "instant",
      });
      const interval = setInterval(() => {
        setThinkingText((prev) =>
          prev.length < 20 ? prev + "." : `${APP_NAME} is thinking`
        );
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const isUserAtBottom =
        container.scrollHeight - container.scrollTop <=
        container.clientHeight + 50;
      setIsAtBottom((prev) =>
        prev !== isUserAtBottom ? isUserAtBottom : prev
      );
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isAtBottom) {
      containerRef.current?.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "instant",
      });
    }
  }, [messages, isAtBottom]);

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
            <DropdownMenuContent align="end" className="w-[260px]">
              <div className="px-2 py-1.5 border-b mb-1">
                <p className="font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
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
              <div ref={containerRef} className="flex-1 overflow-y-auto">
                {messages.length > 0 ? (
                  <div className="p-4">
                    {messages.map((message) => (
                      <ChatMessageComponent
                        key={`message-${message.id}`}
                        chatMessage={message}
                        user_id={user.id}
                      />
                    ))}
                    {isLoading && (
                      <div className="text-left w-full mt-4">
                        <div className="inline-flex items-center p-3 rounded-lg bg-muted text-black dark:bg-secondary dark:text-secondary-foreground">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          <span className="inline-block w-36 overflow-hidden whitespace-nowrap border-r-2 pr-1 animate-typing">
                            {thinkingText}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full mx-auto px-4 space-y-6 max-w-2xl">
                    <div className="flex items-center gap-4 flex-col">
                      <Image
                        src={APP_LOGO}
                        alt="IQ/ID Logo"
                        width={0}
                        height={0}
                        priority
                        className="h-10 w-auto"
                      />
                      <h1 className="text-xl font-medium text-secondary dark:text-primary text-center">
                        {APP_NAME}, find state and federal financial aid
                        regulations for me
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
              <div className="flex items-center relative p-2 gap-2">
                <Image
                  src={APP_LOGO_CIRCLE}
                  alt="IQ/ID Logo"
                  width={30}
                  height={30}
                />
                <p className="text-xs mx-auto text-muted-foreground">
                  Important Notice: All outputs provided by this AI product are
                  for informational purposes only. They are not intended as a
                  substitute for professional advice. Please do not rely on this
                  tool for legal, tax, financial, or any other professional
                  guidance. Always consult a qualified professional for advice
                  in these areas.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
