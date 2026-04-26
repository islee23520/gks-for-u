"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useDraft, patchSection, updateDraft, getDraft } from "@/lib/wizard/store";
import { applyPageActions, buildControlScope, validateAndNormalizeActions, type ChatControlResponse } from "@/lib/ai/page-control";
import {
  INTERVIEWABLE_SECTIONS,
  findNextQuestion,
  buildUpdatesFromAnswer,
  applyUpdates,
} from "@/lib/ai/interview";
import type { InterviewQuestion } from "@/lib/ai/interview";

type Message = { role: "user" | "assistant"; content: string };

const FREEFORM_GREETING = "Hi! I'm here to help with your GKS application. What do you need help with?";

const PAGE_CONTEXT: Record<string, { title: string; focus: string; fields: string[] }> = {
  general: {
    title: "General",
    focus: "Help the user with the page they are currently viewing.",
    fields: [],
  },
  eligibility: {
    title: "Eligibility Check",
    focus: "Help the user understand GKS eligibility requirements and the meaning of the fields on the eligibility page.",
    fields: ["date of birth", "citizenship", "GPA", "graduation date", "special flags"],
  },
  dashboard: {
    title: "Dashboard",
    focus: "Help the user understand their saved progress and where to go next.",
    fields: ["progress", "next step", "saved application draft"],
  },
  track: {
    title: "Application Track",
    focus: "Help the user choose the right GKS track for their case.",
    fields: ["track"],
  },
  profile: {
    title: "Personal Information",
    focus: "Help the user fill out personal identity and contact details exactly as required on the current page.",
    fields: ["family name", "given name", "middle name", "date of birth", "gender", "citizenship", "address", "phone", "email"],
  },
  education: {
    title: "Education",
    focus: "Help the user fill out high school and GPA information for the current page.",
    fields: ["high school name", "city", "start date", "end date", "graduation date", "GPA value", "GPA scale", "class rank percentile"],
  },
  languages: {
    title: "Languages",
    focus: "Help the user fill out TOPIK and English proficiency details for the current page.",
    fields: ["TOPIK level", "TOPIK date", "English test", "English score"],
  },
  universities: {
    title: "University Choices",
    focus: "Help the user choose and fill university, department, and field of study details for the current page.",
    fields: ["1st choice university", "1st department", "1st field of study", "2nd choice", "3rd choice"],
  },
  "personal-statement": {
    title: "Personal Statement",
    focus: "Help the user improve the personal statement section they are currently viewing.",
    fields: ["motivation", "background", "achievements", "character"],
  },
  "study-plan": {
    title: "Study Plan",
    focus: "Help the user improve the study plan section they are currently viewing.",
    fields: ["Korean language plan", "academic plan", "post-graduation plan"],
  },
  recommendation: {
    title: "Recommendation",
    focus: "Help the user draft or review the recommendation section they are currently viewing.",
    fields: ["relationship to recommender", "academic ability", "character", "endorsement"],
  },
  review: {
    title: "Review & Export",
    focus: "Help the user review completeness and prepare export-ready application materials.",
    fields: ["section completeness", "missing information", "export readiness"],
  },
};

export function GlobalChatPanel() {
  const pathname = usePathname();
  const draft = useDraft();
  const [isOpen, setIsOpen] = useState(false);
  const [interviewMode, setInterviewMode] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: FREEFORM_GREETING },
  ]);
  const [suggestedReplies, setSuggestedReplies] = useState<[string, string, string] | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isApplyRoute = pathname?.startsWith("/apply/");
  const section = isApplyRoute ? pathname?.split("/").pop() || "general" : "general";
  const canInterview = isApplyRoute && INTERVIEWABLE_SECTIONS.has(section);
  const normalizedSection = isApplyRoute ? section : pathname === "/" ? "general" : pathname?.replace(/^\//, "") || "general";
  const activePageContext = PAGE_CONTEXT[normalizedSection] ?? PAGE_CONTEXT.general;
  const controlScope = buildControlScope(normalizedSection, draft);

  const currentQuestion = useCallback((): InterviewQuestion | undefined => {
    if (!canInterview || !interviewMode) return undefined;
    return findNextQuestion(section, draft);
  }, [canInterview, interviewMode, section, draft]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const resetToInterviewStart = useCallback(() => {
    const q = findNextQuestion(section, draft);
    if (q) {
      setMessages([
        { role: "assistant", content: `Let's fill out the **${section}** section. ${q.question}` },
      ]);
    } else {
      setMessages([
        { role: "assistant", content: `It looks like the **${section}** section is already complete! You can switch back to freeform chat if you'd like.` },
      ]);
    }
  }, [section, draft]);

  const toggleInterviewMode = useCallback(() => {
    setInterviewMode((prev) => {
      const next = !prev;
      if (next) {
        resetToInterviewStart();
        setSuggestedReplies(null);
      } else {
        setMessages([
          { role: "assistant", content: FREEFORM_GREETING },
        ]);
        setSuggestedReplies(null);
      }
      return next;
    });
  }, [resetToInterviewStart]);

  const getRelevantContext = useCallback(() => {
    const pageContext = PAGE_CONTEXT[normalizedSection] ?? PAGE_CONTEXT.general;
    const context: Record<string, unknown> = {
      pathname,
      section: normalizedSection,
      pageTitle: pageContext.title,
      userLookingAt: pageContext.title,
      assistantFocus: pageContext.focus,
      visibleFields: pageContext.fields,
      controlScope,
    };

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
  }, [pathname, isApplyRoute, section, draft, normalizedSection, controlScope]);

  const handleFreeformSubmit = async (_userMsg: string, newMessages: Message[]) => {
    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: newMessages,
        context: getRelevantContext(),
      }),
    });

    if (!res.ok) throw new Error("Failed to fetch response");
    const data = (await res.json()) as ChatControlResponse;
    const validatedActions = validateAndNormalizeActions(data.actions ?? [], controlScope);
    applyPageActions(validatedActions, controlScope, patchSection, updateDraft);
    setSuggestedReplies(data.suggestedReplies ?? null);
    return data.text as string;
  };

  const handleInterviewSubmit = async (userMsg: string, newMessages: Message[]) => {
    const q = currentQuestion();
    if (q) {
      const { updates, valid, normalized } = buildUpdatesFromAnswer(section, q, userMsg);

      if (valid) {
        applyUpdates(section, patchSection, updateDraft, updates);
        setSuggestedReplies(null);

        const nextQ = findNextQuestion(section, getDraft());
        const fieldLabel = q.label;
        if (nextQ) {
          return `✓ Got it — **${fieldLabel}** saved as \`${String(normalized)}\`.\n\nNext: ${nextQ.question}`;
        }
        return `✓ Got it — **${fieldLabel}** saved as \`${String(normalized)}\`.\n\nThat's everything for the **${section}** section! All fields are filled. You can continue in freeform mode or review your answers.`;
      }

      return `Hmm, that doesn't look quite right for **${q.label}**. Could you try again?\n\n${q.question}`;
    }

    return await handleFreeformSubmit(userMsg, newMessages);
  };

  const submitMessage = async (rawInput: string) => {
    if (!rawInput.trim() || isLoading) return;

    const userMsg = rawInput.trim();
    const newMessages: Message[] = [...messages, { role: "user", content: userMsg }];
    setInput("");
    setSuggestedReplies(null);
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const text = interviewMode && canInterview
        ? await handleInterviewSubmit(userMsg, newMessages)
        : await handleFreeformSubmit(userMsg, newMessages);

      setMessages([...newMessages, { role: "assistant", content: text }]);
    } catch (error) {
      console.error(error);
      setMessages([...newMessages, { role: "assistant", content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitMessage(input);
  };

  const modeLabel = interviewMode ? "Interview" : "Chat";
  const placeholder = interviewMode && canInterview ? "Type your answer..." : "Ask a question...";
  const handleSuggestedReply = async (reply: string) => {
    await submitMessage(reply);
  };
  const panelStyle = {
    borderColor: "var(--line-strong)",
    background: "var(--bg-card)",
    color: "var(--ink)",
    boxShadow: "var(--shadow)",
  } as const;

  const dividerStyle = { borderColor: "var(--line)" } as const;
  const mutedTextStyle = { color: "var(--muted)" } as const;
  const assistantBubbleStyle = {
    background: "var(--bg-soft)",
    color: "var(--ink)",
  } as const;
  const userBubbleStyle = {
    background: "var(--accent)",
    color: "#0a0a0a",
  } as const;
  const suggestionButtonStyle = {
    borderColor: "var(--line-strong)",
    color: "var(--ink-soft)",
    background: "var(--bg)",
  } as const;
  const suggestionButtonHoverStyle = "hover:opacity-80";
  const inputStyle = {
    borderColor: "var(--line-strong)",
    color: "var(--ink)",
    background: "var(--bg)",
  } as const;
  const primaryButtonStyle = {
    background: "var(--accent)",
    color: "var(--ink-invert)",
  } as const;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 flex h-[500px] max-h-[calc(100vh-8rem)] w-80 flex-col rounded-xl border sm:w-96" style={panelStyle}>
          <div className="flex items-center justify-between border-b p-4" style={dividerStyle}>
            <div>
              <h2 className="text-sm font-semibold">GKS AI Assistant</h2>
              <p className="text-xs" style={mutedTextStyle}>
                Context: {activePageContext.title}
                {interviewMode ? " · Interview" : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {canInterview && (
                <button
                  onClick={toggleInterviewMode}
                  className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                    interviewMode
                      ? ""
                      : ""
                  }`}
                  style={interviewMode ? { background: "var(--accent-soft)", color: "var(--accent-text)" } : assistantBubbleStyle}
                >
                  {modeLabel}
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close GKS AI Assistant"
                className="rounded-md p-1 hover:opacity-80"
                style={mutedTextStyle}
              >
                ✕
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className="max-w-[85%] rounded-lg px-3 py-2 text-sm"
                  style={m.role === "user" ? userBubbleStyle : assistantBubbleStyle}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-lg px-3 py-2 text-sm" style={{ ...assistantBubbleStyle, ...mutedTextStyle }}>
                  Thinking...
                </div>
              </div>
            )}
            {!interviewMode && suggestedReplies && (
              <div className="flex flex-wrap gap-2">
                {suggestedReplies.map((reply) => (
                  <button
                    key={reply}
                    type="button"
                    onClick={() => void handleSuggestedReply(reply)}
                    className={`rounded-full border px-3 py-1 text-xs ${suggestionButtonHoverStyle}`}
                    style={suggestionButtonStyle}
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="border-t p-3" style={dividerStyle}>
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={placeholder}
                className="flex-1 rounded-md border px-3 py-1.5 text-sm focus:outline-none"
                style={inputStyle}
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-50"
                style={primaryButtonStyle}
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
          aria-label="Open GKS AI Assistant"
          className="flex h-12 w-12 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2"
          style={{ ...primaryButtonStyle, boxShadow: "var(--shadow)" }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>
      )}
    </div>
  );
}
