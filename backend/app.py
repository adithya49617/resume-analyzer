from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import re
import json
import tempfile
from pathlib import Path

app = Flask(__name__, static_folder="static")
CORS(app)

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_react(path):
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, "index.html")

# Try to import optional libraries
try:
    import pdfplumber
    HAS_PDF = True
except ImportError:
    HAS_PDF = False

try:
    import docx
    HAS_DOCX = True
except ImportError:
    HAS_DOCX = False

try:
    import spacy
    nlp = spacy.load("en_core_web_sm")
    HAS_SPACY = True
except Exception:
    HAS_SPACY = False

# ── Skill taxonomy ──────────────────────────────────────────────────────────
SKILL_CATEGORIES = {
    "Programming Languages": [
        "python","javascript","typescript","java","c++","c#","go","rust","ruby",
        "swift","kotlin","scala","r","matlab","php","bash","shell","sql"
    ],
    "Frontend": [
        "react","vue","angular","svelte","html","css","sass","tailwind",
        "webpack","vite","next.js","nuxt","redux","graphql"
    ],
    "Backend": [
        "flask","django","fastapi","express","spring","node.js","rails",
        "rest api","microservices","grpc","websocket"
    ],
    "Data & AI/ML": [
        "machine learning","deep learning","nlp","computer vision","tensorflow",
        "pytorch","scikit-learn","pandas","numpy","keras","transformers",
        "llm","gpt","bert","hugging face","data science","statistics"
    ],
    "Cloud & DevOps": [
        "aws","azure","gcp","docker","kubernetes","ci/cd","terraform",
        "ansible","jenkins","github actions","linux","nginx"
    ],
    "Databases": [
        "postgresql","mysql","mongodb","redis","elasticsearch","sqlite",
        "dynamodb","cassandra","neo4j","supabase","firebase"
    ],
    "Soft Skills": [
        "leadership","communication","teamwork","agile","scrum","problem solving",
        "project management","mentoring","collaboration","critical thinking"
    ]
}

ALL_SKILLS = {skill: cat for cat, skills in SKILL_CATEGORIES.items() for skill in skills}

# ── Text extraction ──────────────────────────────────────────────────────────
def extract_text_from_pdf(file_path):
    if not HAS_PDF:
        return ""
    with pdfplumber.open(file_path) as pdf:
        return "\n".join(page.extract_text() or "" for page in pdf.pages)

def extract_text_from_docx(file_path):
    if not HAS_DOCX:
        return ""
    doc = docx.Document(file_path)
    return "\n".join(p.text for p in doc.paragraphs)

def extract_text(file_path, filename):
    ext = Path(filename).suffix.lower()
    if ext == ".pdf":
        return extract_text_from_pdf(file_path)
    elif ext in [".docx", ".doc"]:
        return extract_text_from_docx(file_path)
    return ""

# ── NLP helpers ──────────────────────────────────────────────────────────────
def extract_skills(text):
    text_lower = text.lower()
    found = {}
    for skill, category in ALL_SKILLS.items():
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, text_lower):
            found[skill] = category
    return found

def extract_experience_years(text):
    patterns = [
        r'(\d+)\+?\s*years?\s+of\s+experience',
        r'(\d+)\+?\s*years?\s+experience',
        r'experience\s+of\s+(\d+)\+?\s*years?',
    ]
    years = []
    for pat in patterns:
        matches = re.findall(pat, text.lower())
        years.extend(int(m) for m in matches)
    return max(years) if years else None

def extract_education(text):
    degrees = ["phd","ph.d","doctorate","master","msc","mba","bachelor","bsc","b.s","b.e","associate"]
    found = []
    text_lower = text.lower()
    for deg in degrees:
        if deg in text_lower:
            found.append(deg.upper())
    return list(set(found))

def score_resume(resume_skills, job_skills, resume_text):
    if not job_skills:
        return 75  # default when no JD

    matched = set(resume_skills.keys()) & set(job_skills.keys())
    total_job = len(job_skills)
    if total_job == 0:
        return 0

    base_score = (len(matched) / total_job) * 70

    # Bonus for experience mentions
    exp = extract_experience_years(resume_text)
    exp_bonus = min(15, (exp or 0) * 2)

    # Bonus for education
    edu = extract_education(resume_text)
    edu_bonus = 10 if edu else 0

    # Bonus for resume length / completeness
    word_count = len(resume_text.split())
    length_bonus = min(5, word_count / 100)

    total = base_score + exp_bonus + edu_bonus + length_bonus
    return round(min(98, max(20, total)), 1)

def generate_feedback(resume_skills, job_skills, resume_text, score):
    feedback = []
    matched = set(resume_skills.keys()) & set(job_skills.keys()) if job_skills else set()
    missing = set(job_skills.keys()) - set(resume_skills.keys()) if job_skills else set()

    # Score-based headline
    if score >= 85:
        feedback.append({
            "type": "success",
            "title": "Excellent Match",
            "message": f"Your resume scores {score}% — strong alignment with the job requirements. Minor polish could push this to near-perfect."
        })
    elif score >= 65:
        feedback.append({
            "type": "warning",
            "title": "Good Match with Gaps",
            "message": f"Your resume scores {score}% — solid foundation but missing some key skills the employer is looking for."
        })
    else:
        feedback.append({
            "type": "error",
            "title": "Significant Gaps Detected",
            "message": f"Your resume scores {score}% — consider tailoring it more specifically to this role."
        })

    # Missing skills
    if missing:
        top_missing = list(missing)[:6]
        feedback.append({
            "type": "gap",
            "title": "Missing Skills from Job Description",
            "message": f"Consider adding these skills if you have experience with them: {', '.join(top_missing)}.",
            "items": top_missing
        })

    # Matched skills
    if matched:
        feedback.append({
            "type": "match",
            "title": "Skills Matched Successfully",
            "message": f"Great — {len(matched)} skills directly match the job description.",
            "items": list(matched)
        })

    # Experience
    exp = extract_experience_years(resume_text)
    if not exp:
        feedback.append({
            "type": "suggestion",
            "title": "Add Years of Experience",
            "message": "Quantify your experience (e.g., '5+ years of experience in backend development') to help ATS and recruiters quickly assess seniority."
        })

    # Education
    edu = extract_education(resume_text)
    if not edu:
        feedback.append({
            "type": "suggestion",
            "title": "Education Section Not Detected",
            "message": "Ensure your education (degree, institution, year) is clearly listed — many ATS systems filter on this."
        })

    # Resume length
    word_count = len(resume_text.split())
    if word_count < 200:
        feedback.append({
            "type": "warning",
            "title": "Resume Seems Short",
            "message": f"Your resume contains ~{word_count} words. A strong resume typically has 400–800 words with concrete achievements and metrics."
        })
    elif word_count > 1000:
        feedback.append({
            "type": "suggestion",
            "title": "Consider Trimming Your Resume",
            "message": f"At ~{word_count} words, your resume may be too long. Aim for 1–2 pages focused on the most relevant experience."
        })

    # Quantification check
    number_pattern = r'\b\d+[%x]?\b'
    numbers_found = re.findall(number_pattern, resume_text)
    if len(numbers_found) < 3:
        feedback.append({
            "type": "suggestion",
            "title": "Add Quantified Achievements",
            "message": "Use numbers to demonstrate impact: 'Reduced load time by 40%', 'Led a team of 8 engineers', 'Processed 1M+ records daily'."
        })

    # Action verbs
    strong_verbs = ["led","built","designed","developed","architected","optimized","reduced","increased","launched","scaled","deployed","automated"]
    text_lower = resume_text.lower()
    verbs_found = [v for v in strong_verbs if v in text_lower]
    if len(verbs_found) < 3:
        feedback.append({
            "type": "suggestion",
            "title": "Strengthen Action Verbs",
            "message": f"Use powerful action verbs like: Led, Architected, Optimized, Scaled, Automated, Deployed to convey impact and ownership."
        })

    return feedback

def generate_rewrite_suggestions(resume_text, resume_skills, job_skills):
    suggestions = []
    missing = set(job_skills.keys()) - set(resume_skills.keys()) if job_skills else set()

    # Summary rewrite
    has_summary = any(kw in resume_text.lower() for kw in ["summary","objective","profile","about"])
    top_skills = list(resume_skills.keys())[:4]
    skill_str = ", ".join(top_skills) if top_skills else "your core technologies"

    if has_summary:
        suggestions.append({
            "section": "Professional Summary",
            "original_hint": "Your current summary may be too generic.",
            "rewrite": f"Results-driven software engineer with expertise in {skill_str}. Proven track record of delivering scalable solutions and driving measurable business impact through innovative engineering. Passionate about clean architecture and continuous improvement."
        })
    else:
        suggestions.append({
            "section": "Add a Professional Summary",
            "original_hint": "No summary section detected.",
            "rewrite": f"Experienced engineer skilled in {skill_str}, with a strong background in building reliable, high-performance systems. Adept at collaborating across teams to deliver impactful solutions on time."
        })

    # Skills section
    if missing:
        top_miss = list(missing)[:4]
        suggestions.append({
            "section": "Skills Section",
            "original_hint": "Your skills section is missing some keywords from the job description.",
            "rewrite": f"If you have any experience with {', '.join(top_miss)}, add them to your skills section — even in projects or academic settings. ATS systems scan for exact keyword matches."
        })

    # Bullet point improvement
    suggestions.append({
        "section": "Experience Bullets",
        "original_hint": "Weak: 'Worked on backend services'",
        "rewrite": "Strong: 'Architected and deployed 3 microservices handling 500K+ daily requests, reducing P99 latency by 35% through async processing and Redis caching.'"
    })

    suggestions.append({
        "section": "Projects Section",
        "original_hint": "If missing, add a projects section.",
        "rewrite": f"AI Resume Analyzer — Built a full-stack resume analysis tool using React and Flask, integrating NLP models ({', '.join(top_skills[:2] or ['spaCy', 'Python'])}) to evaluate skill-job alignment and generate optimization suggestions with 85%+ accuracy."
    })

    return suggestions

# ── Routes ────────────────────────────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "capabilities": {
            "pdf": HAS_PDF,
            "docx": HAS_DOCX,
            "spacy": HAS_SPACY
        }
    })

@app.route("/analyze", methods=["POST"])
def analyze():
    resume_file = request.files.get("resume")
    job_description = request.form.get("job_description", "")

    if not resume_file:
        return jsonify({"error": "No resume file uploaded"}), 400

    # Save temp file
    suffix = Path(resume_file.filename).suffix
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        resume_file.save(tmp.name)
        tmp_path = tmp.name

    try:
        resume_text = extract_text(tmp_path, resume_file.filename)
        if not resume_text.strip():
            return jsonify({"error": "Could not extract text from resume. Ensure it's a readable PDF or DOCX."}), 400

        resume_skills = extract_skills(resume_text)
        job_skills = extract_skills(job_description) if job_description else {}

        score = score_resume(resume_skills, job_skills, resume_text)
        feedback = generate_feedback(resume_skills, job_skills, resume_text, score)
        rewrites = generate_rewrite_suggestions(resume_text, resume_skills, job_skills)

        # Skill gap analysis by category
        resume_cats = {}
        for skill, cat in resume_skills.items():
            resume_cats.setdefault(cat, []).append(skill)

        job_cats = {}
        for skill, cat in job_skills.items():
            job_cats.setdefault(cat, []).append(skill)

        gap_analysis = []
        all_cats = set(list(resume_cats.keys()) + list(job_cats.keys()))
        for cat in sorted(all_cats):
            r = set(resume_cats.get(cat, []))
            j = set(job_cats.get(cat, []))
            matched = r & j
            missing_skills = j - r
            extra = r - j
            gap_analysis.append({
                "category": cat,
                "resume_skills": sorted(r),
                "job_skills": sorted(j),
                "matched": sorted(matched),
                "missing": sorted(missing_skills),
                "extra": sorted(extra),
                "coverage": round(len(matched) / len(j) * 100) if j else 100
            })

        return jsonify({
            "score": score,
            "resume_text_preview": resume_text[:300] + "..." if len(resume_text) > 300 else resume_text,
            "word_count": len(resume_text.split()),
            "resume_skills": resume_skills,
            "job_skills": job_skills,
            "experience_years": extract_experience_years(resume_text),
            "education": extract_education(resume_text),
            "feedback": feedback,
            "rewrite_suggestions": rewrites,
            "gap_analysis": gap_analysis,
            "matched_count": len(set(resume_skills.keys()) & set(job_skills.keys())),
            "missing_count": len(set(job_skills.keys()) - set(resume_skills.keys()))
        })

    finally:
        os.unlink(tmp_path)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=7860)
