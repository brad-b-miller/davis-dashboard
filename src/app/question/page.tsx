"use client";

import { useRef, useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";

type Citation = {
  label?: string;
  url?: string;
};

type ChatMessage = {
  id: number;
  role: string;
  content: string;
  citations?: Citation[];
};

const initialMessages: ChatMessage[] = [
  {
    id: 1,
    role: "system",
    content:
      "You are Brad's personal assistant. Your sole job is to help Brad learn and expand his capabilities. Only answer questions that can be answered by searching the internet for real, up-to-date answers. Be as helpful as possible, and always prefer concise, clear answers over long or verbose ones.",
    citations: [],
  },
  {
    id: 2,
    role: "assistant",
    content:
      "Hi Brad! What questions do you have for me?",
    citations: [],
  },
];

export default function QuestionPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!input.trim() || loading) return;
    setError(null);
    const userMessage: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: input,
      citations: [],
    };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    try {
      // Prepare messages for API: system message + alternating user/assistant only
      const systemMsg = newMessages.find((m) => m.role === "system");
      const convoMsgs = newMessages.filter((m) => m.role !== "system");
      let filteredConvo = convoMsgs;
      while (filteredConvo.length > 0 && filteredConvo[0].role === "assistant") {
        filteredConvo = filteredConvo.slice(1);
      }
      const apiMessages = [
        ...(systemMsg ? [{ role: systemMsg.role, content: systemMsg.content }] : []),
        ...filteredConvo.map((m) => ({ role: m.role, content: m.content })),
      ];

      // Streaming fetch
      const res = await fetch("/api/perplexity/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, stream: true }),
      });
      if (!res.ok || !res.body) throw new Error("API error");

      let streamedContent = "";
      let lastCitations: Citation[] = [];
      const assistantMsgId = Date.now() + 1;
      setMessages((msgs) => [
        ...msgs,
        {
          id: assistantMsgId,
          role: "assistant",
          content: "",
          citations: [],
        },
      ]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let buffer = "";
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data:")) continue;
            const jsonStr = trimmed.replace(/^data:/, "").trim();
            if (jsonStr === "[DONE]") continue;
            try {
              const delta = JSON.parse(jsonStr) as {
                choices?: [{ delta?: { content?: string; citations?: Citation[] } }];
              };
              const contentDelta = delta.choices?.[0]?.delta?.content;
              if (contentDelta) {
                streamedContent += contentDelta;
                setMessages((msgs) =>
                  msgs.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, content: streamedContent }
                      : m
                  )
                );
              }
              const citations = delta.choices?.[0]?.delta?.citations;
              if (citations) {
                lastCitations = citations;
                setMessages((msgs) =>
                  msgs.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, citations: lastCitations }
                      : m
                  )
                );
              }
            } catch {
              // Ignore JSON parse errors for incomplete lines
            }
          }
        }
      }
      // After streaming, ensure citations are set from the last chunk
      setMessages((msgs) =>
        msgs.map((m) =>
          m.id === assistantMsgId ? { ...m, citations: lastCitations } : m
        )
      );
    } catch {
      setError("Failed to get answer. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function renderCitations(citationObjs: Citation[] = []) {
    if (!citationObjs.length) return null;
    return (
      <span className="ml-2 text-xs text-blue-400">
        {citationObjs.map((c: Citation, i: number) => (
          c.url ? (
            <a
              key={c.url || i}
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-blue-300 ml-1"
            >
              {c.label || `[${i + 1}]`}
            </a>
          ) : (
            <span key={i} className="ml-1">{c.label || `[${i + 1}]`}</span>
          )
        ))}
      </span>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-gray-900">
      <div className="flex-1 overflow-y-auto px-0 sm:px-0 md:px-0 lg:px-0 xl:px-0 py-4 space-y-4 max-w-full">
        {messages.filter((m) => m.role !== "system").map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} px-2 md:px-8 lg:px-32 xl:px-64`}
          >
            <div
              className={`rounded-lg px-4 py-3 max-w-3xl w-full whitespace-pre-line shadow-md text-sm
                ${msg.role === "user"
                  ? "bg-indigo-600 text-white self-end"
                  : "bg-gray-800 text-gray-100 self-start border border-gray-700"}
              `}
            >
              <ReactMarkdown>{msg.content}</ReactMarkdown>
              {msg.citations && msg.citations.length > 0 && renderCitations(msg.citations)}
            </div>
            {msg.role === "assistant" && msg.citations && msg.citations.length > 0 && (
              <div className="w-full mt-2 ml-2 text-xs text-blue-400 flex flex-col gap-1">
                {msg.citations.map((c: Citation, i: number) =>
                  c.url ? (
                    <a
                      key={c.url || i}
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-blue-300"
                    >
                      {c.label || `[${i + 1}]`} {c.url}
                    </a>
                  ) : (
                    <span key={i}>{c.label || `[${i + 1}]`}</span>
                  )
                )}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex justify-start px-2 md:px-8 lg:px-32 xl:px-64">
            <div className="rounded-lg px-4 py-3 bg-gray-800 text-gray-400 border border-gray-700 max-w-3xl w-full text-sm animate-pulse">
              Thinking...
            </div>
          </div>
        )}
        {error && (
          <div className="text-red-400 text-sm mt-2 px-2 md:px-8 lg:px-32 xl:px-64">{error}</div>
        )}
        <div ref={chatEndRef} />
      </div>
      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 border-t border-gray-800 p-4 bg-gray-900 w-full"
        style={{ boxSizing: 'border-box' }}
      >
        <input
          type="text"
          className="flex-1 rounded-md bg-gray-800 text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base w-full"
          placeholder="Ask a question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          autoFocus
          style={{ minHeight: '48px' }}
        />
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-md disabled:opacity-50 text-base"
          disabled={loading || !input.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
}
