"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { MessageSquarePlus } from "lucide-react"
import { FeedbackModal } from "./feedback-modal"

export function FeedbackWidget() {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-[90] flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-md border border-slate-200 text-slate-700 rounded-full shadow-lg hover:bg-white hover:text-purple-600 hover:border-purple-200 transition-colors group"
            >
                <div className="relative">
                    <MessageSquarePlus className="w-4 h-4" />
                    <span className="absolute -top-0.5 -right-0.5 flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-purple-500"></span>
                    </span>
                </div>
                <span className="font-medium text-xs pr-1">Feedback</span>
            </motion.button>

            <FeedbackModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    )
}
