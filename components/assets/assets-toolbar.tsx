"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel
} from "@/components/ui/dropdown-menu"
import { Search, ListFilter, LayoutGrid, List as ListIcon } from "lucide-react"

interface AssetsToolbarProps {
    searchQuery: string
    onSearchChange: (value: string) => void
    filterType: string
    onFilterChange: (value: string) => void
    viewMode: 'grid' | 'list'
    onViewModeChange: (mode: 'grid' | 'list') => void
}

export function AssetsToolbar({
    searchQuery,
    onSearchChange,
    filterType,
    onFilterChange,
    viewMode,
    onViewModeChange
}: AssetsToolbarProps) {
    return (
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-8">
            <div className="relative w-full sm:w-[400px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                    type="text"
                    placeholder="Search files..."
                    className="pl-12 h-12 rounded-full !bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-violet-500 shadow-sm transition-all hover:shadow-md"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="h-12 rounded-full !bg-white border border-slate-200 text-slate-700 hover:text-slate-900 shadow-sm gap-3 px-6 hover:shadow-md transition-all">
                            <ListFilter className="h-5 w-5 text-slate-500" />
                            <span className="hidden sm:inline font-medium text-slate-700">Filter: {filterType === 'all' ? 'All Types' : filterType}</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 bg-white border-slate-100 shadow-xl">
                        <DropdownMenuLabel className="font-bold text-slate-400 text-xs uppercase tracking-wider px-2 py-1.5">File Type</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="rounded-xl cursor-pointer" onClick={() => onFilterChange('all')}>
                            All Files
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-xl cursor-pointer" onClick={() => onFilterChange('video')}>
                            Videos Only
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-xl cursor-pointer" onClick={() => onFilterChange('image')}>
                            Images Only
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <div className="flex items-center p-1.5 bg-white border-transparent rounded-[20px] shadow-sm h-12 gap-1 px-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`h-9 w-10 p-0 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-slate-50 text-violet-600' : 'text-slate-400 hover:text-slate-600'}`}
                        onClick={() => onViewModeChange('grid')}
                    >
                        <LayoutGrid className="h-5 w-5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`h-9 w-10 p-0 rounded-xl transition-all ${viewMode === 'list' ? 'bg-slate-50 text-violet-600' : 'text-slate-400 hover:text-slate-600'}`}
                        onClick={() => onViewModeChange('list')}
                    >
                        <ListIcon className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
