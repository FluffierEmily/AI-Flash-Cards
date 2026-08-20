import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { createOpenAI } from "@ai-sdk/openai"
import { createAnthropic } from "@ai-sdk/anthropic"

export const PROVIDER_MODELS: Record<string, string[]> = {
  Google: ["gemini-3.6-flash", "gemini-3.6-pro", "gemini-2.0-flash", "gemini-2.5-flash", "gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.5-pro"],
  OpenAI: ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"],
  Anthropic: ["claude-3-5-sonnet-20241022", "claude-3-haiku-20240307"],
  OpenRouter: [
    "meta-llama/llama-3-8b-instruct:free",
    "mistralai/mistral-7b-instruct:free",
    "google/gemma-2-9b-it:free"
  ],
  Groq: ["llama3-8b-8192", "llama3-70b-8192", "mixtral-8x7b-32768"],
  DeepSeek: ["deepseek-chat", "deepseek-coder"],
  Mistral: ["mistral-tiny", "mistral-small", "mistral-medium"]
}

export function getModelInstance(provider: string, modelName: string, apiKey: string) {
  const normalizedProvider = provider.trim().toLowerCase()

  switch (normalizedProvider) {
    case "google": {
      const google = createGoogleGenerativeAI({
        apiKey,
      })
      let resolvedModel = modelName || "gemini-3.6-flash"
      if (
        resolvedModel === "gemini-1.5-flash" ||
        resolvedModel === "gemini-2.0-flash" ||
        resolvedModel === "gemini-2.5-flash"
      ) {
        resolvedModel = "gemini-3.6-flash"
      }
      return google(resolvedModel)
    }
    case "openai": {
      const openai = createOpenAI({
        apiKey,
      })
      return openai(modelName || "gpt-4o-mini")
    }
    case "anthropic": {
      const anthropic = createAnthropic({
        apiKey,
      })
      return anthropic(modelName || "claude-3-5-sonnet-20241022")
    }
    case "openrouter": {
      const openrouter = createOpenAI({
        apiKey,
        baseURL: "https://openrouter.ai/api/v1",
      })
      return openrouter(modelName || "meta-llama/llama-3-8b-instruct:free")
    }
    case "groq": {
      const groq = createOpenAI({
        apiKey,
        baseURL: "https://api.groq.com/openai/v1",
      })
      return groq(modelName || "llama3-8b-8192")
    }
    case "deepseek": {
      const deepseek = createOpenAI({
        apiKey,
        baseURL: "https://api.deepseek.com",
      })
      return deepseek(modelName || "deepseek-chat")
    }
    case "mistral": {
      const mistral = createOpenAI({
        apiKey,
        baseURL: "https://api.mistral.ai/v1",
      })
      return mistral(modelName || "mistral-tiny")
    }
    default:
      throw new Error(`Unsupported AI Provider: ${provider}`)
  }
}
