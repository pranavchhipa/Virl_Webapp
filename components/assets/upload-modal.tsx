"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Upload, X, File as FileIcon } from "lucide-react";

interface UploadModalProps {
    projectId: string;
    onUploadComplete?: () => void;
}

export function UploadModal({ projectId, onUploadComplete }: UploadModalProps) {
    const [open, setOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [assignee, setAssignee] = useState<string>("");
    const [instructions, setInstructions] = useState("");
    const [members, setMembers] = useState<any[]>([]);
    const [uploading, setUploading] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        if (open) {
            fetchMembers();
        }
    }, [open, projectId]);

    const fetchMembers = async () => {
        // Fetch members of the workspace this project belongs to
        // 1. Get project workspace_id
        const { data: project } = await supabase
            .from('projects')
            .select('workspace_id')
            .eq('id', projectId)
            .single();

        if (!project) return;

        // 2. Get members
        const { data: memberData } = await supabase
            .from('workspace_members')
            .select('user_id, role, profiles(full_name, id)')
            .eq('workspace_id', project.workspace_id);

        if (memberData) {
            setMembers(memberData.map(m => m.profiles).filter(Boolean));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            toast.error("Please select a file");
            return;
        }

        setUploading(true);
        try {
            const user = (await supabase.auth.getUser()).data.user;
            if (!user) throw new Error("Not authenticated");

            // 1. Upload to Cloudflare R2
            const { uploadFileToR2 } = await import('@/lib/r2-client');
            const result = await uploadFileToR2(file, projectId);

            if (!result.success) {
                throw new Error(result.error || 'Upload failed');
            }

            // 2. Create Asset Record with R2 key
            const { error: dbError } = await supabase
                .from('assets')
                .insert({
                    project_id: projectId,
                    uploader_id: user.id,
                    assigned_to: assignee || null,
                    file_name: file.name,
                    file_path: result.key, // R2 object key
                    file_type: file.type.split('/')[0], // 'video' or 'image'
                    status: 'pending'
                });

            if (dbError) throw dbError;

            // 3. (Optional) Create Comment with Instructions
            if (instructions) {
                // Logic to add comment related to this asset would go here
                // For now, we skip or store it if schema supported 'description' directly
            }

            toast.success("Asset uploaded successfully");
            setOpen(false);
            setFile(null);
            setInstructions("");
            onUploadComplete?.();

        } catch (error: any) {
            console.error("Upload failed", error);
            toast.error(error.message || "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-brand-gradient">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Asset
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Upload New Asset</DialogTitle>
                    <DialogDescription>
                        Add files to this project and assign them for review.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {/* Drag & Drop Area (simplified as input) */}
                    <div className="flex items-center justify-center w-full">
                        <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors">
                            {file ? (
                                <div className="flex flex-col items-center pt-5 pb-6">
                                    <FileIcon className="w-8 h-8 mb-2 text-primary" />
                                    <p className="text-sm text-gray-500 font-semibold">{file.name}</p>
                                    <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center pt-5 pb-6">
                                    <Upload className="w-8 h-8 mb-3 text-gray-400" />
                                    <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                    <p className="text-xs text-gray-500">Video, Image, or Audio</p>
                                </div>
                            )}
                            <input id="dropzone-file" type="file" className="hidden" onChange={handleFileChange} />
                        </label>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="assign" className="text-right">
                            Assign To
                        </Label>
                        <Select onValueChange={setAssignee} value={assignee}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select team member" />
                            </SelectTrigger>
                            <SelectContent>
                                {members.map((m: any) => (
                                    <SelectItem key={m.id} value={m.id}>
                                        {m.full_name || "Unknown"}
                                    </SelectItem>
                                ))}
                                {members.length === 0 && (
                                    <SelectItem value="none" disabled>No members found</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="instructions">Instructions</Label>
                        <Textarea
                            id="instructions"
                            placeholder="Add notes for the editor..."
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleUpload} disabled={uploading}>
                        {uploading ? "Uploading..." : "Save & Notify"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
