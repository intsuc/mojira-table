import { Store } from "@tanstack/store"
import { createHighlighter, type BundledLanguage, type BundledTheme, type HighlighterGeneric } from "shiki"
import type { JqlSearchResponse } from "./api"

export type IssueWithConfidence = (
  & JqlSearchResponse["issues"][number]
  & { englishConfidence: number | undefined }
)

export const store = new Store<{
  activeIssue: IssueWithConfidence | undefined,
  languageDetector: AILanguageDetector | undefined,
  highlighter: Promise<HighlighterGeneric<BundledLanguage, BundledTheme>>,
}>({
  activeIssue: undefined,
  languageDetector: undefined,
  highlighter: createHighlighter({
    themes: ["github-dark", "github-light"],
    langs: ["java", "json", "text"],
  }),
})

export async function createLanguageDetector() {
  if (store.state.languageDetector !== undefined) {
    return store.state.languageDetector
  }

  if ("ai" in self && "languageDetector" in self.ai) {
    const { available } = await self.ai.languageDetector.capabilities()
    if (available !== "no") {
      const languageDetector = await self.ai.languageDetector.create()
      store.setState((state) => ({
        ...state,
        languageDetector,
      }))
      return languageDetector
    }
  }

  return undefined
}
