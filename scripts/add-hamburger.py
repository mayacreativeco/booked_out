#!/usr/bin/env python3
"""Add hamburger mobile nav to all content HTML files."""
import os, re

CONTENT_DIR = os.path.join(os.path.dirname(__file__), '..', 'content')

HAMBURGER_BTN = '''      <div class="flex items-center gap-3">
        <a href="mailto:support@mayaherring.com" class="hidden lg:inline-block text-xs font-mono text-forest border border-forest px-3 py-1.5 rounded-sharp hover:bg-forest hover:text-cream transition">support</a>
        <button id="menuBtn" class="lg:hidden flex items-center justify-center w-9 h-9 rounded-sharp hover:bg-creamDeep transition" aria-label="Open menu" aria-expanded="false">
          <svg id="menuIcon" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#1B3A2F" stroke-width="2" stroke-linecap="round">
            <line x1="3" y1="5" x2="17" y2="5"/><line x1="3" y1="10" x2="17" y2="10"/><line x1="3" y1="15" x2="17" y2="15"/>
          </svg>
        </button>
      </div>'''

MOBILE_NAV_STAGE = '''<!-- Mobile nav -->
<div id="mobileNav" class="hidden lg:hidden bg-forestDeep border-b-2 border-forest sticky top-[57px] z-30">
  <div class="max-w-6xl mx-auto px-6 py-5">
    <nav class="grid grid-cols-2 gap-y-1 gap-x-2 font-mono text-sm mb-4">
      <a href="index.html" class="px-3 py-2.5 text-cream/80 hover:text-cream hover:bg-white/10 rounded-sharp transition">hub</a>
      <a href="00_start.html" class="px-3 py-2.5 text-cream/80 hover:text-cream hover:bg-white/10 rounded-sharp transition">start</a>
      <a href="01_get-clear.html" class="px-3 py-2.5 text-cream/80 hover:text-cream hover:bg-white/10 rounded-sharp transition">01_clear</a>
      <a href="02_get-visible.html" class="px-3 py-2.5 text-cream/80 hover:text-cream hover:bg-white/10 rounded-sharp transition">02_visible</a>
      <a href="03_get-paid.html" class="px-3 py-2.5 text-cream/80 hover:text-cream hover:bg-white/10 rounded-sharp transition">03_paid</a>
      <a href="04_get-booked.html" class="px-3 py-2.5 text-cream/80 hover:text-cream hover:bg-white/10 rounded-sharp transition">04_booked</a>
      <a href="05_get-consistent.html" class="px-3 py-2.5 text-cream/80 hover:text-cream hover:bg-white/10 rounded-sharp transition">05_consistent</a>
      <a href="06_scale-up.html" class="px-3 py-2.5 text-cream/80 hover:text-cream hover:bg-white/10 rounded-sharp transition">06_scale</a>
    </nav>
    <div class="border-t border-white/10 pt-3">
      <a href="mailto:support@mayaherring.com" class="font-mono text-xs text-cream/50 hover:text-cream transition">support@mayaherring.com</a>
    </div>
  </div>
</div>'''

MOBILE_NAV_TOOLS = '''<!-- Mobile nav -->
<div id="mobileNav" class="hidden lg:hidden bg-forestDeep border-b-2 border-forest sticky top-[57px] z-30">
  <div class="max-w-6xl mx-auto px-6 py-5">
    <nav class="grid grid-cols-2 gap-y-1 gap-x-2 font-mono text-sm mb-4">
      <a href="index.html" class="px-3 py-2.5 text-cream/80 hover:text-cream hover:bg-white/10 rounded-sharp transition">hub</a>
      <a href="01_tools.html" class="px-3 py-2.5 text-cream/80 hover:text-cream hover:bg-white/10 rounded-sharp transition">01_tools</a>
      <a href="02_templates.html" class="px-3 py-2.5 text-cream/80 hover:text-cream hover:bg-white/10 rounded-sharp transition">02_templates</a>
      <a href="03_scripts.html" class="px-3 py-2.5 text-cream/80 hover:text-cream hover:bg-white/10 rounded-sharp transition">03_scripts</a>
      <a href="04_videos.html" class="px-3 py-2.5 text-cream/80 hover:text-cream hover:bg-white/10 rounded-sharp transition">04_videos</a>
      <a href="05_vault.html" class="px-3 py-2.5 text-cream/80 hover:text-cream hover:bg-white/10 rounded-sharp transition">05_vault</a>
      <a href="06_bonus.html" class="col-span-2 px-3 py-2.5 text-cream/80 hover:text-cream hover:bg-white/10 rounded-sharp transition">06_bonus</a>
    </nav>
    <div class="border-t border-white/10 pt-3">
      <a href="mailto:support@mayaherring.com" class="font-mono text-xs text-cream/50 hover:text-cream transition">support@mayaherring.com</a>
    </div>
  </div>
</div>'''

HAMBURGER_JS = '''
<!-- Hamburger toggle -->
<script>
(function() {
  var btn = document.getElementById('menuBtn');
  var nav = document.getElementById('mobileNav');
  if (!btn || !nav) return;
  var ICON_OPEN  = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#1B3A2F" stroke-width="2" stroke-linecap="round"><line x1="3" y1="5" x2="17" y2="5"/><line x1="3" y1="10" x2="17" y2="10"/><line x1="3" y1="15" x2="17" y2="15"/></svg>';
  var ICON_CLOSE = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#1B3A2F" stroke-width="2" stroke-linecap="round"><line x1="4" y1="4" x2="16" y2="16"/><line x1="16" y1="4" x2="4" y2="16"/></svg>';
  btn.addEventListener('click', function() {
    var nowHidden = nav.classList.toggle('hidden');
    var isOpen = !nowHidden;
    btn.setAttribute('aria-expanded', String(isOpen));
    btn.innerHTML = isOpen ? ICON_CLOSE : ICON_OPEN;
  });
  // Close when navigating
  nav.querySelectorAll('a').forEach(function(a) {
    a.addEventListener('click', function() {
      nav.classList.add('hidden');
      btn.setAttribute('aria-expanded', 'false');
      btn.innerHTML = ICON_OPEN;
    });
  });
})();
</script>'''

# Files that use stage nav
STAGE_FILES = [
    'index.html', '00_start.html', '01_get-clear.html', '02_get-visible.html',
    '03_get-paid.html', '04_get-booked.html', '05_get-consistent.html', '06_scale-up.html',
]
# Files that use tools nav
TOOLS_FILES = [
    '01_tools.html', '02_templates.html', '03_scripts.html',
    '04_videos.html', '05_vault.html', '06_bonus.html',
]

def process_file(filepath, mobile_nav):
    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()

    # Skip if already has hamburger
    if 'menuBtn' in html:
        print(f'  SKIP (already has hamburger): {os.path.basename(filepath)}')
        return

    # 1. Replace the support link (hidden sm:inline-block → hidden lg:inline-block + add hamburger btn)
    #    Both the correct email and the old wrong email versions
    for old_support in [
        '    <a href="mailto:support@mayaherring.com" class="hidden sm:inline-block text-xs font-mono text-forest border border-forest px-3 py-1.5 rounded-sharp hover:bg-forest hover:text-cream transition">support</a>',
        '    <a href="mailto:hello@collegarestudio.com" class="hidden sm:inline-block text-xs font-mono text-forest border border-forest px-3 py-1.5 rounded-sharp hover:bg-forest hover:text-cream transition">support</a>',
    ]:
        if old_support in html:
            html = html.replace(old_support, HAMBURGER_BTN)
            break

    # 2. Insert mobile nav after </header>
    html = html.replace('</header>\n', '</header>\n\n' + mobile_nav + '\n', 1)

    # 3. Insert hamburger JS before </body>
    html = html.replace('</body>', HAMBURGER_JS + '\n</body>', 1)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f'  OK: {os.path.basename(filepath)}')

print('Processing stage pages...')
for fname in STAGE_FILES:
    process_file(os.path.join(CONTENT_DIR, fname), MOBILE_NAV_STAGE)

print('Processing tools pages...')
for fname in TOOLS_FILES:
    process_file(os.path.join(CONTENT_DIR, fname), MOBILE_NAV_TOOLS)

print('Done.')
