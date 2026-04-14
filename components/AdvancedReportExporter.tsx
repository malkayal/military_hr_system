import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Settings, AlertCircle, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ReportExporterProps {
  data: any[];
  fileName: string;
  columns?: string[];
}

const AdvancedReportExporter: React.FC<ReportExporterProps> = ({ data, fileName, columns }) => {
  const [exportFormat, setExportFormat] = useState<'excel' | 'json' | 'csv'>('excel');
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(columns || Object.keys(data[0] || {}));
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [includeTimestamp, setIncludeTimestamp] = useState(true);

  // الحصول على جميع الأعمدة المتاحة
  const availableColumns = columns || (data.length > 0 ? Object.keys(data[0]) : []);

  // تصدير Excel
  const exportToExcel = () => {
    try {
      const filteredData = data.map(row => {
        const filtered: any = {};
        selectedColumns.forEach(col => {
          filtered[col] = row[col];
        });
        return filtered;
      });

      const worksheet = XLSX.utils.json_to_sheet(filteredData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'التقرير');

      // تنسيق الرأس
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_col(C) + '1';
        if (!worksheet[address]) continue;
        worksheet[address].s = {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '3b82f6' } },
          alignment: { horizontal: 'center', vertical: 'center' }
        };
      }

      const timestamp = includeTimestamp ? `_${new Date().toISOString().split('T')[0]}` : '';
      XLSX.writeFile(workbook, `${fileName}${timestamp}.xlsx`);
      setMessage({ type: 'success', text: 'تم تصدير الملف بنجاح' });
    } catch (err) {
      setMessage({ type: 'error', text: 'فشل تصدير الملف' });
    }
    setTimeout(() => setMessage(null), 2000);
  };

  // تصدير JSON
  const exportToJSON = () => {
    try {
      const filteredData = data.map(row => {
        const filtered: any = {};
        selectedColumns.forEach(col => {
          filtered[col] = row[col];
        });
        return filtered;
      });

      const jsonData = {
        metadata: {
          exportDate: new Date().toISOString(),
          totalRecords: filteredData.length,
          columns: selectedColumns
        },
        data: filteredData
      };

      const jsonString = JSON.stringify(jsonData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const timestamp = includeTimestamp ? `_${new Date().toISOString().split('T')[0]}` : '';
      link.download = `${fileName}${timestamp}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: 'تم تصدير الملف بنجاح' });
    } catch (err) {
      setMessage({ type: 'error', text: 'فشل تصدير الملف' });
    }
    setTimeout(() => setMessage(null), 2000);
  };

  // تصدير CSV
  const exportToCSV = () => {
    try {
      const filteredData = data.map(row => {
        const filtered: any = {};
        selectedColumns.forEach(col => {
          filtered[col] = row[col];
        });
        return filtered;
      });

      const worksheet = XLSX.utils.json_to_sheet(filteredData);
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const timestamp = includeTimestamp ? `_${new Date().toISOString().split('T')[0]}` : '';
      link.download = `${fileName}${timestamp}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: 'تم تصدير الملف بنجاح' });
    } catch (err) {
      setMessage({ type: 'error', text: 'فشل تصدير الملف' });
    }
    setTimeout(() => setMessage(null), 2000);
  };

  // تنفيذ التصدير
  const handleExport = () => {
    if (selectedColumns.length === 0) {
      setMessage({ type: 'error', text: 'يجب اختيار عمود واحد على الأقل' });
      return;
    }

    switch (exportFormat) {
      case 'excel':
        exportToExcel();
        break;
      case 'json':
        exportToJSON();
        break;
      case 'csv':
        exportToCSV();
        break;
    }
  };

  return (
    <div className="space-y-4">
      {/* رسالة التنبيه */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-3 rounded-lg flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 size={18} />
            ) : (
              <AlertCircle size={18} />
            )}
            <span className="text-sm font-bold">{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* اختيار صيغة التصدير */}
      <div className="grid grid-cols-3 gap-2">
        {(['excel', 'json', 'csv'] as const).map(format => (
          <button
            key={format}
            onClick={() => setExportFormat(format)}
            className={`px-4 py-3 rounded-lg font-bold transition-all ${
              exportFormat === format
                ? 'bg-accent text-white shadow-lg'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            {format === 'excel' && 'Excel'}
            {format === 'json' && 'JSON'}
            {format === 'csv' && 'CSV'}
          </button>
        ))}
      </div>

      {/* خيارات التخصيص */}
      <div className="space-y-3">
        <button
          onClick={() => setIsCustomizing(!isCustomizing)}
          className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          <Settings size={18} />
          {isCustomizing ? 'إخفاء الخيارات' : 'خيارات التخصيص'}
        </button>

        <AnimatePresence>
          {isCustomizing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg space-y-4"
            >
              {/* اختيار الأعمدة */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  اختر الأعمدة المراد تصديرها:
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {availableColumns.map(col => (
                    <div key={col} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`col-${col}`}
                        checked={selectedColumns.includes(col)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedColumns([...selectedColumns, col]);
                          } else {
                            setSelectedColumns(selectedColumns.filter(c => c !== col));
                          }
                        }}
                        className="w-4 h-4 accent-accent rounded"
                      />
                      <label htmlFor={`col-${col}`} className="text-sm text-slate-700 dark:text-slate-300">
                        {col}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* خيارات إضافية */}
              <div className="space-y-2 border-t dark:border-slate-600 pt-3">


                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="include-timestamp"
                    checked={includeTimestamp}
                    onChange={(e) => setIncludeTimestamp(e.target.checked)}
                    className="w-4 h-4 accent-accent rounded"
                  />
                  <label htmlFor="include-timestamp" className="text-sm text-slate-700 dark:text-slate-300">
                    إضافة التاريخ إلى اسم الملف
                  </label>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* زر التصدير */}
      <button
        onClick={handleExport}
        className="w-full px-4 py-3 bg-accent hover:bg-accent/90 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg"
      >
        <Download size={20} />
        تصدير الآن ({data.length} سجل)
      </button>

      {/* معلومات */}
      <div className="text-xs text-slate-500 dark:text-slate-400 text-center">
        الأعمدة المختارة: {selectedColumns.length} من {availableColumns.length}
      </div>
    </div>
  );
};

export default AdvancedReportExporter;
