import { useState, useCallback, useRef } from "react";

const API_BASE = "";

// ── Color palette & design tokens ──────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&family=Instrument+Serif:ital@0;1&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0a0a0f;
    --surface: #111118;
    --surface2: #1a1a24;
    --surface3: #22222f;
    --border: rgba(255,255,255,0.07);
    --border-strong: rgba(255,255,255,0.14);
    --accent: #7c6dfa;
    --accent2: #fa6d8f;
    --accent3: #6dfabd;
    --accent4: #fac96d;
    --text: #f0f0f8;
    --text2: #9999b5;
    --text3: #5a5a7a;
    --success: #4ade80;
    --warning: #fb923c;
    --error: #f87171;
    --radius: 14px;
    --radius-sm: 8px;
  }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'DM Mono', monospace;
    min-height: 100vh;
    overflow-x: hidden;
  }

  .app {
    max-width: 1100px;
    margin: 0 auto;
    padding: 40px 24px 80px;
  }

  /* Header */
  .header {
    text-align: center;
    margin-bottom: 56px;
    position: relative;
  }
  .header::before {
    content: '';
    position: absolute;
    top: -60px; left: 50%;
    transform: translateX(-50%);
    width: 400px; height: 400px;
    background: radial-gradient(ellipse, rgba(124,109,250,0.12) 0%, transparent 70%);
    pointer-events: none;
  }
  .eyebrow {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }
  .eyebrow::before, .eyebrow::after {
    content: '';
    width: 32px; height: 1px;
    background: var(--accent);
    opacity: 0.5;
  }
  .header h1 {
    font-family: 'Syne', sans-serif;
    font-size: clamp(36px, 6vw, 64px);
    font-weight: 800;
    line-height: 1.05;
    letter-spacing: -2px;
    background: linear-gradient(135deg, #fff 30%, var(--accent) 70%, var(--accent2) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 16px;
  }
  .header p {
    color: var(--text2);
    font-size: 14px;
    font-family: 'DM Mono', monospace;
    letter-spacing: 0.3px;
  }

  /* Upload zone */
  .upload-zone {
    border: 1.5px dashed var(--border-strong);
    border-radius: var(--radius);
    padding: 48px 32px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    background: var(--surface);
    position: relative;
    overflow: hidden;
  }
  .upload-zone::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at center, rgba(124,109,250,0.04) 0%, transparent 70%);
    pointer-events: none;
  }
  .upload-zone:hover, .upload-zone.drag-over {
    border-color: var(--accent);
    background: rgba(124,109,250,0.06);
  }
  .upload-zone.has-file {
    border-style: solid;
    border-color: var(--accent3);
    background: rgba(109,250,189,0.04);
  }
  .upload-icon {
    font-size: 40px;
    margin-bottom: 16px;
    display: block;
  }
  .upload-zone h3 {
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 18px;
    margin-bottom: 8px;
    color: var(--text);
  }
  .upload-zone p { color: var(--text2); font-size: 13px; }

  /* Card */
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 28px;
    margin-bottom: 20px;
  }
  .card-title {
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: var(--text2);
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  /* Textarea */
  textarea {
    width: 100%;
    background: var(--surface2);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-sm);
    padding: 16px;
    color: var(--text);
    font-family: 'DM Mono', monospace;
    font-size: 13px;
    line-height: 1.7;
    resize: vertical;
    min-height: 160px;
    outline: none;
    transition: border-color 0.2s;
  }
  textarea:focus { border-color: var(--accent); }
  textarea::placeholder { color: var(--text3); }

  /* Button */
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    background: var(--accent);
    color: #fff;
    border: none;
    border-radius: var(--radius-sm);
    padding: 14px 28px;
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 14px;
    letter-spacing: 0.5px;
    cursor: pointer;
    transition: all 0.2s;
    width: 100%;
    justify-content: center;
  }
  .btn:hover { background: #9080ff; transform: translateY(-1px); }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
  .btn.loading { background: var(--surface3); }

  /* Score ring */
  .score-section {
    display: grid;
    grid-template-columns: 200px 1fr;
    gap: 32px;
    align-items: center;
    margin-bottom: 28px;
  }
  @media (max-width: 600px) { .score-section { grid-template-columns: 1fr; } }
  .score-ring-wrap { display: flex; flex-direction: column; align-items: center; gap: 12px; }
  .score-ring {
    position: relative;
    width: 160px; height: 160px;
  }
  .score-ring svg { transform: rotate(-90deg); }
  .score-ring-label {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  .score-number {
    font-family: 'Syne', sans-serif;
    font-size: 42px;
    font-weight: 800;
    line-height: 1;
  }
  .score-label {
    font-size: 11px;
    color: var(--text2);
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .score-meta { display: flex; flex-direction: column; gap: 10px; }
  .score-stat {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 13px;
  }
  .score-stat-icon { font-size: 18px; }
  .score-stat-label { color: var(--text2); }
  .score-stat-value { color: var(--text); font-weight: 500; margin-left: auto; }

  /* Feedback cards */
  .feedback-list { display: flex; flex-direction: column; gap: 12px; }
  .feedback-item {
    border-radius: var(--radius-sm);
    padding: 16px 20px;
    border-left: 3px solid;
  }
  .feedback-item.success { background: rgba(74,222,128,0.07); border-color: var(--success); }
  .feedback-item.warning { background: rgba(251,146,60,0.07); border-color: var(--warning); }
  .feedback-item.error { background: rgba(248,113,113,0.07); border-color: var(--error); }
  .feedback-item.gap { background: rgba(250,109,143,0.07); border-color: var(--accent2); }
  .feedback-item.match { background: rgba(109,250,189,0.07); border-color: var(--accent3); }
  .feedback-item.suggestion { background: rgba(250,201,109,0.07); border-color: var(--accent4); }
  .feedback-title {
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 13px;
    margin-bottom: 6px;
  }
  .feedback-message { font-size: 12px; color: var(--text2); line-height: 1.6; }
  .pill-list { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
  .pill {
    background: rgba(255,255,255,0.06);
    border: 1px solid var(--border-strong);
    border-radius: 100px;
    padding: 3px 10px;
    font-size: 11px;
    color: var(--text2);
    font-family: 'DM Mono', monospace;
  }

  /* Gap analysis */
  .gap-grid { display: flex; flex-direction: column; gap: 14px; }
  .gap-item { }
  .gap-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
    font-size: 12px;
  }
  .gap-category { font-family: 'Syne', sans-serif; font-weight: 600; color: var(--text); }
  .gap-pct { color: var(--text2); font-size: 11px; }
  .bar-track {
    height: 6px;
    background: var(--surface3);
    border-radius: 100px;
    overflow: hidden;
    margin-bottom: 6px;
  }
  .bar-fill {
    height: 100%;
    border-radius: 100px;
    transition: width 1s ease;
  }
  .gap-pills { display: flex; flex-wrap: wrap; gap: 4px; }
  .gap-pill {
    font-size: 10px;
    padding: 2px 8px;
    border-radius: 100px;
    font-family: 'DM Mono', monospace;
  }
  .pill-matched { background: rgba(109,250,189,0.15); color: var(--accent3); border: 1px solid rgba(109,250,189,0.2); }
  .pill-missing { background: rgba(250,109,143,0.15); color: var(--accent2); border: 1px solid rgba(250,109,143,0.2); }
  .pill-extra { background: rgba(124,109,250,0.12); color: var(--accent); border: 1px solid rgba(124,109,250,0.2); }

  /* Rewrites */
  .rewrite-list { display: flex; flex-direction: column; gap: 16px; }
  .rewrite-item {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    overflow: hidden;
  }
  .rewrite-section-label {
    background: var(--surface3);
    padding: 10px 16px;
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 12px;
    color: var(--accent);
    letter-spacing: 0.5px;
  }
  .rewrite-body { padding: 16px; }
  .rewrite-original {
    font-size: 11px;
    color: var(--text3);
    margin-bottom: 10px;
    font-style: italic;
    padding: 8px 12px;
    background: rgba(248,113,113,0.06);
    border-radius: 6px;
    border-left: 2px solid var(--error);
  }
  .rewrite-suggestion {
    font-size: 12px;
    color: var(--text);
    line-height: 1.7;
    padding: 10px 12px;
    background: rgba(109,250,189,0.06);
    border-radius: 6px;
    border-left: 2px solid var(--accent3);
  }

  /* Tabs */
  .tabs { display: flex; gap: 4px; margin-bottom: 24px; flex-wrap: wrap; }
  .tab {
    padding: 9px 18px;
    border-radius: 100px;
    font-family: 'Syne', sans-serif;
    font-weight: 600;
    font-size: 12px;
    cursor: pointer;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--text2);
    transition: all 0.2s;
    letter-spacing: 0.3px;
  }
  .tab.active {
    background: var(--accent);
    color: #fff;
    border-color: var(--accent);
  }
  .tab:hover:not(.active) { border-color: var(--accent); color: var(--accent); }

  /* Grid */
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  @media (max-width: 700px) { .two-col { grid-template-columns: 1fr; } }

  /* Error */
  .error-box {
    background: rgba(248,113,113,0.08);
    border: 1px solid rgba(248,113,113,0.3);
    border-radius: var(--radius-sm);
    padding: 14px 18px;
    font-size: 13px;
    color: var(--error);
    margin-bottom: 20px;
  }

  /* Spinner */
  @keyframes spin { to { transform: rotate(360deg); } }
  .spinner {
    width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,0.2);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  /* Demo mode badge */
  .demo-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(250,201,109,0.1);
    border: 1px solid rgba(250,201,109,0.3);
    color: var(--accent4);
    border-radius: 100px;
    padding: 4px 12px;
    font-size: 11px;
    margin-bottom: 20px;
  }
`;

// ── Score ring component ─────────────────────────────────────────────────────
function ScoreRing({ score }) {
  const radius = 68;
  const circ = 2 * Math.PI * radius;
  const fill = (score / 100) * circ;
  const color = score >= 80 ? "#4ade80" : score >= 60 ? "#fac96d" : "#f87171";

  return (
    <div className="score-ring">
      <svg width="160" height="160" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
        <circle
          cx="80" cy="80" r={radius}
          fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${fill} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1.2s ease" }}
        />
      </svg>
      <div className="score-ring-label">
        <span className="score-number" style={{ color }}>{score}%</span>
        <span className="score-label">Match</span>
      </div>
    </div>
  );
}

// ── Demo data for backend-offline preview ────────────────────────────────────
const DEMO_RESULT = {
  score: 74,
  word_count: 412,
  experience_years: 3,
  education: ["BACHELOR"],
  matched_count: 8,
  missing_count: 4,
  resume_skills: { python: "Programming Languages", react: "Frontend", flask: "Backend", postgresql: "Databases", docker: "Cloud & DevOps", "machine learning": "Data & AI/ML" },
  job_skills: { python: "Programming Languages", react: "Frontend", typescript: "Frontend", kubernetes: "Cloud & DevOps", "machine learning": "Data & AI/ML", pytorch: "Data & AI/ML", flask: "Backend", postgresql: "Databases", redis: "Databases", aws: "Cloud & DevOps", docker: "Cloud & DevOps", "deep learning": "Data & AI/ML" },
  feedback: [
    { type: "warning", title: "Good Match with Gaps", message: "Your resume scores 74% — solid foundation but missing some key skills the employer is looking for." },
    { type: "gap", title: "Missing Skills from Job Description", message: "Consider adding these skills if you have experience with them: typescript, kubernetes, pytorch, redis.", items: ["typescript", "kubernetes", "pytorch", "redis"] },
    { type: "match", title: "Skills Matched Successfully", message: "Great — 8 skills directly match the job description.", items: ["python", "react", "flask", "postgresql", "docker", "machine learning"] },
    { type: "suggestion", title: "Add Quantified Achievements", message: "Use numbers to demonstrate impact: 'Reduced load time by 40%', 'Led a team of 8 engineers', 'Processed 1M+ records daily'." },
    { type: "suggestion", title: "Strengthen Action Verbs", message: "Use powerful action verbs like: Led, Architected, Optimized, Scaled, Automated, Deployed to convey impact and ownership." }
  ],
  rewrite_suggestions: [
    { section: "Professional Summary", original_hint: "Your current summary may be too generic.", rewrite: "Results-driven software engineer with expertise in Python, React, Flask, PostgreSQL. Proven track record of delivering scalable solutions and driving measurable business impact through innovative engineering." },
    { section: "Skills Section", original_hint: "Your skills section is missing some keywords from the job description.", rewrite: "If you have any experience with typescript, kubernetes, pytorch, redis, add them to your skills section — even in projects or academic settings. ATS systems scan for exact keyword matches." },
    { section: "Experience Bullets", original_hint: "Weak: 'Worked on backend services'", rewrite: "Strong: 'Architected and deployed 3 microservices handling 500K+ daily requests, reducing P99 latency by 35% through async processing and Redis caching.'" },
    { section: "Projects Section", original_hint: "If missing, add a projects section.", rewrite: "AI Resume Analyzer — Built a full-stack resume analysis tool using React and Flask, integrating NLP models to evaluate skill-job alignment and generate optimization suggestions with 85%+ accuracy." }
  ],
  gap_analysis: [
    { category: "Programming Languages", matched: ["python"], missing: [], extra: [], resume_skills: ["python"], job_skills: ["python"], coverage: 100 },
    { category: "Frontend", matched: ["react"], missing: ["typescript"], extra: [], resume_skills: ["react"], job_skills: ["react", "typescript"], coverage: 50 },
    { category: "Backend", matched: ["flask"], missing: [], extra: [], resume_skills: ["flask"], job_skills: ["flask"], coverage: 100 },
    { category: "Data & AI/ML", matched: ["machine learning"], missing: ["deep learning", "pytorch"], extra: [], resume_skills: ["machine learning"], job_skills: ["machine learning", "deep learning", "pytorch"], coverage: 33 },
    { category: "Cloud & DevOps", matched: ["docker"], missing: ["aws", "kubernetes"], extra: [], resume_skills: ["docker"], job_skills: ["docker", "aws", "kubernetes"], coverage: 33 },
    { category: "Databases", matched: ["postgresql"], missing: ["redis"], extra: [], resume_skills: ["postgresql"], job_skills: ["postgresql", "redis"], coverage: 50 }
  ]
};

// ── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [file, setFile] = useState(null);
  const [jobDesc, setJobDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [activeTab, setActiveTab] = useState("feedback");
  const [demoMode, setDemoMode] = useState(false);
  const fileRef = useRef();

  const handleFile = (f) => {
    if (f && (f.name.endsWith(".pdf") || f.name.endsWith(".docx"))) {
      setFile(f);
      setError(null);
    } else {
      setError("Please upload a PDF or DOCX file.");
    }
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  const analyze = async () => {
    if (!file) { setError("Please upload a resume first."); return; }
    setLoading(true);
    setError(null);
    setResult(null);

    const fd = new FormData();
    fd.append("resume", file);
    fd.append("job_description", jobDesc);

    try {
      const res = await fetch(`${API_BASE}/analyze`, { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Analysis failed");
      }
      const data = await res.json();
      setResult(data);
      setDemoMode(false);
      setActiveTab("feedback");
    } catch (e) {
      // Fall back to demo mode if backend unavailable
      if (e.message.includes("fetch") || e.message.includes("Failed")) {
        setResult(DEMO_RESULT);
        setDemoMode(true);
        setActiveTab("feedback");
      } else {
        setError(e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const barColor = (pct) => pct >= 80 ? "#4ade80" : pct >= 50 ? "#fac96d" : "#f87171";

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        {/* Header */}
        <div className="header">
          <div className="eyebrow">AI-Powered</div>
          <h1>Resume Analyzer</h1>
          <p>Upload your resume + paste a job description → get NLP-powered feedback & rewrites</p>
        </div>

        {/* Input section */}
        {!result && (
          <div className="two-col" style={{ marginBottom: 20 }}>
            <div className="card">
              <div className="card-title">📄 Upload Resume</div>
              <div
                className={`upload-zone ${dragOver ? "drag-over" : ""} ${file ? "has-file" : ""}`}
                onClick={() => fileRef.current.click()}
                onDrop={onDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
              >
                <input ref={fileRef} type="file" accept=".pdf,.docx" style={{ display: "none" }}
                  onChange={(e) => handleFile(e.target.files[0])} />
                <span className="upload-icon">{file ? "✅" : "📋"}</span>
                <h3>{file ? file.name : "Drop your resume here"}</h3>
                <p>{file ? `${(file.size / 1024).toFixed(1)} KB · Click to change` : "PDF or DOCX · Click or drag & drop"}</p>
              </div>
            </div>

            <div className="card">
              <div className="card-title">💼 Job Description <span style={{ color: "var(--text3)", fontWeight: 400 }}>(optional)</span></div>
              <textarea
                value={jobDesc}
                onChange={(e) => setJobDesc(e.target.value)}
                placeholder="Paste the job description here for skill matching and gap analysis…"
              />
            </div>
          </div>
        )}

        {error && <div className="error-box">⚠️ {error}</div>}

        {!result && (
          <button className={`btn ${loading ? "loading" : ""}`} onClick={analyze} disabled={loading}>
            {loading ? <><div className="spinner" /> Analyzing your resume…</> : "→ Analyze Resume"}
          </button>
        )}

        {/* Results */}
        {result && (
          <>
            {demoMode && (
              <div className="demo-badge">⚡ Demo mode — start Flask backend to analyze your real resume</div>
            )}

            {/* Score overview */}
            <div className="card">
              <div className="score-section">
                <div className="score-ring-wrap">
                  <ScoreRing score={result.score} />
                  <span style={{ fontSize: 11, color: "var(--text3)" }}>
                    {result.score >= 80 ? "Strong" : result.score >= 60 ? "Moderate" : "Needs Work"}
                  </span>
                </div>
                <div className="score-meta">
                  {result.experience_years && (
                    <div className="score-stat">
                      <span className="score-stat-icon">🗓</span>
                      <span className="score-stat-label">Experience</span>
                      <span className="score-stat-value">{result.experience_years} years</span>
                    </div>
                  )}
                  {result.education?.length > 0 && (
                    <div className="score-stat">
                      <span className="score-stat-icon">🎓</span>
                      <span className="score-stat-label">Education</span>
                      <span className="score-stat-value">{result.education.join(", ")}</span>
                    </div>
                  )}
                  <div className="score-stat">
                    <span className="score-stat-icon">📝</span>
                    <span className="score-stat-label">Word count</span>
                    <span className="score-stat-value">{result.word_count}</span>
                  </div>
                  <div className="score-stat">
                    <span className="score-stat-icon">✅</span>
                    <span className="score-stat-label">Skills matched</span>
                    <span className="score-stat-value" style={{ color: "var(--accent3)" }}>{result.matched_count}</span>
                  </div>
                  {result.missing_count > 0 && (
                    <div className="score-stat">
                      <span className="score-stat-icon">❌</span>
                      <span className="score-stat-label">Skills missing</span>
                      <span className="score-stat-value" style={{ color: "var(--accent2)" }}>{result.missing_count}</span>
                    </div>
                  )}
                  <div className="score-stat">
                    <span className="score-stat-icon">🧠</span>
                    <span className="score-stat-label">Skills detected</span>
                    <span className="score-stat-value">{Object.keys(result.resume_skills).length}</span>
                  </div>
                </div>
              </div>

              <button className="btn" style={{ marginTop: 4, background: "var(--surface3)", fontSize: 12 }}
                onClick={() => { setResult(null); setFile(null); setJobDesc(""); setDemoMode(false); }}>
                ↺ Analyze Another Resume
              </button>
            </div>

            {/* Tabs */}
            <div className="tabs">
              {["feedback", "gap", "rewrites"].map(t => (
                <button key={t} className={`tab ${activeTab === t ? "active" : ""}`} onClick={() => setActiveTab(t)}>
                  {t === "feedback" ? "💬 Feedback" : t === "gap" ? "📊 Skill Gap" : "✍️ Rewrites"}
                </button>
              ))}
            </div>

            {/* Feedback tab */}
            {activeTab === "feedback" && (
              <div className="card">
                <div className="card-title">💬 AI Feedback</div>
                <div className="feedback-list">
                  {result.feedback.map((fb, i) => (
                    <div key={i} className={`feedback-item ${fb.type}`}>
                      <div className="feedback-title">{fb.title}</div>
                      <div className="feedback-message">{fb.message}</div>
                      {fb.items && (
                        <div className="pill-list">
                          {fb.items.map(s => <span key={s} className="pill">{s}</span>)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Gap analysis tab */}
            {activeTab === "gap" && (
              <div className="card">
                <div className="card-title">📊 Skill Gap by Category</div>
                <div className="gap-grid">
                  {result.gap_analysis.filter(g => g.resume_skills.length > 0 || g.job_skills.length > 0).map((g, i) => (
                    <div key={i} className="gap-item">
                      <div className="gap-header">
                        <span className="gap-category">{g.category}</span>
                        <span className="gap-pct">{g.coverage}% coverage</span>
                      </div>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: `${g.coverage}%`, background: barColor(g.coverage) }} />
                      </div>
                      <div className="gap-pills">
                        {g.matched.map(s => <span key={s} className="gap-pill pill-matched">✓ {s}</span>)}
                        {g.missing.map(s => <span key={s} className="gap-pill pill-missing">✗ {s}</span>)}
                        {g.extra.map(s => <span key={s} className="gap-pill pill-extra">+ {s}</span>)}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 20, display: "flex", gap: 16, fontSize: 11, color: "var(--text3)" }}>
                  <span><span style={{ color: "var(--accent3)" }}>■</span> Matched</span>
                  <span><span style={{ color: "var(--accent2)" }}>■</span> Missing from JD</span>
                  <span><span style={{ color: "var(--accent)" }}>■</span> Extra (not in JD)</span>
                </div>
              </div>
            )}

            {/* Rewrites tab */}
            {activeTab === "rewrites" && (
              <div className="card">
                <div className="card-title">✍️ AI Rewrite Suggestions</div>
                <div className="rewrite-list">
                  {result.rewrite_suggestions.map((r, i) => (
                    <div key={i} className="rewrite-item">
                      <div className="rewrite-section-label">{r.section}</div>
                      <div className="rewrite-body">
                        <div className="rewrite-original">Before: {r.original_hint}</div>
                        <div className="rewrite-suggestion">After: {r.rewrite}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
