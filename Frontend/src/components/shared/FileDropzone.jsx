import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, FileText, Loader2 } from 'lucide-react';
import apiClient from '../../lib/axios';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';

export function FileDropzone({
  onUploadSuccess,
  accept = '*/*',
  maxSizeMb = 10,
  label = 'Drag files here or click to browse',
  className,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`File size exceeds ${maxSizeMb}MB limit.`);
      return;
    }

    setError(null);
    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await apiClient.post('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data?.data?.url || res.data?.data?.path || '';
      setUploadedUrl(url);
      if (onUploadSuccess) {
        onUploadSuccess(url, file.name);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'File upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={cn(
        'relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer select-none text-center',
        isDragging
          ? 'border-primary bg-primary/5'
          : 'border-border/80 bg-card hover:bg-muted/40 hover:border-border',
        uploadedUrl && 'border-emerald-500/40 bg-emerald-500/5',
        error && 'border-destructive/40 bg-destructive/5',
        className
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
          }
        }}
      />

      {isUploading ? (
        <div className="flex flex-col items-center space-y-2 py-2">
          <Loader2 className="h-6 w-6 text-primary animate-spin" />
          <span className="text-xs text-muted-foreground">Uploading asset...</span>
        </div>
      ) : uploadedUrl ? (
        <div className="flex flex-col items-center space-y-1.5 py-1">
          <CheckCircle2 className="h-7 w-7 text-emerald-500" />
          <span className="text-xs font-semibold text-foreground">File Uploaded</span>
          <span className="text-[10px] text-muted-foreground font-mono truncate max-w-xs">
            {uploadedUrl}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setUploadedUrl(null);
            }}
            className="text-[10px] h-6 px-2 mt-1"
          >
            Replace File
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-2">
          <div className="p-3 rounded-2xl bg-muted/60 text-muted-foreground">
            <UploadCloud className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-foreground">{label}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              Max file size {maxSizeMb}MB
            </div>
          </div>
          {error && (
            <div className="flex items-center gap-1 text-[11px] text-destructive mt-1">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
