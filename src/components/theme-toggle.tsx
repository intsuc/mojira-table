import { Moon, Sun } from "lucide-react"
import { Button } from "./ui/button"
import { useTheme } from "next-themes"
import { useIsMounted } from "@/hooks/use-mounted"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const isMounted = useIsMounted()

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
