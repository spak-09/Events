import React, { useState, useMemo } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../ui/table';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { EmptyState } from './EmptyState';
import { SkeletonTableRows } from '../ui/skeleton';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';

export function DataTable({
  columns,
  data = [],
  isLoading = false,
  searchPlaceholder = 'Filter records...',
  searchKey,
  emptyTitle = 'No data available',
  emptyDescription,
  pageSize = 10,
  actionSlot,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  const filteredData = useMemo(() => {
    let result = [...data];
    if (searchTerm && searchKey) {
      result = result.filter((item) => {
        const val = item[searchKey];
        if (typeof val === 'string') {
          return val.toLowerCase().includes(searchTerm.toLowerCase());
        }
        return false;
      });
    }

    if (sortKey) {
      result.sort((a, b) => {
        const valA = a[sortKey] ?? '';
        const valB = b[sortKey] ?? '';
        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, searchTerm, searchKey, sortKey, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {searchKey ? (
          <div className="w-full sm:w-72">
            <Input
              icon={Search}
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        ) : (
          <div />
        )}
        {actionSlot && <div className="self-end sm:self-auto">{actionSlot}</div>}
      </div>

      <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col, idx) => (
                <TableHead
                  key={idx}
                  className={col.sortable ? 'cursor-pointer select-none hover:text-foreground' : ''}
                  onClick={() => col.sortable && handleSort(col.accessorKey)}
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && <ArrowUpDown className="h-3 w-3 opacity-60" />}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="p-4">
                  <SkeletonTableRows rows={pageSize > 5 ? 5 : pageSize} cols={columns.length} />
                </TableCell>
              </TableRow>
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-48 text-center">
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, rIdx) => (
                <TableRow key={row._id || row.id || rIdx}>
                  {columns.map((col, cIdx) => (
                    <TableCell key={cIdx}>
                      {col.cell ? col.cell(row) : row[col.accessorKey]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 pt-2">
          <div className="text-xs text-muted-foreground">
            Page {currentPage} of {totalPages} ({filteredData.length} records)
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" />
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
