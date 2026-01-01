-- Grant execute permission to anon users for claim_marketplace_task
GRANT EXECUTE ON FUNCTION claim_marketplace_task(UUID, UUID, TEXT) TO anon;

-- Also ensure get_marketplace_tasks is available to anon
GRANT EXECUTE ON FUNCTION get_marketplace_tasks TO anon;
