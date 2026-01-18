import { Rocket, Shield, Play, Zap } from "lucide-react"

export function AuthHero() {
    return (
        <div className="hidden lg:flex w-[55%] bg-[#7c3aed] relative flex-col justify-between p-12 overflow-hidden h-screen sticky top-0">
            {/* Top Badges */}
            <div className="flex justify-end gap-3 relative z-10">
                <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 text-white text-xs font-semibold tracking-wide">
                    <Rocket className="w-3.5 h-3.5" /> BETA ACCESS
                </div>
                <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 text-white text-xs font-semibold tracking-wide">
                    <Shield className="w-3.5 h-3.5" /> ENTERPRISE READY
                </div>
            </div>

            {/* Floating Mockup */}
            <div className="relative z-10 flex-1 flex items-center justify-center">
                {/* Main Card */}
                <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-4 rotate-[-2deg] hover:rotate-0 transition-transform duration-500 ease-out">
                    {/* Browser Bar */}
                    <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                        </div>
                        <div className="flex-1 bg-slate-50 rounded-md h-5 ml-2" />
                    </div>

                    {/* Video Content */}
                    <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden group">
                        {/* Fake Play Button */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                            </div>
                        </div>
                        {/* Progress Bar */}
                        <div className="absolute bottom-4 left-4 right-4 h-1 bg-white/30 rounded-full overflow-hidden">
                            <div className="h-full w-2/3 bg-violet-500 rounded-full" />
                        </div>

                        {/* Floating Tooltip - Inside Video Removed as per user request */}
                    </div>

                    {/* Card Footer */}
                    <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">Q3</div>
                            <div>
                                <div className="text-slate-900 text-sm font-bold">Marketing Campaign</div>
                                <div className="text-slate-400 text-xs">Edited 2 mins ago</div>
                            </div>
                        </div>
                        <div className="bg-emerald-500 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm shadow-emerald-200">APPROVED</div>
                    </div>

                    {/* Floating Tooltip - Positioned for Float Cover Animation */}
                    <div className="absolute -bottom-20 -right-4 bg-white rounded-xl shadow-xl p-3 flex items-center gap-3 animate-float-cover shadow-violet-900/20 border border-slate-100 z-50">
                        <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center text-yellow-600">
                            <Zap className="w-4 h-4 fill-yellow-600" />
                        </div>
                        <div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Speed</div>
                            <div className="text-slate-900 text-xs font-bold">Lightning Fast</div>
                        </div>
                    </div>
                </div>

                {/* Background Elements */}
                <div className="absolute -z-10 bg-indigo-500/30 rounded-full blur-3xl w-72 h-72 -top-10 -left-10" />
            </div>

            {/* Bottom Content */}
            <div className="relative z-10 mt-8">
                <h2 className="text-3xl font-bold text-white mb-2">Your content, organized.</h2>
                <p className="text-indigo-200 text-base max-w-sm">From ideation to approval — all in one place. Streamline your video workflow with Virl's intelligent management system.</p>
            </div>

            {/* Background Pattern */}
            <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        </div>
    )
}
