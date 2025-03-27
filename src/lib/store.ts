import { Store } from "@tanstack/store"

export const store = new Store<{
  languageDetector: AILanguageDetector | undefined,
}>({
  languageDetector: undefined,
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
