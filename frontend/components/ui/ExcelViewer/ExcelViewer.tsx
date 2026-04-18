"use client"

import { useState, useEffect, useMemo } from 'react'
import * as XLSX from 'xlsx'
import { 
  flexRender, 
  getCoreRowModel, 
  useReactTable,
  createColumnHelper 
} from '@tanstack/react-table'
import { 
  FileSpreadsheet, 
  Table as TableIcon, 
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  Layers
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface ExcelViewerProps {
  fileUrl: string
  fileName: string
}

export function ExcelViewer({ fileUrl, fileName }: ExcelViewerProps) {
  const [data, setData] = useState<any[]>([])
  const [columns, setColumns] = useState<any[]>([])
  const [sheets, setSheets] = useState<string[]>([])
  const [activeSheet, setActiveSheet] = useState<string>('')
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [globalFilter, setGlobalFilter] = useState('')

  useEffect(() => {
    fetchAndParseFile()
  }, [fileUrl])

  const fetchAndParseFile = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(fileUrl)
      const arrayBuffer = await response.arrayBuffer()
      const wb = XLSX.read(arrayBuffer)
      
      setWorkbook(wb)
      setSheets(wb.SheetNames)
      if (wb.SheetNames.length > 0) {
        loadSheet(wb, wb.SheetNames[0])
      }
    } catch (error) {
      console.error('Failed to parse spreadsheet:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadSheet = (wb: XLSX.WorkBook, sheetName: string) => {
    const worksheet = wb.Sheets[sheetName]
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
    
    if (jsonData.length > 0) {
      const headerRow = jsonData[0] as string[]
      const tableData = jsonData.slice(1).map((row: any) => {
        const rowObj: any = {}
        headerRow.forEach((header, index) => {
          rowObj[header || `Col ${index + 1}`] = row[index]
        })
        return rowObj
      })

      const columnHelper = createColumnHelper<any>()
      const tableCols = headerRow.map((header, index) => 
        columnHelper.accessor(header || `Col ${index + 1}`, {
          header: () => <span className="font-black uppercase tracking-widest text-[10px]">{header || `Column ${index + 1}`}</span>,
          cell: info => <span className="text-slate-300 font-medium">{info.getValue() || '-'}</span>,
        })
      )

      setData(tableData)
      setColumns(tableCols)
      setActiveSheet(sheetName)
    }
  }

  const table = useReactTable({
    data,
    columns,
    state: {
        globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
  })

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4 opacity-50">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-xs font-black uppercase tracking-widest text-indigo-400">Parsing Matrix Data...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeInUp">
      {/* Spreadsheet Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-4">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
            <FileSpreadsheet size={20} />
          </div>
          <div className="flex flex-col">
            <h3 className="text-sm font-black text-white tracking-tight leading-none">{fileName}</h3>
            <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none">Spreadsheet Viewer</span>
                <span className="w-1 h-1 rounded-full bg-slate-800" />
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none">{activeSheet}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
            <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                <input 
                    type="text"
                    value={globalFilter}
                    onChange={e => setGlobalFilter(e.target.value)}
                    placeholder="Search in grid..."
                    className="bg-slate-950 border border-slate-900 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder:text-slate-700 transition-all w-[200px]"
                />
            </div>
            <Button variant="secondary" size="sm" onClick={() => window.open(fileUrl)} leftIcon={<Download size={14} />}>
                Export
            </Button>
        </div>
      </div>

      {/* Sheet Selector */}
      {sheets.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
          {sheets.map(sheet => (
            <button
                key={sheet}
                onClick={() => loadSheet(workbook!, sheet)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                    activeSheet === sheet 
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                        : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
                }`}
            >
                {sheet}
            </button>
          ))}
        </div>
      )}

      {/* Data Grid */}
      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse">
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id} className="border-b border-slate-800">
                  {headerGroup.headers.map(header => (
                    <th key={header.id} className="px-6 py-4 text-left bg-slate-950/50 sticky top-0 z-10">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="border-b border-slate-900/50 hover:bg-white/[0.02] transition-colors group">
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-6 py-4 text-xs whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                    <td colSpan={columns.length} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-3 opacity-20">
                            <Layers size={40} />
                            <p className="text-sm font-black uppercase tracking-widest">No matching records found</p>
                        </div>
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
