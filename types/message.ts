export type MessageMode = "anonymous" | "identified";

export interface MessagePayload {
  mode: MessageMode;
  message: string;
  name?: string;
  email?: string;
  /** Honeypot field. Must stay empty — filled in only by bots. */
  company?: string;
}

export type SendState = "idle" | "sending" | "success" | "error";
