-- Add custom limit columns to workspaces table for granular overrides
ALTER TABLE public.workspaces 
ADD COLUMN IF NOT EXISTS custom_storage_limit BIGINT, -- In Bytes (to match file sizes)
ADD COLUMN IF NOT EXISTS custom_member_limit INTEGER,
ADD COLUMN IF NOT EXISTS custom_workspace_limit INTEGER,
ADD COLUMN IF NOT EXISTS custom_vixi_spark_limit INTEGER;

-- Comment on columns for clarity
COMMENT ON COLUMN public.workspaces.custom_storage_limit IS 'Override for storage limit in Bytes. If NULL, use plan default.';
COMMENT ON COLUMN public.workspaces.custom_member_limit IS 'Override for member limit. If NULL, use plan default.';
COMMENT ON COLUMN public.workspaces.custom_workspace_limit IS 'Override for workspace creation limit. If NULL, use plan default.';
COMMENT ON COLUMN public.workspaces.custom_vixi_spark_limit IS 'Override for monthly Vixi spark limit. If NULL, use plan default.';
