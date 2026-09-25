#!/usr/bin/env python3
"""
build_site.py — Saare day files ka content ek bundle (content.js) bana do,
taaki web app bina server ke (double-click) bhi chale.
Run: python3 build_site.py
Chahe to markdown files update karne ke baad dobara run karo.
"""
import json
import re
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent   # DevClo/
OUT = ROOT / "web" / "assets" / "content.js"

# (relative path, priority) — web app ke DAYS manifest se match hota hai
FILES = []
for p in sorted(ROOT.glob("day-*.md")):
    FILES.append((p.name, p))
for p in sorted((ROOT / "capstone").glob("day-*.md")):
    FILES.append((f"capstone/{p.name}", p))
for p in sorted((ROOT / "topics").glob("*.md")):
    FILES.append((f"topics/{p.name}", p))
for p in sorted((ROOT / "expanded").glob("*.md")):
    FILES.append((f"expanded/{p.name}", p))
# DevOps Topics Library — 50-day course se alag, topic-based modules
for p in sorted((ROOT / "modules").glob("*.md")):
    FILES.append((f"modules/{p.name}", p))

# Extra files jo landing/help page dikhata hai
FILES += [("today-task.md", ROOT / "today-task.md"),
          ("help-debug.md", ROOT / "help-debug.md"),
          ("README-site.md", ROOT / "README.md")]

# Downloaded images kabhi kabhi markdown ke alawa hoti hain — bas md files chahiye
content = {}
missing = []
for rel, path in FILES:
    if not path.exists():
        missing.append(rel)
        continue
    # normalize CRLF -> LF
    text = path.read_text(encoding="utf-8").replace("\r\n", "\n")
    content[rel] = text

payload = json.dumps(content, ensure_ascii=False, indent=1)
js = "// DEVCLO content bundle — python3 build_site.py se generate hota hai\n"
js += "// ise manually edit mat karo.\n"
js += "window.DEVCLO_CONTENT = " + payload + ";\n"

OUT.write_text(js, encoding="utf-8")
print(f"[OK] {len(content)} files bundled -> {OUT.relative_to(ROOT)}")
if missing:
    print(f"[WARN] nahi mili: {missing}")

# Cache-busting: har build pe index.html me assets ke ?v= ko bump karo,
# taaki browser purana cached content.js/style.css serve na kare.
INDEX = ROOT / "web" / "index.html"
if INDEX.exists():
    from datetime import datetime
    ver = datetime.now().strftime("%H%M%S")
    text = INDEX.read_text(encoding="utf-8")
    text = re.sub(r"(\?v=)\d+", r"\g<1>" + ver, text)
    INDEX.write_text(text, encoding="utf-8")
    print(f"[OK] cache version bumped -> ?v={ver} in index.html")