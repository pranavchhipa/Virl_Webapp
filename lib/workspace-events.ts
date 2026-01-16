/**
 * Workspace Event Bus
 * Simple event emitter for real-time workspace state synchronization
 */

type WorkspaceEvent = 'workspace-updated' | 'workspace-switched' | 'project-updated' | 'project-created' | 'project-deleted'

type Listener = (data?: any) => void

class WorkspaceEventBus {
    private listeners = new Map<WorkspaceEvent, Set<Listener>>()

    on(event: WorkspaceEvent, callback: Listener): () => void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set())
        }
        this.listeners.get(event)!.add(callback)

        // Return unsubscribe function
        return () => {
            this.listeners.get(event)?.delete(callback)
        }
    }

    // Alias for compatibility
    subscribe(event: WorkspaceEvent, callback: Listener): () => void {
        return this.on(event, callback)
    }

    emit(event: WorkspaceEvent, data?: any) {
        this.listeners.get(event)?.forEach(cb => cb(data))
    }

    clear() {
        this.listeners.clear()
    }
}

export const workspaceEvents = new WorkspaceEventBus()
