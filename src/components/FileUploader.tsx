import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Image as ImageIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface FileUploaderProps {
  files: File[];
  setFiles: (files: File[]) => void;
  onUpload: () => void;
  isProcessing: boolean;
}

export function FileUploader({ files, setFiles, onUpload, isProcessing }: FileUploaderProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles([...files, ...acceptedFiles]);
  }, [files, setFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    disabled: isProcessing,
    multiple: true
  } as any);

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div
        {...getRootProps()}
        className={cn(
          "relative group cursor-pointer border-2 border-dashed rounded-2xl p-12 transition-all duration-300",
          isDragActive ? "border-black bg-black/5" : "border-gray-200 hover:border-black/20 hover:bg-gray-50/50",
          isProcessing && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-black/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <Upload className="w-8 h-8 text-black" />
          </div>
          <div>
            <p className="text-xl font-medium text-black">
              {isDragActive ? "Drop files here" : "Upload your statements"}
            </p>
            <p className="text-gray-500 mt-1">
              Drag & drop PDFs or images, or click to browse
            </p>
          </div>
          <p className="text-xs text-gray-400">
            Supports PDF, PNG, JPG, WEBP (Max 20MB per file)
          </p>
        </div>
      </div>

      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                Queued Files ({files.length})
              </h3>
              <button
                onClick={() => setFiles([])}
                className="text-xs text-red-500 hover:underline"
                disabled={isProcessing}
              >
                Clear all
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {files.map((file, idx) => (
                <motion.div
                  layout
                  key={`${file.name}-${idx}`}
                  className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl shadow-sm"
                >
                  <div className="p-2 bg-gray-50 rounded-lg">
                    {file.type === 'application/pdf' ? (
                      <FileText className="w-5 h-5 text-blue-500" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-purple-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={() => removeFile(idx)}
                    className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>

            <button
              id="upload-btn"
              onClick={onUpload}
              disabled={isProcessing}
              className={cn(
                "w-full mt-6 py-4 bg-black text-white rounded-xl font-medium transition-all text-sm uppercase tracking-widest",
                "hover:bg-black/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-black/10",
                isProcessing && "animate-pulse"
              )}
            >
              {isProcessing 
                ? "Processing Batch..." 
                : files.length > 1 
                  ? `Analyze ${files.length} Documents` 
                  : "Start OCR Extraction"
              }
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
