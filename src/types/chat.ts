export type ChatRole = "user" | "assistant";

export type AttachedDataBlock = {
  title: string;
  lines: string[];
};

export type ChatMessageForAPI = {
  role: ChatRole;
  content: string;
  attachedData?: AttachedDataBlock[];
};

export type ChatPayload = {
  messages: ChatMessageForAPI[];
};

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: Date;
  attachedData?: string[];
  canGenerateReport?: boolean;
  reportPayload?: ChatPayload;
}
