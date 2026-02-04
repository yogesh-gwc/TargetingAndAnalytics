import { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";

import { Card } from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "../components/ui/dropdown-menu";
import { Button } from "../components/ui/button";
import { ScrollArea } from "../components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";

type CsvRow = Record<string, string>;

interface Props {
  data: CsvRow[];
  onUpdateRow: (updated: CsvRow, original: CsvRow) => void;
  onExport: () => void;
}

const READ_ONLY_COLUMNS = new Set([
  "Radia/Prisma Package Name",
  "Placement Name",
  "Buy Model",
]);

export default function TargetingAndAnalyicsTable({
  data,
  onUpdateRow,
  onExport,
}: Props) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [selectedRow, setSelectedRow] = useState<CsvRow | null>(null);
  const [editRow, setEditRow] = useState<CsvRow>({});

  const columns = useMemo<ColumnDef<CsvRow>[]>(() => {
    if (!data.length) return [];
    return Object.keys(data[0]).map((key) => ({
      accessorKey: key,
      header: key,
      cell: ({ row }) => {
        const value = row.getValue(key) as string;
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="max-w-[260px] truncate">{value || "—"}</div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xl">
              {value || "Empty"}
            </TooltipContent>
          </Tooltip>
        );
      },
    }));
  }, [data]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnVisibility },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <Card>
      {/* HEADER */}
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="font-semibold">TARGETING & ANALYTICS TABLE</h2>

        <div className="flex gap-2">
          <Button size="sm" onClick={onExport}>
            Export CSV
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                Columns
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-64">
              <DropdownMenuLabel>Show / Hide Columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <ScrollArea className="h-64">
                {table
                  .getAllColumns()
                  .filter((c) => c.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => {
                        column.toggleVisibility(!!value);
                      }}
                      onSelect={(e) => e.preventDefault()} // 👈 KEEP MENU OPEN
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className="cursor-pointer"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="cursor-pointer hover:bg-muted"
                onClick={() => {
                  setSelectedRow(row.original);
                  setEditRow(row.original);
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* EDIT DIALOG */}
      <Dialog open={!!selectedRow} onOpenChange={() => setSelectedRow(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Row</DialogTitle>
          </DialogHeader>

          <ScrollArea className="h-[60vh] pr-4">
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(editRow).map(([key, value]) => {
                const isReadOnly = READ_ONLY_COLUMNS.has(key);

                return (
                  <div key={key}>
                    <label className="text-xs text-muted-foreground">
                      {key}
                    </label>

                    <Input
                      value={value}
                      readOnly={isReadOnly}
                      disabled={isReadOnly}
                      className={
                        isReadOnly
                          ? "bg-muted cursor-not-allowed text-muted-foreground"
                          : ""
                      }
                      onChange={(e) => {
                        if (!isReadOnly) {
                          setEditRow((prev) => ({
                            ...prev,
                            [key]: e.target.value,
                          }));
                        }
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button
              onClick={() => {
                if (selectedRow) {
                  onUpdateRow(editRow, selectedRow);
                }
                setSelectedRow(null);
              }}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
