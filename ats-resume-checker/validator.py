import io
import re

import pdfplumber

STOPWORDS = set("""
the a an and or of to in for on with as is are was were be been being by at from
we you they he she it this that these those have has had will would can could may
should must do does did not no but if then than so such only just about into over
job jobs work working role roles position positions candidate candidates applicant
applicants company companies team teams experience experiences responsibility
responsibilities requirement requirements required preferred qualifications
qualification skills skills skill must nice year years month months new best great good
strong relevant ideal summary responsibilities about our us youll youre we're apply
come join plus able ability someone looking live life please see want looking build
doing things thing make made day days part full time remote hybrid onsite location
usa uk india etc sdet qa automation engineer seeking skilled strong proficiency
building maintaining familiarity containerized collaboration communication plus ability
willing look join wanting environment organization excellent demonstrated proven track
record passion continuous problem-solving problemsolving multiple cross-functional
""".split())

SECTION_LABELS = {
    "summary": ["PROFILE SUMMARY", "SUMMARY", "PROFESSIONAL SUMMARY", "PROFILE", "OBJECTIVE"],
    "skills": ["SKILLS", "TECHNICAL SKILLS", "CORE COMPETENCIES"],
    "experience": ["PROFESSIONAL EXPERIENCE", "WORK EXPERIENCE", "EMPLOYMENT HISTORY", "EXPERIENCE", "EMPLOYMENT"],
    "education": ["EDUCATION", "ACADEMIC BACKGROUND"],
    "certifications": ["CERTIFICATIONS", "CERTIFICATION", "LICENSES & CERTIFICATIONS"],
    "projects": ["PROJECTS", "PERSONAL PROJECTS", "ACADEMIC PROJECTS"],
}

PLATFORM_MODELS = {
    "workday": {
        "name": "Workday", "weights": {"keyword": 0.50, "placement": 0.10, "sections": 0.20, "parse": 0.15, "relevance": 0.05},
        "match": "exact", "note": "Prefer DOCX. Contact stripped from headers. Two-column layouts scramble.",
    },
    "taleo": {
        "name": "Oracle Taleo", "weights": {"keyword": 0.55, "placement": 0.08, "sections": 0.17, "parse": 0.15, "relevance": 0.05},
        "match": "exact", "note": "Strictest literal keyword matching. Ranking driven by prescreening criteria.",
    },
    "lever": {
        "name": "Lever", "weights": {"keyword": 0.40, "placement": 0.15, "sections": 0.15, "parse": 0.15, "relevance": 0.15},
        "match": "semantic", "note": "Semantic matching credits synonyms and related terms.",
    },
    "icims": {
        "name": "iCIMS", "weights": {"keyword": 0.45, "placement": 0.12, "sections": 0.18, "parse": 0.15, "relevance": 0.10},
        "match": "semantic", "note": "Boolean-style skill matching. Forgiving on layout.",
    },
}

SKILL_GLOSSARY = [
    "python", "java", "javascript", "typescript", "golang", "c#", "c++", "ruby", "php",
    "selenium", "playwright", "cypress", "appium", "testng", "junit", "cucumber", "restassured",
    "soapui", "postman", "jmeter", "k6", "karate", "robot framework", "pytest", "mocha", "jasmine",
    "selenium webdriver", "wdio", "detox", "xctest", "uiautomator", "espresso",
    "api testing", "ui testing", "mobile testing", "automation testing", "manual testing",
    "regression testing", "smoke testing", "integration testing", "e2e", "end-to-end",
    "mockito", "wiremock", "mssql", "mysql", "postgresql", "oracle", "sql server", "mongodb", "redis",
    "aws", "azure", "gcp", "docker", "kubernetes", "jenkins", "github actions", "gitlab ci/cd",
    "git", "svn", "jira", "confluence", "agile", "scrum", "kanban", "saas", "fintech", "healthcare",
    "bdd", "tdd", "shift left", "sonarqube", "splunk", "grafana", "prometheus", "new relic",
    "terraform", "ansible", "ci/cd", "ci", "cd", "sql", "bash", "shell", "pandas", "pytest-bdd",
    "allure", "extent reports", "testrail", "qtest", "xray", "zephyr", "genai", "llm", "azure devops",
]

EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
DATE_RE = re.compile(r"\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4}\b|\b(?:19|20)\d{2}\b")

PHONE_PATTERNS = [
    re.compile(r"\+?\d{1,3}[\s-]?\d{5}[\s-]?\d{4,5}"),        # +91 74155 45448 (IN 5-5)
    re.compile(r"\+?\d{1,3}[\s-]?\(\d{3}\)[\s.-]?\d{3}[\s.-]?\d{4}"),  # (555) 000-1234
    re.compile(r"\+?\d{1,3}[\s-]?\d{3}[\s.-]?\d{3}[\s.-]?\d{4}"),      # 555-000-1234
]

GARBAGE_RATIO = 0.55  # if non-alphanumeric/nospace chars exceed this, suspect encoding issues


def _find_phone(text):
    for pat in PHONE_PATTERNS:
        m = pat.search(text)
        if m:
            return m.group(0)
    return None


def _norm(text):
    return re.sub(r"\s+", " ", (text or "")).strip().lower()


def _stem(word):
    for suffix in ("ing", "ed", "es", "s", "tion", "tions", "ly"):
        if word.endswith(suffix) and len(word) > len(suffix) + 3:
            return word[: -len(suffix)]
    return word


def _tokenize(text):
    cleaned = []
    for t in re.findall(r"[A-Za-z0-9+#./-]{2,}", (text or "").lower()):
        t = t.strip(".,;:!?()[]{}\"'")
        t = re.sub(r"[.,;:]$", "", t)
        if not t or t in STOPWORDS:
            continue
        if not re.sub(r"[0-9./-]", "", t):
            continue  # pure number/range like 3-5
        cleaned.append(t)
        if "/" in t:  # split sdet/qa -> sdet, qa (and keep original)
            cleaned.extend(p for p in t.split("/") if len(p) >= 2 and p not in STOPWORDS)
    return cleaned


def _column_count(words, page_width=612.0):
    """Multi-column detector: flags a real two-column layout, tolerates
    left-aligned single-column text with full-width lines."""
    if not words:
        return 1
    left = right = mid = 0
    for w in words:
        center = w["x0"] + 60
        if center <= 0.40 * page_width:
            left += 1
        elif center >= 0.62 * page_width:
            right += 1
        else:
            mid += 1
    total = max(1, len(words))
    lf, mf, rf = left / total, mid / total, right / total
    # strong middle gap + meaningful right column = two-column layout
    if rf > 0.15 and mf < 0.08:
        return 2
    # strong middle gap + meaningful left column = sidebar layout
    if lf > 0.15 and mf < 0.08:
        return 2
    return 1


def extract_text_and_words(pdf_bytes):
    words, full, meta = [], [], {}
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        meta = pdf.metadata or {}
        for page in pdf.pages:
            full.append(page.extract_text() or "")
            for w in page.extract_words():
                words.append({"text": w["text"], "x0": w["x0"], "top": w["top"]})
    return "\n".join(full), words, meta


# --------------------------------------------------------------------------
# 1. PARSEABILITY
# --------------------------------------------------------------------------

def _detect_sections(text):
    found = set()
    upper = (text or "").upper()
    for key, labels in SECTION_LABELS.items():
        for lab in labels:
            if re.search(rf"(?m)^\s*{re.escape(lab)}\s*$", upper) or \
               re.search(rf"(?m)^\s*{re.escape(lab)}\s*[:]?", upper):
                found.add(key)
                break
    return found


def _char_sanity(text):
    if not text:
        return False
    alnum_spaces = sum(1 for ch in text if ch.isalnum() or ch in " \n\t.,;:()-/@|+")
    return alnum_spaces / len(text) >= GARBAGE_RATIO


def check_parseability(pdf_bytes, expected_terms=None, email="", phone=""):
    checks = []
    text, words, meta = extract_text_and_words(pdf_bytes)
    nt = text or ""
    size_bytes = len(pdf_bytes)
    expected_terms = [t for t in (expected_terms or []) if t]

    has_text = bool(re.sub(r"\s+", "", nt))
    checks.append({
        "id": "text_layer", "pass": has_text,
        "label": "Text-based PDF (selectable text exists)",
        "detail": "Image-only / scanned PDFs fail every ATS." if has_text else "No extractable text - the #1 ATS rejection cause.",
        "fatal": not has_text,
    })

    sanity = _char_sanity(nt)
    checks.append({
        "id": "gibberish", "pass": sanity,
        "label": "Clean characters (no mojibake from unembedded fonts)",
        "detail": "Non-embedded/exotic fonts render as gibberish in parsed text." if not sanity else "Character / letter ratio healthy.",
        "fatal": not sanity,
    })

    cols = _column_count(words)
    checks.append({
        "id": "single_column", "pass": cols == 1,
        "label": f"Single-column layout (detected: {cols})",
        "detail": "Two-column/table layouts get interleaved by Workday, Greenhouse, iCIMS." if cols > 1 else "Single reading column - clean flow.",
        "fatal": cols > 1,
    })

    email_found = bool(EMAIL_RE.search(nt))
    phone_found = bool(_find_phone(nt))
    needs = [n for n, ok in (("email", email_found), ("phone", phone_found)) if not ok]
    checks.append({
        "id": "contact_body", "pass": not needs,
        "label": "Contact info in body (" + ("email, phone" if not needs else ", ".join(needs)) + ")",
        "detail": "Missing: " + (", ".join(needs) or "none")
        + ". Contact in headers/footers is skipped by Workday.",
        "fatal": bool(needs),
    })

    sections_found = _detect_sections(nt)
    missing_sections = [s for s in ("summary", "skills", "experience", "education") if s not in sections_found]
    checks.append({
        "id": "sections", "pass": not missing_sections,
        "label": "Standard section headings recognized",
        "detail": "Missing: " + (", ".join(missing_sections) or "none")
        + ". Standard labels map to ATS fields.",
        "fatal": bool(missing_sections),
    })

    checks.append({
        "id": "file_size", "pass": size_bytes <= 2.5 * 1024 * 1024,
        "label": f"File size {round(size_bytes / 1024)} KB (< 2.5 MB)",
        "detail": "Greenhouse cannot parse resumes over 2.5MB even though it accepts uploads to 100MB.",
        "fatal": size_bytes > 2.5 * 1024 * 1024,
    })

    failing = [c for c in checks if not c["pass"]]
    fatal = [c for c in checks if c.get("fatal")]
    score = max(0, 100 - 4 * len(failing))

    return {
        "score": score, "checks": checks,
        "fatal": len(fatal) > 0,
        "sections_found": sections_found,
        "extracted_text": nt, "words": words, "meta": meta,
        "sections_found": sorted(sections_found),
    }


# --------------------------------------------------------------------------
# 2. KEYWORD / SKILL ANALYSIS
# --------------------------------------------------------------------------

def keyword_analysis(jd_text, resume_text, skills=None):
    jd_tokens = [t for t in _tokenize(jd_text) if len(t) >= 2 and t not in STOPWORDS]
    res_tokens = set(_tokenize(resume_text))
    freq = {}
    for t in jd_tokens:
        freq[t] = freq.get(t, 0) + 1
    uniq = list(dict.fromkeys(jd_tokens))

    exact_hit, sem_hit = {}, {}
    for t in uniq:
        exact_hit[t] = t in res_tokens
        sem_hit[t] = exact_hit[t] or any(_stem(t) == _stem(r) for r in res_tokens)

    return {
        "jd_tokens": uniq, "freq": freq,
        "exact_hit": exact_hit, "sem_hit": sem_hit,
        "skills": _skill_match(skills or [], jd_text, resume_text),
        "res_norm": _norm(resume_text), "jd_text": jd_text,
    }


def _skill_match(skills, jd_text, resume_text):
    jd_norm, res_norm = _norm(jd_text), _norm(resume_text)
    out = []
    for s in skills:
        s = s.strip() if isinstance(s, str) else (s or {}).get("skill", "")
        if not s:
            continue
        s_lower = re.sub(r"\s+", " ", s.lower()).strip()
        out.append({"skill": s, "in_jd": s_lower in jd_norm, "in_res": s_lower in res_norm})
    return out


def detect_skills(text, glossary=SKILL_GLOSSARY):
    nt = _norm(text)
    found = set()
    for s in sorted(glossary, key=len, reverse=True):
        if s in nt:
            found.add(s)
    return sorted(found)


# --------------------------------------------------------------------------
# 3. SCORE COMPOSITION
# --------------------------------------------------------------------------

def _sections_presence(sections_found):
    keys = ("summary", "skills", "experience", "education")
    return round(100 * sum(1 for k in keys if k in sections_found) / len(keys))


def _summary_blob(text):
    m = re.search(r"(?:profile\s*)?summary\s*\n(.{0,1500}?)(?=\n\s*(knowledge\s*&|tools|skills|professional experience|education|work experience|certifications))", text, re.S | re.I)
    return (m.group(1) or "").lower() if m else (text or "").lower()[:2000]


def compute_scores(jd_text, resume_text, parse, skills=None, profile=None):
    kw = keyword_analysis(jd_text, resume_text, skills)

    def coverage(hit_dict):
        hits = [h for h in hit_dict.values() if h]
        return round(100 * len(hits) / max(1, len(hit_dict)))

    exact_cov = coverage(kw["exact_hit"])
    sem_cov = coverage(kw["sem_hit"])

    skills_in_jd = [s for s in kw["skills"] if s["in_jd"]]
    relevant = [s for s in kw["skills"] if s["in_jd"] and s["in_res"]]
    cov_ratio = round(100 * len(relevant) / len(skills_in_jd)) if skills_in_jd else round(100 * len(skills) / 3) if skills else 100

    sections = _sections_presence(parse["sections_found"])

    placement_words = [t for t, ok in kw["exact_hit"].items() if ok and len(t) >= 3 and t not in STOPWORDS]
    dup = dict.fromkeys(placement_words)
    sec_blobs = [s.lower().strip() for s in re.split(
        r"(?mi)^\s*(summary|skills|professional experience|education)\s*$",
        (resume_text or "").lower()) if s and re.sub(r"\s+", "", s)]
    multi = [t for t in dup if sum(1 for b in sec_blobs if t in b) >= 2]
    placement = round(100 * len(multi) / len(dup)) if dup else 100

    summary_blob = _summary_blob(resume_text)
    jd_uniq = list(dict.fromkeys(_tokenize(jd_text)))
    jd_resonance = sum(1 for t in jd_uniq if t in summary_blob)
    relevance = min(100, round(0.6 * cov_ratio + 0.4 * (0 if not jd_uniq else 100 * jd_resonance / len(jd_uniq))))

    parse_score = parse["score"]
    if parse["fatal"]:
        parse_score = min(parse_score, 30)

    comps = {"keyword": exact_cov, "placement": placement, "sections": sections, "parse": parse_score, "relevance": relevance}

    platforms = {}
    for pid, model in PLATFORM_MODELS.items():
        base = round(sum(comps[k] * w for k, w in model["weights"].items()))
        score = base
        if model["match"] == "semantic" and sem_cov > exact_cov:
            score = min(round(sum(comps[k] * w for k, w in model["weights"].items() if k != "keyword") + 100 * model["weights"]["keyword"]),
                        int(base + (sem_cov - exact_cov) * model["weights"]["keyword"]))
        platforms[pid] = {"score": max(0, min(100, round(score))), "note": model["note"]}

    platforms["greenhouse"] = {
        "score": None,
        "note": ("Greenhouse does not auto-score resumes. Real gates: parse success + screening answers + human scorecard. "
                 f"Parse: {'PASS' if not parse['fatal'] else 'FAIL'}."),
    }

    return {
        "components": comps,
        "platforms": platforms,
        "exact_coverage": exact_cov,
        "semantic_coverage": sem_cov,
        "skill_stats": {
            "jd": len(skills_in_jd), "matched": len(relevant),
            "ratio": cov_ratio,
            "detected": sorted({s["skill"] for s in kw["skills"] if s["in_res"]}),
        },
        "missing_keywords": _missing_keywords(kw),
        "honesty_note": ("Simulation of *published* ATS rules (Greenhouse parse-failure list, Workday/Taleo/Lever/iCIMS weighting). "
                         "Vendor algorithms are private - no third-party tool reports a true ATS score. Parseability is the binary gate; content match is the real filter."),
    }


def _missing_keywords(kw):
    skills_missing = [s["skill"] for s in kw["skills"] if s["in_jd"] and not s["in_res"]]
    token_missing = []
    for t, ok in kw["exact_hit"].items():
        if ok or len(t) < 3 or t in STOPWORDS:
            continue
        if "/" in t and all(p in kw["exact_hit"] and kw["exact_hit"][p]
                            for p in t.split("/") if len(p) >= 2 and p in kw["exact_hit"]):
            continue  # slash form only; every part already matched
        token_missing.append(t)
    token_missing.sort(key=lambda t: kw["freq"].get(t, 0), reverse=True)
    return {
        "skills": skills_missing,
        "tokens": [t for t in token_missing if t not in [s.lower() for s in skills_missing]][:25],
    }


# --------------------------------------------------------------------------
# 4. VALIDATION ENTRY POINTS
# --------------------------------------------------------------------------

def extract_profile(text):
    lines = [ln.strip() for ln in (text or "").splitlines() if ln.strip() and len(ln.strip()) > 1]
    email = EMAIL_RE.search(text)
    phone = _find_phone(text)
    dates = DATE_RE.findall(text)
    name = lines[0] if lines else ""
    return {
        "name": name,
        "email": email.group(0) if email else None,
        "phone": phone or None,
        "dates_spotted": len(dates),
        "lines": lines[:3],
    }


def run_build_validation(pdf_bytes, data, jd_text):
    skills = [s.strip() for s in data.get("skills", []) if s.strip()]
    expected = [data.get("name", ""), data.get("email", ""), data.get("phone", ""),
                *skills,
                *[e.get("company", "") for e in data.get("experience", [])],
                *[e.get("role", "") for e in data.get("experience", [])],
                *[e.get("degree", "") for e in data.get("education", [])]]
    expected = [t for t in expected if t]
    return _score(pdf_bytes, jd_text, skills, expected)


def run_upload_validation(pdf_bytes, jd_text):
    return _score(pdf_bytes, jd_text, None, None)


def _score(pdf_bytes, jd_text, skills, expected_terms):
    parse = check_parseability(pdf_bytes, expected_terms)
    text = parse["extracted_text"]
    used_skills = skills or detect_skills(text)
    scores = compute_scores(jd_text, text, parse, used_skills)
    profile = extract_profile(text)
    return {
        "parse": {k: v for k, v in parse.items() if k != "extracted_text"},
        "scores": scores,
        "parsed_profile": profile,
        "raw_text": text,
        "word_count": len(_tokenize(text)),
    }


# --------------------------------------------------------------------------
# 5. AUTO-OPTIMIZATION  (same real info, better ATS wording)
# --------------------------------------------------------------------------

TECH_PHRASE_HINTS = [
    ("docker", "containerized test environments"),
    ("ci/cd", "optimized CI/CD release pipelines"),
    ("jenkins", "CI/CD pipeline"),
    ("regression", "automated regression execution"),
    ("release", "release-based validation"),
    ("api", "REST API test automation"),
    ("test case", "end-to-end and system-level test plans"),
    ("observability", "system observability and monitoring"),
    ("framework", "scalable test automation framework"),
    ("automated test", "production-grade automated test suite"),
]


def optimize_resume(data, jd_text):
    """Returns a copy of `data` (same facts) reworded + skill-augmented to
    match JD terminology. Never fabricates skills a candidate doesn't list."""
    import copy
    out = copy.deepcopy(data)

    jd_norm = _norm(jd_text)

    # 1) unify SKILLS list casing and dedupe
    seen, skills = set(), []
    for s in out.get("skills", []):
        key = _norm(s)
        if key and key not in seen:
            seen.add(key)
            skills.append(s)
    if skills:
        out["skills"] = skills

    # 2) reword bullets: append JD-matching phrasing, only where the bullet
    #    already does that work (no new claims are fabricated)
    for exp in out.get("experience", []):
        for j, b in enumerate(exp.get("bullets", [])):
            bn = _norm(b)
            for key, phrase in TECH_PHRASE_HINTS:
                if key in bn and phrase not in bn:
                    b = b.rstrip(".") + f" - {phrase}."
                    bn = _norm(b)
            exp["bullets"][j] = b

    # 3) enrich the Skill line with JD glossary terms the candidate ALREADY
    #    claims elsewhere (summary / bullets) so their skills surface in ATS
    claimed = _norm(" ".join([
        (out.get("summary") or ""),
        (out.get("projects") or ""),
        " ".join(skills),
        " ".join(b for e in out.get("experience", []) for b in e.get("bullets", [])),
    ]))
    for phrase in SKILL_GLOSSARY:
        if phrase in jd_norm and phrase in claimed and phrase.lower() not in seen:
            seen.add(phrase.lower())
            out["skills"].append(phrase)

    # 4) keyword summary section at the end (real claimed skills only)
    claimed_skill_text = _norm(" ".join(out["skills"]))
    top_terms = [t for t in dict.fromkeys(_tokenize(jd_text))
                 if t in claimed_skill_text and t not in {"job", "work", "etc"}]
    if top_terms:
        kept = []
        for k in dict.fromkeys(kept_terms(out["skills"], jd_norm)):
            kept.append(_pretty(k))
        out["projects"] = ", ".join(kept)

    return out, top_terms


def kept_terms(skills, jd_norm):
    jd = _norm(jd_norm)
    for s in skills:
        sn = _norm(s)
        if sn in jd:
            yield sn


def _pretty(term):
    if " " in term or "-" in term or "/" in term:
        return term
    return term.capitalize()