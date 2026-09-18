import io

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, HRFlowable, ListFlowable, ListItem
)

ACCENT = colors.HexColor("#1a1a2e")
GRAY = colors.HexColor("#555555")


def _base_styles():
    name = ParagraphStyle(
        "name", fontName="Helvetica-Bold", fontSize=20, leading=24,
        textColor=colors.black, spaceAfter=2,
    )
    title = ParagraphStyle(
        "title", fontName="Helvetica", fontSize=12, leading=15,
        textColor=GRAY, spaceAfter=4,
    )
    contact = ParagraphStyle(
        "contact", fontName="Helvetica", fontSize=9.5, leading=13,
        textColor=colors.black, spaceAfter=6,
    )
    section = ParagraphStyle(
        "section", fontName="Helvetica-Bold", fontSize=12.5, leading=15,
        textColor=ACCENT, spaceBefore=10, spaceAfter=4,
    )
    role = ParagraphStyle(
        "role", fontName="Helvetica", fontSize=11, leading=14,
        textColor=colors.black, spaceBefore=6, spaceAfter=1,
    )
    org = ParagraphStyle(
        "org", fontName="Helvetica-Bold", fontSize=10.5, leading=13,
        textColor=colors.black, spaceAfter=1,
    )
    dates = ParagraphStyle(
        "dates", fontName="Helvetica-Oblique", fontSize=9.5, leading=13,
        textColor=GRAY, spaceAfter=3,
    )
    bullet = ParagraphStyle(
        "bullet", fontName="Helvetica", fontSize=10, leading=13.5,
        textColor=colors.black, spaceAfter=2, leftIndent=14,
    )
    normal = ParagraphStyle(
        "normal", fontName="Helvetica", fontSize=10, leading=13.5,
        textColor=colors.black, spaceAfter=2,
    )
    return name, title, contact, section, role, org, dates, bullet, normal


def _esc(text):
    return (text or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def _fmt_date_range(start, end):
    return f"{start or ''} - {end or ''}".strip(" -")


def build_pdf(data):
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=letter,
        leftMargin=0.7 * inch, rightMargin=0.7 * inch,
        topMargin=0.6 * inch, bottomMargin=0.6 * inch,
        title=f"{data.get('name', 'Resume')} - Resume",
    )
    (name_s, title_s, contact_s, section_s,
     role_s, org_s, dates_s, bullet_s, normal_s) = _base_styles()

    story = []

    story.append(Paragraph(_esc(data.get("name", "")), name_s))
    if data.get("job_title"):
        story.append(Paragraph(_esc(data["job_title"]), title_s))
    contact_parts = [p for p in [
        data.get("email"), data.get("phone"),
        data.get("location"), data.get("linkedin"), data.get("github"),
    ] if p]
    if contact_parts:
        story.append(Paragraph(" | ".join(_esc(p) for p in contact_parts), contact_s))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.black, spaceAfter=6))

    if data.get("summary"):
        story.append(Paragraph("SUMMARY", section_s))
        story.append(Paragraph(_esc(data["summary"]), normal_s))

    skills = [s.strip() for s in data.get("skills", []) if s.strip()]
    if skills:
        story.append(Paragraph("SKILLS", section_s))
        story.append(Paragraph(_esc(", ".join(skills)), normal_s))

    exp = data.get("experience", [])
    if exp:
        story.append(Paragraph("WORK EXPERIENCE", section_s))
        for e in exp:
            if e.get("role"):
                story.append(Paragraph(_esc(e["role"]), role_s))
            org_line = " - ".join(str(x) for x in [e.get("company"), _fmt_date_range(e.get("start"), e.get("end"))] if x)
            if org_line:
                story.append(Paragraph(_esc(org_line), org_s))
            bullets = [b for b in e.get("bullets", []) if b.strip()]
            if bullets:
                items = [ListItem(Paragraph(_esc(b), normal_s), leftIndent=0) for b in bullets]
                story.append(ListFlowable(
                    items, bulletType="bullet", bulletFontName="Helvetica",
                    bulletFontSize=10, leftIndent=12, spaceAfter=4, start="bulletchar",
                ))

    projects = data.get("projects") or []
    if projects:
        story.append(Paragraph("KEY PROJECTS", section_s))
        if isinstance(projects, list):
            for p in projects:
                head = " - ".join(str(x) for x in [p.get("name"), p.get("meta")] if x)
                if head:
                    story.append(Paragraph(_esc(head), org_s))
                pbullets = [b for b in p.get("bullets", []) if b.strip()]
                if pbullets:
                    pitems = [ListItem(Paragraph(_esc(b), normal_s), leftIndent=0) for b in pbullets]
                    story.append(ListFlowable(
                        pitems, bulletType="bullet", bulletFontName="Helvetica",
                        bulletFontSize=10, leftIndent=12, spaceAfter=4, start="bulletchar",
                    ))
        else:
            story.append(Paragraph(_esc(str(projects)), normal_s))

    edu = data.get("education", [])
    if edu:
        story.append(Paragraph("EDUCATION", section_s))
        for e in edu:
            line = " - ".join(str(x) for x in [
                e.get("degree"), _fmt_date_range(e.get("start"), e.get("end")),
            ] if x)
            if e.get("institution") and line:
                story.append(Paragraph(f"{_esc(e['institution'])} &mdash; {_esc(line)}", org_s))
            elif e.get("institution"):
                story.append(Paragraph(_esc(e["institution"]), org_s))
            else:
                story.append(Paragraph(_esc(line), org_s))

    certs = [c.strip() for c in data.get("certifications", []) if c.strip()]
    if certs:
        story.append(Paragraph("CERTIFICATIONS", section_s))
        story.append(Paragraph("<br/>".join("&#8226; " + _esc(c) for c in certs), normal_s))

    doc.build(story)
    return buf.getvalue()