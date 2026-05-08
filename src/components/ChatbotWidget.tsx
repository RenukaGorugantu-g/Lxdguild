"use client";

import { useEffect, useMemo, useState } from "react";
import { Bot, Loader2, MessageSquare, Send, X } from "lucide-react";
import { CHATBOT_QUICK_PROMPTS } from "@/lib/chatbot-knowledge";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const STARTER_MESSAGE =
  "I can answer common LXD Guild questions instantly, and for anything else I can fall back to AI when that is configured.";

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileScrolled, setIsMobileScrolled] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: STARTER_MESSAGE,
    },
  ]);
  const [quickReplies, setQuickReplies] = useState<string[]>(CHATBOT_QUICK_PROMPTS);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerWidth >= 640) {
        setIsMobileScrolled(false);
        return;
      }
      setIsMobileScrolled(window.scrollY > 32);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  const visibleMessages = useMemo(() => messages.slice(-8), [messages]);

  const askQuestion = async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || isLoading) return;

    const nextMessages = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: trimmed,
          history: nextMessages.filter((message) => message.role !== "assistant" || message.content !== STARTER_MESSAGE),
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Chatbot request failed.");
      }

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: typeof result.reply === "string" ? result.reply : "I couldn't generate a reply just now.",
        },
      ]);

      if (Array.isArray(result.quickReplies) && result.quickReplies.length > 0) {
        setQuickReplies(result.quickReplies.slice(0, 4));
      }
    } catch (error: unknown) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            error instanceof Error
              ? `I hit a problem: ${error.message}`
              : "I hit a problem while replying. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`fixed right-4 z-[95] transition-all duration-200 sm:bottom-6 sm:right-6 ${isMobileScrolled ? "bottom-4" : "bottom-[7.8rem]"}`}>
      {isOpen ? (
        <div className="w-[calc(100vw-2rem)] max-w-[380px] overflow-hidden rounded-[2rem] border border-[#dbe6d7] bg-[linear-gradient(180deg,rgba(251,253,248,0.98),rgba(244,249,241,0.98))] shadow-[0_28px_80px_rgba(87,108,67,0.18)] backdrop-blur-2xl">
          <div className="flex items-start justify-between gap-3 border-b border-[#e4ece0] px-5 py-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#34cd2f,#80ef7a)] text-[#091737]">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#111827]">LXD Guild Assistant</p>
                <p className="mt-1 text-xs leading-5 text-[#667085]">
                  FAQ-first help with AI fallback for unexpected questions.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#dbe6d7] bg-white text-[#667085] transition hover:bg-[#f3f7ef] hover:text-[#111827]"
              aria-label="Close assistant"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[52vh] space-y-3 overflow-y-auto px-4 py-4">
            {visibleMessages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`rounded-[1.4rem] px-4 py-3 text-sm leading-6 ${
                  message.role === "assistant"
                    ? "mr-8 border border-[#dbe6d7] bg-white text-[#334155] shadow-[0_10px_24px_rgba(87,108,67,0.06)]"
                    : "ml-8 bg-[linear-gradient(135deg,#34cd2f,#80ef7a)] text-[#091737] shadow-[0_14px_28px_rgba(52,205,47,0.18)]"
                }`}
              >
                {message.content}
              </div>
            ))}

            {isLoading ? (
              <div className="mr-8 flex items-center gap-2 rounded-[1.4rem] border border-[#dbe6d7] bg-white px-4 py-3 text-sm text-[#334155] shadow-[0_10px_24px_rgba(87,108,67,0.06)]">
                <Loader2 className="h-4 w-4 animate-spin text-[#80ef7a]" />
                Thinking through your question...
              </div>
            ) : null}
          </div>

          <div className="border-t border-[#e4ece0] px-4 py-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {quickReplies.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => askQuestion(prompt)}
                  disabled={isLoading}
                  className="rounded-full border border-[#dbe6d7] bg-white px-3 py-1.5 text-xs font-semibold text-[#475467] transition hover:bg-[#f3f7ef] hover:text-[#111827] disabled:opacity-60"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 rounded-[1.5rem] border border-[#dbe6d7] bg-white p-2 shadow-[0_10px_24px_rgba(87,108,67,0.06)]">
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void askQuestion(input);
                  }
                }}
                placeholder="Ask about jobs, ATS, interviews, membership..."
                className="h-11 flex-1 appearance-none bg-transparent px-3 text-sm text-[#111827] outline-none placeholder:text-[#98a2b3]"
              />
              <button
                type="button"
                onClick={() => askQuestion(input)}
                disabled={isLoading || !input.trim()}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#34cd2f,#80ef7a)] text-[#091737] transition hover:scale-[1.02] disabled:opacity-50"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group relative inline-flex h-14 w-14 items-center justify-center rounded-full border border-[#dbe6d7] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(242,249,238,0.94))] text-[#091737] shadow-[0_18px_45px_rgba(94,119,74,0.18)] backdrop-blur-2xl transition duration-200 hover:scale-[1.04] hover:shadow-[0_24px_60px_rgba(94,119,74,0.22)] sm:h-16 sm:w-16"
          aria-label="Open chatbot"
        >
          <span className="absolute inset-[4px] rounded-full border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(255,255,255,0.22))]" />
          <span className="absolute -inset-1 rounded-full bg-[radial-gradient(circle,rgba(52,205,47,0.18),rgba(52,205,47,0)_65%)] opacity-70 blur-md transition group-hover:opacity-100" />
          <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#34cd2f,#80ef7a)] text-[#091737] shadow-[0_10px_20px_rgba(52,205,47,0.22)] sm:h-12 sm:w-12">
            <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
          </span>
        </button>
      )}
    </div>
  );
}
