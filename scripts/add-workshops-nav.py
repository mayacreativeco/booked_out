#!/usr/bin/env python3
"""Add workshops link to desktop nav + mobile hamburger on all content pages."""
import os, re

CONTENT_DIR = os.path.join(os.path.dirname(__file__), '..', 'content')

# --- Stage pages: desktop nav ends with 06_scale link ---
STAGE_DESKTOP_OLD = '      <a href="06_scale-up.html" class="px-3 py-1.5 rounded-sharp text-forest hover:bg-creamDeep">06_scale</a>\n    </nav>'
STAGE_DESKTOP_NEW = '      <a href="06_scale-up.html" class="px-3 py-1.5 rounded-sharp text-forest hover:bg-creamDeep">06_scale</a>\n      <a href="workshops.html" class="px-3 py-1.5 rounded-sharp text-forest hover:bg-creamDeep">workshops</a>\n    </nav>'

# Stage pages where 06_scale is the active (current) page
STAGE_DESKTOP_OLD_ACTIVE = '      <a href="06_scale-up.html" class="px-3 py-1.5 rounded-sharp bg-forest text-cream">06_scale</a>\n    </nav>'
STAGE_DESKTOP_NEW_ACTIVE = '      <a href="06_scale-up.html" class="px-3 py-1.5 rounded-sharp bg-forest text-cream">06_scale</a>\n      <a href="workshops.html" class="px-3 py-1.5 rounded-sharp text-forest hover:bg-creamDeep">workshops</a>\n    </nav>'

# Stage mobile hamburger: 06_scale is last nav item before closing tag
STAGE_MOBILE_OLD = '      <a href="06_scale-up.html" class="px-3 py-2.5 text-cream/80 hover:text-cream hover:bg-white/10 rounded-sharp transition">06_scale</a>\n    </nav>'
STAGE_MOBILE_NEW = '      <a href="06_scale-up.html" class="px-3 py-2.5 text-cream/80 hover:text-cream hover:bg-white/10 rounded-sharp transition">06_scale</a>\n      <a href="workshops.html" class="col-span-2 px-3 py-2.5 text-cream/80 hover:text-cream hover:bg-white/10 rounded-sharp transition">workshops</a>\n    </nav>'

# --- Tools pages: desktop nav ends with 06_bonus link ---
TOOLS_DESKTOP_OLD = '      <a href="06_bonus.html" class="px-3 py-1.5 rounded-sharp text-forest hover:bg-creamDeep">06_bonus</a>\n    </nav>'
TOOLS_DESKTOP_NEW = '      <a href="06_bonus.html" class="px-3 py-1.5 rounded-sharp text-forest hover:bg-creamDeep">06_bonus</a>\n      <a href="workshops.html" class="px-3 py-1.5 rounded-sharp text-forest hover:bg-creamDeep">workshops</a>\n    </nav>'

TOOLS_DESKTOP_OLD_ACTIVE = '      <a href="06_bonus.html" class="px-3 py-1.5 rounded-sharp bg-forest text-cream">06_bonus</a>\n    </nav>'
TOOLS_DESKTOP_NEW_ACTIVE = '      <a href="06_bonus.html" class="px-3 py-1.5 rounded-sharp bg-forest text-cream">06_bonus</a>\n      <a href="workshops.html" class="px-3 py-1.5 rounded-sharp text-forest hover:bg-creamDeep">workshops</a>\n    </nav>'

TOOLS_MOBILE_OLD = '      <a href="06_bonus.html" class="col-span-2 px-3 py-2.5 text-cream/80 hover:text-cream hover:bg-white/10 rounded-sharp transition">06_bonus</a>\n    </nav>'
TOOLS_MOBILE_NEW = '      <a href="06_bonus.html" class="col-span-2 px-3 py-2.5 text-cream/80 hover:text-cream hover:bg-white/10 rounded-sharp transition">06_bonus</a>\n      <a href="workshops.html" class="col-span-2 px-3 py-2.5 text-cream/80 hover:text-cream hover:bg-white/10 rounded-sharp transition">workshops</a>\n    </nav>'

STAGE_FILES = [
    '00_start.html', '01_get-clear.html', '02_get-visible.html',
    '03_get-paid.html', '04_get-booked.html', '05_get-consistent.html', '06_scale-up.html',
]
TOOLS_FILES = [
    '01_tools.html', '02_templates.html', '03_scripts.html',
    '04_videos.html', '05_vault.html', '06_bonus.html',
]

def process(filepath, desktop_old, desktop_new, desktop_old_active, desktop_new_active, mobile_old, mobile_new):
    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()

    if 'href="workshops.html"' in html:
        print(f'  SKIP (already has workshops): {os.path.basename(filepath)}')
        return

    changed = False
    for old, new in [
        (desktop_old, desktop_new),
        (desktop_old_active, desktop_new_active),
        (mobile_old, mobile_new),
    ]:
        if old in html:
            html = html.replace(old, new, 1)
            changed = True

    if changed:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(html)
        print(f'  OK: {os.path.basename(filepath)}')
    else:
        print(f'  WARN (pattern not found): {os.path.basename(filepath)}')

print('Processing stage pages...')
for fname in STAGE_FILES:
    process(
        os.path.join(CONTENT_DIR, fname),
        STAGE_DESKTOP_OLD, STAGE_DESKTOP_NEW,
        STAGE_DESKTOP_OLD_ACTIVE, STAGE_DESKTOP_NEW_ACTIVE,
        STAGE_MOBILE_OLD, STAGE_MOBILE_NEW,
    )

print('Processing tools pages...')
for fname in TOOLS_FILES:
    process(
        os.path.join(CONTENT_DIR, fname),
        TOOLS_DESKTOP_OLD, TOOLS_DESKTOP_NEW,
        TOOLS_DESKTOP_OLD_ACTIVE, TOOLS_DESKTOP_NEW_ACTIVE,
        TOOLS_MOBILE_OLD, TOOLS_MOBILE_NEW,
    )

print('Done.')
