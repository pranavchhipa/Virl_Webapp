
"use client"

import { useCallback, useState, useEffect } from 'react'
import { useDropzone, type Accept } from 'react-dropzone'
import { UploadCloud, File, Loader2, Video, Image as ImageIcon, Music, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface UploadZoneProps {
    projectId: string;
    onUploadComplete?: () => void;
}

export function UploadZone({ projectId, onUploadComplete }: UploadZoneProps) {
    const [uploading, setUploading] = useState(false);
    const [showTypeModal, setShowTypeModal] = useState(false);
    const [fileType, setFileType] = useState<'video' | 'image' | 'audio' | 'doc' | null>(null);

    // Dynamic accept attribute based on selection
    // Dynamic accept attribute based on selection
    const accept: Accept | undefined = fileType === 'video' ? { 'video/*': [] }
        : fileType === 'image' ? { 'image/*': [] }
            : fileType === 'audio' ? { 'audio/*': [] }
                : fileType === 'doc' ? { 'application/pdf': [], 'application/msword': [], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [] }
                    : undefined;

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        setUploading(true);
        // Process files one by one
        for (const file of acceptedFiles) {
            console.log("Uploading", file.name);

            // Determine type if not manually selected (for Drag & Drop)
            let type = fileType;
            if (!type) {
                if (file.type.startsWith('image/')) type = 'image';
                else if (file.type.startsWith('video/')) type = 'video';
                else if (file.type.startsWith('audio/')) type = 'audio';
                else type = 'doc';
            }

            // Simulate upload (In real app: Supabase Storage)
            await new Promise(resolve => setTimeout(resolve, 800));

            // Call API
            try {
                await fetch('/api/assets/upload', {
                    method: 'POST',
                    body: JSON.stringify({
                        filename: file.name,
                        uploaderName: 'Demo User',
                        projectId,
                        fileType: type // Pass derived or selected type
                    })
                });
                toast.success(`Uploaded ${file.name}`)
            } catch (e) {
                console.error("Failed to notify", e);
                toast.error(`Failed to upload ${file.name}`)
            }
        }
        setUploading(false);
        setFileType(null); // Reset
        onUploadComplete?.();
    }, [projectId, onUploadComplete, fileType]);

    const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
        onDrop,
        accept,
        noClick: true, // Disable default click to show modal first
        onFileDialogCancel: () => setFileType(null)
    })

    // Trigger file picker when type changes
    // We utilize a simple effect or just call open() inside the state setter's callback if possible, 
    // but React state is async. 
    // Effect approach:
    useEffect(() => {
        if (fileType) {
            open();
        }
    }, [fileType, open]);

    const handleTypeSelect = (type: 'video' | 'image' | 'audio' | 'doc') => {
        setFileType(type);
        setShowTypeModal(false);
        // Effect will trigger open()
    };

    return (
        <div className="w-full">
            {/* Desktop Drag and Drop */}
            <div
                {...getRootProps()}
                onClick={() => setShowTypeModal(true)}
                className={cn(
                    "hidden md:flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative",
                    isDragActive ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-300 dark:border-gray-700"
                )}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                    {uploading ? (
                        <Loader2 className="w-10 h-10 mb-3 text-gray-400 animate-spin" />
                    ) : (
                        <UploadCloud className="w-10 h-10 mb-3 text-gray-400" />
                    )}
                    {uploading ? (
                        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">Uploading...</p>
                    ) : (
                        <>
                            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Video, Image, Audio or Docs</p>
                        </>
                    )}
                </div>
            </div>

            {/* Mobile Button View */}
            <div className="md:hidden w-full">
                <div {...getRootProps()} className="w-full">
                    <input {...getInputProps()} />
                    <Button type="button" onClick={() => setShowTypeModal(true)} className="w-full" disabled={uploading}>
                        {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                        {uploading ? 'Uploading...' : 'Select File'}
                    </Button>
                </div>
            </div>

            {/* File Type Selection Modal */}
            <Dialog open={showTypeModal} onOpenChange={setShowTypeModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Select Asset Type</DialogTitle>
                        <DialogDescription>
                            What kind of file are you uploading?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                        <Button variant="outline" className="h-24 flex flex-col gap-2 hover:border-purple-500 hover:bg-purple-50" onClick={() => handleTypeSelect('video')}>
                            <Video className="h-8 w-8 text-purple-600" />
                            <span>Video</span>
                        </Button>
                        <Button variant="outline" className="h-24 flex flex-col gap-2 hover:border-pink-500 hover:bg-pink-50" onClick={() => handleTypeSelect('image')}>
                            <ImageIcon className="h-8 w-8 text-pink-600" />
                            <span>Image</span>
                        </Button>
                        <Button variant="outline" className="h-24 flex flex-col gap-2 hover:border-blue-500 hover:bg-blue-50" onClick={() => handleTypeSelect('audio')}>
                            <Music className="h-8 w-8 text-blue-600" />
                            <span>Audio</span>
                        </Button>
                        <Button variant="outline" className="h-24 flex flex-col gap-2 hover:border-orange-500 hover:bg-orange-50" onClick={() => handleTypeSelect('doc')}>
                            <FileText className="h-8 w-8 text-orange-600" />
                            <span>Document</span>
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
