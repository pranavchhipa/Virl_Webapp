'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Share2, Copy, Check, Loader2 } from 'lucide-react'

interface ShareLinkButtonProps {
    assetId: string
    projectId: string
    assetName: string
}

export function ShareLinkButton({ assetId, projectId, assetName }: ShareLinkButtonProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [generatedLink, setGeneratedLink] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    // Form state
    const [expiresIn, setExpiresIn] = useState<number | null>(168) // 7 days default
    const [allowComments, setAllowComments] = useState(true)
    const [usePassword, setUsePassword] = useState(false)
    const [password, setPassword] = useState('')

    async function generateLink() {
        setLoading(true)

        try {
            const response = await fetch('/api/review-links', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assetId,
                    projectId,
                    expiresIn,
                    allowComments,
                    password: usePassword ? password : null
                })
            })

            const data = await response.json()

            if (response.ok) {
                setGeneratedLink(data.reviewLink.publicUrl)
                toast.success('Review link generated!')
            } else {
                toast.error(data.error || 'Failed to generate link')
            }
        } catch (error) {
            toast.error('Failed to generate link')
        } finally {
            setLoading(false)
        }
    }

    function copyToClipboard() {
        if (generatedLink) {
            navigator.clipboard.writeText(generatedLink)
            setCopied(true)
            toast.success('Link copied to clipboard!')
            setTimeout(() => setCopied(false), 2000)
        }
    }

    function resetForm() {
        setGeneratedLink(null)
        setCopied(false)
        setExpiresIn(168)
        setAllowComments(true)
        setUsePassword(false)
        setPassword('')
    }

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen)
            if (!isOpen) resetForm()
        }}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                >
                    <Share2 className="h-4 w-4" />
                    Share for Review
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Share for Client Review</DialogTitle>
                    <DialogDescription>
                        Generate a public link for <strong>{assetName}</strong>
                    </DialogDescription>
                </DialogHeader>

                {!generatedLink ? (
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="expires">Link Expiration</Label>
                            <Select
                                value={expiresIn?.toString() || 'never'}
                                onValueChange={(value) => setExpiresIn(value === 'never' ? null : parseInt(value))}
                            >
                                <SelectTrigger id="expires">
                                    <SelectValue placeholder="Select expiration" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="24">24 hours</SelectItem>
                                    <SelectItem value="72">3 days</SelectItem>
                                    <SelectItem value="168">7 days</SelectItem>
                                    <SelectItem value="336">14 days</SelectItem>
                                    <SelectItem value="never">Never expires</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label htmlFor="comments">Allow Comments</Label>
                                <p className="text-sm text-muted-foreground">
                                    Clients can request changes with feedback
                                </p>
                            </div>
                            <Switch
                                id="comments"
                                checked={allowComments}
                                onCheckedChange={setAllowComments}
                            />
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password-toggle">Password Protection</Label>
                                <Switch
                                    id="password-toggle"
                                    checked={usePassword}
                                    onCheckedChange={setUsePassword}
                                />
                            </div>
                            {usePassword && (
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter password"
                                    className="mt-2"
                                />
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 py-4">
                        <div className="flex items-center gap-2">
                            <Input
                                value={generatedLink}
                                readOnly
                                className="font-mono text-sm"
                            />
                            <Button
                                size="icon"
                                variant="outline"
                                onClick={copyToClipboard}
                            >
                                {copied ? (
                                    <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                    <Copy className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                        <div className="rounded-lg bg-muted p-4 text-sm space-y-1">
                            <p><strong>Expires:</strong> {expiresIn ? `In ${expiresIn / 24} days` : 'Never'}</p>
                            <p><strong>Comments:</strong> {allowComments ? 'Enabled' : 'Disabled'}</p>
                            <p><strong>Password:</strong> {usePassword ? 'Protected' : 'None'}</p>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    {!generatedLink ? (
                        <Button
                            onClick={generateLink}
                            disabled={loading || (usePassword && !password)}
                            className="w-full"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Share2 className="mr-2 h-4 w-4" />
                                    Generate Link
                                </>
                            )}
                        </Button>
                    ) : (
                        <div className="flex gap-2 w-full">
                            <Button
                                variant="outline"
                                onClick={resetForm}
                                className="flex-1"
                            >
                                Generate Another
                            </Button>
                            <Button
                                onClick={() => setOpen(false)}
                                className="flex-1"
                            >
                                Done
                            </Button>
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
