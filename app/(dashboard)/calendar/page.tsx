'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CalendarView } from '@/components/calendar/CalendarView'
import { BulkScheduler } from '@/components/calendar/BulkScheduler'
import { CalendarAnalytics } from '@/components/calendar/CalendarAnalytics'
import { createClient } from '@/lib/supabase/client'
import { CalendarAsset } from '@/lib/calendar/platforms'
import { useCalendarFilters, filterAssets } from '@/lib/calendar/use-calendar-filters'
import { useRealtimeSubscription } from '@/lib/supabase/use-realtime-subscription'
import { Loader2, Info } from 'lucide-react'
import { toast } from 'sonner'

export default function GlobalCalendarPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const workspaceIdParam = searchParams.get('workspace')

    const [assets, setAssets] = useState<CalendarAsset[]>([])
    const [loading, setLoading] = useState(true)
    const [userRole, setUserRole] = useState<'owner' | 'admin' | 'member'>('member')
    const [availableProjects, setAvailableProjects] = useState<any[]>([])
    const [showBulkScheduler, setShowBulkScheduler] = useState(false)
    const [showAnalytics, setShowAnalytics] = useState(false)
    const [workspaceName, setWorkspaceName] = useState('')
    const [teamMembers, setTeamMembers] = useState<{ id: string, name: string }[]>([])

    const supabase = createClient()

    // Filter hook
    const {
        filters,
        setPlatform,
        setStatus,
        setMemberId,
        setSearchQuery,
        setDateRange,
        clearFilters,
        applyFilters,
        hasActiveFilters,
        activeFilterCount,
    } = useCalendarFilters()

    // Apply filters to assets
    const filteredAssets = filterAssets(assets, filters)

    // Real-time subscription
    useRealtimeSubscription({
        table: 'assets',
        channelName: 'calendar-assets',
        onInsert: (newAsset) => {
            setAssets(prev => [...prev, newAsset as CalendarAsset])
            toast.info('New content added', {
                description: 'The calendar has been updated'
            })
        },
        onUpdate: (updatedAsset) => {
            setAssets(prev => prev.map(a =>
                a.id === updatedAsset.id ? { ...a, ...updatedAsset } as CalendarAsset : a
            ))
        },
        onDelete: (deletedAsset) => {
            setAssets(prev => prev.filter(a => a.id !== deletedAsset.id))
        }
    })

    useEffect(() => {
        loadCalendarData()
    }, [workspaceIdParam]) // Re-load when workspace changes

    async function loadCalendarData() {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            let workspaceId: string | null = null
            let workspaceName = 'Workspace'
            let role: 'owner' | 'admin' | 'member' = 'member'

            // 1. Priority: URL Param
            if (workspaceIdParam) {
                const { data: membership } = await supabase
                    .from('workspace_members')
                    .select('role, workspace_id, workspaces(name)')
                    .eq('user_id', user.id)
                    .eq('workspace_id', workspaceIdParam)
                    .maybeSingle()

                if (membership) {
                    workspaceId = membership.workspace_id
                    workspaceName = (membership as any).workspaces?.name || 'Workspace'
                    role = membership.role as any
                }
            }

            // 2. Fallback: Default Workspace Logic (only if no URL param or access denied)
            if (!workspaceId) {
                // Try to get first workspace
                const { data: membership } = await supabase
                    .from('workspace_members')
                    .select('role, workspace_id, workspaces(name)')
                    .eq('user_id', user.id)
                    .limit(1)
                    .maybeSingle()

                if (membership) {
                    workspaceId = membership.workspace_id
                    workspaceName = (membership as any).workspaces?.name || 'Workspace'
                    role = membership.role as any
                } else {
                    // Check if owner of any workspace (edge case where not in members table?)
                    const { data: ownedWorkspace } = await supabase
                        .from('workspaces')
                        .select('id, name')
                        .eq('owner_id', user.id)
                        .limit(1)
                        .maybeSingle()

                    if (ownedWorkspace) {
                        workspaceId = ownedWorkspace.id
                        workspaceName = ownedWorkspace.name
                        role = 'owner'
                    }
                }
            }

            // 3. Fallback: First project's workspace (Legacy)
            if (!workspaceId) {
                const { data: userProjects } = await supabase
                    .from('project_members')
                    .select('projects(id, name, workspace_id)')
                    .eq('user_id', user.id)
                    .limit(1)

                if (userProjects && userProjects.length > 0) {
                    const project = (userProjects[0] as any).projects
                    workspaceId = project.workspace_id
                    role = 'member'
                }
            }

            setUserRole(role)
            setWorkspaceName(workspaceName)

            // Load team members for filter dropdown
            if (workspaceId) {
                const { data: members } = await supabase
                    .from('workspace_members')
                    .select('user_id, profiles(id, full_name)')
                    .eq('workspace_id', workspaceId)

                if (members) {
                    setTeamMembers(members.map((m: any) => ({
                        id: m.user_id,
                        name: m.profiles?.full_name || 'Unknown'
                    })))
                }
            }

            const isOwnerOrAdmin = role === 'owner' || role === 'admin'

            if (workspaceId && isOwnerOrAdmin) {
                // OWNERS/ADMINS: Get all workspace projects
                const { data: projects } = await supabase
                    .from('projects')
                    .select('id, name')
                    .eq('workspace_id', workspaceId)
                    .order('name')

                setAvailableProjects(projects || [])

                // Get ALL assets from workspace (scheduled + unscheduled for bulk scheduler)
                const { data: allAssets } = await supabase
                    .from('assets')
                    .select(`
            id,
            file_name,
            file_path,
            file_type,
            thumbnail_url,
            scheduled_date,
            scheduled_time,
            platform,
            status,
            assigned_to,
            uploader_id,
            created_at,
            platform_specific,
            posting_notes,
            project_id,
            projects!inner (
              id,
              name,
              workspace_id
            )
          `)
                    .eq('projects.workspace_id', workspaceId)
                    .order('created_at', { ascending: false })

                setAssets(allAssets || [])
            } else {
                // MEMBERS: Get only their projects
                const { data: memberProjects } = await supabase
                    .from('project_members')
                    .select(`
            projects (
              id,
              name
            )
          `)
                    .eq('user_id', user.id)

                const projects = memberProjects?.map((mp: any) => mp.projects).filter(Boolean) || []
                setAvailableProjects(projects)

                // Get ALL assets from their projects (scheduled + unscheduled)
                if (projects.length > 0) {
                    const projectIds = projects.map((p: any) => p.id)

                    const { data: myAssets } = await supabase
                        .from('assets')
                        .select(`
              id,
              file_name,
              file_path,
              file_type,
              thumbnail_url,
              scheduled_date,
              scheduled_time,
              platform,
              status,
              assigned_to,
              uploader_id,
              created_at,
              platform_specific,
              posting_notes,
              project_id,
              projects (
                id,
                name
              )
            `)
                        .in('project_id', projectIds)
                        .order('created_at', { ascending: false })

                    setAssets(myAssets || [])
                }
            }
        } catch (error) {
            console.error('Error loading calendar:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleUpdateSchedule(assetId: string, date: Date, time?: string) {
        // Use format() to preserve local date, toISOString() shifts to UTC which can cause date issues
        const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

        const response = await fetch('/api/calendar/schedule', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                assetId,
                scheduledDate: formattedDate,
                scheduledTime: time,
            }),
        })

        if (!response.ok) {
            throw new Error('Failed to update schedule')
        }

        await loadCalendarData()
    }

    async function handleBulkSchedule(schedules: { assetId: string; date: Date; time: string }[]) {
        await Promise.all(
            schedules.map(async (schedule) => {
                // Use local date formatting to avoid timezone shift
                const formattedDate = `${schedule.date.getFullYear()}-${String(schedule.date.getMonth() + 1).padStart(2, '0')}-${String(schedule.date.getDate()).padStart(2, '0')}`

                const response = await fetch('/api/calendar/schedule', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        assetId: schedule.assetId,
                        scheduledDate: formattedDate,
                        scheduledTime: schedule.time,
                        platform: 'instagram',
                    }),
                })

                if (!response.ok) {
                    throw new Error(`Failed to schedule asset ${schedule.assetId}`)
                }
            })
        )

        await loadCalendarData()
    }

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    const isOwnerOrAdmin = userRole === 'owner' || userRole === 'admin'

    const handleUnschedule = async (assetId: string) => {
        try {
            const { error } = await supabase
                .from('assets')
                .update({
                    scheduled_date: null,
                    scheduled_time: null,
                    status: 'pending' // Reset status to pending when unscheduled
                })
                .eq('id', assetId)

            if (error) throw error

            // Optimistic update
            setAssets(prev => prev.map(a =>
                a.id === assetId
                    ? { ...a, scheduled_date: null as any, scheduled_time: null as any, status: 'pending' as const }
                    : a
            ))

            toast.success('Post unscheduled', {
                description: 'Moved back to unscheduled list'
            })
        } catch (error) {
            toast.error('Failed to unschedule post')
            console.error(error)
        }
    }

    const handleDelete = async (assetId: string) => {
        try {
            const { error } = await supabase
                .from('assets')
                .delete()
                .eq('id', assetId)

            if (error) throw error

            // Optimistic update
            setAssets(prev => prev.filter(a => a.id !== assetId))

            toast.success('Post deleted')
        } catch (error) {
            toast.error('Failed to delete post')
            console.error(error)
        }
    }

    return (
        <div className="h-full flex flex-col p-6 space-y-4 overflow-hidden bg-[#F8FAFC]">
            {availableProjects.length === 0 ? (
                <div className="flex items-center justify-center h-96 border-2 border-dashed rounded-lg">
                    <div className="text-center text-muted-foreground">
                        <p className="text-lg font-medium mb-2">No projects available</p>
                        <p className="text-sm">You need to be assigned to projects to use the calendar.</p>
                    </div>
                </div>
            ) : (
                <>
                    <CalendarView
                        projectId="all"
                        assets={filteredAssets}
                        onUpdateSchedule={handleUpdateSchedule}
                        onBulkSchedule={() => setShowBulkScheduler(true)}
                        onCreatePost={() => {
                            toast.info('Select a Project to Schedule', {
                                description: 'Please select a project to upload and schedule content.'
                            })
                            router.push('/projects')
                        }}
                        onShowAnalytics={() => setShowAnalytics(true)}
                        // Filter props
                        filters={filters}
                        onPlatformChange={setPlatform}
                        onStatusChange={setStatus}
                        onMemberChange={setMemberId}
                        onSearchChange={setSearchQuery}
                        onDateRangeChange={setDateRange}
                        onClearFilters={clearFilters}
                        onApplyPreset={applyFilters}
                        hasActiveFilters={hasActiveFilters}
                        activeFilterCount={activeFilterCount}
                        teamMembers={teamMembers}
                        projectCount={availableProjects.length}
                        onUnschedule={handleUnschedule}
                        onDelete={handleDelete}
                    />

                    <BulkScheduler
                        open={showBulkScheduler}
                        onOpenChange={setShowBulkScheduler}
                        assets={assets.filter(a => !a.scheduled_date)}
                        onSchedule={handleBulkSchedule}
                    />

                    <CalendarAnalytics
                        assets={assets}
                        open={showAnalytics}
                        onOpenChange={setShowAnalytics}
                    />
                </>
            )}
        </div>
    )
}
