"use client"

import { jqlSearchPost, projects, type JqlSearchRequest, type JqlSearchResponse } from "@/lib/api"
import { type Table as ReactTable, type Column, type ColumnDef, type ColumnFiltersState, ColumnPinningState, flexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel, type PaginationState, type RowData, type SortingState, useReactTable, VisibilityState, type Header, ColumnOrderState, type Cell, type ColumnSizingState } from "@tanstack/react-table"
import { ThemeToggle } from "@/components/theme-toggle"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { keepPreviousData, useQuery, useQueryClient, type QueryFunction } from "@tanstack/react-query"
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import { store } from "@/lib/store"
import { cn } from "@/lib/utils"
import { useLocalStorageState } from "@/hooks/use-local-storage-state"
import { buildQuery } from "@/lib/jql"
import { DataTableViewOptions } from "@/components/data-table-view-options"
import { useStore } from "@tanstack/react-store"
import type { BundledLanguage } from "shiki"
import Link from "next/link"
import { useIsMobile } from "@/hooks/use-mobile"
import { Issue } from "@/components/issue"
import { Button } from "@/components/ui/button"
import { ArrowDown01, ArrowDown10, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, EyeOff, PanelLeftClose, PanelRightClose } from "lucide-react"
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarProvider, SidebarRail } from "@/components/ui/sidebar"
import { DndContext, KeyboardSensor, closestCenter, type DragEndEvent, useSensor, useSensors, PointerSensor } from "@dnd-kit/core"
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers"
import { arrayMove, SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"

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
  issues: "issues",
  project: JqlSearchRequest["project"],
  searchQuery: string,
  pagination: PaginationState,
]

type QueryResult = {
  issues: JqlSearchResponse["issues"],
  total: number,
}

const queryFn: QueryFunction<QueryResult, QueryKey, number> = async ({
  signal,
  queryKey: [, project, searchQuery, { pageIndex, pageSize }],
}): Promise<QueryResult> => {
  const response = await jqlSearchPost({
    project,
    advanced: true,
    search: searchQuery,
    startAt: pageIndex * pageSize,
    maxResults: pageSize,
  }, signal)

  return {
    issues: response.issues,
    total: response.total,
  }
}

export default function App() {
  "use no memo"

  const columns: ColumnDef<JqlSearchResponse["issues"][number]>[] = useMemo(() => [
    {
      id: "status",
      meta: { title: "Status" },
      accessorFn: (row) => row.fields.status,
      size: 105,
      cell: ({ getValue }) => {
        const status = getValue<JqlSearchResponse["issues"][number]["fields"]["status"]>()
        return (
          <Badge title={status.description} className={cn(
            "truncate w-full",
            status.name === "Open" && "bg-sky-600",
            status.name === "Resolved" && "bg-emerald-600",
            status.name === "Reopened" && "bg-amber-600",
          )}>{status.name}</Badge>
        )
      }
    },
    {
      id: "key",
      meta: { title: "Key" },
      accessorFn: (row) => row.key,
      size: 100,
    },
    {
      id: "summary",
      meta: { title: "Summary" },
      accessorFn: (row) => row.fields.summary,
      size: 400,
    },
    {
      id: "created",
      meta: { title: "Created" },
      accessorFn: (row) => row.fields.created,
      size: 180,
      cell: ({ getValue }) => new Date(getValue<string>()).toLocaleString(),
    },
    {
      id: "updated",
      meta: { title: "Updated" },
      accessorFn: (row) => row.fields.updated,
      size: 180,
      cell: ({ getValue }) => new Date(getValue<string>()).toLocaleString(),
    },
    {
      id: "resolutiondate",
      meta: { title: "Resolved" },
      accessorFn: (row) => row.fields.resolutiondate,
      size: 180,
      cell: ({ getValue }) => {
        const value = getValue<string | null>()
        return value ? new Date(value).toLocaleString() : <div className="truncate text-muted-foreground">Unresolved</div>
      }
    },
    {
      id: "resolution",
      meta: { title: "Resolution" },
      accessorFn: (row) => row.fields.resolution,
      size: 130,
      cell: ({ getValue }) => {
        const resolution = getValue<JqlSearchResponse["issues"][number]["fields"]["resolution"]>()
        return (
          <div title={resolution?.description} className="truncate">{resolution?.name}</div>
        )
      }
    },
    {
      id: "affectedVersion",
      meta: { title: "Affects Versions" },
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
      id: "fixVersion",
      meta: { title: "Fix Versions" },
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
    {
      id: "cf[10054]",
      meta: { title: "Confirmation Status" },
      accessorFn: (row) => row.fields.customfield_10054?.value,
      size: 100,
    },
    {
      id: "cf[10055]",
      meta: { title: "Category" },
      accessorFn: (row) => row.fields.customfield_10055,
      size: 100,
      cell: ({ getValue }) => {
        const categories = getValue<JqlSearchResponse["issues"][number]["fields"]["customfield_10055"]>()
        if (categories?.length === 1 && categories[0]?.value === "(Unassigned)") {
          return (
            <div className="truncate text-muted-foreground">(Unassigned)</div>
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
      id: "labels",
      meta: { title: "Labels" },
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
      id: "cf[10049]",
      meta: { title: "Mojang Priority" },
      accessorFn: (row) => row.fields.customfield_10049?.value,
      size: 115,
    },
    {
      id: "cf[10051]",
      meta: { title: "Area" },
      accessorFn: (row) => row.fields.customfield_10051?.value,
      size: 100,
    },
    {
      id: "cf[10048]",
      meta: { title: "Game Mode" },
      accessorFn: (row) => row.fields.customfield_10048?.value,
      size: 100,
    },
    {
      id: "cf[10061]",
      meta: { title: "Operating System Version" },
      accessorFn: (row) => row.fields.customfield_10061,
      size: 100,
    },
    {
      id: "cf[10070]",
      meta: { title: "Votes" },
      accessorFn: (row) => row.fields.customfield_10070 ?? 0,
      size: 75,
      cell: ({ getValue }) => <div className="truncate text-right">{getValue<number>()}</div>,
    },
    {
      id: "watchers",
      meta: { title: "Watchers" },
      accessorFn: (row) => row.fields.watches.watchCount,
      size: 75,
      cell: ({ getValue }) => <div className="truncate text-right">{getValue<number>()}</div>,
    },
    {
      id: "cf[10047]",
      meta: { title: "CHK" },
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
      accessorFn: (row) => row.fields.customfield_10050,
      size: 100,
    },
    /*{
      header: "Linked Issues",
      accessorFn: (row) => row.fields.issuelinks,
      cell: () => null, // TODO
    },*/
  ] satisfies ColumnDef<JqlSearchResponse["issues"][number]>[], [])

  const [project, setProject] = useLocalStorageState<JqlSearchRequest["project"]>("project", "MC", (x) => x, (x) => x as JqlSearchRequest["project"])
  const [sorting, setSorting] = useLocalStorageState<SortingState>("sorting", [])
  const [columnFilters, setColumnFilters] = useLocalStorageState<ColumnFiltersState>("columnFilters", [])
  const [columnVisibility, setColumnVisibility] = useLocalStorageState<VisibilityState>("columnVisibility", {})
  const [columnPinning, setColumnPinning] = useLocalStorageState<ColumnPinningState>("columnPinning", {})
  const [columnOrder, setColumnOrder] = useLocalStorageState<ColumnOrderState>("columnOrder", columns.map((column) => column.id!))
  const [columnSizing, setColumnSizing] = useLocalStorageState<ColumnSizingState>("columnSizing", {})
  const [pagination, setPagination] = useLocalStorageState<PaginationState>("pagination", { pageIndex: 0, pageSize: 20 })
  const [search, setSearch] = useLocalStorageState<JqlSearchRequest["search"]>("search", "", (x) => x, (x) => x)

  const searchQuery = useMemo(
    () => buildQuery(project, search, sorting, columnFilters),
    [columnFilters, project, search, sorting],
  )
  const queryKey = useMemo(
    () => ["issues", project, searchQuery!, pagination] as const,
    [pagination, project, searchQuery],
  )

  const {
    data,
    isFetching,
  } = useQuery({
    queryKey,
    queryFn,
    placeholderData: keepPreviousData,
    retry: false,
  })
  const issues = useMemo(() => data?.issues ?? [], [data?.issues])

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
    onColumnOrderChange: setColumnOrder,
    onColumnSizingChange: setColumnSizing,
    columnResizeMode: "onChange",
    onPaginationChange: setPagination,
    manualPagination: true,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      columnPinning,
      columnOrder,
      columnSizing,
      pagination,
    },
  })

  const [activeIssue, setActiveIssue] = useState<JqlSearchResponse["issues"][number] | undefined>(undefined)

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const issue = event.state.issue as JqlSearchResponse["issues"][number] | undefined
      setActiveIssue(issue)
    }
    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [])

  return (
    <SidebarProvider className="h-full overflow-hidden">
      <Sidebar>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <Select value={project} onValueChange={setProject as (value: JqlSearchRequest["project"]) => void}>
                <SelectTrigger className="min-w-full">
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
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup />
          <SidebarGroup />
        </SidebarContent>
        <SidebarFooter>
          <ThemeToggle />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <div className="w-full h-full grid grid-flow-col grid-rows-[auto_auto_1fr_auto] overflow-x-hidden">
        <div className="col-span-2 p-2 min-h-fit flex flex-row gap-2 overflow-x-auto overflow-y-hidden">
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
        </div>

        <div className="relative h-0.5">
          <div className={cn(
            "absolute left-0 top-0 inset-0 bg-blue-500 animate-indeterminate origin-left transition-opacity",
            isFetching ? "opacity-100" : "opacity-0",
          )}></div>
        </div>

        <IssueTable
          table={table}
          onClickIssue={(issue) => {
            setActiveIssue(issue)
            window.history.pushState({ issue }, "", `/issue/${issue.key}`)
          }}
        />

        <IssuePagination
          table={table}
          queryKey={queryKey}
        />
      </div>

      <IssueModal
        issue={activeIssue}
        onClose={() => {
          setActiveIssue(undefined)
          window.history.back()
        }}
      />
    </SidebarProvider>
  )
}

function IssueTable({
  table,
  onClickIssue,
}: {
  table: ReactTable<JqlSearchResponse["issues"][number]>,
  onClickIssue: (issue: JqlSearchResponse["issues"][number]) => void,
}) {
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      table.setColumnOrder((columnOrder) => {
        const oldIndex = columnOrder.indexOf(active.id as string)
        const newIndex = columnOrder.indexOf(over.id as string)
        return arrayMove(columnOrder, oldIndex, newIndex)
      })
    }
  }, [table])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {}),
  )

  const columnSizeVars = useMemo(() => {
    const headers = table.getFlatHeaders()
    const sizes: { [key: string]: number } = {}
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i]!
      sizes[`--col-${header.column.id}-size`] = header.column.getSize()
    }
    return sizes
    // eslint-disable-next-line react-compiler/react-compiler, react-hooks/exhaustive-deps
  }, [table.getState().columnSizingInfo, table.getState().columnSizing])

  const rows = table.getRowModel().rows

  return (
    <DndContext
      collisionDetection={closestCenter}
      modifiers={[restrictToHorizontalAxis]}
      onDragEnd={handleDragEnd}
      sensors={sensors}
    >
      <SortableContext
        items={table.getState().columnOrder}
        strategy={horizontalListSortingStrategy}
      >
        <Table
          className="relative h-full grid grid-rows-[auto_1fr] overflow-auto overscroll-none border-t border-separate border-spacing-0 bg-muted/50"
          style={columnSizeVars}
        >
          <TableHeader className="flex sticky top-0 z-2">
            {table.getFlatHeaders().map((header) => (
              <IssueHeader key={header.id} header={header} />
            ))}
          </TableHeader>
          <TableBody>
            {[...Array(table.getState().pagination.pageSize).keys()].map((i) => {
              const row = rows[i]
              if (row === undefined) {
                return (
                  <TableRow key={i} className="grid group h-10 p-2 bg-background">
                    {rows[0] === undefined ? <Skeleton /> : null}
                  </TableRow>
                )
              } else {
                return (
                  <TableRow
                    key={row.id}
                    className="flex items-center group h-10"
                    onClick={() => onClickIssue(row.original)}
                  >
                    {row.getVisibleCells().map(cell => (
                      <IssueCell key={cell.id} cell={cell} />
                    ))}
                  </TableRow>
                )
              }
            })}
          </TableBody>
        </Table>
      </SortableContext>
    </DndContext>
  )
}

function IssueHeader({
  header,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  header: Header<any, unknown>,
}) {
  const column = header.column
  const title = column.columnDef.meta?.title ?? column.id

  const { attributes, isDragging, listeners, setNodeRef, setActivatorNodeRef, transform } = useSortable({
    id: header.column.id,
  })
  const normalizedTransform = CSS.Translate.toString(transform) ?? "translate3d(0px, 0px, 0)"

  const style = useMemo(
    () => getColumnStyles(header.column, isDragging, normalizedTransform),
    [header.column, isDragging, normalizedTransform],
  )

  return (
    <TableHead
      key={header.id}
      ref={setNodeRef}
      style={style}
      className="px-0 bg-background/95 border-border/50 border-r"
    >
      <div className="relative h-full hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 data-[state=open]:bg-accent transition-colors">
        <Popover>
          <PopoverTrigger asChild>
            <button
              ref={setActivatorNodeRef}
              className={cn(
                "w-full h-full flex items-center justify-between m-0 px-2",
                isDragging && "cursor-grabbing",
              )}
              {...attributes}
              {...listeners}
            >
              <span className="truncate">{title}</span>
              <div className="h-full flex items-center">
                {column.getIsSorted() === "desc" ? (
                  <ArrowDown10 className="size-4" />
                ) : column.getIsSorted() === "asc" ? (
                  <ArrowDown01 className="size-4" />
                ) : (
                  null
                )}
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent className="flex flex-col gap-2 w-fit">
            <div className="flex flex-row gap-2 h-full">
              <div className="flex flex-col">
                <Label htmlFor="sort" className="text-sm font-medium">Sort</Label>
                <ToggleGroup id="sort" type="single" value={column.getIsSorted() || ""} onValueChange={(value) => {
                  switch (value) {
                    case "": return column.clearSorting()
                    case "asc": return column.toggleSorting(false)
                    case "desc": return column.toggleSorting(true)
                  }
                }}>
                  <ToggleGroupItem value="asc" aria-label="Sort ascending">
                    <ArrowDown01 className="size-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="desc" aria-label="Sort descending">
                    <ArrowDown10 className="size-4" />
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
              <div className="">
                <Separator orientation="vertical" />
              </div>
              <div className="flex flex-col">
                <Label htmlFor="pin" className="text-sm font-medium">Pin</Label>
                <ToggleGroup id="pin" type="single" value={column.getIsPinned() || ""} onValueChange={(value) => {
                  switch (value) {
                    case "": return column.pin(false)
                    case "left": return column.pin("left")
                    case "right": return column.pin("right")
                  }
                }}>
                  <ToggleGroupItem value="left" aria-label="Pin left">
                    <PanelLeftClose className="size-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="right" aria-label="Pin right">
                    <PanelRightClose className="size-4" />
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
            <Separator />
            <Button variant="outline" onClick={() => column.toggleVisibility(false)}>
              <EyeOff className="size-4" />
              Hide
            </Button>
          </PopoverContent>
        </Popover>
        <div
          className="absolute top-0 right-0 w-1 h-full bg-transparent hover:bg-blue-500 cursor-ew-resize transition-colors"
          onDoubleClick={header.column.resetSize}
          onMouseDown={header.getResizeHandler()}
          onTouchStart={header.getResizeHandler()}
        ></div>
      </div>
    </TableHead>
  )
}

function IssueCell({
  cell,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cell: Cell<any, unknown>,
}) {
  const { isDragging, setNodeRef, transform } = useSortable({
    id: cell.column.id,
  })
  const normalizedTransform = CSS.Translate.toString(transform) ?? "translate3d(0px, 0px, 0)"

  const style = useMemo(
    () => getColumnStyles(cell.column, isDragging, normalizedTransform),
    [cell.column, isDragging, normalizedTransform],
  )

  return (
    <TableCell
      ref={setNodeRef}
      className={cn(
        "relative h-full truncate bg-background transition-colors border-border/50 border-r",
        cell.column.getIsPinned() ? "" : "group-hover:bg-muted/50",
      )}
      style={style}
    >
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
    </TableCell>
  )
}

function getColumnStyles(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  column: Column<any, unknown>,
  isDragging: boolean,
  transform: string,
): CSSProperties {
  const isPinned = column.getIsPinned()
  const isLastLeftPinnedColumn = isPinned === "left" && column.getIsLastColumn("left")
  const isFirstRightPinnedColumn = isPinned === "right" && column.getIsFirstColumn("right")
  const size = `calc(var(--col-${column.id.replace("[", "\\[").replace("]", "\\]")}-size)*1px)`

  return {
    borderRight: isLastLeftPinnedColumn ? "1px solid var(--border)" : undefined,
    borderLeft: isFirstRightPinnedColumn ? "1px solid var(--border)" : undefined,
    left: isPinned === "left" ? `${column.getStart("left")}px` : undefined,
    right: isPinned === "right" ? `${column.getAfter("right")}px` : undefined,
    opacity: isDragging ? 0.8 : isPinned ? 0.95 : 1,
    position: isPinned ? "sticky" : "relative",
    width: size,
    minWidth: size,
    maxWidth: size,
    zIndex: isDragging ? 2 : isPinned ? 1 : 0,
    transform,
  }
}

function IssuePagination({
  table,
  queryKey,
}: {
  table: ReactTable<JqlSearchResponse["issues"][number]>,
  queryKey: QueryKey,
}) {
  const queryClient = useQueryClient()

  const prefetchPage = useCallback((pageIndex: number) => {
    const [issues, project, searchQuery, pagination] = queryKey
    queryClient.prefetchQuery({
      queryKey: [issues, project, searchQuery, { ...pagination, pageIndex }],
      queryFn,
      retry: false,
    })
  }, [queryClient, queryKey])

  const currentPageIndex = table.getState().pagination.pageIndex
  const [pageIndex, setPageIndex] = useState(currentPageIndex)
  useEffect(() => setPageIndex(currentPageIndex), [currentPageIndex])

  return (
    <TableFooter className="w-full flex justify-end p-2 gap-4 bg-background">
      <div className="flex gap-1 w-fit items-center justify-center text-sm font-normal">
        {/* TODO: responsiveness */}
        <div>Show</div>
        <Select value={table.getState().pagination.pageSize.toString()} onValueChange={(value) => {
          const pageSize = Number(value)
          table.setPageSize(pageSize)
        }}>
          <SelectTrigger className="font-medium">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[10, 20, 30, 40, 50].map((size) => (
              <SelectItem key={size} value={size.toString()}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="text-nowrap">rows in page</div>
        <Input
          type="number"
          value={pageIndex + 1}
          onChange={(e) => setPageIndex(Math.max(0, Math.min(Number(e.target.value) - 1, table.getPageCount() - 1)))}
          onBlur={(e) => table.setPageIndex(Math.max(0, Math.min(Number(e.currentTarget.value) - 1, table.getPageCount() - 1)))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              table.setPageIndex(Math.max(0, Math.min(Number(e.currentTarget.value) - 1, table.getPageCount() - 1)))
            }
          }}
          className={cn(
            "field-sizing-content [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-right font-medium",
            currentPageIndex !== pageIndex && "text-muted-foreground"
          )}
        />
        <div>of</div>
        <div className="font-medium">{table.getPageCount()}</div>
      </div>
      <div className="flex gap-2">
        <Button
          size="icon"
          variant="outline"
          disabled={!table.getCanPreviousPage()}
          onClick={table.firstPage}
          onMouseEnter={() => prefetchPage(0)}
          onFocus={() => prefetchPage(0)}
        >
          <ChevronsLeft />
        </Button>
        <Button
          size="icon"
          variant="outline"
          disabled={!table.getCanPreviousPage()}
          onClick={table.previousPage}
          onMouseEnter={() => prefetchPage(currentPageIndex - 1)}
          onFocus={() => prefetchPage(currentPageIndex - 1)}
        >
          <ChevronLeft />
        </Button>
        <Button
          size="icon"
          variant="outline"
          disabled={!table.getCanNextPage()}
          onClick={table.nextPage}
          onMouseEnter={() => prefetchPage(currentPageIndex + 1)}
          onFocus={() => prefetchPage(currentPageIndex + 1)}
        >
          <ChevronRight />
        </Button>
        <Button
          size="icon"
          variant="outline"
          disabled={!table.getCanNextPage()}
          onClick={table.lastPage}
          onMouseEnter={() => prefetchPage(table.getPageCount() - 1)}
          onFocus={() => prefetchPage(table.getPageCount() - 1)}
        >
          <ChevronsRight />
        </Button>
      </div>
    </TableFooter>
  )
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
                  className="w-fit text-base text-muted-foreground hover:text-foreground transition-colors font-medium"
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
                  className="w-fit text-base text-muted-foreground hover:text-foreground transition-colors font-medium"
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
