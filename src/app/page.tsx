"use client"

import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { filters, jqlSearchPost, projects, sortFields, type Content, type JqlSearchRequest, type JqlSearchResponse } from "@/lib/api"
import { cn } from "@/lib/utils"
import { useInfiniteQuery } from "@tanstack/react-query"
import { ArrowDown01, ArrowDown10, Loader2 } from "lucide-react"
import { useState } from "react"

const maxResults = 25

export default function Page() {
  const [project, setProject] = useState<JqlSearchRequest["project"] | undefined>(undefined)
  const [filter, setFilter] = useState<JqlSearchRequest["filter"]>("all")
  const [sortField, setSortField] = useState<JqlSearchRequest["sortField"]>("created")
  const [sortAsc, setSortAsc] = useState<JqlSearchRequest["sortAsc"]>(false)
  const [advanced, setAdvanced] = useState<JqlSearchRequest["advanced"]>(false)
  const [search, setSearch] = useState<JqlSearchRequest["search"]>("")

  const { data, fetchNextPage, hasNextPage, isFetching } = useInfiniteQuery({
    queryKey: [project, filter, sortField, sortAsc, advanced, search],
    queryFn: async ({ pageParam, signal }) => jqlSearchPost({
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
    }, signal),
    initialPageParam: 0,
    getNextPageParam: (_lastPage, _allPages, lastPageParam) => lastPageParam + 1,
    enabled: project !== undefined,
  })
  const issues = data?.pages.flatMap((page) => page.issues) ?? []

  const [activeIssue, setActiveIssue] = useState<JqlSearchResponse["issues"][number] | undefined>(undefined)

  return (
    <div className="h-full flex flex-col">
      <div className="col-span-2 p-2 flex flex-row gap-2 border-b">
        <EnumSelect label="Project" value={project} onValueChange={setProject} values={projects} />
        <EnumSelect label="Filter" value={filter} onValueChange={setFilter} values={filters} />
        <EnumSelect label="Sort field" value={sortField} onValueChange={setSortField} values={sortFields} />
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
        <ThemeToggle />
      </div>

      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={20} className="overflow-y-hidden">
          <div className="h-full flex flex-col overflow-y-scroll [scrollbar-width:thin] divide-y">
            {issues.map((issue) => (
              <div
                key={issue.key}
                className={cn("p-2 grid grid-cols-[auto_1fr] gap-2 hover:bg-zinc-50 transition-colors", activeIssue?.key === issue.key && "bg-zinc-100")}
                onClick={() => setActiveIssue(issue)}
              >
                <div>{issue.key}</div>
                <div className="truncate">{issue.fields.summary}</div>
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
}: {
  label: string,
  value: T["id"] | undefined,
  onValueChange: (value: T["id"]) => void,
  values: readonly T[],
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[180px]">
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
