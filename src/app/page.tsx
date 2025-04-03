"use client"

import { jqlSearchPost, projects, type JqlSearchRequest, type JqlSearchResponse } from "@/lib/api"
import { type Table as ReactTable, type Column, type ColumnDef, type ColumnFiltersState, ColumnPinningState, flexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel, type PaginationState, type RowData, type SortingState, useReactTable, VisibilityState } from "@tanstack/react-table"
import { ThemeToggle } from "@/components/theme-toggle"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { keepPreviousData, useQuery, type QueryFunction } from "@tanstack/react-query"
import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import { store } from "@/lib/store"
import { cn } from "@/lib/utils"
import { useLocalStorageState } from "@/hooks/use-local-storage-state"
import { buildQuery } from "@/lib/jql"
import { DataTableColumnHeader } from "@/components/data-table-column-header"
import { DataTableViewOptions } from "@/components/data-table-view-options"
import Image from "next/image"
import { useIsMounted } from "@/hooks/use-mounted"
import { useStore } from "@tanstack/react-store"
import type { BundledLanguage } from "shiki"
import Link from "next/link"
import { useIsMobile } from "@/hooks/use-mobile"
import { Issue } from "@/components/issue"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-object-type
  interface TableMeta<TData extends RowData> {
    //
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    title: string,
  }
}

type QueryKey = readonly [
  "issues",
  project: JqlSearchRequest["project"],
  query: string,
  pagination: PaginationState,
]

type QueryResult = {
  issues: JqlSearchResponse["issues"],
  total: number,
}

const queryFn: QueryFunction<QueryResult, QueryKey, number> = async ({
  signal,
  queryKey: [, project, query, { pageIndex, pageSize }],
}): Promise<QueryResult> => {
  const response = await jqlSearchPost({
    project,
    advanced: true,
    search: query,
    startAt: pageIndex * pageSize,
    maxResults: pageSize,
  }, signal)

  return {
    issues: response.issues,
    total: response.total,
  }
}

export default function Page() {
  const isMounted = useIsMounted()

  const [project, setProject] = useLocalStorageState<JqlSearchRequest["project"]>("project", "MC", (x) => x, (x) => x as JqlSearchRequest["project"])
  const [sorting, setSorting] = useLocalStorageState<SortingState>("sorting", [])
  const [columnFilters, setColumnFilters] = useLocalStorageState<ColumnFiltersState>("columnFilters", [])
  const [columnVisibility, setColumnVisibility] = useLocalStorageState<VisibilityState>("columnVisibility", {})
  const [columnPinning, setColumnPinning] = useLocalStorageState<ColumnPinningState>("columnPinning", {})
  const [search, setSearch] = useLocalStorageState<JqlSearchRequest["search"]>("search", "", (x) => x, (x) => x)

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  })

  const query = useMemo(
    () => buildQuery(project, search, sorting, columnFilters),
    [columnFilters, project, search, sorting],
  )

  const {
    data,
    isFetching,
  } = useQuery({
    enabled: isMounted,
    queryKey: ["issues", project, query!, pagination],
    queryFn,
    placeholderData: keepPreviousData,
    retry: false,
  })
  const issues = data?.issues ?? []

  const columns: ColumnDef<JqlSearchResponse["issues"][number]>[] = useMemo(() => [
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
            <Image src={issuetype.iconUrl} alt={issuetype.name} width={0} height={0} className="size-5" unoptimized />
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
            <Image src={status.iconUrl} alt={status.name} width={0} height={0} className="size-4" />
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
  ] satisfies ColumnDef<JqlSearchResponse["issues"][number]>[], [])

  const table = useReactTable({
    data: issues,
    columns,
    rowCount: data?.total,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    manualSorting: true,
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    manualFiltering: true,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnPinningChange: setColumnPinning,
    onPaginationChange: setPagination,
    manualPagination: true,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      columnPinning,
      pagination,
    },
  })

  const [activeIssue, setActiveIssue] = useState<JqlSearchResponse["issues"][number] | undefined>(undefined)

  const handleClickIssue = (issue: JqlSearchResponse["issues"][number]) => {
    setActiveIssue(issue)
    window.history.replaceState(null, "", `/issue/${issue.key}`,)
  }

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
            isFetching ? "opacity-100" : "opacity-0",
          )}></div>
        </div>

        <IssueTable
          table={table}
          onClickIssue={handleClickIssue}
        />
      </div>

      <IssueModal
        issue={activeIssue}
        onClose={() => {
          setActiveIssue(undefined)
          window.history.replaceState(null, "", "/")
        }}
      />
    </>
  )
}

function IssueTable({
  table,
  onClickIssue,
}: {
  table: ReactTable<JqlSearchResponse["issues"][number]>,
  onClickIssue: (issue: JqlSearchResponse["issues"][number]) => void,
}) {
  return (
    <Table className="relative h-full grid grid-rows-[auto_1fr_auto] overflow-scroll overscroll-none border-t border-separate border-spacing-0">
      <TableHeader className="sticky top-0 z-2 border-b">
        <TableRow>
          {table.getFlatHeaders().map((header) => (
            <TableHead
              key={header.id}
              style={{
                ...getCommonPinningStyles(header.column),
                minWidth: header.getSize(),
                maxWidth: header.getSize(),
              }}
              className="px-0 bg-background"
            >
              {header.isPlaceholder ? null : flexRender(
                header.column.columnDef.header,
                header.getContext(),
              )}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody className="bg-secondary">
        {table.getRowModel().rows.map(row => {
          const cellClassName = row !== undefined ? row.index & 1 ? "bg-background" : "bg-secondary" : undefined

          return (
            <TableRow
              key={row.id}
              onClick={() => onClickIssue(row.original)}
              className="h-10"
            >
              {row.getVisibleCells().map(cell => (
                <TableCell
                  key={cell.id}
                  className={cn(
                    "truncate border-b",
                    cellClassName,
                  )}
                  style={{
                    ...getCommonPinningStyles(cell.column),
                    minWidth: cell.column.getSize(),
                    maxWidth: cell.column.getSize(),
                  }}
                >
                  {flexRender(
                    cell.column.columnDef.cell,
                    cell.getContext(),
                  )}
                </TableCell>
              ))}
            </TableRow>
          )
        })}
      </TableBody>
      <TableFooter className="sticky bottom-0 z-2 overflow-x-clip">
        <TableRow className="flex w-[200%] bg-background/95 hover:!bg-background">
          <TableCell colSpan={0} className="sticky left-full -translate-x-full flex justify-end gap-4">
            <div className="flex gap-1 w-fit items-center justify-center text-sm">
              <div>Page</div>
              <Input
                type="number"
                value={table.getState().pagination.pageIndex + 1}
                onChange={(e) => {
                  const pageIndex = e.target.valueAsNumber - 1
                  table.setPageIndex(pageIndex)
                }}
                className="text-right"
              />
              <div>of</div>
              {table.getPageCount()}
            </div>
            <div className="flex gap-2">
              <Button size="icon" variant="outline" onClick={() => table.firstPage()} disabled={!table.getCanPreviousPage()}>
                <ChevronsLeft />
              </Button>
              <Button size="icon" variant="outline" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                <ChevronLeft />
              </Button>
              <Button size="icon" variant="outline" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                <ChevronRight />
              </Button>
              <Button size="icon" variant="outline" onClick={() => table.lastPage()} disabled={!table.getCanNextPage()}>
                <ChevronsRight />
              </Button>
            </div>
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
}

function getCommonPinningStyles(column: Column<JqlSearchResponse["issues"][number]>): CSSProperties {
  const isPinned = column.getIsPinned()
  const isLastLeftPinnedColumn = isPinned === "left" && column.getIsLastColumn("left")
  const isFirstRightPinnedColumn = isPinned === "right" && column.getIsFirstColumn("right")

  return {
    borderRight: isLastLeftPinnedColumn ? "1px solid var(--border)" : undefined,
    borderLeft: isFirstRightPinnedColumn ? "1px solid var(--border)" : undefined,
    left: isPinned === "left" ? `${column.getStart("left")}px` : undefined,
    right: isPinned === "right" ? `${column.getAfter("right")}px` : undefined,
    opacity: isPinned ? 0.95 : 1,
    position: isPinned ? "sticky" : "relative",
    width: column.getSize(),
    zIndex: isPinned ? 1 : 0,
  }
}

function IssueModal({
  issue,
  onClose,
}: {
  issue: JqlSearchResponse["issues"][number] | undefined,
  onClose: () => void,
}) {
  const isMobile = useIsMobile()

  return isMobile ? (
    <Drawer
      open={issue !== undefined}
      onOpenChange={(open) => { if (!open) { onClose() } }}
    >
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>
            {issue !== undefined ? (
              <div className="h-full flex flex-col">
                <Link
                  href={`/issue/${issue.key}`}
                  target="_blank"
                  className="text-base text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  {issue.key}
                </Link>
                <div className="text-2xl">{issue.fields.summary}</div>
              </div>
            ) : null}
          </DrawerTitle>
          <DrawerDescription></DrawerDescription>
        </DrawerHeader>
        <div className="px-6 h-full overflow-y-auto">
          {issue !== undefined ? (
            <Issue issue={issue} hideSummary CodeBlockComponent={CodeBlock} />
          ) : null}
        </div>
      </DrawerContent>
    </Drawer>
  ) : (
    <Dialog
      open={issue !== undefined}
      onOpenChange={(open) => { if (!open) { onClose() } }}
    >
      <DialogContent className="w-4xl grid-rows-[auto_1fr]">
        <DialogHeader>
          <DialogTitle>
            {issue !== undefined ? (
              <div className="h-full flex flex-col">
                <Link
                  href={`/issue/${issue.key}`}
                  target="_blank"
                  className="text-base text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  {issue.key}
                </Link>
                <div className="text-2xl font-bold">{issue.fields.summary}</div>
              </div>
            ) : null}
          </DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <div className="h-full overflow-y-auto">
          {issue !== undefined ? (
            <Issue issue={issue} hideSummary CodeBlockComponent={CodeBlock} />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function CodeBlock({
  text,
  lang,
}: {
  text: string,
  lang: BundledLanguage,
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  const highlighter = useStore(store, (state) => state.highlighter)

  useLayoutEffect(() => {
    void (async () => {
      const out = (await highlighter).codeToHtml(text, {
        lang,
        themes: {
          dark: "github-dark",
          light: "github-light",
        },
      })
      if (containerRef.current !== null) {
        containerRef.current.innerHTML = out
      }
    })()
  }, [highlighter, lang, text])

  return <div ref={containerRef}></div>
}
