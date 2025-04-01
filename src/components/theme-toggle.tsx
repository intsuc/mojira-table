import { Moon, Sun } from "lucide-react"
import { Button } from "./ui/button"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => setIsMounted(true), [])

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {isMounted ? (
        theme === "dark" ? <Moon /> : <Sun />
      ) : null}
    </Button>
  )
}
