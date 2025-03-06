"use client";

import { useState, Dispatch, SetStateAction, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreVertical, Pencil, Trash2, Check, Edit2 } from "lucide-react";
import { ChatSession } from "@/lib/types";

interface ChatSidebarProps {
  onCreateOrSwitchSession: (session?: ChatSession) => void;
  onDeleteChatSession: (session: ChatSession) => void;
  onStartEditingSession: (session: ChatSession) => void;
  onSaveEditedSession: () => void;
  currentSession: ChatSession | null;
  editingSessionId: string | null;
  //   setEditingSessionId: Dispatch<SetStateAction<string | null>>;
  editedSessionTitle: string;
  setEditedSessionTitle: Dispatch<SetStateAction<string>>;
  chatSessions: ChatSession[];
}

export default function ChatSidebar({
  chatSessions,
  onCreateOrSwitchSession,
  onDeleteChatSession,
  onStartEditingSession,
  onSaveEditedSession,
  editingSessionId,
  //   setEditingSessionId,
  currentSession,
  editedSessionTitle,
  setEditedSessionTitle,
}: ChatSidebarProps) {
  const editInputRef = useRef<HTMLInputElement>(null);
  const [visibleMenuId, setVisibleMenuId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const handleMenuItemClick = (
    action: "rename" | "delete",
    session: ChatSession
  ) => {
    // Implement the action here (e.g., rename or delete the chat)
    console.log(`${action} chat at id ${session.id}`);
    if (action === "rename") {
      onStartEditingSession(session);
    } else if (action === "delete") {
      onDeleteChatSession(session);
    } else {
      console.log("Invalid option");
    }
    // Hide the menu and close the dropdown
    setVisibleMenuId(null);
    setOpenMenuId(null);
  };

  useEffect(() => {
    if (editingSessionId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingSessionId]);

  return (
    <>
      <SidebarHeader className="px-2 py-4">
        <Button
          className="w-full justify-start"
          onClick={() => onCreateOrSwitchSession()}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Chat
        </Button>
      </SidebarHeader>
      <SidebarMenu className="px-2 py-4">
        {/* TODO: Sort by last message sent at */}
        {chatSessions.map((session) => (
          <SidebarMenuItem
            key={`chat-session-${session.id}`}
            onMouseEnter={() => setVisibleMenuId(session.id)}
            onMouseLeave={() => {
              if (openMenuId !== session.id) {
                setVisibleMenuId(null);
              }
            }}
            onClick={() => null}
            className="group relative"
          >
            {editingSessionId === session.id ? (
              <div className="w-full pr-8 flex items-center">
                <Input
                  ref={editInputRef}
                  value={editedSessionTitle}
                  onChange={(e) => setEditedSessionTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      onSaveEditedSession();
                    }
                  }}
                  className="mr-2"
                />
                <Button size="sm" onClick={onSaveEditedSession}>
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <SidebarMenuButton
                className={`w-full pr-8 `}
                isActive={currentSession?.id === session.id}
                onClick={() => onCreateOrSwitchSession(session)}
              >
                {session.title}
              </SidebarMenuButton>
            )}
            {visibleMenuId === session.id && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <DropdownMenu
                  open={openMenuId === session.id}
                  onOpenChange={(open) => {
                    setOpenMenuId(open ? session.id : null);
                    if (!open) {
                      setVisibleMenuId(null);
                    }
                  }}
                >
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    side="right"
                    sideOffset={5}
                  >
                    <DropdownMenuItem
                      onSelect={() => handleMenuItemClick("rename", session)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => handleMenuItemClick("delete", session)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </>
  );
}
