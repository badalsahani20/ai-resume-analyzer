import { useState, useCallback } from 'react';
import { useDropzone, type DropzoneOptions } from 'react-dropzone';
import { formatSize } from '~/lib/utils';

interface FileUploaderProps {
    onFileSelect: (file: File | null) => void;
    acceptedFileTypes?: Record<string, string[]>;
    maxSizeInMB?: number;
}

const FileUploader = ({ 
    onFileSelect, 
    acceptedFileTypes = { 'application/pdf': ['.pdf'] },
    maxSizeInMB = 20
}: FileUploaderProps) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);

    const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
        setError(null);
        
        // Handle file rejections
        if (fileRejections.length > 0) {
            const rejection = fileRejections[0];
            if (rejection.errors.some((e: any) => e.code === 'file-too-large')) {
                setError(`File is too large. Max size is ${maxSizeInMB}MB`);
            } else if (rejection.errors.some((e: any) => e.code === 'file-invalid-type')) {
                setError('Invalid file type. Please upload a PDF file.');
            } else {
                setError('Error uploading file. Please try again.');
            }
            onFileSelect(null);
            return;
        }

        const file = acceptedFiles[0] || null;
        setSelectedFile(file);
        onFileSelect(file);
    }, [onFileSelect, maxSizeInMB]);

    const maxFileSize = maxSizeInMB * 1024 * 1024;

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: false,
        accept: acceptedFileTypes,
        maxSize: maxFileSize,
    } as DropzoneOptions);

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedFile(null);
        setError(null);
        onFileSelect(null);
    };

    return (
        <div className="w-full gradient-border">
            <div 
                {...getRootProps()} 
                className={`w-full ${isDragActive ? 'bg-gray-50' : ''}`}
            >
                <input {...getInputProps()} />
                <div className="space-y-4 cursor-pointer">
                    {selectedFile ? (
                        <div className="uploader-selected-file" onClick={(e) => e.stopPropagation()}>
                            <img src="/images/pdf.png" alt="pdf" className="size-10" />
                            <div className="flex items-center space-x-3">
                                <div>
                                    <p className="text-sm font-medium text-gray-700 truncate max-w-xs" title={selectedFile.name}>
                                        {selectedFile.name}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {formatSize(selectedFile.size)}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="p-2 cursor-pointer hover:bg-gray-100 rounded"
                                onClick={handleRemove}
                                aria-label="Remove file"
                            >
                                <img src="/icons/cross.svg" alt="remove" className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="p-6 text-center">
                            <div className="mx-auto w-16 h-16 flex items-center justify-center mb-2">
                                <img 
                                    src="/icons/info.svg" 
                                    alt="Upload resume" 
                                    className="size-20" 
                                />
                            </div>
                            <p className="text-lg text-gray-500">
                                <span className="font-semibold">
                                    Click to upload
                                </span> or drag and drop
                            </p>
                            <p className="text-sm text-gray-500">
                                PDF (max {formatSize(maxFileSize)})
                            </p>
                        </div>
                    )}
                    {error && (
                        <p className="text-red-500 text-sm mt-2 text-center">
                            {error}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FileUploader;