import { jqlSearchPost, projects, type JqlSearchRequest, type JqlSearchResponse } from "@/lib/api"
import { type Cell, type Column, type ColumnDef, type ColumnFiltersState, flexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel, type Row, type RowData, type SortingState, useReactTable, VisibilityState } from "@tanstack/react-table"
import { ThemeToggle } from "@/components/theme-toggle"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { keepPreviousData, useInfiniteQuery, type QueryFunction } from "@tanstack/react-query"
import { memo, useEffect, useMemo, useRef, useState } from "react"
import { createLanguageDetector } from "@/lib/store"
import { AlertCircle, CircleSlash2 } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "./lib/utils"
import { useLocalStorageState } from "@/hooks/use-local-storage-state"
import { Issue } from "@/components/issue"
import { useVirtualizer, type VirtualItem } from "@tanstack/react-virtual"
import { buildQuery } from "@/lib/jql"
import { DataTableColumnHeader } from "@/components/data-table-column-header"
import { DataTableViewOptions } from "@/components/data-table-view-options"

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    hideNonEnglishIssues: boolean,
    setHideNonEnglishIssues: (value: boolean) => void,
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    title: string,
  }
}

const maxResults = 25

type IssueWithConfidence = (
  & JqlSearchResponse["issues"][number]
  & { englishConfidence: number | undefined }
)

type QueryKey = readonly [
  "issues",
  project: JqlSearchRequest["project"],
  query: string,
  hideNonEnglishIssues: boolean,
]

const queryFn: QueryFunction<IssueWithConfidence[], QueryKey, number> = async ({
  pageParam,
  signal,
  queryKey: [, project, query, hideNonEnglishIssues],
}): Promise<IssueWithConfidence[]> => {
  const response = await jqlSearchPost({
    project,
    advanced: true,
    search: query,
    startAt: pageParam * maxResults,
    maxResults,
  }, signal)
  const issues = response.issues as IssueWithConfidence[]
  if (hideNonEnglishIssues) {
    const languageDetector = await createLanguageDetector()
    if (languageDetector !== undefined) {
      await Promise.all(issues.map(async (issue) => {
        const results = await languageDetector.detect(issue.fields.summary)
        for (const { detectedLanguage, confidence } of results) {
          if (detectedLanguage === "en") {
            issue.englishConfidence = confidence
            break
          }
        }
      }))
    }
  }
  return issues
}

export function App() {
  const [project, setProject] = useLocalStorageState<JqlSearchRequest["project"]>("project", "MC", (x) => x, (x) => x as JqlSearchRequest["project"])
  const [sorting, setSorting] = useLocalStorageState<SortingState>("sorting", [{ id: "created", desc: true }])
  const [columnFilters, setColumnFilters] = useLocalStorageState<ColumnFiltersState>("columnFilters", [])
  const [columnVisibility, setColumnVisibility] = useLocalStorageState<VisibilityState>("columnVisibility", {})
  const [search, setSearch] = useLocalStorageState<JqlSearchRequest["search"]>("search", "", (x) => x, (x) => x)
  const [hideNonEnglishIssues, setHideNonEnglishIssues] = useLocalStorageState("hideNonEnglishIssues", false, (x) => x.toString(), (x) => x === "true")

  const query = useMemo(
    () => buildQuery(project, search, sorting, columnFilters),
    [columnFilters, project, search, sorting],
  )

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isError,
    failureReason,
  } = useInfiniteQuery({
    queryKey: ["issues", project, query, hideNonEnglishIssues],
    queryFn,
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage?.length < maxResults ? undefined : lastPageParam + 1,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    retry: false,
  })
  const issues: IssueWithConfidence[] = useMemo(
    () => data?.pages.flatMap((page) => page) ?? [],
    [data?.pages],
  )

  const columns: ColumnDef<IssueWithConfidence>[] = useMemo(() => [
    {
      id: "issuetype",
      meta: { title: "Issue Type" },
      header: ({ column }) => <DataTableColumnHeader column={column} />,
      accessorFn: (row) => row.fields.issuetype,
      size: 85,
      cell: ({ getValue }) => {
        const issuetype = getValue<JqlSearchResponse["issues"][number]["fields"]["issuetype"]>()
        return (
          <div className="flex flex-row items-center gap-1">
            <img src={issuetype.iconUrl} alt={issuetype.name} width={0} height={0} className="size-5" />
            <div title={issuetype.description}>{issuetype.name}</div>
          </div>
        )
      }
    },
    {
      id: "key",
      meta: { title: "Key" },
      header: ({ column }) => <DataTableColumnHeader column={column} />,
      accessorFn: (row) => row.key,
      size: 100,
    },
    {
      id: "summary",
      meta: { title: "Summary" },
      header: ({ column }) => <DataTableColumnHeader column={column} />,
      accessorFn: (row) => row.fields.summary,
      size: 400,
    },
    {
      id: "created",
      meta: { title: "Created" },
      accessorFn: (row) => row.fields.created,
      header: ({ column }) => <DataTableColumnHeader column={column} />,
      size: 180,
      cell: ({ getValue }) => new Date(getValue<string>()).toLocaleString(),
    },
    {
      id: "updated",
      meta: { title: "Updated" },
      accessorFn: (row) => row.fields.updated,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} />
      ),
      size: 180,
      cell: ({ getValue }) => new Date(getValue<string>()).toLocaleString(),
    },
    {
      id: "resolutiondate",
      meta: { title: "Resolved" },
      header: ({ column }) => <DataTableColumnHeader column={column} />,
      accessorFn: (row) => row.fields.resolutiondate,
      size: 180,
      cell: ({ getValue }) => {
        const value = getValue<string | null>()
        return value ? new Date(value).toLocaleString() : <div className="text-muted-foreground">Unresolved</div>
      }
    },
    {
      id: "resolution",
      meta: { title: "Resolution" },
      header: ({ column }) => <DataTableColumnHeader column={column} />,
      accessorFn: (row) => row.fields.resolution,
      size: 130,
      cell: ({ getValue }) => {
        const resolution = getValue<JqlSearchResponse["issues"][number]["fields"]["resolution"]>()
        return (
          <div title={resolution?.description}>{resolution?.name}</div>
        )
      }
    },
    {
      id: "status",
      meta: { title: "Status" },
      header: ({ column }) => <DataTableColumnHeader column={column} />,
      accessorFn: (row) => row.fields.status,
      size: 105,
      cell: ({ getValue }) => {
        const status = getValue<JqlSearchResponse["issues"][number]["fields"]["status"]>()
        return (
          <div className="flex flex-row items-center gap-1">
            <img src={status.iconUrl} alt={status.name} width={0} height={0} className="size-4" />
            <div title={status.description}>{status.name}</div>
          </div>
        )
      }
    },
    {
      id: "affectedVersion",
      meta: { title: "Affects Versions" },
      header: ({ column }) => <DataTableColumnHeader column={column} />,
      accessorFn: (row) => row.fields.versions,
      size: 140,
      cell: ({ getValue }) => {
        const versions = getValue<JqlSearchResponse["issues"][number]["fields"]["versions"]>()
        return (
          <div className="flex gap-0.5 overflow-x-auto ![scrollbar-width:none]">
            {versions?.map((version) => (
              <Badge key={version.id} variant="secondary" title={version.releaseDate}>{version.name}</Badge>
            ))}
          </div>
        )
      }
    },
    {
      id: "labels",
      meta: { title: "Labels" },
      header: ({ column }) => <DataTableColumnHeader column={column} />,
      accessorFn: (row) => row.fields.labels,
      size: 140,
      cell: ({ getValue }) => {
        const labels = getValue<string[]>()
        return (
          <div className="flex gap-0.5 overflow-x-auto ![scrollbar-width:none]">
            {labels.map((label) => (
              <Badge key={label} variant="secondary">{label}</Badge>
            ))}
          </div>
        )
      }
    },
    {
      id: "cf[10054]",
      meta: { title: "Confirmation Status" },
      header: ({ column }) => <DataTableColumnHeader column={column} />,
      accessorFn: (row) => row.fields.customfield_10054?.value,
      size: 100,
    },
    {
      id: "cf[10055]",
      meta: { title: "Category" },
      header: ({ column }) => <DataTableColumnHeader column={column} />,
      accessorFn: (row) => row.fields.customfield_10055,
      size: 100,
      cell: ({ getValue }) => {
        const categories = getValue<JqlSearchResponse["issues"][number]["fields"]["customfield_10055"]>()
        if (categories?.length === 1 && categories[0]?.value === "(Unassigned)") {
          return (
            <div className="text-muted-foreground">(Unassigned)</div>
          )
        } else {
          return (
            <div className="flex gap-0.5 overflow-x-auto ![scrollbar-width:none]">
              {categories?.map((category) => (
                <Badge key={category.id} variant="secondary">{category.value}</Badge>
              ))}
            </div>
          )
        }
      }
    },
    {
      id: "cf[10048]",
      meta: { title: "Game Mode" },
      header: ({ column }) => <DataTableColumnHeader column={column} />,
      accessorFn: (row) => row.fields.customfield_10048?.value,
      size: 100,
    },
    {
      id: "cf[10051]",
      meta: { title: "Area" },
      header: ({ column }) => <DataTableColumnHeader column={column} />,
      accessorFn: (row) => row.fields.customfield_10051?.value,
      size: 100,
    },
    {
      id: "cf[10049]",
      meta: { title: "Mojang Priority" },
      header: ({ column }) => <DataTableColumnHeader column={column} />,
      accessorFn: (row) => row.fields.customfield_10049?.value,
      size: 115,
    },
    {
      id: "cf[10061]",
      meta: { title: "Operating System Version" },
      header: ({ column }) => <DataTableColumnHeader column={column} />,
      accessorFn: (row) => row.fields.customfield_10061,
      size: 100,
    },
    {
      id: "fixVersion",
      meta: { title: "Fix Versions" },
      header: ({ column }) => <DataTableColumnHeader column={column} />,
      accessorFn: (row) => row.fields.fixVersions,
      size: 140,
      cell: ({ getValue }) => {
        const fixVersions = getValue<JqlSearchResponse["issues"][number]["fields"]["fixVersions"]>()
        return (
          <div className="flex gap-0.5 overflow-x-auto ![scrollbar-width:none]">
            {fixVersions?.map((fixVersion) => (
              <Badge key={fixVersion.id} variant="secondary" title={fixVersion.description}>{fixVersion.name}</Badge>
            ))}
          </div>
        )
      }
    },
    /*{
      header: "Linked Issues",
      accessorFn: (row) => row.fields.issuelinks,
      cell: () => null, // TODO
    },*/
    {
      id: "cf[10070]",
      meta: { title: "Votes" },
      header: ({ column }) => <DataTableColumnHeader column={column} />,
      accessorFn: (row) => row.fields.customfield_10070 ?? 0,
      size: 75,
      cell: ({ getValue }) => <div className="text-right">{getValue<number>()}</div>,
    },
    {
      id: "watchers",
      meta: { title: "Watchers" },
      header: ({ column }) => <DataTableColumnHeader column={column} />,
      accessorFn: (row) => row.fields.watches.watchCount,
      size: 75,
      cell: ({ getValue }) => <div className="text-right">{getValue<number>()}</div>,
    },
    {
      id: "cf[10047]",
      meta: { title: "CHK" },
      header: ({ column }) => <DataTableColumnHeader column={column} />,
      accessorFn: (row) => row.fields.customfield_10047,
      size: 180,
      cell: ({ getValue }) => {
        const value = getValue<string | null>()
        return value ? new Date(value).toLocaleString() : null
      },
    },
    {
      id: "cf[10050]",
      meta: { title: "ADO" },
      header: ({ column }) => <DataTableColumnHeader column={column} />,
      accessorFn: (row) => row.fields.customfield_10050,
      size: 100,
    },
    /* {
      id: "English Confidence",
      accessorFn: (row) => row.englishConfidence,
      size: 140,
      header: EnglishConfidenceMenu,
      cell: ({ getValue }) => {
        const value = getValue<number | undefined>()
        return value !== undefined ? <div className="text-right">{Math.round(value * 100)}%</div> : null
      }
    }, */
  ] satisfies ColumnDef<IssueWithConfidence>[], [])

  const table = useReactTable({
    data: issues,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    manualSorting: true,
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    manualFiltering: true,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    meta: {
      hideNonEnglishIssues,
      setHideNonEnglishIssues,
    },
  })
  const { rows } = table.getRowModel()

  const parentRef = useRef<HTMLTableElement>(null)
  const rowVirtualizer = useVirtualizer({
    count: issues.length + (hasNextPage ? maxResults : 0),
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    measureElement: () => 40,
    overscan: 0,
  })
  const virtualItems = rowVirtualizer.getVirtualItems()
  useEffect(() => {
    const lastItem = virtualItems[virtualItems.length - 1]
    if (lastItem !== undefined && lastItem.index >= issues.length - 1 && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage()
    }
  }, [hasNextPage, fetchNextPage, issues.length, isFetchingNextPage, virtualItems])

  useEffect(() => {
    if (data?.pageParams.length === 1) {
      parentRef.current?.scrollTo({ top: 0, behavior: "smooth" })
    }
  }, [data?.pageParams.length])

  const isMobile = useIsMobile()

  const [activeIssue, setActiveIssue] = useState<IssueWithConfidence | undefined>(undefined)
  // console.log(activeIssue)

  return (
    <>
      <div className="h-full flex flex-col">
        <div className="col-span-2 p-2 flex flex-row gap-2 overflow-x-auto overflow-y-hidden">
          <Select value={project} onValueChange={setProject as (value: JqlSearchRequest["project"]) => void}>
            <SelectTrigger className="min-w-[220px]">
              <SelectValue placeholder="Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Project</SelectLabel>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>{project.label}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Input
            defaultValue={search}
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
            className="min-w-[300px]"
          />
          <DataTableViewOptions table={table} />
          <ThemeToggle />
        </div>

        <div className="relative h-0.5 overflow-clip">
          <div className={cn(
            "absolute left-0 top-0 inset-0 bg-blue-500 animate-indeterminate origin-left transition-opacity",
            isFetching && !isFetchingNextPage ? "opacity-100" : "opacity-0",
          )}></div>
        </div>

        <Table ref={parentRef} className="h-full grid grid-rows-[auto_1fr] overflow-scroll overscroll-none border-t">
          <TableHeader className={cn(
            "grid sticky top-0 z-10 w-full bg-background shadow-[0_1px_0_var(--border)]",
          )}>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      style={{
                        minWidth: header.getSize(),
                        maxWidth: header.getSize(),
                      }}
                      className="truncate"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody
            className="grid relative before:content-[''] before:absolute before:inset-0 before:bg-primary/10 before:animate-pulse"
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
            }}
          >
            {issues.length === 0 ? (
              <TableRow>
                <TableCell colSpan={0} className="relative flex items-center">
                  <div className="sticky left-1/2 -translate-x-1/2">
                    {isError ? (
                      <Alert variant="destructive">
                        <AlertCircle className="size-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>
                          {failureReason?.message}
                        </AlertDescription>
                      </Alert>
                    ) : !isFetching ? (
                      <Alert>
                        <CircleSlash2 className="size-4" />
                        <AlertTitle>No issues found</AlertTitle>
                      </Alert>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ) : virtualItems.map((virtualRow) => (
              <IssueRow
                key={virtualRow.index}
                row={rows[virtualRow.index]}
                virtualRow={virtualRow}
                onClickIssue={setActiveIssue}
                columnVisibility={columnVisibility}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {isMobile ? (
        <Drawer
          open={activeIssue !== undefined}
          onOpenChange={(open) => { if (!open) { setActiveIssue(undefined) } }}
        >
          <DrawerContent>
            <DrawerHeader className="text-left">
              <DrawerTitle>
                {activeIssue !== undefined ? (
                  <div className="h-full flex flex-col">
                    <a
                      href={`${import.meta.env.BASE_URL}${activeIssue.key}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base text-blue-500 font-medium hover:underline"
                    >
                      {activeIssue.key}
                    </a>
                    <div className="text-2xl">{activeIssue.fields.summary}</div>
                  </div>
                ) : null}
              </DrawerTitle>
              <DrawerDescription></DrawerDescription>
            </DrawerHeader>
            <div className="px-6 h-full overflow-y-auto">
              {activeIssue ? <Issue issue={activeIssue} hideSummary /> : null}
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog
          open={activeIssue !== undefined}
          onOpenChange={(open) => { if (!open) { setActiveIssue(undefined) } }}
        >
          <DialogContent className="w-4xl grid-rows-[auto_1fr]">
            <DialogHeader>
              <DialogTitle>
                {activeIssue !== undefined ? (
                  <div className="h-full flex flex-col">
                    <a
                      href={`${import.meta.env.BASE_URL}${activeIssue.key}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base text-blue-500 font-medium hover:underline"
                    >
                      {activeIssue.key}
                    </a>
                    <div className="text-2xl font-bold">{activeIssue.fields.summary}</div>
                  </div>
                ) : null}
              </DialogTitle>
              <DialogDescription></DialogDescription>
            </DialogHeader>
            <div className="h-full overflow-y-auto">
              {activeIssue ? <Issue issue={activeIssue} hideSummary /> : null}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

const IssueRow = memo(function IssueRow({
  row,
  virtualRow,
  onClickIssue,
  columnVisibility: _columnVisibility,
}: {
  row: Row<IssueWithConfidence> | undefined,
  virtualRow: VirtualItem,
  onClickIssue: (issue: IssueWithConfidence) => void,
  columnVisibility: VisibilityState,
}) {
  return row !== undefined ? (
    <TableRow
      data-index={virtualRow.index}
      data-state={row.getIsSelected() && "selected"}
      onClick={() => onClickIssue(row.original)}
      style={{
        height: `${virtualRow.size}px`,
        transform: `translateY(${virtualRow.start}px)`,
      }}
      className="absolute top-0 left-0 w-full truncate bg-background hover:bg-accent "
    >
      {row.getVisibleCells().map((cell) => (
        <IssueCell
          key={cell.id}
          cell={cell}
          column={cell.column}
        />
      ))}
    </TableRow>
  ) : (
    <TableRow
      key={virtualRow.index}
      style={{
        height: `${virtualRow.size}px`,
        transform: `translateY(${virtualRow.start}px)`,
      }}
      className="absolute top-0 left-0 w-full truncate"
    >
      <TableCell colSpan={0} className="p-0 h-full flex"></TableCell>
    </TableRow>
  )
})

const IssueCell = memo(function IssueCell({
  cell,
  column,
}: {
  cell: Cell<IssueWithConfidence, unknown>,
  column: Column<IssueWithConfidence, unknown>,
}) {
  return (
    <TableCell
      key={cell.id}
      style={{
        minWidth: column.getSize(),
        maxWidth: column.getSize(),
      }}
      className="truncate"
    >
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
    </TableCell>
  )
})
