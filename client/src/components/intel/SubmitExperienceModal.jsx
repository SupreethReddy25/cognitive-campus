import React, { useState, useEffect } from 'react';
import {
  Shield, X, Check, Loader2, Sparkles,
  ArrowRight, Lock, BadgeCheck, Building2, GraduationCap
} from 'lucide-react';
import { experiencesService, collegesService } from '../../services/api';
import GuidedNarrativeBuilder from './GuidedNarrativeBuilder';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - i);

// ─── Input primitives ───────────────────────────────────────────────────────
const Field = ({ label, required, children, hint }) => (
  <div className="space-y-2">
    <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-zinc-500 flex items-center gap-1.5">
      {label}
      {required && <span className="text-[var(--signal)]">*</span>}
      {hint && <span className="text-zinc-700 normal-case tracking-normal text-[9px]">— {hint}</span>}
    </div>
    {children}
  </div>
);

const Input = (props) => (
  <input
    {...props}
    className="w-full rounded-lg bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.14] px-4 py-2.5 text-sm text-zinc-200 outline-none focus:border-[var(--signal)]/40 focus:bg-[var(--signal)]/5 transition-all duration-200 placeholder:text-zinc-700"
  />
);

const Select = ({ children, ...props }) => (
  <select
    {...props}
    className="w-full rounded-lg bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.14] px-4 py-2.5 text-sm text-zinc-200 outline-none focus:border-[var(--signal)]/40 focus:bg-[var(--signal)]/5 transition-all duration-200 appearance-none cursor-pointer"
  >
    {children}
  </select>
);

// ─── Main Modal Component ────────────────────────────────────────────────────
export function SubmitExperienceModal({ company, companies, onClose, onSuccess }) {
  const [step, setStep]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [gnbData, setGnbData] = useState(null);

  // College typeahead
  const [colleges, setColleges]           = useState([]);
  const [collegeSearch, setCollegeSearch] = useState('');
  const [collegeDropOpen, setCollegeDropOpen] = useState(false);

  // Load colleges on mount
  useEffect(() => {
    collegesService.getColleges({ limit: 100 })
      .then(res => { if (res.data?.success) setColleges(res.data.data || []); })
      .catch(() => {});
  }, []);

  const [form, setForm] = useState({
    companyId:          company?._id || '',
    role:               '',
    offerReceived:      'Pending',
    year:               CURRENT_YEAR,
    month:              MONTHS[new Date().getMonth()],
    applicationSource:  '',
    timeline:           '',
    difficulty:         '',
    experienceRating:   '',
    cgpa:               '',
    college:            company?.college || '',  // free-text fallback
    collegeId:          '',                       // structured reference

    // Compensation
    base:       '',
    bonus:      '',
    stock:      '',
    isVerified: false,
    isAnonymous: false,

    // Assembled from GNB
    rounds:        [],
    overallTips:   '',
    resourcesUsed: '',
    prepText:      '',
    adviceText:    '',
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Filtered colleges for typeahead
  const filteredColleges = colleges.filter(c =>
    !collegeSearch ||
    c.name.toLowerCase().includes(collegeSearch.toLowerCase()) ||
    c.shortName?.toLowerCase().includes(collegeSearch.toLowerCase())
  ).slice(0, 8);

  function selectCollege(c) {
    setForm(p => ({ ...p, college: c.name, collegeId: c._id }));
    setCollegeSearch(c.name);
    setCollegeDropOpen(false);
  }

  // Company-aware template helpers
  const selectedCompanySlug = company?.slug
    || companies?.find(c => c._id === form.companyId)?.slug
    || '';
  const selectedCompanyName = company?.name
    || companies?.find(c => c._id === form.companyId)?.name
    || '';

  function handleGnbChange(data) { setGnbData(data); }

  function guessQuestionType(topics = []) {
    if (topics.some(t => ['Dynamic Programming','Graphs','Trees','Arrays','Strings','Binary Search','Two Pointers','Sliding Window','Recursion','Backtracking','BFS/DFS','Linked Lists','Heap/Priority Queue','Greedy','Stacks/Queues'].includes(t))) return 'DSA';
    if (topics.some(t => ['System Design (HLD)','Low-Level Design (LLD)','Scalability','Database Design','API Design','Microservices','Caching'].includes(t))) return 'System Design';
    if (topics.some(t => ['OS Concepts','DBMS/SQL','Computer Networks','OOP/OOAD'].includes(t))) return 'CS Fundamentals';
    if (topics.some(t => ['Leadership Principles','Behavioral (STAR)','Culture Fit','Conflict Resolution','Project Deep-Dive'].includes(t))) return 'Behavioral';
    return 'Role-specific';
  }

  function handleFinalize() {
    if (!gnbData) { setStep(4); return; }

    setForm(prev => ({
      ...prev,
      rounds: gnbData.rounds
        .filter(r => r.type)
        .map(r => ({
          type:      r.type,
          duration:  r.duration || '',
          vibe:      r.vibe || '',
          topics:    r.topics || [],
          questions: (r.questions || []).filter(q => q.text?.trim()).map(q => ({
            text:         q.text,
            questionType: guessQuestionType(r.topics),
            topicTags:    r.topics,
          })),
          tips: r.notes || '',
        })),
      resourcesUsed: gnbData.resources?.join(', ') || '',
      overallTips:   gnbData.tips?.join('. ')      || '',
      prepText: [
        gnbData.prepNotes,
        gnbData.prepDuration ? `Prepared for ${gnbData.prepDuration}.` : '',
      ].filter(Boolean).join(' '),
      adviceText: [
        gnbData.retrospective,
        gnbData.overallFeel ? `Overall: ${gnbData.overallFeel}.` : '',
      ].filter(Boolean).join(' '),
    }));

    setStep(4);
  }

  const handleSubmit = async () => {
    if (!form.companyId || !form.role) {
      setError('Company and Role are required.');
      return;
    }
    setLoading(true); setError(null);
    try {
      const submissionData = { ...form };
      // Build compensation object only if any field filled
      if (form.base || form.bonus || form.stock) {
        submissionData.compensation = { base: form.base, bonus: form.bonus, stock: form.stock };
      }
      // Clean up flat comp fields
      delete submissionData.base;
      delete submissionData.bonus;
      delete submissionData.stock;

      const res = await experiencesService.createExperience(submissionData);
      if (res.data.success) { onSuccess(); }
      else setError('Submission failed. Please try again.');
    } catch {
      setError('Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const STEPS = [
    { n: 1, label: 'Context' },
    { n: 2, label: 'Comp & Verify' },
    { n: 3, label: 'Intel Capture' },
    { n: 4, label: 'Review' },
  ];

  const canAdvanceStep1 = !!form.companyId && !!form.role;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#010104]/92 backdrop-blur-sm animate-in fade-in duration-200" />

      {/* Modal */}
      <div
        className="relative w-full max-w-4xl rounded-2xl bg-[#0a0f16]/95 border border-white/[0.07] border-t-[var(--signal)]/30 shadow-[0_40px_100px_rgba(0,0,0,0.85),0_0_60px_-20px_rgba(16,185,129,0.08)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-250 backdrop-blur-xl"
        style={{ maxHeight: 'calc(100vh - 48px)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-white/[0.05] shrink-0">
          <div>
            <div className="flex items-center gap-2 text-[var(--signal)] mb-1.5">
              <Shield className="h-3.5 w-3.5" strokeWidth={1.6} />
              <span className="font-mono text-[9px] tracking-[0.25em] uppercase">Share Intelligence</span>
            </div>
            <h2 className="text-[20px] font-extralight tracking-tight text-zinc-100">
              {company?.name ? (
                <>{company.name}<span className="font-serif italic" style={{ color: 'var(--signal)' }}>.</span> Interview</>
              ) : (
                <>New Interview <span className="font-serif italic" style={{ color: 'var(--signal)' }}>Experience.</span></>
              )}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="press rounded-lg p-2 text-zinc-600 hover:bg-white/[0.05] hover:text-zinc-200 transition-all duration-200"
          >
            <X className="h-4.5 w-4.5" strokeWidth={1.6} />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-8 py-4 border-b border-white/[0.04] shrink-0 flex items-center gap-0 bg-black/20">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.n}>
              <button
                onClick={() => step > s.n && setStep(s.n)}
                className={`flex flex-col items-center gap-1 group transition-all ${step > s.n ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div className={`h-7 w-7 flex items-center justify-center text-[11px] font-bold font-mono transition-all duration-300 ${
                  step === s.n
                    ? 'bg-[var(--signal)] text-emerald-950 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                    : step > s.n
                    ? 'bg-[var(--signal)]/15 text-[var(--signal)] border border-[var(--signal)]/30'
                    : 'bg-white/[0.04] border border-white/[0.08] text-zinc-600'
                }`}>
                  {step > s.n ? <Check className="h-3.5 w-3.5" /> : s.n}
                </div>
                <span className={`text-[9px] font-mono uppercase tracking-wider ${
                  step === s.n ? 'text-[var(--signal)]' : 'text-zinc-700'
                }`}>{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-2 mb-5 transition-all duration-500 ${
                  step > s.n ? 'bg-[var(--signal)]/30' : 'bg-white/[0.05]'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto scrollbar-surgical p-8">

          {/* ── STEP 1: Context ── */}
          {step === 1 && (
            <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in slide-in-from-right-3 duration-400">
              <div className="mb-6">
                <h3 className="text-base font-bold text-zinc-100 mb-1 uppercase tracking-widest">The Basics</h3>
                <p className="text-xs text-zinc-600">Hard facts that help others filter and benchmark their journey.</p>
              </div>

              {/* Company (if not pre-set) */}
              {!company?._id && (
                <Field label="Company" required>
                  <Select
                    value={form.companyId}
                    onChange={e => set('companyId', e.target.value)}
                  >
                    <option value="">Select a company...</option>
                    {(companies || []).map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </Select>
                  {(!companies || companies.length === 0) && (
                    <p className="text-[10px] text-zinc-700 mt-1">Loading companies...</p>
                  )}
                </Field>
              )}

              {/* Company display when pre-selected */}
              {company?._id && (
                <div className="flex items-center gap-3 p-3 rounded-lg border border-[var(--signal)]/20 bg-[var(--signal)]/5">
                  <Building2 className="h-4 w-4 text-[var(--signal)] shrink-0" strokeWidth={1.6} />
                  <div>
                    <div className="text-sm font-semibold text-zinc-200">{company.name}</div>
                    <div className="text-[10px] text-zinc-600 font-mono">{company.tier} · {company.avgCTC}</div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-5">
                <Field label="Role / Position" required>
                  <Input
                    placeholder="e.g. SDE-1, Data Engineer"
                    value={form.role}
                    onChange={e => set('role', e.target.value)}
                  />
                </Field>
                <Field label="Outcome" required>
                  <Select value={form.offerReceived} onChange={e => set('offerReceived', e.target.value)}>
                    <option value="Pending">⏳ Awaiting Decision</option>
                    <option value="Yes">✓ Offer Received</option>
                    <option value="No">✗ Rejected</option>
                  </Select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <Field label="Month">
                  <Select value={form.month} onChange={e => set('month', e.target.value)}>
                    {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                  </Select>
                </Field>
                <Field label="Year">
                  <Select value={form.year} onChange={e => set('year', +e.target.value)}>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </Select>
                </Field>
              </div>

              {/* College + CGPA row */}
              <div className="grid grid-cols-[1fr_140px] gap-5 relative">
                <Field label="Your College / University">
                  <div className="relative">
                    <input
                      value={collegeSearch || form.college}
                      onChange={e => {
                        setCollegeSearch(e.target.value);
                        set('college', e.target.value);
                        set('collegeId', '');
                        setCollegeDropOpen(true);
                      }}
                      onFocus={() => setCollegeDropOpen(true)}
                      onBlur={() => setTimeout(() => setCollegeDropOpen(false), 200)}
                      placeholder="e.g. NIT Trichy, IIT Bombay..."
                      className="w-full rounded-lg bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.14] px-4 py-2.5 text-sm text-zinc-200 outline-none focus:border-[var(--signal)]/40 focus:bg-[var(--signal)]/5 transition-all duration-200 placeholder:text-zinc-700"
                    />
                    {collegeDropOpen && filteredColleges.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-lg bg-[#0d1420] border border-white/[0.1] shadow-2xl overflow-hidden">
                        {filteredColleges.map(c => (
                          <button
                            key={c._id}
                            type="button"
                            onMouseDown={() => selectCollege(c)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/[0.06] transition-colors"
                          >
                            <GraduationCap className="h-3.5 w-3.5 text-zinc-600 shrink-0" strokeWidth={1.6} />
                            <div className="min-w-0">
                              <div className="text-sm text-zinc-200 truncate">{c.name}</div>
                              <div className="text-[10px] text-zinc-600 font-mono">{c.tier} · {c.location}</div>
                            </div>
                            {form.collegeId === c._id && (
                              <Check className="h-3.5 w-3.5 text-[var(--signal)] ml-auto shrink-0" strokeWidth={2} />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </Field>
                <Field label="CGPA / %">
                  <Input
                    placeholder="e.g. 8.4 / 87%"
                    value={form.cgpa}
                    onChange={e => set('cgpa', e.target.value)}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <Field label="Application Source">
                  <Select value={form.applicationSource} onChange={e => set('applicationSource', e.target.value)}>
                    <option value="">Select...</option>
                    <option value="Campus">On-Campus / University</option>
                    <option value="Referral">Employee Referral</option>
                    <option value="Career Page">Company Career Page</option>
                    <option value="LinkedIn">LinkedIn / Cold Reach</option>
                    <option value="Recruiter">Recruiter Reached Out</option>
                    <option value="Naukri">Naukri / Indeed</option>
                    <option value="PPO">Internship PPO</option>
                  </Select>
                </Field>
                <Field label="Process Timeline">
                  <Select value={form.timeline} onChange={e => set('timeline', e.target.value)}>
                    <option value="">Select...</option>
                    <option value="< 1 week">Lightning (&lt; 1 week)</option>
                    <option value="1-2 weeks">Fast (1-2 weeks)</option>
                    <option value="3-4 weeks">Standard (3-4 weeks)</option>
                    <option value="1-2 months">Slow (1-2 months)</option>
                    <option value="3+ months">Glacial (3+ months)</option>
                  </Select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <Field label="Overall Difficulty" hint="of the entire process">
                  <Select value={form.difficulty} onChange={e => set('difficulty', e.target.value)}>
                    <option value="">Select...</option>
                    <option value="Smooth">😌 Smooth (standard questions, chill)</option>
                    <option value="Challenging">🤔 Challenging (tricky edge cases)</option>
                    <option value="Grueling">😤 Grueling (intense grilling)</option>
                    <option value="Brain-melting">💀 Brain-melting (CP-level / hostile)</option>
                  </Select>
                </Field>
                <Field label="Interviewer Vibe">
                  <Select value={form.experienceRating} onChange={e => set('experienceRating', e.target.value)}>
                    <option value="">Select...</option>
                    <option value="Positive">😊 Positive (professional, polite)</option>
                    <option value="Neutral">😐 Neutral (standard)</option>
                    <option value="Negative">😠 Negative (rude, unorganized)</option>
                  </Select>
                </Field>
              </div>

              {error && (
                <div className="p-3 border border-red-500/20 bg-red-500/10 text-red-400 text-sm text-center rounded-lg">
                  {error}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  disabled={!canAdvanceStep1}
                  onClick={() => setStep(2)}
                  className="group flex items-center gap-3 rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 px-7 py-3 text-[12px] font-bold tracking-[0.18em] text-white uppercase transition-all duration-500 hover:from-emerald-500/25 hover:to-teal-500/25 hover:shadow-[0_0_30px_-5px_rgba(52,211,153,0.3)] hover:-translate-y-0.5 border border-[var(--signal)]/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none"
                >
                  Continue
                  <ArrowRight className="h-3.5 w-3.5 text-emerald-400/70 transition-transform duration-300 group-hover:translate-x-0.5" strokeWidth={2} />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: Comp & Verification ── */}
          {step === 2 && (
            <div className="space-y-7 max-w-2xl mx-auto animate-in fade-in slide-in-from-right-3 duration-400">
              <div className="mb-8">
                <h3 className="text-base font-bold text-zinc-100 mb-1 uppercase tracking-widest">Compensation & Verification</h3>
                <p className="text-xs text-zinc-600">Highly requested by the community. Completely optional — skip freely.</p>
              </div>

              {/* Verified Badge */}
              <div className="rounded-xl p-5 border border-[var(--signal)]/15 bg-[var(--signal)]/5 relative overflow-hidden">
                <div className="absolute -right-8 -top-8 text-[var(--signal)]/8">
                  <BadgeCheck className="h-32 w-32" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 text-[var(--signal)] font-semibold mb-2 text-sm">
                    <BadgeCheck className="h-4 w-4" strokeWidth={1.6} /> Get Verified Status
                  </div>
                  <p className="text-zinc-500 text-xs mb-5 max-w-sm leading-relaxed">
                    Verified experiences are pinned to the top of company pages and get 10× more views. Upload your offer letter — we delete it after review.
                  </p>
                  {form.isVerified ? (
                    <div className="inline-flex items-center gap-2 rounded-lg text-[var(--signal)] border border-[var(--signal)]/30 bg-[var(--signal)]/10 px-4 py-2 font-mono text-xs">
                      <Check className="h-3.5 w-3.5" strokeWidth={2} /> Proof Uploaded
                    </div>
                  ) : (
                    <button
                      onClick={() => set('isVerified', true)}
                      className="press rounded-lg font-mono text-xs text-zinc-400 border border-white/[0.08] hover:border-white/[0.16] px-5 py-2.5 transition-all duration-200 hover:text-zinc-200 hover:bg-white/[0.03]"
                    >
                      + Upload Offer PDF
                    </button>
                  )}
                </div>
              </div>

              {/* Compensation */}
              {form.offerReceived === 'Yes' && (
                <div className="space-y-5">
                  <div className="text-[9px] font-mono tracking-[0.2em] uppercase text-zinc-600 border-b border-white/[0.05] pb-2">Compensation Breakdown</div>
                  <div className="grid grid-cols-3 gap-4">
                    <Field label="Base Salary">
                      <Input placeholder="e.g. 24 LPA" value={form.base} onChange={e => set('base', e.target.value)} />
                    </Field>
                    <Field label="Sign-on / Bonus">
                      <Input placeholder="e.g. 5L" value={form.bonus} onChange={e => set('bonus', e.target.value)} />
                    </Field>
                    <Field label="Stock (RSUs)">
                      <Input placeholder="e.g. 20L / 4yrs" value={form.stock} onChange={e => set('stock', e.target.value)} />
                    </Field>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-4">
                <button onClick={() => setStep(1)} className="press rounded-lg px-4 py-2 font-mono text-[11px] tracking-[0.12em] text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.03] transition-all duration-200 uppercase">
                  ← Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="group flex items-center gap-3 rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 px-7 py-3 text-[12px] font-bold tracking-[0.18em] text-white uppercase transition-all duration-500 hover:from-emerald-500/25 hover:to-teal-500/25 hover:shadow-[0_0_30px_-5px_rgba(52,211,153,0.3)] hover:-translate-y-0.5 border border-[var(--signal)]/20"
                >
                  Capture Intel
                  <ArrowRight className="h-3.5 w-3.5 text-emerald-400/70 transition-transform duration-300 group-hover:translate-x-0.5" strokeWidth={2} />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Guided Narrative Builder ── */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-3 duration-400">
              <div className="mb-8 max-w-3xl mx-auto">
                <h3 className="text-base font-bold text-zinc-100 mb-1 uppercase tracking-widest">Smart Intel Capture</h3>
                <p className="text-xs text-zinc-600">Paste a raw brain dump and let AI structure it — or fill the guided form manually. Both paths lead to the same result.</p>
              </div>

              <GuidedNarrativeBuilder
                companySlug={selectedCompanySlug}
                companyName={selectedCompanyName}
                onChange={handleGnbChange}
              />

              {error && (
                <div className="mt-6 max-w-3xl mx-auto p-3 border border-red-500/20 bg-red-500/10 text-red-400 text-sm text-center">
                  {error}
                </div>
              )}

              <div className="flex justify-between items-center pt-8 max-w-3xl mx-auto">
                <button onClick={() => setStep(2)} className="press rounded-lg px-4 py-2 font-mono text-[11px] tracking-[0.12em] text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.03] transition-all duration-200 uppercase">
                  ← Back
                </button>
                <button
                  onClick={handleFinalize}
                  className="group flex items-center gap-3 rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 px-7 py-3 text-[12px] font-bold tracking-[0.18em] text-white uppercase transition-all duration-500 hover:from-emerald-500/25 hover:to-teal-500/25 hover:shadow-[0_0_30px_-5px_rgba(52,211,153,0.3)] hover:-translate-y-0.5 border border-[var(--signal)]/20"
                >
                  <Sparkles className="h-3.5 w-3.5 text-[var(--signal)]" strokeWidth={1.6} /> Finalize & Review
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 4: Review & Publish ── */}
          {step === 4 && (
            <div className="space-y-8 max-w-2xl mx-auto text-center py-6 animate-in fade-in slide-in-from-right-3 duration-400">
              {/* Icon */}
              <div className="relative inline-flex">
                <div className="h-20 w-20 rounded-2xl border border-[var(--signal)]/30 bg-[var(--signal)]/10 flex items-center justify-center shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)]">
                  <Check className="h-10 w-10 text-[var(--signal)]" strokeWidth={1.5} />
                </div>
                <div className="absolute inset-0 rounded-2xl animate-ping border border-[var(--signal)]/10" style={{ animationDuration: '2.5s' }} />
              </div>

              <div>
                <h3 className="text-2xl font-bold text-zinc-100 mb-2">Intel Structured</h3>
                <p className="text-zinc-500 text-sm max-w-md mx-auto leading-relaxed">
                  {form.rounds?.length > 0
                    ? `Captured ${form.rounds.length} round${form.rounds.length > 1 ? 's' : ''} with detailed topic tags. Ready to publish.`
                    : 'Your experience has been structured and is ready to publish.'
                  }
                </p>
              </div>

              {/* Summary card */}
              <div className="text-left border border-white/[0.05] p-5 space-y-3 rounded-lg">
                <div className="text-[9px] font-mono uppercase tracking-widest text-zinc-700 mb-3">Preview</div>

                {/* Basic info row */}
                <div className="flex flex-wrap gap-3 text-xs">
                  <span className="flex items-center gap-1.5 text-zinc-400">
                    <span className="text-zinc-600">Company:</span>
                    <span className="text-zinc-200 font-medium">{selectedCompanyName || '—'}</span>
                  </span>
                  <span className="text-zinc-700">·</span>
                  <span className="flex items-center gap-1.5 text-zinc-400">
                    <span className="text-zinc-600">Role:</span>
                    <span className="text-zinc-200 font-medium">{form.role || '—'}</span>
                  </span>
                  <span className="text-zinc-700">·</span>
                  <span className={`font-semibold ${form.offerReceived === 'Yes' ? 'text-emerald-400' : form.offerReceived === 'No' ? 'text-red-400' : 'text-amber-400'}`}>
                    {form.offerReceived === 'Yes' ? '✓ Offer' : form.offerReceived === 'No' ? '✗ Rejected' : '⏳ Pending'}
                  </span>
                </div>

                {form.college && (
                  <div className="text-xs text-zinc-500">
                    <span className="text-zinc-700">College:</span> {form.college}
                    {form.cgpa && <span className="ml-2 text-zinc-700">· CGPA: <span className="text-zinc-400">{form.cgpa}</span></span>}
                  </div>
                )}

                {/* Rounds */}
                {form.rounds?.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-white/[0.04]">
                    {form.rounds.map((r, i) => (
                      <div key={i} className="flex items-center gap-3 text-xs">
                        <span className="text-zinc-700 font-mono w-4 text-right shrink-0">{i + 1}.</span>
                        <span className="text-zinc-300 font-medium">{r.type}</span>
                        {r.duration && <span className="text-zinc-600">· {r.duration}</span>}
                        {r.vibe && <span className="text-zinc-600">· {r.vibe}</span>}
                        {r.topics?.length > 0 && (
                          <div className="flex flex-wrap gap-1 ml-1">
                            {r.topics.slice(0, 3).map(t => (
                              <span key={t} className="text-[var(--signal)] bg-[var(--signal)]/10 px-1.5 py-0.5 font-mono text-[9px]">{t}</span>
                            ))}
                            {r.topics.length > 3 && <span className="text-zinc-700 text-[9px]">+{r.topics.length - 3}</span>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {form.rounds?.length === 0 && (
                  <p className="text-xs text-zinc-700 italic">No rounds captured — you can go back to Step 3 to add them.</p>
                )}
              </div>

              {/* Anonymous toggle */}
              <div
                className="inline-flex items-center gap-3 cursor-pointer py-4 group mx-auto"
                onClick={() => set('isAnonymous', !form.isAnonymous)}
              >
                <div className={`h-5 w-5 border flex items-center justify-center transition-all ${
                  form.isAnonymous
                    ? 'border-[var(--signal)] bg-[var(--signal)]'
                    : 'border-zinc-700 group-hover:border-zinc-500'
                }`}>
                  {form.isAnonymous && <Check className="h-3.5 w-3.5 text-emerald-950" />}
                </div>
                <div className="text-sm text-zinc-400 flex items-center gap-2 group-hover:text-zinc-300 transition-colors">
                  <Lock className="h-3.5 w-3.5 text-zinc-600" /> Post anonymously
                </div>
              </div>

              {error && <div className="text-red-400 text-sm">{error}</div>}

              <div className="flex justify-between items-center pt-2">
                <button onClick={() => setStep(3)} className="press rounded-lg px-4 py-2 font-mono text-[11px] tracking-[0.12em] text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.03] transition-all duration-200 uppercase">
                  ← Edit Intel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="group flex items-center gap-3 rounded-full bg-gradient-to-r from-emerald-500/15 to-teal-500/15 px-9 py-3.5 text-[12px] font-bold tracking-[0.18em] text-white uppercase transition-all duration-500 hover:from-emerald-500/30 hover:to-teal-500/30 hover:shadow-[0_0_40px_-5px_rgba(52,211,153,0.4)] hover:-translate-y-0.5 border border-[var(--signal)]/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
                >
                  {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.6} /> : <BadgeCheck className="h-3.5 w-3.5 text-[var(--signal)]" strokeWidth={1.6} />}
                  {loading ? 'Publishing...' : 'Publish Intelligence'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
