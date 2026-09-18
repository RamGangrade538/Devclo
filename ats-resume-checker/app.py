import os
import re
import time
import uuid

from flask import Flask, jsonify, render_template, request, send_file

from generator import build_pdf
from validator import (
    run_upload_validation,
    run_build_validation,
    optimize_resume,
    compute_scores,
    check_parseability,
    detect_skills,
)

BASE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(BASE, "output")
os.makedirs(OUT, exist_ok=True)

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 6 * 1024 * 1024
ALLOWED = {".pdf", ".docx", ".doc", ".txt", ".rtf"}


def _clean(data):
    def norm_list(items):
        out = []
        for it in items or []:
            if isinstance(it, dict):
                d = {}
                for k, v in it.items():
                    if isinstance(v, list):
                        d[k] = [str(x).strip() for x in v if str(x).strip()]
                    else:
                        d[k] = (v or "").strip()
                out.append(d)
        return out

    def norm_lines(raw):
        if isinstance(raw, str):
            return [ln.strip() for ln in raw.replace("\r\n", "\n").split("\n") if ln.strip()]
        return [str(x).strip() for x in raw or [] if str(x).strip()]

    return {
        "name": (data.get("name") or "").strip(),
        "job_title": (data.get("job_title") or "").strip(),
        "email": (data.get("email") or "").strip(),
        "phone": (data.get("phone") or "").strip(),
        "location": (data.get("location") or "").strip(),
        "linkedin": (data.get("linkedin") or "").strip(),
        "github": (data.get("github") or "").strip(),
        "summary": (data.get("summary") or "").strip(),
        "skills": norm_lines(data.get("skills")),
        "experience": norm_list(data.get("experience")),
        "education": norm_list(data.get("education")),
        "certifications": norm_lines(data.get("certifications")),
        "projects": (data.get("projects") or "").strip(),
    }


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/build", methods=["POST"])
def build():
    payload = request.get_json(force=True)
    data = _clean(payload.get("resume", {}))
    jd_text = (payload.get("job_description") or "").strip()

    if not data["name"]:
        return jsonify({"error": "Name is required"}), 400

    pdf_bytes = build_pdf(data)
    result = run_build_validation(pdf_bytes, data, jd_text)
    return _finish(result, pdf_bytes, "ats-resume.pdf")


@app.route("/optimize", methods=["POST"])
def optimize():
    """Score the resume; if the overall score is below the threshold,
    auto-reword the resume (same facts, JD-matching phrasing), rebuild the
    PDF and re-score it. Returns before + after plus the new download URL."""
    payload = request.get_json(force=True)
    data = _clean(payload.get("resume", {}))
    jd_text = (payload.get("job_description") or "").strip()
    threshold = int(payload.get("threshold", 60))

    if not data["name"]:
        return jsonify({"error": "Name is required"}), 400

    pdf_before = build_pdf(data)
    before = run_build_validation(pdf_before, data, jd_text)
    before_score = _overall_score(before)

    if before_score >= threshold:
        return jsonify({
            "optimized": False,
            "reason": f"Score {before_score} is already above {threshold} - no optimization needed.",
            "before_score": before_score,
            "scores": before,
        })

    optimized_data, matched_terms = optimize_resume(data, jd_text)
    pdf_after = build_pdf(optimized_data)
    after = run_build_validation(pdf_after, optimized_data, jd_text)
    after_score = _overall_score(after)

    return _finish({
        "optimized": True,
        "threshold": threshold,
        "before_score": before_score,
        "after_score": after_score,
        "delta": round(after_score - before_score, 1),
        "added_terms": matched_terms,
        "before": {
            "overall": before_score,
            "keyword": before["scores"]["exact_coverage"],
            "platforms": {k: v["score"] for k, v in before["scores"]["platforms"].items()},
        },
        "after": {
            "overall": after_score,
            "keyword": after["scores"]["exact_coverage"],
            "platforms": {k: v["score"] for k, v in after["scores"]["platforms"].items()},
        },
        "scores": after,
    }, pdf_after, "ats-resume-optimized.pdf")


def _overall_score(result):
    parse = result["parse"]["score"]
    content = result["scores"]["exact_coverage"]
    return round((parse * 0.35) + (content * 0.65))


@app.route("/upload", methods=["POST"])
def upload():
    f = request.files.get("file")
    jd_text = (request.form.get("job_description") or "").strip()
    if not f or not f.filename:
        return jsonify({"error": "No file uploaded"}), 400

    ext = os.path.splitext(f.filename)[1].lower()
    if ext not in ALLOWED:
        return jsonify({"error": f"Unsupported file type {ext}. Use PDF/DOCX/TXT/RTF."}), 400

    if ext != ".pdf":
        return jsonify({"error": "DOCX/TXT/RTF upload coming soon - for now, convert to PDF and upload."}), 400

    pdf_bytes = f.read()
    result = run_upload_validation(pdf_bytes, jd_text)
    return _finish(result, pdf_bytes, os.path.splitext(f.filename)[0] + "-checked.pdf")


def _finish(result, pdf_bytes, fname):
    token = uuid.uuid4().hex[:12]
    path = os.path.join(OUT, f"{token}.pdf")
    with open(path, "wb") as fh:
        fh.write(pdf_bytes)
    result["download_url"] = f"/download/{token}"
    result["generated_at"] = time.strftime("%Y-%m-%d %H:%M:%S")
    return jsonify(result)


@app.route("/download/<token>")
def download(token):
    if not re.fullmatch(r"[a-f0-9]{12}", token):
        return "bad token", 400
    return send_file(os.path.join(OUT, f"{token}.pdf"), as_attachment=True,
                     download_name="resume.pdf")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=False)