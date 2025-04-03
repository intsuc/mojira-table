import { Column } from "@tanstack/react-table"
import { ArrowDown, ArrowDown01, ArrowDown10, EyeOff, PanelLeftClose, PanelRightClose, PinOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface DataTableColumnHeaderProps<TData, TValue> extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  const title = column.columnDef.meta?.title ?? column.id

  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="w-full h-full flex items-center justify-between rounded-none m-0 px-2 hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 data-[state=open]:bg-accent transition-colors"
        >
          <span className="truncate">{title}</span>
          {column.getIsSorted() === "desc" ? (
            <ArrowDown10 className="size-4" />
          ) : column.getIsSorted() === "asc" ? (
            <ArrowDown01 className="size-4" />
          ) : (
            null
          )}
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
  )
}
