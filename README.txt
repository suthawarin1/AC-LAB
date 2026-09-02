THE AC LAB — MAIN WEBSITE + INNOVATION PORTFOLIO + AWARDS SUBWEBSITE
===================================================================

Folder structure
----------------
/index.html
/portfolio/index.html
/awards/index.html
/awards/assets/...

The three websites are designed as one AC Lab ecosystem.
Both subwebs include a Main website button and use the same design language as the main page.

MANAGER BUTTONS
---------------
Main website:
- Manager button in the top navigation
- Manager item in the mobile menu
- Floating Manager button at the lower-left corner

Innovation Portfolio / Patents:
- Manager button in the top navigation
- Floating Manager button at the lower-left corner
- Manager contains Dashboard, IP records and Products
- IP Manager supports:
  * Granted petty patent / อนุสิทธิบัตร
  * Petty-patent application / คำขออนุสิทธิบัตร
  * Granted patent / สิทธิบัตร
  * Patent application / คำขอสิทธิบัตร

Awards subwebsite:
- Manager button in the top navigation
- Floating Manager button at the lower-left corner
- Right-side drawer visually matched to the main website Manager
- Add / edit / delete awards
- Separate award-photo upload and shield/plaque upload
- Mixed records are supported: photo + shield, photo only, shield only, or text only

SHARED SUPABASE
---------------
All websites use the SAME Supabase project:
  nmzwvxdegtfartbhoixx

Primary website CMS/source of truth:
  public.site_content
  id = 1

Portfolio data:
  site_content.data.ipAssets
  site_content.data.products

Awards data:
  site_content.data.awards

Theme shared by all sites:
  site_content.data.theme

Safe save flow:
1. Admin signs in using Supabase Authentication.
2. Manager fetches the latest site_content.data JSON.
3. It changes only its own key(s).
4. It merges the JSON and updates site_content id = 1.
5. Other main-site fields are preserved.

NORMALIZED MIRRORS
------------------
For easier SQL queries/reporting, Manager also mirrors:
  IP records  -> public.ip_assets
  Awards      -> public.awards

These are in the SAME Supabase project, not a separate database.

SQL FILES
---------
supabase.sql
  Full AC Lab database setup.

supabase_ip_petty_patents.sql
  Self-contained SQL for the Patent / Petty Patent Manager.
  Includes shared site_content setup + ip_assets + RLS + 13 current records + views.

supabase_awards.sql
  Self-contained SQL for Awards Manager.
  Includes shared site_content setup + awards table + RLS.

SECURITY
--------
- Browser code uses only the Supabase publishable key.
- Never put service_role keys in HTML/JavaScript.
- Public users receive read access where required.
- Insert/update/delete access is limited to authenticated users through RLS.
- Manager authentication uses the same Supabase Authentication project as the main website.
- Cloudflare Turnstile uses the same verification flow as the main website.

THEME
-----
The Awards subwebsite now follows the main AC Lab visual system:
- Fraunces / Noto Serif Thai headings
- Inter / IBM Plex Sans Thai body text
- IBM Plex Mono utility text
- Same Forest theme variables
- Same Ocean / Amber / Berry / Slate presets
- Same light/dark system
- Same rounded cards, spacing, navigation and Manager visual language

The Awards page reads site_content.data.theme so a Manager theme change on the main website
is reflected by the Awards subwebsite on its next cloud load.
