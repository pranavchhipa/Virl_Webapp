'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type Task = {
    id: string
    project_id: string
    title: string
    description?: string
    status: 'todo' | 'in-progress' | 'review' | 'done'
    assignee_id?: string
    due_date?: string
    position: number
    profiles?: {
        full_name: string
        avatar_url: string
    }
}

export async function getTasks(projectId: string) {
    const supabase = await createClient()

    const { data: tasks, error } = await supabase
        .from('tasks')
        .select(`
            *,
            profiles:assigned_to (
                full_name,
                avatar_url
            )
        `)
        .eq('project_id', projectId)
        .order('position', { ascending: true })

    if (error) {
        console.error('Error fetching tasks:', error)
        return []
    }

    return tasks as Task[]
}

export async function createTask(projectId: string, title: string, status: string = 'todo', description?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    // Get max position to append to end
    const { data: maxPosData } = await supabase
        .from('tasks')
        .select('position')
        .eq('project_id', projectId)
        .eq('status', status)
        .order('position', { ascending: false })
        .limit(1)
        .single()

    const newPosition = (maxPosData?.position || 0) + 1

    const { data, error } = await supabase
        .from('tasks')
        .insert({
            project_id: projectId,
            title,
            description: description || null,
            status,
            position: newPosition,
            assigned_to: user.id
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating task:', error)
        return { error: error.message }
    }

    revalidatePath(`/projects/${projectId}/kanban`)
    return { success: true, task: data }
}

export async function updateTaskStatus(taskId: string, newStatus: string, newPosition: number, projectId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('tasks')
        .update({
            status: newStatus,
            position: newPosition
        })
        .eq('id', taskId)

    if (error) {
        console.error('Error updating task status:', error)
        return { error: error.message }
    }

    revalidatePath(`/projects/${projectId}/kanban`)
    return { success: true }
}
