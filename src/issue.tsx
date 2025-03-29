import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { Issue } from "@/components/issue"
import { projects, jqlSearchPost, type JqlSearchRequest } from "./lib/api"

const key = location.pathname.slice("/mojira/".length)
const project = key?.split("-")[0]

function App() {
  const { data } = useQuery({
    enabled: projects.find(({ id }) => id === project) !== undefined,
    queryKey: [key] as const,
    queryFn: async ({
      signal,
      queryKey: [issueKey],
    }) => {
      return await jqlSearchPost({
        project: project as JqlSearchRequest["project"],
        filter: "all",
        sortField: "created",
        sortAsc: false,
        advanced: true,
        search: `key = ${issueKey}`,
        startAt: 0,
        maxResults: 1,
        isForge: false,
        workspaceId: "",
      }, signal)
    }
  })
  const issue = data?.issues[0]

  return (
    <div className="p-8">
      {issue !== undefined ? (
        <div className="flex flex-col gap-4">
          <div className="h-full flex flex-col">
            <div>{issue.key}</div>
            <div className="text-2xl font-bold">{issue.fields.summary}</div>
          </div>
          <Issue issue={issue} />
        </div>
      ) : null}
    </div>
  )
}

const queryClient = new QueryClient()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <App />
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
)
