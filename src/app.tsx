import { jqlSearchPost, projects, type JqlSearchRequest, type JqlSearchResponse } from "@/lib/api"
import { type ColumnDef, type ColumnFiltersState, flexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel, type HeaderContext, type RowData, type SortingState, useReactTable } from "@tanstack/react-table"
import { ThemeToggle } from "@/components/theme-toggle"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { keepPreviousData, useInfiniteQuery, type QueryFunction } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { createLanguageDetector } from "@/lib/store"
import { ArrowDown, ArrowDown01, ArrowDown10, Loader2 } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "./lib/utils"
import { useLocalStorageState } from "@/hooks/use-local-storage-state"
import { Issue } from "@/components/issue"

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    hideNonEnglishIssues: boolean,
    setHideNonEnglishIssues: (value: boolean) => void,
  }
}

const maxResults = 25

type IssueWithConfidence = (
  & JqlSearchResponse["issues"][number]
  & { englishConfidence: number | undefined }
)

type QueryKey = readonly [JqlSearchRequest["project"], SortingState, ColumnFiltersState, JqlSearchRequest["advanced"], JqlSearchRequest["search"], boolean]

const queryFn: QueryFunction<IssueWithConfidence[], QueryKey, number> = async ({
  pageParam,
  signal,
  queryKey: [project, sorting, columnFilters, advanced, search, hideNonEnglishIssues],
}): Promise<IssueWithConfidence[]> => {
  const sortId = sorting[0]?.id
  const sortField = sortId === "Created" ? "created"
    : sortId === "Updated" ? "updated"
      : sortId === "Status" ? "status"
        : "created"
  const sortAsc = sorting[0]?.desc === false

  const filter = columnFilters.find((filter) => filter.id === "Status")?.value as "open" | undefined ?? "all"

  const response = await jqlSearchPost({
    project,
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
  const [sorting, setSorting] = useLocalStorageState<SortingState>("sorting", [{ id: "Created", desc: true }])
  const [columnFilters, setColumnFilters] = useLocalStorageState<ColumnFiltersState>("columnFilters", [])
  const [advanced, setAdvanced] = useLocalStorageState<JqlSearchRequest["advanced"]>("advanced", false, (x) => x.toString(), (x) => x === "true")
  const [search, setSearch] = useLocalStorageState<JqlSearchRequest["search"]>("search", "", (x) => x, (x) => x)
  const [hideNonEnglishIssues, setHideNonEnglishIssues] = useLocalStorageState("hideNonEnglishIssues", false, (x) => x.toString(), (x) => x === "true")

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: [project, sorting, columnFilters, advanced, search, hideNonEnglishIssues],
    queryFn,
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.length < maxResults ? undefined : lastPageParam + 1,
    placeholderData: keepPreviousData,
  })
  const issues: IssueWithConfidence[] = useMemo(
    () => data?.pages.flatMap((page) => page) ?? [],
    [data?.pages],
  )

  const columns: ColumnDef<IssueWithConfidence>[] = useMemo(() => [
    {
      accessorFn: (row) => row.fields.issuetype,
      header: "Issue Type",
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
      accessorFn: (row) => row.key,
      header: "Key",
      size: 100,
    },
    {
      accessorFn: (row) => row.fields.summary,
      header: "Summary",
      size: 400,
    },
    {
      id: "Created",
      accessorFn: (row) => row.fields.created,
      header: ColumnMenu,
      size: 180,
      cell: ({ getValue }) => new Date(getValue<string>()).toLocaleString(),
    },
    {
      id: "Updated",
      accessorFn: (row) => row.fields.updated,
      header: ColumnMenu,
      size: 180,
      cell: ({ getValue }) => new Date(getValue<string>()).toLocaleString(),
    },
    {
      accessorFn: (row) => row.fields.resolutiondate,
      header: "Resolved",
      size: 180,
      cell: ({ getValue }) => {
        const value = getValue<string | null>()
        return value ? new Date(value).toLocaleString() : <div className="text-muted-foreground">Unresolved</div>
      }
    },
    {
      accessorFn: (row) => row.fields.resolution,
      header: "Resolution",
      size: 130,
      cell: ({ getValue }) => {
        const resolution = getValue<JqlSearchResponse["issues"][number]["fields"]["resolution"]>()
        return (
          <div title={resolution?.description}>{resolution?.name}</div>
        )
      }
    },
    {
      id: "Status",
      accessorFn: (row) => row.fields.status,
      header: StatusColumnMenu,
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
      accessorFn: (row) => row.fields.versions,
      header: "Affects Version/s",
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
      accessorFn: (row) => row.fields.labels,
      header: "Labels",
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
      accessorFn: (row) => row.fields.customfield_10054?.value,
      header: "Confirmation Status",
      size: 100,
    },
    {
      accessorFn: (row) => row.fields.customfield_10055,
      header: "Category",
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
      accessorFn: (row) => row.fields.customfield_10048?.value,
      header: "Game Mode",
      size: 100,
    },
    {
      accessorFn: (row) => row.fields.customfield_10051?.value,
      header: "Area",
      size: 100,
    },
    {
      accessorFn: (row) => row.fields.customfield_10049?.value,
      header: "Mojang Priority",
      size: 115,
    },
    {
      accessorFn: (row) => row.fields.customfield_10061,
      header: "Operating System Version",
      size: 100,
    },
    {
      accessorFn: (row) => row.fields.fixVersions,
      header: "Fix Version/s",
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
    // {
    //   accessorFn: (row) => row.fields.issuelinks,
    //   header: "Linked Issues",
    // },
    {
      accessorFn: (row) => row.fields.customfield_10070 ?? 0,
      header: "Votes",
      size: 75,
      cell: ({ getValue }) => <div className="text-right">{getValue<number>()}</div>,
    },
    {
      accessorFn: (row) => row.fields.watches.watchCount,
      header: "Watchers",
      size: 75,
      cell: ({ getValue }) => <div className="text-right">{getValue<number>()}</div>,
    },
    {
      accessorFn: (row) => row.fields.customfield_10047,
      header: "CHK",
      size: 180,
      cell: ({ getValue }) => {
        const value = getValue<string | null>()
        return value ? new Date(value).toLocaleString() : null
      },
    },
    {
      accessorFn: (row) => row.fields.customfield_10050,
      header: "ADO",
      size: 100,
    },
    {
      id: "English Confidence",
      accessorFn: (row) => row.englishConfidence,
      size: 140,
      header: EnglishConfidenceMenu,
      cell: ({ getValue }) => {
        const value = getValue<number | undefined>()
        return value !== undefined ? <div className="text-right">{Math.round(value * 100)}%</div> : null
      }
    },
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
    state: {
      sorting,
      columnFilters,
    },
    meta: {
      hideNonEnglishIssues,
      setHideNonEnglishIssues,
    },
  })

  const [activeIssue, setActiveIssue] = useState<IssueWithConfidence | undefined>(undefined)

  console.log(activeIssue)

  const isMobile = useIsMobile()

  return (
    <>
      <div className="h-full flex flex-col overflow-hidden">
        <div className="col-span-2 p-2 flex flex-row gap-2 border-b overflow-x-auto overflow-y-hidden">
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
          <div className="flex items-center gap-2">
            <Switch id="advanced" checked={advanced} onCheckedChange={setAdvanced} />
            <Label htmlFor="advanced">Advanced</Label>
          </div>
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
          <ThemeToggle />
        </div>

        <Table className="overflow-clip">
          <TableHeader className={cn(
            "sticky top-0 z-10 bg-background shadow-[0_1px_0_var(--border)] after:transition-opacity after:content-[''] after:absolute after:bottom-0 after:w-full after:h-0.5 after:bg-blue-500 after:animate-indeterminate after:origin-left",
            isFetching ? "after:opacity-100" : "after:opacity-0",
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
          <TableBody className="relative">
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                onClick={() => setActiveIssue(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    style={{
                      minWidth: cell.column.getSize(),
                      maxWidth: cell.column.getSize(),
                    }}
                    className="truncate"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={columns.length}>
                <Button
                  variant="ghost"
                  disabled={!hasNextPage || isFetchingNextPage}
                  onClick={() => void fetchNextPage()}
                  className="sticky left-2"
                >
                  {isFetchingNextPage ? <><Loader2 className="animate-spin" />Loading...</> : hasNextPage ? "Load more" : "No more issues"}
                </Button>
              </TableCell>
            </TableRow>
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
                    <div>{activeIssue.key}</div>
                    <div className="text-2xl">{activeIssue.fields.summary}</div>
                  </div>
                ) : null}
              </DrawerTitle>
              <DrawerDescription></DrawerDescription>
            </DrawerHeader>
            <div className="px-6 h-full overflow-y-auto">
              {activeIssue ? <Issue issue={activeIssue} /> : null}
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog
          open={activeIssue !== undefined}
          onOpenChange={(open) => { if (!open) { setActiveIssue(undefined) } }}
        >
          <DialogContent className="grid-rows-[auto_1fr]">
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
              {activeIssue ? <Issue issue={activeIssue} /> : null}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

function ColumnMenu<T>({ header, column }: HeaderContext<T, unknown>) {
  const direction = column.getIsSorted() || "none"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost">
          {header.id}
          {direction === "none" ? <ArrowDown className="text-muted-foreground" /> : direction === "desc" ? <ArrowDown10 /> : <ArrowDown01 />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>{header.id}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={direction} onValueChange={(value) => {
          if (value === "none") {
            column.clearSorting()
          } else {
            column.toggleSorting(value === "desc")
          }
        }}>
          <DropdownMenuRadioItem value="none"><ArrowDown />None</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="desc"><ArrowDown10 />Descending</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="asc"><ArrowDown01 />Ascending</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function StatusColumnMenu<T>({ header, column }: HeaderContext<T, unknown>) {
  const direction = column.getIsSorted() || "none"
  const filter = column.getIsFiltered() ? "open" : "all"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost">
          {header.id}
          {direction === "none" ? <ArrowDown className="text-muted-foreground" /> : direction === "desc" ? <ArrowDown10 /> : <ArrowDown01 />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>{header.id}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={direction} onValueChange={(value) => {
          if (value === "none") {
            column.clearSorting()
          } else {
            column.toggleSorting(value === "desc")
          }
        }}>
          <DropdownMenuRadioItem value="none"><ArrowDown />None</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="desc"><ArrowDown10 />Descending</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="asc"><ArrowDown01 />Ascending</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={filter} onValueChange={(value) => {
          if (value === "all") {
            column.setFilterValue(undefined)
          } else {
            column.clearSorting()
            column.setFilterValue("open")
          }
        }}>
          <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="open">Open</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function EnglishConfidenceMenu<T>({ table, header }: HeaderContext<T, unknown>) {
  const { hideNonEnglishIssues, setHideNonEnglishIssues } = table.options.meta!

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost">
          {header.id}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>{header.id}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="flex items-center gap-2">
          <Switch id="hide-non-english-issues" checked={hideNonEnglishIssues} onCheckedChange={setHideNonEnglishIssues} />
          <Label htmlFor="hide-non-english-issues">Hide non-English issues</Label>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
