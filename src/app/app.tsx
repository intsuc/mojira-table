"use client"

import { jqlSearchPost, projects, type JqlSearchRequest, type JqlSearchResponse } from "@/lib/api"
import { type Table as ReactTable, type Column, type ColumnDef, type ColumnFiltersState, ColumnPinningState, flexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel, type PaginationState, type RowData, type SortingState, useReactTable, VisibilityState, type Header, ColumnOrderState, type Cell } from "@tanstack/react-table"
import { ThemeToggle } from "@/components/theme-toggle"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
import Image from "next/image"
import { useStore } from "@tanstack/react-store"
import type { BundledLanguage } from "shiki"
import Link from "next/link"
import { useIsMobile } from "@/hooks/use-mobile"
import { Issue } from "@/components/issue"
import { Button } from "@/components/ui/button"
import { ArrowDown, ArrowDown01, ArrowDown10, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, EyeOff, GripVertical, PanelLeftClose, PanelRightClose, PinOff } from "lucide-react"
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarProvider, SidebarRail } from "@/components/ui/sidebar"
import { DndContext, KeyboardSensor, MouseSensor, TouchSensor, closestCenter, type DragEndEvent, useSensor, useSensors } from "@dnd-kit/core"
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers"
import { arrayMove, SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

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
      id: "issuetype",
      meta: { title: "Issue Type" },
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
        return value ? new Date(value).toLocaleString() : <div className="text-muted-foreground">Unresolved</div>
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
          <div title={resolution?.description}>{resolution?.name}</div>
        )
      }
    },
    {
      id: "status",
      meta: { title: "Status" },
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
      accessorFn: (row) => row.fields.customfield_10048?.value,
      size: 100,
    },
    {
      id: "cf[10051]",
      meta: { title: "Area" },
      accessorFn: (row) => row.fields.customfield_10051?.value,
      size: 100,
    },
    {
      id: "cf[10049]",
      meta: { title: "Mojang Priority" },
      accessorFn: (row) => row.fields.customfield_10049?.value,
      size: 115,
    },
    {
      id: "cf[10061]",
      meta: { title: "Operating System Version" },
      accessorFn: (row) => row.fields.customfield_10061,
      size: 100,
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
    /*{
      header: "Linked Issues",
      accessorFn: (row) => row.fields.issuelinks,
      cell: () => null, // TODO
    },*/
    {
      id: "cf[10070]",
      meta: { title: "Votes" },
      accessorFn: (row) => row.fields.customfield_10070 ?? 0,
      size: 75,
      cell: ({ getValue }) => <div className="text-right">{getValue<number>()}</div>,
    },
    {
      id: "watchers",
      meta: { title: "Watchers" },
      accessorFn: (row) => row.fields.watches.watchCount,
      size: 75,
      cell: ({ getValue }) => <div className="text-right">{getValue<number>()}</div>,
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
  ] satisfies ColumnDef<JqlSearchResponse["issues"][number]>[], [])

  const [project, setProject] = useLocalStorageState<JqlSearchRequest["project"]>("project", "MC", (x) => x, (x) => x as JqlSearchRequest["project"])
  const [sorting, setSorting] = useLocalStorageState<SortingState>("sorting", [])
  const [columnFilters, setColumnFilters] = useLocalStorageState<ColumnFiltersState>("columnFilters", [])
  const [columnVisibility, setColumnVisibility] = useLocalStorageState<VisibilityState>("columnVisibility", {})
  const [columnPinning, setColumnPinning] = useLocalStorageState<ColumnPinningState>("columnPinning", {})
  const [columnOrder, setColumnOrder] = useLocalStorageState<ColumnOrderState>("columnOrder", columns.map((column) => column.id!))
  const [search, setSearch] = useLocalStorageState<JqlSearchRequest["search"]>("search", "", (x) => x, (x) => x)

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  })

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
  const issues = data?.issues ?? []

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
    onPaginationChange: setPagination,
    manualPagination: true,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      columnPinning,
      columnOrder,
      pagination,
    },
  })

  const [activeIssue, setActiveIssue] = useState<JqlSearchResponse["issues"][number] | undefined>(undefined)

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
      <div className="w-full h-full grid grid-flow-col grid-rows-[auto_auto_1fr]">
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
            window.history.replaceState(null, "", `/issue/${issue.key}`,)
          }}
          queryKey={queryKey}
        />
      </div>

      <IssueModal
        issue={activeIssue}
        onClose={() => {
          setActiveIssue(undefined)
          window.history.replaceState(null, "", "/")
        }}
      />
    </SidebarProvider>
  )
}

const modifiers = [restrictToHorizontalAxis]

function IssueTable({
  table,
  queryKey,
  onClickIssue,
}: {
  table: ReactTable<JqlSearchResponse["issues"][number]>,
  queryKey: QueryKey,
  onClickIssue: (issue: JqlSearchResponse["issues"][number]) => void,
}) {
  "use no memo"

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

  // always prefetch the next page
  useEffect(() => {
    prefetchPage(currentPageIndex + 1)
  }, [currentPageIndex, prefetchPage])

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
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {}),
  )

  return (
    <DndContext
      collisionDetection={closestCenter}
      modifiers={modifiers}
      onDragEnd={handleDragEnd}
      sensors={sensors}
    >
      <SortableContext
        items={table.getState().columnOrder}
        strategy={horizontalListSortingStrategy}
      >
        <Table className="relative h-full grid grid-rows-[auto_1fr_auto] overflow-scroll overscroll-none border-t border-separate border-spacing-0">
          <TableHeader className="sticky top-0 z-2 border-b">
            <TableRow>
              {table.getFlatHeaders().map((header) => (
                <IssueHeader key={header.id} header={header} />
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map(row => {
              return (
                <TableRow
                  key={row.id}
                  onClick={() => onClickIssue(row.original)}
                  className="group h-10"
                >
                  {row.getVisibleCells().map(cell => (
                    <IssueCell key={cell.id} cell={cell} />
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
                  {currentPageIndex + 1}
                  <div>of</div>
                  {table.getPageCount()}
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
              </TableCell>
            </TableRow>
          </TableFooter>
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

  const { attributes, isDragging, listeners, setNodeRef, transform } = useSortable({
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
      className="px-0 bg-background/95"
    >
      <div className="h-full flex items-center justify-between hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 data-[state=open]:bg-accent transition-colors">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="px-2 truncate">
              {title}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => column.clearSorting()}>
              <ArrowDown className="h-3.5 w-3.5 text-muted-foreground/70" />
              None
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
              <ArrowDown01 className="h-3.5 w-3.5 text-muted-foreground/70" />
              Asc
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
              <ArrowDown10 className="h-3.5 w-3.5 text-muted-foreground/70" />
              Desc
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => column.pin(false)}>
              <PinOff className="h-3.5 w-3.5 text-muted-foreground/70" />
              Unpin
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => column.pin("left")}>
              <PanelLeftClose className="h-3.5 w-3.5 text-muted-foreground/70" />
              Pin Left
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => column.pin("right")}>
              <PanelRightClose className="h-3.5 w-3.5 text-muted-foreground/70" />
              Pin Right
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
              <EyeOff className="h-3.5 w-3.5 text-muted-foreground/70" />
              Hide
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="h-full flex items-center">
          {column.getIsSorted() === "desc" ? (
            <ArrowDown10 className="size-4" />
          ) : column.getIsSorted() === "asc" ? (
            <ArrowDown01 className="size-4" />
          ) : (
            null
          )}
          <GripVertical
            {...attributes}
            {...listeners}
            className="size-4 cursor-grab"
          />
        </div>
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
        "relative truncate border-b bg-background",
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
  const size = column.getSize()

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
