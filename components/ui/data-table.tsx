'use client';

import * as React from 'react';
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Search,
  Filter,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

type SortDirection = 'asc' | 'desc' | null;

interface Column<T> {
  key: string;
  header: string;
  accessor: (row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T) => string;
  searchable?: boolean;
  searchKeys?: string[];
  pagination?: boolean;
  pageSize?: number;
  selectable?: boolean;
  selectedRows?: Set<string>;
  onSelectionChange?: (selected: Set<string>) => void;
  onRowClick?: (row: T) => void;
  emptyState?: React.ReactNode;
  loading?: boolean;
  className?: string;
  rowClassName?: string;
  actions?: (row: T) => { label: string; onClick: () => void; variant?: 'default' | 'destructive' }[];
}

function useSort<T>(data: T[], columns: Column<T>[]) {
  const [sortConfig, setSortConfig] = React.useState<{
    key: string;
    direction: SortDirection;
  }>({ key: '', direction: null });

  const sortedData = React.useMemo(() => {
    if (!sortConfig.direction) return data;

    const column = columns.find((c) => c.key === sortConfig.key);
    if (!column || !column.sortable) return data;

    return [...data].sort((a, b) => {
      const aValue = column.accessor(a);
      const bValue = column.accessor(b);

      // Handle string comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      // Handle number comparison
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc'
          ? aValue - bValue
          : bValue - aValue;
      }

      return 0;
    });
  }, [data, sortConfig, columns]);

  const requestSort = (key: string) => {
    setSortConfig((current) => {
      if (current.key !== key) {
        return { key, direction: 'asc' };
      }
      if (current.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return { key: '', direction: null };
    });
  };

  return { sortedData, sortConfig, requestSort };
}

function usePagination<T>(data: T[], pageSize: number) {
  const [currentPage, setCurrentPage] = React.useState(1);

  const totalPages = Math.ceil(data.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = data.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToFirst = () => goToPage(1);
  const goToLast = () => goToPage(totalPages);
  const goToNext = () => goToPage(currentPage + 1);
  const goToPrevious = () => goToPage(currentPage - 1);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [data.length]);

  return {
    currentPage,
    totalPages,
    paginatedData,
    goToPage,
    goToFirst,
    goToLast,
    goToNext,
    goToPrevious,
    startIndex,
    endIndex,
  };
}

function useSearch<T>(data: T[], searchKeys: string[]) {
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredData = React.useMemo(() => {
    if (!searchQuery.trim()) return data;

    const query = searchQuery.toLowerCase();
    return data.filter((item) =>
      searchKeys.some((key) => {
        const value = (item as any)[key];
        return String(value).toLowerCase().includes(query);
      })
    );
  }, [data, searchQuery, searchKeys]);

  return { searchQuery, setSearchQuery, filteredData };
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  searchable = false,
  searchKeys = [],
  pagination = false,
  pageSize = 10,
  selectable = false,
  selectedRows = new Set(),
  onSelectionChange,
  onRowClick,
  emptyState,
  loading = false,
  className,
  rowClassName,
  actions,
}: DataTableProps<T>) {
  const { searchQuery, setSearchQuery, filteredData } = useSearch(
    data,
    searchKeys.length > 0 ? searchKeys : columns.map((c) => c.key)
  );
  const { sortedData, sortConfig, requestSort } = useSort(filteredData, columns);
  const {
    currentPage,
    totalPages,
    paginatedData,
    goToFirst,
    goToLast,
    goToNext,
    goToPrevious,
    startIndex,
    endIndex,
  } = usePagination(sortedData, pageSize);

  const displayData = pagination ? paginatedData : sortedData;

  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return;

    if (checked) {
      const newSelected = new Set(selectedRows);
      displayData.forEach((row) => newSelected.add(keyExtractor(row)));
      onSelectionChange(newSelected);
    } else {
      const newSelected = new Set(selectedRows);
      displayData.forEach((row) => newSelected.delete(keyExtractor(row)));
      onSelectionChange(newSelected);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (!onSelectionChange) return;

    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    onSelectionChange(newSelected);
  };

  const allSelected = displayData.length > 0 && displayData.every((row) => selectedRows.has(keyExtractor(row)));
  const someSelected = displayData.some((row) => selectedRows.has(keyExtractor(row))) && !allSelected;

  if (loading) {
    return (
      <div className={cn('rounded-xl border border-white/10 bg-card/40 backdrop-blur-xl overflow-hidden', className)}>
        <div className="p-8 flex items-center justify-center">
          <div className="animate-pulse flex items-center gap-2">
            <div className="h-5 w-5 rounded-full bg-muted" />
            <div className="h-4 w-24 rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (data.length === 0 && emptyState) {
    return (
      <div className={cn('rounded-xl border border-white/10 bg-card/40 backdrop-blur-xl', className)}>
        {emptyState}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Toolbar */}
      {(searchable || selectedRows.size > 0) && (
        <div className="flex items-center justify-between gap-4">
          {searchable && (
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-card/50 border-white/10"
              />
            </div>
          )}

          {selectedRows.size > 0 && (
            <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
              {selectedRows.size} selected
            </Badge>
          )}
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-white/10 bg-card/40 backdrop-blur-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-muted/30">
                {selectable && (
                  <th className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(input) => {
                        if (input) input.indeterminate = someSelected;
                      }}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-white/20 bg-background"
                    />
                  </th>
                )}
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      'px-4 py-3 text-left text-sm font-medium text-muted-foreground',
                      column.sortable && 'cursor-pointer select-none hover:text-foreground',
                      column.align === 'center' && 'text-center',
                      column.align === 'right' && 'text-right'
                    )}
                    style={{ width: column.width }}
                    onClick={() => column.sortable && requestSort(column.key)}
                  >
                    <div className={cn('flex items-center gap-1', column.align === 'center' && 'justify-center', column.align === 'right' && 'justify-end')}>
                      {column.header}
                      {column.sortable && (
                        <span className="inline-flex">
                          {sortConfig.key === column.key ? (
                            sortConfig.direction === 'asc' ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )
                          ) : (
                            <ChevronsUpDown className="h-4 w-4 opacity-30" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
                {actions && <th className="w-12 px-4 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {displayData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    No results found
                  </td>
                </tr>
              ) : (
                displayData.map((row) => {
                  const id = keyExtractor(row);
                  const isSelected = selectedRows.has(id);

                  return (
                    <tr
                      key={id}
                      className={cn(
                        'transition-colors',
                        onRowClick && 'cursor-pointer hover:bg-muted/50',
                        isSelected && 'bg-primary/5',
                        rowClassName
                      )}
                      onClick={() => onRowClick?.(row)}
                    >
                      {selectable && (
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleSelectRow(id, e.target.checked)}
                            className="rounded border-white/20 bg-background"
                          />
                        </td>
                      )}
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className={cn(
                            'px-4 py-3 text-sm',
                            column.align === 'center' && 'text-center',
                            column.align === 'right' && 'text-right'
                          )}
                        >
                          {column.accessor(row)}
                        </td>
                      ))}
                      {actions && (
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {actions(row).map((action, i) => (
                                <DropdownMenuItem
                                  key={i}
                                  onClick={action.onClick}
                                  className={cn(
                                    action.variant === 'destructive' && 'text-destructive focus:text-destructive'
                                  )}
                                >
                                  {action.label}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of {filteredData.length} results
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={goToFirst}
                disabled={currentPage === 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={goToPrevious}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={goToNext}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={goToLast}
                disabled={currentPage === totalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export type { Column, DataTableProps };
