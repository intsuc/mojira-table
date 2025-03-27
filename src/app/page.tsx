"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { filters, jqlSearchPost, projects, sortFields, type JqlSearchRequest } from "@/lib/api"
import { ArrowDown01, ArrowDown10, Loader2 } from "lucide-react"
import { useState } from "react"
import useSWRInfinite from "swr/infinite"

const maxResults = 25

export default function Page() {
  const [project, setProject] = useState<JqlSearchRequest["project"] | undefined>(undefined)
  const [filter, setFilter] = useState<JqlSearchRequest["filter"]>("all")
  const [sortField, setSortField] = useState<JqlSearchRequest["sortField"]>("created")
  const [sortAsc, setSortAsc] = useState<JqlSearchRequest["sortAsc"]>(false)
  const [search, setSearch] = useState<JqlSearchRequest["search"]>("")

  const { data, error, isLoading, isValidating, size, setSize } = useSWRInfinite(
    (pageIndex) => {
      if (project === undefined) { return null }
      return [pageIndex + 1, project, filter, sortField, sortAsc, search]
    },
    ([
      page,
      project,
      filter,
      sortField,
      sortAsc,
      search,
    ]: [
        page: number,
        project: JqlSearchRequest["project"],
        filter: JqlSearchRequest["filter"],
        sortField: JqlSearchRequest["sortField"],
        sortAsc: JqlSearchRequest["sortAsc"],
        search: JqlSearchRequest["search"],
      ]) => jqlSearchPost({
        project,
        filter,
        sortField,
        sortAsc,
        advanced: false,
        search,
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
    label,
    value,
    onValueChange,
    values,
  }: {
    label: string,
    value: T | undefined,
    onValueChange: (value: T) => void,
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
              <SelectItem key={item} value={item}>{item}</SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="sticky top-0 flex flex-row bg-white">
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
