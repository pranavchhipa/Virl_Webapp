'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Loader2, Lock, Mail, User, FileText, Check } from "lucide-react"

export default function ProfileSettingsPage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<any>(null)

    // Form State
    const [fullName, setFullName] = useState("")
    const [bio, setBio] = useState("")

    useEffect(() => {
        getProfile()
    }, [])

    async function getProfile() {
        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) return

            setUser(user)

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            if (error && error.code !== 'PGRST116') {
                throw error
            }

            if (data) {
                setProfile(data)
                setFullName(data.full_name || "")
                setBio(data.bio || "")
            }
        } catch (error) {
            console.error('Error loading user data!', error)
        } finally {
            setLoading(false)
        }
    }

    async function updateProfile() {
        try {
            setSaving(true)
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: fullName,
                    bio: bio,
                })
                .eq('id', user?.id)

            if (error) throw error
            toast.success("Profile updated successfully")
        } catch (error) {
            toast.error("Error updating profile")
        } finally {
            setSaving(false)
        }
    }

    async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
        try {
            setSaving(true)
            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('You must select an image to upload.')
            }

            const file = event.target.files[0]
            const fileExt = file.name.split('.').pop()
            const filePath = `${user.id}-${Math.random()}.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file)

            if (uploadError) {
                throw uploadError
            }

            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)

            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    avatar_url: publicUrl,
                })
                .eq('id', user.id)

            if (updateError) {
                throw updateError
            }

            setProfile({ ...profile, avatar_url: publicUrl })
            toast.success("Avatar updated")
        } catch (error: any) {
            toast.error(`Error uploading avatar: ${error.message}`)
        } finally {
            setSaving(false)
        }
    }

    async function removeAvatar() {
        try {
            setSaving(true)
            const { error } = await supabase
                .from('profiles')
                .update({ avatar_url: null })
                .eq('id', user.id)

            if (error) throw error
            setProfile({ ...profile, avatar_url: null })
            toast.success("Avatar removed")
        } catch (error) {
            toast.error("Error removing avatar")
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 className="h-10 w-10 animate-spin text-violet-600 mx-auto" />
                    <p className="text-sm text-slate-500">Loading your profile...</p>
                </div>
            </div>
        )
    }

    const bioLength = bio.length
    const maxBioLength = 240

    return (
        <div className="space-y-6">
            {/* Profile Picture Section */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="flex items-center gap-5">
                    <div className="relative">
                        <Avatar className="h-16 w-16 ring-2 ring-slate-100">
                            <AvatarImage src={profile?.avatar_url} />
                            <AvatarFallback className="text-lg bg-gradient-to-br from-sky-400 to-blue-500 text-white font-semibold">
                                {fullName?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <label
                            htmlFor="avatar-upload"
                            className="absolute -bottom-1 -right-1 w-6 h-6 bg-violet-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-violet-700 transition-colors shadow-lg"
                        >
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </label>
                        <input
                            type="file"
                            id="avatar-upload"
                            accept="image/*"
                            className="hidden"
                            onChange={uploadAvatar}
                            disabled={saving}
                        />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-base font-semibold text-slate-900">Profile Picture</h3>
                            <span className="text-xs text-violet-600 font-medium">Visible to team members</span>
                        </div>
                        <p className="text-sm text-slate-500 mb-3">
                            Upload a new avatar. Recommended size 400x400px.
                        </p>
                        <div className="flex items-center gap-3">
                            <label
                                htmlFor="avatar-upload-btn"
                                className="text-sm font-medium text-violet-600 hover:text-violet-700 cursor-pointer"
                            >
                                Upload new photo
                            </label>
                            <input
                                type="file"
                                id="avatar-upload-btn"
                                accept="image/*"
                                className="hidden"
                                onChange={uploadAvatar}
                                disabled={saving}
                            />
                            <span className="text-slate-300">|</span>
                            <button
                                onClick={removeAvatar}
                                className="text-sm font-medium text-slate-500 hover:text-slate-700"
                                disabled={saving || !profile?.avatar_url}
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Email Address Section */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                        <Mail className="w-4 h-4 text-slate-600" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-900">Email Address</h3>
                </div>
                <div className="relative">
                    <Input
                        value={user?.email}
                        disabled
                        className="pr-10 bg-white border-slate-200 text-slate-700"
                        style={{ backgroundColor: 'white' }}
                    />
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
                <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center">
                        <span className="text-[10px]">i</span>
                    </span>
                    Email cannot be changed for security reasons. Please contact support if you need assistance.
                </p>
            </div>

            {/* Display Name Section */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                        <User className="w-4 h-4 text-slate-600" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-900">Display Name</h3>
                </div>
                <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your display name"
                    className="bg-white border-slate-200"
                    style={{ backgroundColor: 'white' }}
                />
                <p className="text-xs text-slate-500 mt-2">
                    This name will be displayed to your team and on your public profile.
                </p>
            </div>

            {/* Bio Section */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-slate-600" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-900">Bio</h3>
                </div>
                <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value.slice(0, maxBioLength))}
                    placeholder="Product Designer based in San Francisco. Passionate about building clean and usable interfaces."
                    rows={3}
                    className="bg-white border-slate-200 resize-none"
                    style={{ backgroundColor: 'white' }}
                />
                <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-slate-500">
                        Brief description for your profile.
                    </p>
                    <span className="text-xs text-slate-400">
                        {bioLength}/{maxBioLength}
                    </span>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                    variant="outline"
                    className="h-10 px-5 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
                    onClick={() => {
                        setFullName(profile?.full_name || "")
                        setBio(profile?.bio || "")
                    }}
                >
                    Cancel
                </Button>
                <Button
                    onClick={updateProfile}
                    disabled={saving}
                    className="h-10 px-5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium shadow-lg shadow-violet-200"
                >
                    {saving ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Check className="h-4 w-4 mr-2" />
                            Save Changes
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}
