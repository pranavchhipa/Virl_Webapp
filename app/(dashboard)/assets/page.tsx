import { AssetGallery } from "@/components/assets/asset-gallery"

export default function AssetsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Assets</h2>
                    <p className="text-muted-foreground">Manage your creative assets and media files.</p>
                </div>
            </div>
            <AssetGallery />
        </div>
    )
}
