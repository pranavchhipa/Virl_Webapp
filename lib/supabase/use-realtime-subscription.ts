'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface RealtimeSubscriptionProps {
    table: string
    channelName?: string
    filter?: string
    onInsert?: (payload: any) => void
    onUpdate?: (payload: any) => void
    onDelete?: (payload: any) => void
}

export function useRealtimeSubscription({
    table,
    channelName = 'db-changes',
    filter,
    onInsert,
    onUpdate,
    onDelete,
}: RealtimeSubscriptionProps) {
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: table,
                    filter: filter,
                },
                (payload) => {
                    console.log('Realtime INSERT:', payload)
                    onInsert?.(payload.new)
                    router.refresh()
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: table,
                    filter: filter,
                },
                (payload) => {
                    console.log('Realtime UPDATE:', payload)
                    onUpdate?.(payload.new)
                    router.refresh()
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: table,
                    filter: filter,
                },
                (payload) => {
                    console.log('Realtime DELETE:', payload)
                    onDelete?.(payload.old)
                    router.refresh()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase, table, filter, channelName, onInsert, onUpdate, onDelete, router])
}
