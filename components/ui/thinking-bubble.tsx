'use client'

import { motion } from "framer-motion"
import { Sparkles, Brain } from "lucide-react"

export function ThinkingBubble() {
    return (
        <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-purple-100 to-white flex items-center justify-center border border-purple-200 shadow-sm mt-1">
                <Brain className="h-4 w-4 text-purple-600 animate-pulse" />
            </div>
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm px-4 py-3 rounded-2xl rounded-tl-none shadow-sm border border-purple-100 dark:border-slate-800 flex items-center gap-3">
                <span className="text-xs font-semibold text-purple-800 dark:text-purple-300">Virl is thinking</span>
                <div className="flex gap-1">
                    {[0, 1, 2].map((dot) => (
                        <motion.div
                            key={dot}
                            className="w-1.5 h-1.5 bg-purple-500 rounded-full"
                            animate={{
                                y: ["0%", "-50%", "0%"],
                                opacity: [0.4, 1, 0.4]
                            }}
                            transition={{
                                duration: 0.8,
                                repeat: Infinity,
                                delay: dot * 0.2,
                                ease: "easeInOut"
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}
