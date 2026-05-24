import { useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { ChatMessage, ChatMessageForAPI } from "../types/chat";

const STREAM_URL = "https://ai.boradora.store/api/chat/stream";
const THROTTLE_MS = 50;

export function useChatStream(
  setChatMessages: Dispatch<SetStateAction<ChatMessage[]>>,
  setIsTyping: Dispatch<SetStateAction<boolean>>
) {
  const abortRef = useRef<AbortController | null>(null);

  const streamChat = async (payload: {
    messages: ChatMessageForAPI[];
  }): Promise<{ msgId: string; content: string }> => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const msgId = (Date.now() + 1).toString();
    let accumulated = "";
    let firstChunk = true;
    let lastRenderTime = 0;

    const render = (text: string) => {
      if (firstChunk) {
        firstChunk = false;
        setIsTyping(false);
        setChatMessages((prev) => [
          ...prev,
          {
            id: msgId,
            role: "assistant",
            content: text,
            timestamp: new Date(),
          },
        ]);
      } else {
        setChatMessages((prev) =>
          prev.map((m) => (m.id === msgId ? { ...m, content: text } : m))
        );
      }
    };

    const res = await fetch(STREAM_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || "Chat API Error");
    }

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();

    outer: while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const lines = decoder.decode(value, { stream: true }).split("\n");

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (data === "[DONE]") break outer;

        try {
          const parsed = JSON.parse(data);
          if (parsed.error) throw new Error(parsed.error);
          if (!parsed.token) continue;

          accumulated += parsed.token;

          const now = Date.now();
          if (now - lastRenderTime >= THROTTLE_MS) {
            lastRenderTime = now;
            render(accumulated);
          }
        } catch (e: any) {
          if (e.name === "SyntaxError") continue;
          throw e;
        }
      }
    }

    // 마지막 남은 토큰 flush
    if (accumulated) render(accumulated);

    return { msgId, content: accumulated };
  };

  const abort = () => abortRef.current?.abort();

  return { streamChat, abort };
}
