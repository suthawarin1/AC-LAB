# Setting Up Supabase for AC Lab Admin Panel

## Overview
Currently, the admin panel saves changes to **localStorage only** (browser storage on that device). To make edits persist to the live website visible to everyone, we'll connect to **Supabase** — a free, open-source Firebase alternative.

## Quick Start (5 minutes)

### Step 1: Create Supabase Project
1. Go to **supabase.com** → Sign up free
2. Create a new project (choose Thailand or nearby region)
3. Wait ~2 minutes for project to initialize
4. Go to **Settings → API** and copy:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **Anon/Public Key** (the long string marked "anon")

### Step 2: Create Database Table
1. In Supabase dashboard, go to **SQL Editor**
2. Click **+ New Query**
3. Paste this entire block and click **Run**:

```sql
-- Create table
create table public.site_content (
  id integer primary key default 1,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now(),
  constraint one_row check (id = 1)
);

-- Insert empty row
insert into public.site_content (id, data) values (1, '{}') 
on conflict do nothing;

-- Enable security
alter table public.site_content enable row level security;

-- Policy 1: Anyone can read (public website)
create policy "public_read" on public.site_content
  for select using (true);

-- Policy 2: Only authenticated users can update
create policy "authenticated_update" on public.site_content
  for update to authenticated
  using (true)
  with check (true);
```

4. Refresh the page — you should see `site_content` table appear in left sidebar

### Step 3: Create Admin Account
1. Go to **Authentication → Users** in left menu
2. Click **+ Add user** (top right)
3. Enter:
   - **Email**: `admin@yourlab.com` (or any email)
   - **Password**: Something secure (e.g., generate one)
   - Check ✓ **Auto Confirm User** (important!)
4. Click **Save** — account is ready immediately

### Step 4: Add Supabase to HTML File
In your `index.html`, find the large `<script>` block near the bottom (the one that starts with `const PROF_IMG=...`).

**At the very top of that script block**, add these 3 lines:

```javascript
// Supabase Configuration (add these first 3 lines)
const SUPA_URL = 'https://xxxxx.supabase.co';  // <- Replace with your URL
const SUPA_KEY = 'eyJhbGc...';                  // <- Replace with your anon key
const ADMIN_EMAIL = 'admin@yourlab.com';        // <- Replace with your admin email
```

Then, **find the line that says `})();` at the very end of the script** and **add this entire block BEFORE it**:

```javascript
/* ===== Supabase Cloud Sync ===== */
if (SUPA_URL && SUPA_URL.indexOf('xxxxx') < 0 && typeof supabase !== 'undefined') {
  const supaClient = supabase.createClient(SUPA_URL, SUPA_KEY);
  
  // Load cloud data on page load
  supaClient
    .from('site_content')
    .select('data')
    .eq('id', 1)
    .single()
    .then(({ data, error }) => {
      if (error || !data?.data) return;
      const cloudData = data.data;
      if (Array.isArray(cloudData.members) && cloudData.members.length) MEMBERS = cloudData.members;
      if (Array.isArray(cloudData.news) && cloudData.news.length) NEWS = cloudData.news;
      if (cloudData.cpubs) CPUBS = cloudData.cpubs;
      if (Array.isArray(cloudData.products) && cloudData.products.length) PRODUCTS = cloudData.products;
      if (Array.isArray(cloudData.videos) && cloudData.videos.length) VIDEOS = cloudData.videos;
      renderProjectTeam();
      renderTeam(teamCat);
      renderNews();
      renderProducts();
      renderVideos();
      renderPubAll();
    });

  // Override saveStore to sync to cloud
  const originalSaveStore = saveStore;
  saveStore = function(silent) {
    const result = originalSaveStore(silent);
    supaClient
      .from('site_content')
      .update({
        data: {
          members: MEMBERS,
          news: NEWS,
          cpubs: CPUBS,
          products: PRODUCTS,
          videos: VIDEOS
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', 1)
      .then(({ error }) => {
        if (error) {
          console.error('Cloud sync error:', error);
          if (!silent) toast('Cloud save failed — are you logged in?');
        } else {
          if (!silent) toast('✓ Saved to cloud');
        }
      });
    return result;
  };

  // Replace admin password with Supabase authentication
  window.tryUnlock = function() {
    const password = document.getElementById('adminPass')?.value || '';
    supaClient.auth
      .signInWithPassword({ email: ADMIN_EMAIL, password })
      .then(({ data, error }) => {
        if (error) {
          toast(lang === 'th' ? 'รหัสไม่ถูกต้อง' : 'Wrong password');
          return;
        }
        adminUnlocked = true;
        document.getElementById('adminLock').style.display = 'none';
        document.getElementById('adminBody').style.display = 'flex';
        renderAdmin('team');
        toast('✓ Logged in');
      });
  };

  // Check if already logged in
  supaClient.auth.getSession().then(({ data }) => {
    if (data?.session) {
      adminUnlocked = true;
    }
  });
}
```

### Step 5: Upload to Hosting
1. Rename `index.html` to the filename you want (or keep it as `index.html`)
2. Upload to any static host:
   - **Netlify**: Drag & drop at netlify.com/drop (free)
   - **Vercel**: Push to GitHub then deploy
   - **GitHub Pages**: Push to `gh-pages` branch
   - **Cloudflare Pages**: Connect GitHub repo

## How It Works Now

✅ **User visits website** → Loads latest data from cloud  
✅ **Admin logs in** → Uses Supabase account (email + password from Step 3)  
✅ **Admin edits content** → Changes appear in browser locally  
✅ **Admin clicks Save** → Changes upload to Supabase **and** stay in localStorage  
✅ **Other users refresh page** → They see the updated content  

## Security Notes

- **Anon key is public** — intentional, for reading only. RLS policies prevent edits.
- **Service role key** — NEVER put in frontend code
- **Authentication-based** — Only your email/password can edit
- **Data is simple JSON** — stored in one table for simplicity

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Not logged in" message | Check email/password in Supabase → Authentication → Users match your tryUnlock call |
| Changes save locally but not to cloud | Check console for errors; verify SUPA_URL/SUPA_KEY are correct |
| Cloud data isn't loading | Check if Supabase status is green (not red) at status.supabase.com |
| Can't find SQL editor | In Supabase dashboard, left sidebar → **Editor** section |

## Alternative: Export/Import (no Supabase needed)

If you prefer not to use Supabase, you can:

1. **Edit locally** in admin panel (changes saved to localStorage)
2. **Export** → Admin panel → Data tab → Export JSON
3. **Update file** → Paste JSON, commit to GitHub, deploy
4. **Next person** → Import that JSON into admin panel, make changes, export again

This works but is manual. Supabase is automated.

---

**Questions?** The admin panel's data structure is:
```javascript
{
  members: [...],
  news: [...],
  cpubs: {...},
  products: [...],
  videos: [...]
}
```
All stored as one JSON document in Supabase for simplicity.
