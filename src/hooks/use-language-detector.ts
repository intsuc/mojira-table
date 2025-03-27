import { useEffect, useRef } from "react"

export function useLanguageDetector(): AILanguageDetector | undefined {
  const detector = useRef<AILanguageDetector | undefined>(undefined)

  useEffect(() => {
    if ("ai" in self && "languageDetector" in self.ai) {
      (async () => {

        const { available } = await self.ai.languageDetector.capabilities()
        if (available === "no") {
          return
        }
        detector.current = await self.ai.languageDetector.create()
      })()
    } else {
      console.log("The Language Detector API is not available.")
    }

    return () => detector.current?.destroy()
  }, [])

  return detector.current
}
