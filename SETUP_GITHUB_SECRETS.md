# GitHub Secrets Setup for Supabase Migrations

## Required Secrets

You need to add these secrets to your GitHub repository to enable automatic migration deployment:

### 1. SUPABASE_ACCESS_TOKEN
```
sbp_047f186c6c53cc18e95c255febe535f1b40cddd5
```

### 2. SUPABASE_DB_PASSWORD
```
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
```

## How to Add Secrets

### Option A: Via GitHub Web UI (Recommended)
1. Go to: https://github.com/bmbilon/merets/settings/secrets/actions
2. Click **"New repository secret"**
3. Add `SUPABASE_ACCESS_TOKEN` with the value above
4. Click **"Add secret"**
5. Repeat for `SUPABASE_DB_PASSWORD`

### Option B: Via GitHub CLI (if you have admin token)
```bash
cd /home/ubuntu/merets

# Set SUPABASE_ACCESS_TOKEN
echo "sbp_047f186c6c53cc18e95c255febe535f1b40cddd5" | gh secret set SUPABASE_ACCESS_TOKEN

# Set SUPABASE_DB_PASSWORD
echo "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" | gh secret set SUPABASE_DB_PASSWORD
```

## How It Works

Once secrets are set:

1. **Create a migration file** in `supabase/migrations/` with timestamp naming:
   ```
   supabase/migrations/20260103_fix_decimal_overflow.sql
   ```

2. **Commit and push to main**:
   ```bash
   git add supabase/migrations/
   git commit -m "Fix DECIMAL overflow in triggers"
   git push origin main
   ```

3. **GitHub Actions automatically**:
   - Links to your Supabase project
   - Applies all pending migrations
   - Reports success/failure

## Testing the Workflow

After setting secrets, you can manually trigger the workflow:
1. Go to: https://github.com/bmbilon/merets/actions/workflows/supabase-migrations.yml
2. Click **"Run workflow"**
3. Select branch: `main`
4. Click **"Run workflow"**

## Migration File Naming Convention

Use timestamp-based naming for migrations:
```
YYYYMMDD_HHMMSS_description.sql
```

Examples:
- `20260103_120000_fix_decimal_overflow.sql`
- `20260103_130000_audit_triggers.sql`

## Current Status

✅ Workflow file created: `.github/workflows/supabase-migrations.yml`
✅ Supabase config created: `supabase/config.toml`
⏳ **ACTION REQUIRED**: Add GitHub secrets via web UI
