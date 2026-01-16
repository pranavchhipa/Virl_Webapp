'use client'

import { useState } from "react"
import { Trash2, Loader2 } from "lucide-react"
import { deleteFeedback } from "@/app/actions/feedback"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function DeleteFeedbackButton({ id }: { id: string }) {
    const [isDeleting, setIsDeleting] = useState(false)
    const router = useRouter()

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this feedback?")) return

        setIsDeleting(true)
        const result = await deleteFeedback(id)

        if (result.success) {
            toast.success("Feedback deleted successfully")
            router.refresh()
        } else {
            toast.error(result.error || "Failed to delete feedback")
        }
        setIsDeleting(false)
    }

    return (
        <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            title="Delete Feedback"
        >
            {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <Trash2 className="h-4 w-4" />
            )}
        </button>
    )
}
