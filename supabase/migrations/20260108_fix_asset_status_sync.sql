-- Fix RLS for asset status updates from review feedback
-- This allows the client_feedback submission to update asset status

-- Create a function to update asset status (bypasses RLS)
CREATE OR REPLACE FUNCTION update_asset_status_on_feedback()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' THEN
        UPDATE assets 
        SET status = 'approved'
        WHERE id = (
            SELECT asset_id FROM review_links WHERE id = NEW.review_link_id
        );
    ELSIF NEW.status = 'changes_requested' THEN
        UPDATE assets 
        SET status = 'changes_requested'
        WHERE id = (
            SELECT asset_id FROM review_links WHERE id = NEW.review_link_id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update asset status when feedback is inserted
DROP TRIGGER IF EXISTS update_asset_status_trigger ON client_feedback;
CREATE TRIGGER update_asset_status_trigger
    AFTER INSERT ON client_feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_asset_status_on_feedback();
