import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { PlayCircle, Zap, Video, TrendingUp } from "lucide-react"

export type ViralIdea = {
    hook_visual: string
    hook_audio: string
    script_outline: string[]
    caption: string
    virality_score: number
    estimated_views: string
}

interface IdeaCardProps {
    idea: ViralIdea
    onRefine: (instruction: string) => void
    onCreateProject: (idea: ViralIdea) => void
}

export function IdeaCard({ idea, onRefine, onCreateProject }: IdeaCardProps) {
    return (
        <Card className="w-full md:w-[420px] border-purple-200/50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500" />

            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        Viral Score: {idea.virality_score}/100
                    </Badge>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                        {idea.estimated_views} views
                    </Badge>
                </div>
                <CardTitle className="text-lg mt-3 flex items-center gap-2 group-hover:text-purple-700 transition-colors">
                    <Video className="h-5 w-5 text-pink-500" />
                    Viral Concept
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 text-sm">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700 space-y-2">
                    <div className="grid grid-cols-[80px_1fr] gap-2 items-start">
                        <span className="font-bold text-xs text-purple-600 uppercase tracking-wider flex items-center gap-1">
                            <Zap className="h-3 w-3" /> Visual
                        </span>
                        <span className="text-slate-700 dark:text-slate-300 leading-snug">{idea.hook_visual}</span>
                    </div>
                    <Separator className="bg-slate-200 dark:bg-slate-700" />
                    <div className="grid grid-cols-[80px_1fr] gap-2 items-start">
                        <span className="font-bold text-xs text-pink-600 uppercase tracking-wider flex items-center gap-1">
                            <PlayCircle className="h-3 w-3" /> Audio
                        </span>
                        <span className="italic text-slate-600 dark:text-slate-400">"{idea.hook_audio}"</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <span className="font-semibold text-xs text-slate-500 uppercase tracking-wider block">Script Outline</span>
                    <ul className="space-y-1.5">
                        {idea.script_outline.map((step, i) => (
                            <li key={i} className="flex gap-2 text-slate-700 dark:text-slate-300 text-xs">
                                <span className="text-purple-400 font-mono select-none">•</span>
                                {step}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded text-xs border border-slate-100 dark:border-slate-700">
                    <p className="font-bold text-slate-500 mb-1">Suggested Caption</p>
                    <p className="text-slate-600 dark:text-slate-400 font-mono">{idea.caption}</p>
                </div>
            </CardContent>

            <CardFooter className="flex gap-2 pt-2 pb-4">
                <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-7 text-xs px-2 text-slate-500 hover:text-purple-600" onClick={() => onRefine("Make it shorter")}>
                        Shorter
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs px-2 text-slate-500 hover:text-pink-600" onClick={() => onRefine("Focus on strong hook")}>
                        Better Hook
                    </Button>
                </div>
                <Button size="sm" className="h-8 text-xs ml-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all" onClick={() => onCreateProject(idea)}>
                    🚀 Launch Project
                </Button>
            </CardFooter>
        </Card>
    )
}
