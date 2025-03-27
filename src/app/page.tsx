"use client"

import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { filters, jqlSearchPost, projects, sortFields, type Content, type JqlSearchRequest, type JqlSearchResponse } from "@/lib/api"
import { createLanguageDetector } from "@/lib/store"
import { cn } from "@/lib/utils"
import { useInfiniteQuery } from "@tanstack/react-query"
import { ArrowDown01, ArrowDown10, Loader2, Menu } from "lucide-react"
import { useState } from "react"

const maxResults = 25

type IssuesWithConfidence = (
  & JqlSearchResponse["issues"][number]
  & { enConfidence: number | undefined }
)[]

export default function Page() {
  const [hideNonEnglishIssues, setHideNonEnglishIssues] = useState(false)

  const [project, setProject] = useState<JqlSearchRequest["project"] | undefined>(undefined)
  const [filter, setFilter] = useState<JqlSearchRequest["filter"]>("all")
  const [sortField, setSortField] = useState<JqlSearchRequest["sortField"]>("created")
  const [sortAsc, setSortAsc] = useState<JqlSearchRequest["sortAsc"]>(false)
  const [advanced, setAdvanced] = useState<JqlSearchRequest["advanced"]>(false)
  const [search, setSearch] = useState<JqlSearchRequest["search"]>("")

  const { data, fetchNextPage, hasNextPage, isFetching } = useInfiniteQuery({
    queryKey: [project, filter, sortField, sortAsc, advanced, search, hideNonEnglishIssues],
    queryFn: async ({ pageParam, signal }): Promise<IssuesWithConfidence> => {
      const response = await jqlSearchPost({
        project: project!,
        filter,
        sortField,
        sortAsc,
        advanced,
        search,
        startAt: pageParam * maxResults,
        maxResults,
        isForge: false,
        workspaceId: "",
      }, signal)
      const issues = response.issues as IssuesWithConfidence
      if (hideNonEnglishIssues) {
        const languageDetector = await createLanguageDetector()
        if (languageDetector !== undefined) {
          await Promise.all(issues.map(async (issue) => {
            const results = await languageDetector.detect(issue.fields.summary)
            for (const { detectedLanguage, confidence } of results) {
              if (detectedLanguage === "en") {
                issue.enConfidence = confidence
                break
              }
            }
          }))
        }
      }
      return issues
    },
    initialPageParam: 0,
    getNextPageParam: (_lastPage, _allPages, lastPageParam) => lastPageParam + 1,
    enabled: project !== undefined,
  })
  const issues = data?.pages.flatMap((page) => page) ?? []

  const [activeIssue, setActiveIssue] = useState<JqlSearchResponse["issues"][number] | undefined>(undefined)

  return (
    <div className="h-full flex flex-col">
      <div className="col-span-2 p-2 flex flex-row gap-2 border-b">
        <EnumSelect className="min-w-[220px]" label="Project" value={project} onValueChange={setProject} values={projects} />
        <EnumSelect className="min-w-[90px]" label="Filter" value={filter} onValueChange={setFilter} values={filters} />
        <EnumSelect className="min-w-[110px]" label="Sort field" value={sortField} onValueChange={setSortField} values={sortFields} />
        <Button variant="outline" size="icon" onClick={() => setSortAsc((prev) => !prev)}>
          {sortAsc ? (
            <ArrowDown01 />
          ) : (
            <ArrowDown10 />
          )}
        </Button>
        <div className="flex items-center space-x-2">
          <Switch id="advanced" checked={advanced} onCheckedChange={setAdvanced} />
          <Label htmlFor="advanced">Advanced</Label>
        </div>
        <Input
          placeholder="Search"
          onBlur={(e) => setSearch(e.currentTarget.value)}
          onKeyDown={(e) => {
            switch (e.key) {
              case "Enter": {
                setSearch(e.currentTarget.value)
                break
              }
              case "Escape": {
                e.currentTarget.value = search
                break
              }
            }
          }}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuCheckboxItem
              checked={hideNonEnglishIssues}
              onCheckedChange={setHideNonEnglishIssues}
            >
              Hide non-English issues
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <ThemeToggle />
      </div>

      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={20} className="overflow-y-hidden">
          <div className="h-full flex flex-col overflow-y-scroll [scrollbar-width:thin] divide-y">
            {issues.map((issue) => (
              <div
                key={issue.key}
                className={cn(
                  "p-2 flex flex-col text-sm hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
                  activeIssue?.key === issue.key && "bg-accent dark:bg-accent/50",
                  hideNonEnglishIssues && issue.enConfidence !== undefined && issue.enConfidence < 0.5 && "text-muted-foreground hover:text-muted-foreground bg-muted hover:bg-muted",
                )}
                onClick={() => setActiveIssue(issue)}
              >
                <div>{issue.key}</div>
                <div>{issue.fields.summary}</div>
              </div>
            ))}
            <Button
              variant="ghost"
              disabled={isFetching || !hasNextPage}
              onClick={() => void fetchNextPage()}
            >
              {isFetching ? <><Loader2 className="animate-spin" />Loading...</> : hasNextPage ? "Load more" : "No more issues"}
            </Button>
          </div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel className="overflow-y-hidden">
          {activeIssue ? (
            <div className="h-full overflow-y-scroll [scrollbar-width:thin]">
              <div className="mx-auto prose prose-zinc dark:prose-invert">
                <Content content={activeIssue.fields.description} />
              </div>
            </div>
          ) : null}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

function EnumSelect<T extends { id: string, label: string }>({
  label,
  value,
  onValueChange,
  values,
  className,
}: {
  label: string,
  value: T["id"] | undefined,
  onValueChange: (value: T["id"]) => void,
  values: readonly T[],
  className?: string,
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>{label}</SelectLabel>
          {values.map((item) => (
            <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

function Content({
  content,
}: {
  content: Content,
}) {
  switch (content.type) {
    case "bulletList": {
      return <ul><Contents contents={content.content} /></ul>
    }
    case "codeBlock": {
      return <code><Contents contents={content.content} /></code>
    }
    case "doc": {
      // TODO: check `content.version`
      return <Contents contents={content.content} />
    }
    case "emoji": {
      return content.attrs.text
    }
    case "hardBreak": {
      return <br />
    }
    case "heading": {
      switch (content.attrs.level) {
        case 1: {
          return <h1><Contents contents={content.content} /></h1>
        }
        case 2: {
          return <h2><Contents contents={content.content} /></h2>
        }
        case 3: {
          return <h3><Contents contents={content.content} /></h3>
        }
        case 4: {
          return <h4><Contents contents={content.content} /></h4>
        }
        case 5: {
          return <h5><Contents contents={content.content} /></h5>
        }
        case 6: {
          return <h6><Contents contents={content.content} /></h6>
        }
      }
    }
    case "inlineCard": {
      return <a href={content.attrs.url}>{content.attrs.url}</a>
    }
    case "listItem": {
      return <li><Contents contents={content.content} /></li>
    }
    case "orderedList": {
      // TODO: check `content.attrs.order`
      return <ol><Contents contents={content.content} /></ol>
    }
    case "paragraph": {
      return <p><Contents contents={content.content} /></p>
    }
    case "text": {
      return content.text
    }
    default: {
      return <div className="text-red-500 font-mono">{JSON.stringify(content, null, 2)}</div>
    }
  }
}

function Contents({
  contents,
}: {
  contents?: Content[],
}) {
  return (
    <>
      {contents?.map((content, index) => (
        <Content key={index} content={content} />
      ))}
    </>
  )
}
