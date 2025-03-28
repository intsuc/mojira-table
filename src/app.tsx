import { jqlSearchPost, projects, type JqlSearchRequest, type JqlSearchResponse } from "@/lib/api"
import { type ColumnDef, type ColumnFiltersState, flexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel, type HeaderContext, type SortingState, useReactTable } from "@tanstack/react-table"
import { ThemeToggle } from "@/components/theme-toggle"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { keepPreviousData, useInfiniteQuery, type QueryFunction } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { createLanguageDetector } from "@/lib/store"
import { ArrowDown, ArrowDown01, ArrowDown10, Loader2, Menu, RefreshCw } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import { Content } from "@/components/content"
import { cn } from "./lib/utils"

const maxResults = 25

type IssueWithConfidence = (
  & JqlSearchResponse["issues"][number]
  & { enConfidence: number | undefined }
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
            issue.enConfidence = confidence
            break
          }
        }
      }))
    }
  }
  return issues
}

export function App() {
  const [hideNonEnglishIssues, setHideNonEnglishIssues] = useState(false)

  const [project, setProject] = useState<JqlSearchRequest["project"]>("MC")
  const [sorting, setSorting] = useState<SortingState>([{ id: "Created", desc: true }])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [advanced, setAdvanced] = useState<JqlSearchRequest["advanced"]>(false)
  const [search, setSearch] = useState<JqlSearchRequest["search"]>("")

  const { data, fetchNextPage, hasNextPage, isFetching, isRefetching, refetch } = useInfiniteQuery({
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
      size: 90,
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
      size: 150,
      cell: ({ getValue }) => new Date(getValue<string>()).toLocaleString(),
    },
    {
      id: "Updated",
      accessorFn: (row) => row.fields.updated,
      header: ColumnMenu,
      size: 150,
      cell: ({ getValue }) => new Date(getValue<string>()).toLocaleString(),
    },
    {
      accessorFn: (row) => row.fields.resolutiondate,
      header: "Resolved",
      size: 150,
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
      size: 150,
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
          <Button variant="outline" size="icon" disabled={isRefetching} onClick={() => void refetch()}>
            <RefreshCw className={cn(isRefetching && "animate-spin")} />
          </Button>
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

        <Table>
          <TableHeader className="sticky top-0 z-10 bg-background shadow-[0_1px_0_var(--border)]">
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
                  disabled={isFetching || !hasNextPage}
                  onClick={() => void fetchNextPage()}
                  className="sticky left-2"
                >
                  {isFetching ? <><Loader2 className="animate-spin" />Loading...</> : hasNextPage ? "Load more" : "No more issues"}
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {isMobile ? (
        <Drawer open={activeIssue !== undefined} onOpenChange={(open) => {
          if (!open) {
            setActiveIssue(undefined)
          }
        }}>
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
              {activeIssue ? <Issue activeIssue={activeIssue} /> : null}
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={activeIssue !== undefined} onOpenChange={(open) => {
          if (!open) {
            setActiveIssue(undefined)
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {activeIssue !== undefined ? (
                  <div className="h-full flex flex-col">
                    <div>{activeIssue.key}</div>
                    <div className="text-2xl font-bold">{activeIssue.fields.summary}</div>
                  </div>
                ) : null}
              </DialogTitle>
              <DialogDescription></DialogDescription>
            </DialogHeader>
            <div className="h-full overflow-y-auto">
              {activeIssue ? <Issue activeIssue={activeIssue} /> : null}
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

function Issue({
  activeIssue,
}: {
  activeIssue: IssueWithConfidence,
}) {
  return (
    <div className="h-full flex flex-col">
      <div className="grid grid-cols-[10rem_auto] *:py-2 *:border-b">
        <div>Created</div> <div>{new Date(activeIssue.fields.created).toLocaleString()}</div>
        <div>CHK</div> <div>{activeIssue.fields.customfield_10047 ? new Date(activeIssue.fields.customfield_10047).toLocaleString() : null}</div>
        <div>Game Mode</div> <div>{activeIssue.fields.customfield_10048?.value}</div>
        <div>Mojang Priority</div> <div>{activeIssue.fields.customfield_10049?.value}</div>
        <div>ADO</div> <div>{activeIssue.fields.customfield_10050}</div>
        <div>Area</div> <div>{activeIssue.fields.customfield_10051?.value}</div>
        <div>Confirmation Status</div> <div>{activeIssue.fields.customfield_10054?.value}</div>
        <div>Category</div> <div>{activeIssue.fields.customfield_10055?.map((v) => v.value).join(", ")}</div>
        <div>Operating System Version</div> <div>{activeIssue.fields.customfield_10061}</div>
        <div>Votes Count</div> <div>{activeIssue.fields.customfield_10070 ?? 0}</div>
        <div>Fix Versions</div> <div className="flex flex-wrap gap-1">
          {activeIssue.fields.fixVersions.map((fixVersion) => (
            <div key={fixVersion.id}>
              <Badge variant="secondary" title={fixVersion.description}>{fixVersion.name}</Badge>
            </div>
          ))}
        </div>
        <div>Linked Issues</div> <div className="flex flex-col">
          {activeIssue.fields.issuelinks.map((issuelink) => {
            // TODO: status and issuetype
            const issue = (issuelink.inwardIssue ?? issuelink.outwardIssue)!
            return (
              <div key={issuelink.id} className="flex gap-1">
                <div>{issuelink.type.name}:</div>
                <div>{issuelink.inwardIssue ? issuelink.type.inward : null}{issuelink.outwardIssue ? issuelink.type.outward : null}</div>
                <div className="flex flex-row items-center gap-1">
                  <img src={issue.fields.issuetype.iconUrl} alt={issue.fields.issuetype.name} title={issue.fields.issuetype.description} width={0} height={0} className="size-4" />
                  <div className="font-bold">{issue.key}</div>
                  <div>{issue.fields.summary}</div>
                </div>
              </div>
            )
          })}
        </div>
        <div>Issue Type</div> <div className="flex flex-row items-center gap-1">
          <img src={activeIssue.fields.issuetype.iconUrl} alt={activeIssue.fields.issuetype.name} width={0} height={0} className="size-5" />
          <div title={activeIssue.fields.issuetype.description}>{activeIssue.fields.issuetype.name}</div>
        </div>
        <div>Labels</div> <div className="flex flex-wrap gap-1">
          {activeIssue.fields.labels.map((label) => (
            <div key={label}>
              <Badge variant="secondary">{label}</Badge>
            </div>
          ))}
        </div>
        <div>Resolution</div> <div><div title={activeIssue.fields.resolution?.description}>{activeIssue.fields.resolution?.name}</div></div>
        <div>Resolved</div> <div>{activeIssue.fields.resolutiondate ? new Date(activeIssue.fields.resolutiondate).toLocaleString() : null}</div>
        <div>Status</div> <div className="flex flex-row items-center gap-1">
          <img src={activeIssue.fields.status.iconUrl} alt={activeIssue.fields.status.name} width={0} height={0} className="size-4" />
          <div title={activeIssue.fields.status.description}>{activeIssue.fields.status.name}</div>
          <div title={activeIssue.fields.status.statusCategory.colorName}>({activeIssue.fields.status.statusCategory.name})</div>
        </div>
        <div>Affects Versions</div> <div className="flex flex-wrap gap-1">
          {activeIssue.fields.versions.map((version) => (
            <div key={version.id}>
              <Badge variant="secondary">{version.name}</Badge>
            </div>
          ))}
        </div>
        <div>Watchers</div> <div>{activeIssue.fields.watches.watchCount}</div>
      </div>

      <div className="p-8 grid justify-center">
        <div className="prose prose-zinc dark:prose-invert">
          {activeIssue.fields.description !== null ? (
            <Content content={activeIssue.fields.description} />
          ) : null}
        </div>
      </div>
    </div>
  )
}
