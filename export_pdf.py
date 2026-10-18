"""Export a PDF and check page integrity using a standalone Chrome renderer."""
from pathlib import Path
import json, os, re, shutil, subprocess, tempfile

root=Path(__file__).resolve().parent
chrome=os.environ.get('CHROME_BIN') or next((p for p in [shutil.which('google-chrome'),shutil.which('chromium'),'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'] if p and Path(p).exists()),None)
if not chrome: raise SystemExit('Chrome is required to export PDF. Set CHROME_BIN to its executable.')
with tempfile.TemporaryDirectory(prefix='vibe-book-pdf-') as profile:
    result=subprocess.run([chrome,'--headless','--no-first-run','--disable-extensions','--disable-dev-shm-usage',f'--user-data-dir={profile}','--window-size=1440,1000','--virtual-time-budget=3000','--run-all-compositor-stages-before-draw','--dump-dom',f'--print-to-pdf={root}/dist/guidebook.pdf','--no-pdf-header-footer',(root/'dist/index.html').as_uri()],capture_output=True,text=True,timeout=60)
    found=re.search(r'<script type="application/json" id="ebook-audit">(.*?)</script>',result.stdout,re.S)
    if result.returncode or not found: raise SystemExit('Rendering failed:\n'+result.stderr[-3000:])
    report=json.loads(found[1])
    (root/'render-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
    if report['contentMismatches'] or report['layoutOverflow']: raise SystemExit('Page verification failed: '+json.dumps(report,ensure_ascii=False))
    if not (root/'dist/guidebook.pdf').is_file(): raise SystemExit('PDF was not created.')
    print(f"Verified {report['pages']} pages: no missing blocks or clipped body text.")
