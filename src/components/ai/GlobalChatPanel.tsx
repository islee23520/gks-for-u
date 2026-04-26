"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useDraft } from "@/lib/wizard/store";

type Message = { role: "user" | "assistant"; content: string };

export function GlobalChatPanel() {
  const pathname = usePathname();
  const draft = useDraft();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I'm here to help with your GKS application. What do you need help with?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isApplyRoute = pathname?.startsWith("/apply/");
  const section = isApplyRoute ? pathname?.split("/").pop() || "general" : "general";

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const getRelevantContext = () => {
    const context: any = { pathname, section: isApplyRoute ? section : "landing/other" };
    
    if (isApplyRoute) {
      if (["track", "profile", "education", "languages"].includes(section)) {
        context.draftData = {
          track: draft.track,
          profile: draft.profile,
          education: draft.education,
          languages: draft.languages,
        };
      } else if (section === "universities") {
        context.draftData = { universities: draft.universities };
      } else if (["personal-statement", "study-plan", "recommendation"].includes(section)) {
        const key = section === "personal-statement" ? "personalStatement" : section === "study-plan" ? "studyPlan" : "recommendation";
        context.draftData = { essay: draft.essays[key as keyof typeof draft.essays] };
      }
    }
    return context;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput("");
    const newMessages: Message[] = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          context: getRelevantContext(),
        }),
      });

      if (!res.ok) throw new Error("Failed to fetch response");
      const data = await res.json();
      
      setMessages([...newMessages, { role: "assistant", content: data.text }]);
    } catch (error) {
      console.error(error);
      setMessages([...newMessages, { role: "assistant", content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 flex h-[500px] max-h-[calc(100vh-8rem)] w-80 flex-col rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950 sm:w-96">
          <div className="flex items-center justify-between border-b border-zinc-200 p-4 dark:border-zinc-800">
            <div>
              <h2 className="text-sm font-semibold">Application Assistant</h2>
              <p className="text-xs text-zinc-500">Context: {isApplyRoute ? section : "General"}</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              ✕
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  m.role === "user" 
                    ? "bg-blue-600 text-white" 
                    : "bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100"
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-500 dark:bg-zinc-900">
                  Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="border-t border-zinc-200 p-3 dark:border-zinc-800">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
                className="flex-1 rounded-md border border-zinc-300 bg-transparent px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-700"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}
      
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>
      )}
    </div>
  );
}
