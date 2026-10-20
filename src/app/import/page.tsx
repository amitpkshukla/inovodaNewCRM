"use client";

import React, { useState } from "react";
import {
  Upload,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  FileSpreadsheet,
  Plus,
  Trash2,
  Table,
  Check,
} from "lucide-react";

const STEPS = [
  { step: 1, name: "Upload Excel" },
  { step: 2, name: "Map Columns" },
  { step: 3, name: "Preview Unpivoted" },
  { step: 4, name: "Confirm & Ingest" },
];

export default function ExcelImportWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFileName, setUploadedFileName] = useState("Sales_Pipeline_Q3_Unnormalized.xlsx");

  // Step 2 Mapping state: multiple source Excel columns to a single App target column
  const [targetColumn, setTargetColumn] = useState("Remarks");
  const [mappedSourceColumns, setMappedSourceColumns] = useState<string[]>([
    "Jan_Remark",
    "Feb_Remark",
    "Mar_Remark",
  ]);
  const [availableSourceColumns, setAvailableSourceColumns] = useState<string[]>([
    "Apr_Remark",
    "May_Remark",
    "Q2_Strategy_Update",
  ]);
  const [selectedColToAdd, setSelectedColToAdd] = useState("Apr_Remark");

  const handleAddColumnToMapping = () => {
    if (!selectedColToAdd || mappedSourceColumns.includes(selectedColToAdd)) return;
    setMappedSourceColumns([...mappedSourceColumns, selectedColToAdd]);
    setAvailableSourceColumns(availableSourceColumns.filter((c) => c !== selectedColToAdd));
    if (availableSourceColumns.length > 1) {
      setSelectedColToAdd(availableSourceColumns.find((c) => c !== selectedColToAdd) || "");
    } else {
      setSelectedColToAdd("");
    }
  };

  const handleRemoveMappedColumn = (col: string) => {
    setMappedSourceColumns(mappedSourceColumns.filter((c) => c !== col));
    setAvailableSourceColumns([...availableSourceColumns, col]);
  };

  // Step 3 Mock unpivoted data
  const mockUnpivotedData = [
    {
      Company: "Apex Industrial Logistics",
      Contact: "Marcus Vance",
      Designation: "VP Supply Chain",
      Month_Period: "Jan_Remark",
      Remarks: "Confirmed telemetry uptime metrics. Requested security SLA documentation.",
    },
    {
      Company: "Apex Industrial Logistics",
      Contact: "Marcus Vance",
      Designation: "VP Supply Chain",
      Month_Period: "Feb_Remark",
      Remarks: "Marcus disclosed Competitor X submitted an RFP response to procurement.",
    },
    {
      Company: "Apex Industrial Logistics",
      Contact: "Elena Rostova",
      Designation: "Chief Procurement Officer",
      Month_Period: "Jan_Remark",
      Remarks: "Initial discovery call regarding Q3 procurement cycle and vendor terms.",
    },
    {
      Company: "Apex Industrial Logistics",
      Contact: "Elena Rostova",
      Designation: "Chief Procurement Officer",
      Month_Period: "Feb_Remark",
      Remarks: "CFO noted budget locked until Q4 audit completion. Exploring pilot bridge.",
    },
    {
      Company: "Vanguard Cloud Systems",
      Contact: "Sophia Martinez",
      Designation: "VP Platform Architecture",
      Month_Period: "Jan_Remark",
      Remarks: "Architecture review completed. Zero-Trust Identity Bridge selected for POC.",
    },
  ];

  return (
    <div className="flex-1 p-8 max-w-5xl mx-auto w-full">
      {/* Wizard Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <FileSpreadsheet className="w-6 h-6 text-indigo-400" />
          Excel Ingestion Wizard
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Horizontal unpivoting engine using pandas pd.melt(). Transforms legacy monthly spreadsheets into normalized relational tables.
        </p>
      </div>

      {/* Step Indicators */}
      <div className="grid grid-cols-4 gap-2 mb-8">
        {STEPS.map((s) => {
          const isActive = currentStep === s.step;
          const isCompleted = currentStep > s.step;
          return (
            <div
              key={s.step}
              className={`p-3 rounded-xl border transition-all ${
                isActive
                  ? "bg-indigo-950/40 border-indigo-500 text-white"
                  : isCompleted
                  ? "bg-slate-900 border-slate-700 text-slate-300"
                  : "bg-slate-950/60 border-slate-800 text-slate-500"
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span
                  className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-mono ${
                    isActive
                      ? "bg-indigo-600 text-white"
                      : isCompleted
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {isCompleted ? <Check className="w-3 h-3" /> : s.step}
                </span>
                <span>{s.name}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Step 1: Upload */}
      {currentStep === 1 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Upload className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Upload Legacy Excel Workbook</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Select or drop your horizontal Excel sheet (.xlsx, .xls). The parser will detect horizontal date columns.
            </p>
          </div>
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl max-w-sm mx-auto text-left flex items-center justify-between text-xs">
            <span className="font-mono text-slate-300 truncate">{uploadedFileName}</span>
            <span className="text-emerald-400 font-mono text-[11px]">Ready</span>
          </div>
        </div>
      )}

      {/* Step 2: Map Columns (Multiple to One with + button) */}
      {currentStep === 2 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div>
            <h3 className="text-base font-semibold text-white">
              Step 2: Map Horizontal Columns to Unified Target
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Unpivot multiple horizontal Excel timeline columns (e.g. Jan_Remark, Feb_Remark) into a single vertical App column.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 rounded-xl bg-slate-950 border border-slate-800">
            {/* Target App Column */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Unified App Target Column
              </label>
              <input
                type="text"
                disabled
                value={targetColumn}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-indigo-300 font-semibold cursor-not-allowed"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Maps to contacts.remarks in PostgreSQL schema.
              </span>
            </div>

            {/* Mapped Source Columns */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Mapped Source Excel Columns (pd.melt value_vars)
              </label>

              {/* Add column control */}
              <div className="flex items-center gap-2 mb-3">
                <select
                  value={selectedColToAdd}
                  onChange={(e) => setSelectedColToAdd(e.target.value)}
                  disabled={availableSourceColumns.length === 0}
                  className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-40"
                >
                  {availableSourceColumns.length === 0 ? (
                    <option value="">No more detected columns</option>
                  ) : (
                    availableSourceColumns.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))
                  )}
                </select>

                {/* The "+" Button as specifically requested */}
                <button
                  type="button"
                  onClick={handleAddColumnToMapping}
                  disabled={!selectedColToAdd}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                  title="Add Excel column to mapping"
                >
                  <Plus className="w-4 h-4" />
                  <span>Map</span>
                </button>
              </div>

              {/* Current Mapped List */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {mappedSourceColumns.map((col) => (
                  <div
                    key={col}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs"
                  >
                    <span className="font-mono text-slate-300">{col}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMappedColumn(col)}
                      className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                      title="Remove column from unpivoting"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Preview Unpivoted Table */}
      {currentStep === 3 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">
                Step 3: Preview Unpivoted Data Structure
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Resulting normalized rows produced by pandas pd.melt() unpivoting.
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800">
              5 Unpivoted Sample Rows
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Company</th>
                  <th className="py-2.5 px-3">Contact</th>
                  <th className="py-2.5 px-3">Designation</th>
                  <th className="py-2.5 px-3">Month Period (Source)</th>
                  <th className="py-2.5 px-3">Normalized Remarks (Target)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-sans">
                {mockUnpivotedData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-semibold text-slate-200">{row.Company}</td>
                    <td className="py-2.5 px-3 text-indigo-300 font-medium">{row.Contact}</td>
                    <td className="py-2.5 px-3 text-slate-400">{row.Designation}</td>
                    <td className="py-2.5 px-3 font-mono text-amber-400">{row.Month_Period}</td>
                    <td className="py-2.5 px-3 max-w-[340px] truncate text-slate-300" title={row.Remarks}>
                      {row.Remarks}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Step 4: Confirm & Ingest */}
      {currentStep === 4 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-white">Ingestion Complete</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Successfully parsed and unpivoted 48 monthly remarks into the PostgreSQL contacts table. Account 360 data grids are now populated.
          </p>
        </div>
      )}

      {/* Wizard Footer Controls */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
          disabled={currentStep === 1}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 disabled:opacity-30 disabled:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        {currentStep < 4 ? (
          <button
            type="button"
            onClick={() => setCurrentStep((s) => Math.min(4, s + 1))}
            className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors"
          >
            <span>{currentStep === 3 ? "Execute Ingestion" : "Continue"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <a
            href="/"
            className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-colors"
          >
            <span>Go to Account 360 Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}
