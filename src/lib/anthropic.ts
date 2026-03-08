import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const MODELS = {
  VISION: "claude-sonnet-4-5",
  AUDIO: "claude-sonnet-4-5",
} as const;
