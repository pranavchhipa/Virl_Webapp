"use client";

import * as React from "react";
import { Check, ChevronsUpDown, PlusCircle, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
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
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

type Workspace = {
    id: string;
    name: string;
};

export function WorkspaceSwitcher({ className }: { className?: string }) {
    const [open, setOpen] = useState(false);
    const [showNewWorkspaceDialog, setShowNewWorkspaceDialog] = useState(false);
    const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [newWorkspaceName, setNewWorkspaceName] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const supabase = createClient();

    // Get workspace ID from URL
    const urlWorkspaceId = searchParams.get('workspace');

    useEffect(() => {
        const fetchWorkspaces = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setWorkspaces([{ id: 'guest', name: 'Guest Workspace' }]);
                setSelectedWorkspace({ id: 'guest', name: 'Guest Workspace' });
                return;
            };

            const { data, error } = await supabase
                .from('workspaces')
                .select('id, name')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching workspaces:', error);
                return;
            }

            if (data) {
                setWorkspaces(data);

                // Determine selected workspace based on URL or Default
                if (urlWorkspaceId) {
                    const match = data.find(w => w.id === urlWorkspaceId);
                    if (match) {
                        setSelectedWorkspace(match);
                    } else if (data.length > 0) {
                        // URL has invalid ID, fallback to first
                        handleWorkspaceChange(data[0]);
                    }
                } else if (data.length > 0) {
                    // No URL param, set first one
                    handleWorkspaceChange(data[0]);
                }
            }
        };

        fetchWorkspaces();
    }, [urlWorkspaceId]); // Re-run if URL changes (though mostly handled by internal logic)

    const handleWorkspaceChange = (workspace: Workspace) => {
        setSelectedWorkspace(workspace);
        setOpen(false);

        // Update URL
        const params = new URLSearchParams(searchParams.toString());
        params.set('workspace', workspace.id);

        // Preserve other params if needed, or simple replacement
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleCreateWorkspace = async () => {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            toast.error("You must be logged in to create a workspace");
            setIsLoading(false);
            return;
        }

        try {
            // 1. Create Workspace
            const { data: workspaceData, error: workspaceError } = await supabase
                .from('workspaces')
                .insert({ name: newWorkspaceName, owner_id: user.id })
                .select()
                .single();

            if (workspaceError) throw workspaceError;

            // 2. Add creator as member
            const { error: memberError } = await supabase
                .from('workspace_members')
                .insert({
                    workspace_id: workspaceData.id,
                    user_id: user.id,
                    role: 'owner'
                });

            if (memberError) throw memberError;

            // Success
            setWorkspaces([workspaceData, ...workspaces]);
            setNewWorkspaceName("");
            setShowNewWorkspaceDialog(false);
            toast.success("Workspace created successfully");

            // Switch to new workspace
            handleWorkspaceChange(workspaceData);

        } catch (error: any) {
            console.error('Error creating workspace:', error);
            toast.error(error.message || "Failed to create workspace");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={showNewWorkspaceDialog} onOpenChange={setShowNewWorkspaceDialog}>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        aria-label="Select a workspace"
                        className={cn("w-full justify-between", className)}
                    >
                        <Avatar className="mr-2 h-5 w-5">
                            <AvatarImage
                                src={`https://avatar.vercel.sh/${selectedWorkspace?.id}.png`}
                                alt={selectedWorkspace?.name}
                            />
                            <AvatarFallback>WS</AvatarFallback>
                        </Avatar>
                        <span className="truncate max-w-[120px]">
                            {selectedWorkspace?.name || "Select workspace"}
                        </span>
                        <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                    <Command>
                        <CommandList>
                            <CommandInput placeholder="Search workspace..." />
                            <CommandEmpty>No workspace found.</CommandEmpty>
                            <CommandGroup heading="Workspaces">
                                {workspaces.map((workspace) => (
                                    <CommandItem
                                        key={workspace.id}
                                        onSelect={() => handleWorkspaceChange(workspace)}
                                        className="text-sm cursor-pointer"
                                    >
                                        <Avatar className="mr-2 h-5 w-5">
                                            <AvatarImage
                                                src={`https://avatar.vercel.sh/${workspace.id}.png`}
                                                alt={workspace.name}
                                                className="grayscale"
                                            />
                                            <AvatarFallback>WS</AvatarFallback>
                                        </Avatar>
                                        <span className="truncate">{workspace.name}</span>
                                        <Check
                                            className={cn(
                                                "ml-auto h-4 w-4",
                                                selectedWorkspace?.id === workspace.id
                                                    ? "opacity-100"
                                                    : "opacity-0"
                                            )}
                                        />
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                        <CommandSeparator />
                        <CommandList>
                            <CommandGroup>
                                <DialogTrigger asChild>
                                    <CommandItem
                                        onSelect={() => {
                                            setOpen(false);
                                            setShowNewWorkspaceDialog(true);
                                        }}
                                        className="cursor-pointer"
                                    >
                                        <PlusCircle className="mr-2 h-5 w-5" />
                                        Create Workspace
                                    </CommandItem>
                                </DialogTrigger>
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create workspace</DialogTitle>
                    <DialogDescription>
                        Add a new workspace to manage products and customers.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2 pb-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Workspace name</Label>
                        <Input
                            id="name"
                            placeholder="Acme Inc."
                            value={newWorkspaceName}
                            onChange={(e) => setNewWorkspaceName(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setShowNewWorkspaceDialog(false)}>
                        Cancel
                    </Button>
                    <Button type="submit" onClick={handleCreateWorkspace} disabled={isLoading}>
                        {isLoading ? "Creating..." : "Create & Switch"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
