"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { type Skater } from "@prisma/client"
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
  PlusCircle,
} from "lucide-react"
import {
  Table as ShadcnTable,
  type ColumnDef,
  type ColumnSort,
} from "unstyled-table"

import { formatPrice } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { deleteSkatersAction } from "@/app/_actions/skater"

import { DebounceInput } from "./debounce-input"
import { Button } from "./ui/button"
import { Checkbox } from "./ui/checkbox"
import { Skeleton } from "./ui/skeleton"

interface ServerControlledTableProps {
  data: Skater[]
  pageCount?: number
}

export function ServerControlledTable({
  data,
  pageCount,
}: ServerControlledTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // This lets us update states without blocking the UI
  // Read more: https://react.dev/reference/react/useTransition#usage
  const [isPending, startTransition] = React.useTransition()

  const page = searchParams.get("page") ?? "1"
  const items = searchParams.get("items") ?? "10"
  const sort = searchParams.get("sort") ?? "email"
  const order = searchParams.get("order")
  const email = searchParams.get("email")
  const stance = searchParams.get("stance")

  // create query string
  const createQueryString = React.useCallback(
    (params: Record<string, string | number | null>) => {
      const newSearchParams = new URLSearchParams(searchParams.toString())

      for (const [key, value] of Object.entries(params)) {
        if (value === null) {
          newSearchParams.delete(key)
        } else {
          newSearchParams.set(key, String(value))
        }
      }

      return newSearchParams.toString()
    },
    [searchParams]
  )

  // Memoize the columns so they don't re-render on every render
  const columns = React.useMemo<ColumnDef<Skater, unknown>[]>(
    () => [
      {
        // Column for row selection
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => {
              table.toggleAllPageRowsSelected(!!value)
            }}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => {
              row.toggleSelected(!!value)
            }}
            aria-label="Select row"
          />
        ),
        // Disable column sorting for this column
        enableSorting: false,
        // Remove column from column visibility state
        enableHiding: false,
      },
      {
        accessorKey: "name",
        header: "Name",
      },
      {
        accessorKey: "age",
        header: "Age",
        // Disable column filter for this column
        enableColumnFilter: false,
        // Disable sorting for this column
        enableSorting: false,
      },
      {
        accessorKey: "email",
        header: "Email",
      },
      { accessorKey: "stats", header: "Stats", enableColumnFilter: false },
      {
        accessorKey: "stance",
        header: "Stance",
        // Cell value formatting
        cell: ({ row }) => (
          <span className="capitalize">{row.getValue("stance")}</span>
        ),
      },
      {
        accessorKey: "deckPrice",
        // Column header formatting
        header: () => <span className="text-left">Deck Price</span>,
        // Cell value formatting
        cell: ({ row }) => formatPrice(row.getValue("deckPrice")),
      },
      {
        // Column for row actions
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const skater = row.original

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  aria-label="Open menu"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => {
                    void navigator.clipboard.writeText(skater.id)
                  }}
                >
                  Copy skater ID
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>View skater</DropdownMenuItem>
                <DropdownMenuItem>View deck details</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    []
  )

  // Handle server-side column (email) filtering
  const [emailFilter, setEmailFilter] = React.useState(email ?? "")

  // Handle server-side column sorting
  const [sorting] = React.useState<ColumnSort[]>([
    {
      id: sort,
      desc: order === "desc" ? true : false,
    },
  ])

  return (
    <div className="w-full overflow-auto">
      <ShadcnTable
        columns={columns}
        // The inline `[]` prevents re-rendering the table when the data changes.
        data={data ?? []}
        // Rows per page
        itemsCount={Number(items)}
        // States controlled by the table
        state={{ sorting }}
        // Enable controlled states
        manualPagination
        // Table renderers
        renders={{
          table: ({ children, tableInstance }) => {
            return (
              <div className="w-full p-1">
                <DebounceInput
                  className="max-w-xs"
                  placeholder="Search all columns..."
                  value={tableInstance.getState().globalFilter as string}
                  onChange={(value) => {
                    tableInstance.setGlobalFilter(value)
                  }}
                />
                <div className="flex items-center gap-2 py-4">
                  <div className="flex w-full max-w-xs items-center gap-2">
                    <DebounceInput
                      className="max-w-xs"
                      placeholder="Search emails..."
                      value={emailFilter}
                      onChange={(value) => {
                        setEmailFilter(String(value))
                        startTransition(() => {
                          router.push(
                            `${pathname}?${createQueryString({
                              page: 1,
                              email: String(value),
                            })}`
                          )
                        })
                      }}
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          aria-label="Open stance filter menu"
                          variant="outline"
                          className="ml-auto"
                          disabled={isPending}
                        >
                          <PlusCircle className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline-block">Stance</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuCheckboxItem
                          checked={stance === "mongo"}
                          onCheckedChange={(value) => {
                            startTransition(() => {
                              router.push(
                                `${pathname}?${createQueryString({
                                  page: 1,
                                  stance: value ? "mongo" : null,
                                })}`
                              )
                            })
                          }}
                        >
                          Mongo
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                          checked={stance === "goofy"}
                          onCheckedChange={(value) => {
                            startTransition(() => {
                              router.push(
                                `${pathname}?${createQueryString({
                                  page: 1,
                                  stance: value ? "goofy" : null,
                                })}`
                              )
                            })
                          }}
                        >
                          Goofy
                        </DropdownMenuCheckboxItem>
                        {stance && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="justify-center"
                              onClick={() => {
                                startTransition(() => {
                                  router.push(
                                    `${pathname}?${createQueryString({
                                      page: 1,
                                      stance: null,
                                    })}`
                                  )
                                })
                              }}
                            >
                              Clear Filter
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="ml-auto flex items-center space-x-2">
                    <Button
                      variant="destructive"
                      onClick={() => {
                        startTransition(async () => {
                          // Delete the selected rows
                          await deleteSkatersAction(
                            tableInstance
                              .getSelectedRowModel()
                              .rows.map((row) => row.original.id)
                          )
                          // Reset row selection
                          tableInstance.resetRowSelection()
                        })
                      }}
                      disabled={
                        !tableInstance.getSelectedRowModel().rows.length ||
                        isPending
                      }
                    >
                      Delete
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="ml-auto">
                          Columns <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {tableInstance
                          .getAllColumns()
                          .filter((column) => column.getCanHide())
                          .map((column) => {
                            return (
                              <DropdownMenuCheckboxItem
                                key={column.id}
                                className="capitalize"
                                checked={column.getIsVisible()}
                                onCheckedChange={(value) => {
                                  column.toggleVisibility(!!value)
                                }}
                              >
                                {column.id}
                              </DropdownMenuCheckboxItem>
                            )
                          })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <div className="rounded-md border">
                  <Table>{children}</Table>
                </div>
              </div>
            )
          },
          header: ({ children }) => <TableHeader>{children}</TableHeader>,
          headerRow: ({ children }) => <TableRow>{children}</TableRow>,
          headerCell: ({ children, header }) => (
            <TableHead
              className="whitespace-nowrap"
              // Handle server-side column sorting
              onClick={() => {
                const isSortable = header.column.getCanSort()
                const nextSortDirection = header.column.getNextSortingOrder()

                // Update the URL with the new sort order if the column is sortable
                isSortable &&
                  startTransition(() => {
                    router.push(
                      `${pathname}?${createQueryString({
                        page: page,
                        sort: nextSortDirection ? header.column.id : null,
                        order: nextSortDirection ? nextSortDirection : null,
                      })}`
                    )
                  })
              }}
            >
              {children}
            </TableHead>
          ),
          body: ({ children }) => (
            <TableBody>
              {data.length
                ? children
                : !isPending && (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
            </TableBody>
          ),
          bodyRow: ({ children }) => <TableRow>{children}</TableRow>,
          bodyCell: ({ children }) => (
            <TableCell>
              {isPending ? <Skeleton className="h-6 w-20" /> : children}
            </TableCell>
          ),
          filterInput: ({ }) => null,
          // Custom pagination bar
          paginationBar: ({ tableInstance }) => {
            return (
              <div className="flex flex-col-reverse items-center gap-4 py-4 md:flex-row">
                <div className="flex-1 text-sm font-medium">
                  {tableInstance.getFilteredSelectedRowModel().rows.length} of{" "}
                  {items} row(s) selected.
                </div>
                <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-6">
                  <div className="flex flex-wrap items-center space-x-2">
                    <span className="text-sm font-medium">Rows per page</span>
                    <Select
                      value={items}
                      onValueChange={(value) => {
                        startTransition(() => {
                          router.push(
                            `${pathname}?${createQueryString({
                              page,
                              items: value,
                              sort,
                              order,
                            })}`
                          )
                        })
                      }}
                      disabled={isPending}
                    >
                      <SelectTrigger className="h-8 w-16">
                        <SelectValue placeholder={items} />
                      </SelectTrigger>
                      <SelectContent>
                        {[10, 20, 30, 40, 50].map((item) => (
                          <SelectItem key={item} value={item.toString()}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="text-sm font-medium">
                    {`Page ${page} of ${pageCount ?? 10}`}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 px-0"
                      onClick={() => {
                        startTransition(() => {
                          router.push(
                            `${pathname}?${createQueryString({
                              page: 1,
                              items: items,
                              sort,
                              order,
                            })}`
                          )
                        })
                      }}
                      disabled={Number(page) === 1 || isPending}
                    >
                      <ChevronsLeft className="h-5 w-5" aria-hidden="true" />
                      <span className="sr-only">First page</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 px-0"
                      onClick={() => {
                        startTransition(() => {
                          router.push(
                            `${pathname}?${createQueryString({
                              page: Number(page) - 1,
                              items: items,
                              sort,
                              order,
                            })}`
                          )
                        })
                      }}
                      disabled={Number(page) === 1 || isPending}
                    >
                      <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                      <span className="sr-only">Previous page</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 px-0"
                      onClick={() => {
                        startTransition(() => {
                          router.push(
                            `${pathname}?${createQueryString({
                              page: Number(page) + 1,
                              items: items,
                              sort,
                              order,
                            })}`
                          )
                        })
                      }}
                      disabled={Number(page) === (pageCount ?? 10) || isPending}
                    >
                      <ChevronRight className="h-5 w-5" aria-hidden="true" />
                      <span className="sr-only">Next page</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 px-0"
                      onClick={() => {
                        router.push(
                          `${pathname}?${createQueryString({
                            page: pageCount ?? 10,
                            items: items,
                            sort,
                            order,
                          })}`
                        )
                      }}
                      disabled={Number(page) === (pageCount ?? 10) || isPending}
                    >
                      <ChevronsRight className="h-5 w-5" aria-hidden="true" />
                      <span className="sr-only">Last page</span>
                    </Button>
                  </div>
                </div>
              </div>
            )
          },
        }}
      />
    </div>
  )
}
