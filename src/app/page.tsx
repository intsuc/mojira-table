"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { filters, jqlSearchPost, projects, sortFields, type JqlSearchRequest } from "@/lib/api"
import { Loader2 } from "lucide-react"
import { useState } from "react"
import useSWRInfinite from "swr/infinite"

const maxResults = 25

export default function Page() {
  const [project, setProject] = useState<JqlSearchRequest["project"] | undefined>(undefined)
  const [filter, setFilter] = useState<JqlSearchRequest["filter"]>("all")
  const [sortField, setSortField] = useState<JqlSearchRequest["sortField"]>("created")

  const { data, error, isLoading, isValidating, size, setSize } = useSWRInfinite(
    (pageIndex) => {
      if (project === undefined) { return null }
      return [pageIndex + 1, project, filter, sortField]
    },
    ([
      page,
      project,
      filter,
      sortField,
    ]: [
        page: number,
        project: JqlSearchRequest["project"],
        filter: JqlSearchRequest["filter"],
        sortField: JqlSearchRequest["sortField"],
      ]) => jqlSearchPost({
        project: project!,
        filter: filter,
        sortField: sortField,
        sortAsc: false,
        advanced: false,
        search: "",
        startAt: (page - 1) * maxResults,
        maxResults,
        isForge: false,
        workspaceId: "",
      }),
  )
  const issues = data?.flatMap((page) => page.issues) ?? []
  const isLoadingMore = isLoading || (size > 0 && data && typeof data[size - 1] === "undefined")
  const isEmpty = data?.[0] ? data[0].issues.length === 0 : true
  const isReachingEnd = isEmpty || (data?.[data.length - 1] && data[data.length - 1]!.issues.length < maxResults)
  const isRefreshing = isValidating && data && data.length === size

  function EnumSelect<T extends string>({
    placeholder,
    value,
    onValueChange,
    values,
  }: {
    placeholder?: string,
    value: T | undefined,
    onValueChange: (value: T) => void,
    values: readonly T[],
  }) {
    return (
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {values.map((item) => (
            <SelectItem key={item} value={item}>{item}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="sticky top-0 flex flex-row bg-white">
        <EnumSelect placeholder="Select a project" value={project} onValueChange={setProject} values={projects} />
        <EnumSelect value={filter} onValueChange={setFilter} values={filters} />
        <EnumSelect value={sortField} onValueChange={setSortField} values={sortFields} />
      </div>

      {!isLoading && isEmpty ? <p>No issues found.</p> : null}
      {issues.map((issue) => (
        <div key={issue.key} className="grid grid-cols-[auto_1fr] gap-2">
          <div>{issue.key}</div>
          <div className="truncate">{issue.fields.summary}</div>
        </div>
      ))}
      <Button
        variant="ghost"
        disabled={isLoadingMore || isReachingEnd}
        onClick={() => setSize(size + 1)}
      >
        {isLoadingMore ? <><Loader2 className="animate-spin" />Loading...</> : isReachingEnd ? "No more issues" : "Load more"}
      </Button>
    </div>
  )
}
