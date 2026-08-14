export type TerminalMessage = {
  type: "append" | "frame" | "snapshot"
  content: string
}

// Frames replace previous content, so appends do not need a character cap.
// Slicing here can remove part of the current frame and break its HTML.
export const updateTerminalContent = (
  currentContent: string,
  message: TerminalMessage,
) =>
  message.type === "append" ? currentContent + message.content : message.content
