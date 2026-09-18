DevOps 30-Day Roadmap — Web App
=================================

Ye web app pehle se ready hai. Koi installation, hosting ya server ki
zaroorat NAHI hai.

KAISE KHOLEN
------------
Option 1 (sabse aasan):
    index.html pe DOUBLE-CLICK karo  → browser mein khul jayega

Option 2 (command se):
    ./launch

Option 3 (server chahye ho toh bhi chalta hai):
    cd .. && python3 -m http.server 8080
    browser mein: http://localhost:8080/web/


Features
--------
- Sidebar mein saare 30 days (4 weeks + Capstone)
- Har day: Concept, Mermaid diagram, ASCII diagram, Copy-paste Demo, Lab
- Progressive checklists — day auto-complete, progress bar
  (browser ke localStorage mein save hota hai)
- Kuch bhi server nahi chahiye, internet bhi zaroori nahi (images sirf online)

FILES
-----
index.html          main app
assets/app.js       app logic
assets/content.js   SAARE day files bundeled (generate hota hai)
assets/style.css    styling
assets/vendor/      marked, mermaid, highlight.js (local, offline)
build_site.py       content.js REGENERATE karne ke liye

MARKDOWN UPDATE KARNE KE BAAD
-----------------------------
Agar day-XX-*.md files mein kuch badlo, toh bundle dobara banao:

    python3 build_site.py

Phir browser ko refresh (F5) karo. Yehi sab kuch hai.