import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { companiesService, experiencesService } from '../services/api';
import {
  Loader2, ArrowLeft, TrendingUp, ThumbsUp, BadgeCheck,
  ChevronDown, ChevronUp, Shield, X, Sparkles,
  Search, Clock, Play, Tag, ExternalLink
} from 'lucide-react';
import { SubmitExperienceModal } from '../components/intel/SubmitExperienceModal';

// ─── Config ─────────────────────────────────────────────────────────────────
const DIFF_DOT = {
  'Brain-melting': 'bg-rose-500', 'Very Hard': 'bg-rose-500', 'Hard': 'bg-rose-500',
  'Grueling': 'bg-amber-500',    'Challenging': 'bg-amber-500', 'Medium': 'bg-amber-500',
  'Easy': 'bg-[var(--signal)]',  'Smooth': 'bg-[var(--signal)]',
};
const TIER_DOT = {
  'FAANG':   'bg-violet-400',
  'Product': 'bg-[var(--signal)]',
  'Service': 'bg-sky-400',
  'Startup': 'bg-amber-400',
};
// Color palette for round nodes in the timeline
const ROUND_COLORS = [
  { border: 'border-violet-500/30', bg: 'bg-violet-500/10', text: 'text-violet-400' },
  { border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  { border: 'border-sky-500/30', bg: 'bg-sky-500/10', text: 'text-sky-400' },
  { border: 'border-amber-500/30', bg: 'bg-amber-500/10', text: 'text-amber-400' },
  { border: 'border-rose-500/30', bg: 'bg-rose-500/10', text: 'text-rose-400' },
];

const NAV_SECTIONS = [
  { id: 'process',   label: 'Process'   },
  { id: 'reports',   label: 'Reports'   },
  { id: 'questions', label: 'Questions' },
  { id: 'prep',      label: 'Prep Kit'  },
  { id: 'practice',  label: 'Practice'  },
];

// ─── Main ────────────────────────────────────────────────────────────────────
export default function CompanyDetailPage() {
  const { slug } = useParams();
  const [company, setCompany]             = useState(null);
  const [experiences, setExperiences]     = useState([]);
  const [relatedProblems, setRelatedProblems] = useState([]);
  const [relatedTopics, setRelatedTopics] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [expandedExp, setExpandedExp]     = useState(null);
  const [prepPlan, setPrepPlan]           = useState(null);
  const [prepWeaknesses, setPrepWeaknesses] = useState([]);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [planError, setPlanError]           = useState(null);
  const [showSubmit, setShowSubmit]       = useState(false);
  const [successMsg, setSuccessMsg]       = useState(false);
  const [filterOffer, setFilterOffer]     = useState('All');
  const [sortExp, setSortExp]             = useState('newest');
  const [qSearch, setQSearch]             = useState('');
  const [qType, setQType]                 = useState('All');
  const [activeSection, setActiveSection] = useState('process');
  const mainRef = useRef(null);

  const sectionRefs = {
    process:   useRef(null),
    reports:   useRef(null),
    questions: useRef(null),
    prep:      useRef(null),
    practice:  useRef(null),
  };

  // ── Data loading ────────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      companiesService.getCompany(slug),
      companiesService.getCompanyExperiences(slug),
      companiesService.getRelatedProblems(slug),
    ]).then(([compRes, expRes, relRes]) => {
      if (compRes.data.success) setCompany(compRes.data.data);
      if (expRes.data.success)  setExperiences(expRes.data.data);
      if (relRes.data.success) {
        setRelatedProblems(relRes.data.data || []);
        setRelatedTopics(relRes.data.matchedTopics || []);
      }
      setLoading(false);
    }).catch(console.error);
  }, [slug]);

  // ── Scroll spy ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;
    const handler = () => {
      const scrollTop = main.scrollTop;
      // Walk sections in reverse — first one whose offsetTop <= scrollTop+80 wins
      const entries = Object.entries(sectionRefs);
      for (let i = entries.length - 1; i >= 0; i--) {
        const [id, ref] = entries[i];
        if (ref.current && ref.current.offsetTop - 100 <= scrollTop) {
          setActiveSection(id);
          break;
        }
      }
    };
    main.addEventListener('scroll', handler, { passive: true });
    return () => main.removeEventListener('scroll', handler);
  });

  const scrollToSection = useCallback((id) => {
    const el = sectionRefs[id]?.current;
    if (!el || !mainRef.current) return;
    mainRef.current.scrollTo({ top: el.offsetTop - 56, behavior: 'smooth' });
  }, []);

  const handleUpvote = async (id) => {
    try {
      await experiencesService.upvoteExperience(id);
      setExperiences(prev => prev.map(e => e._id === id ? { ...e, upvotes: (e.upvotes || 0) + 1 } : e));
    } catch (e) { console.error(e); }
  };

  // ── Derived state ───────────────────────────────────────────────────────────
  const allQuestions = useMemo(() => {
    const qs = [];
    experiences.forEach(exp => {
      exp.rounds?.forEach(round => {
        round.questions?.forEach(q => {
          if (q.text?.trim()) {
            qs.push({
              ...q,
              roundType: round.type,
              role: exp.role,
              date: `${exp.month} ${exp.year}`,
            });
          }
        });
      });
    });
    return qs;
  }, [experiences]);

  // Topic frequency (from all community experience rounds)
  const topicFreq = useMemo(() => {
    const map = {};
    experiences.forEach(exp => {
      exp.rounds?.forEach(round => {
        round.topics?.forEach(t => { map[t] = (map[t] || 0) + 1; });
      });
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [experiences]);

  // Resource frequency
  const resourceFreq = useMemo(() => {
    const map = {};
    experiences.forEach(exp => {
      const raw = typeof exp.resourcesUsed === 'string' ? exp.resourcesUsed : '';
      raw.split(',').map(r => r.trim()).filter(Boolean).forEach(r => {
        map[r] = (map[r] || 0) + 1;
      });
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [experiences]);

  const offerYes  = experiences.filter(e => e.offerReceived === 'Yes').length;
  const offerRate = experiences.length ? Math.round((offerYes / experiences.length) * 100) : null;
  const verified  = experiences.filter(e => e.isVerified).length;

  const filteredExp = useMemo(() =>
    experiences
      .filter(e => filterOffer === 'All' || e.offerReceived === filterOffer)
      .sort((a, b) => sortExp === 'upvotes'
        ? (b.upvotes || 0) - (a.upvotes || 0)
        : new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      ),
    [experiences, filterOffer, sortExp]
  );

  const filteredQ = useMemo(() =>
    allQuestions.filter(q => {
      const matchText = !qSearch || q.text.toLowerCase().includes(qSearch.toLowerCase());
      const matchType = qType === 'All' || q.questionType === qType;
      return matchText && matchType;
    }),
    [allQuestions, qSearch, qType]
  );

  const qTypes = useMemo(
    () => ['All', ...new Set(allQuestions.map(q => q.questionType).filter(Boolean))],
    [allQuestions]
  );

  // ── Loading / error ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-zinc-700">
        <Loader2 className="h-5 w-5 animate-spin" strokeWidth={1.5} />
        <span className="font-mono text-[10px] tracking-[0.24em]">LOADING...</span>
      </div>
    );
  }
  if (!company) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2">
        <span className="font-mono text-[10px] tracking-[0.22em] text-zinc-700">COMPANY NOT FOUND</span>
        <Link to="/intel" className="mt-2 font-mono text-[10px] text-zinc-600 hover:text-[var(--signal)] transition-colors underline underline-offset-2">
          ← Back to Intel Hub
        </Link>
      </div>
    );
  }

  const rounds  = company.interviewProcess?.rounds || [];
  const diff    = company.interviewProcess?.difficulty;
  const diffDot = DIFF_DOT[diff]         || 'bg-zinc-600';
  const tierDot = TIER_DOT[company.tier] || 'bg-zinc-500';

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full min-h-0 overflow-hidden">

      {/* ════ LEFT SIDEBAR ════════════════════════════════════════════════════ */}
      <aside className="flex h-full w-[260px] shrink-0 flex-col border-r border-white/[0.04] bg-[#060608] overflow-y-auto scrollbar-surgical">

        {/* Back link */}
        <div className="flex items-center gap-2 border-b border-white/[0.04] px-5 h-12 shrink-0">
          <Link to="/intel" className="flex items-center gap-1.5 text-zinc-600 hover:text-zinc-300 transition-colors duration-200">
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.6} />
            <span className="font-mono text-[9px] tracking-[0.2em] uppercase">Intel Hub</span>
          </Link>
        </div>

        {/* Company identity */}
        <div className="px-5 pt-6 pb-5 border-b border-white/[0.04]">
          <h1 className="font-serif text-[28px] italic font-medium leading-tight text-zinc-100 mb-3">
            {company.name}
            <span style={{ color: 'var(--signal)' }}>.</span>
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <span className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${tierDot}`} />
              <span className="font-mono text-[10px] tracking-[0.12em] text-zinc-400">{company.tier}</span>
            </span>
            {diff && (
              <span className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${diffDot}`} />
                <span className="font-mono text-[10px] tracking-[0.12em] text-zinc-500">{diff}</span>
              </span>
            )}
          </div>
          {company.avgCTC && (
            <div className="mt-2.5 flex items-center gap-1.5 font-mono text-[11px] text-zinc-400">
              <TrendingUp className="h-3 w-3" strokeWidth={1.6} />
              <span>{company.avgCTC}</span>
            </div>
          )}
        </div>

        {/* Key stats 2×2 grid */}
        <div className="grid grid-cols-2 gap-px bg-white/[0.04] border-b border-white/[0.04]">
          <StatCell label="Reports"   value={experiences.length || '—'} />
          <StatCell label="Offer Rate" value={offerRate !== null ? `${offerRate}%` : '—'} accent={offerRate !== null} />
          <StatCell label="Rounds"    value={rounds.length || '—'} />
          <StatCell label="Verified"  value={verified || '—'} />
        </div>

        {/* Round breakdown (compact list) */}
        {rounds.length > 0 && (
          <div className="px-5 py-4 border-b border-white/[0.04]">
            <div className="font-mono text-[9px] tracking-[0.22em] text-zinc-700 uppercase mb-3">Interview Rounds</div>
            <div className="space-y-2">
              {rounds.map((r, i) => {
                const col = ROUND_COLORS[i % ROUND_COLORS.length];
                return (
                  <div key={i} className="flex items-center gap-2.5">
                    <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${col.bg}`} style={{ opacity: 0.9 }} />
                    <span className="font-mono text-[10px] text-zinc-500 truncate">{r.name}</span>
                    {r.duration && <span className="font-mono text-[9px] text-zinc-700 ml-auto shrink-0">{r.duration}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Topic frequency chips */}
        {topicFreq.length > 0 && (
          <div className="px-5 py-4 border-b border-white/[0.04]">
            <div className="font-mono text-[9px] tracking-[0.22em] text-zinc-700 uppercase mb-2.5">
              Hot Topics
            </div>
            <div className="flex flex-wrap gap-1.5">
              {topicFreq.map(([topic, count]) => (
                <span
                  key={topic}
                  className="rounded border border-[var(--signal)]/20 bg-[var(--signal)]/5 px-2 py-0.5 font-mono text-[9px] tracking-wide text-[var(--signal)]"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Section nav */}
        <div className="px-5 py-4 border-b border-white/[0.04]">
          <div className="font-mono text-[9px] tracking-[0.22em] text-zinc-700 uppercase mb-2">Jump to</div>
          <nav className="flex flex-col gap-0.5">
            {NAV_SECTIONS.map(s => (
              <button
                key={s.id}
                onClick={() => scrollToSection(s.id)}
                className={`press ease-signature flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left font-mono text-[11px] tracking-[0.1em] transition-all duration-200 ${
                  activeSection === s.id
                    ? 'bg-[var(--signal)]/10 text-[var(--signal)]'
                    : 'text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.03]'
                }`}
              >
                {activeSection === s.id && (
                  <span className="h-1 w-1 rounded-full bg-[var(--signal)]" />
                )}
                {s.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* CTA */}
        <div className="p-5 border-t border-white/[0.04]">
          <button
            onClick={() => setShowSubmit(true)}
            className="group w-full flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 px-4 py-2.5 text-[11px] font-bold tracking-[0.15em] text-white uppercase border border-[var(--signal)]/20 transition-all duration-500 hover:from-emerald-500/25 hover:to-teal-500/25 hover:shadow-[0_0_25px_-5px_rgba(52,211,153,0.3)]"
          >
            <Shield className="h-3.5 w-3.5 text-[var(--signal)]" strokeWidth={1.6} />
            Share Experience
          </button>
          {company.roles?.length > 0 && (
            <p className="mt-2 text-center font-mono text-[9px] text-zinc-700 leading-relaxed">
              {company.roles.slice(0, 2).join(' · ')}
            </p>
          )}
        </div>
      </aside>

      {/* ════ MAIN CONTENT (scrollable) ═══════════════════════════════════════ */}
      <div ref={mainRef} className="flex-1 overflow-y-auto scrollbar-surgical">

        {/* Sticky section tracker bar */}
        <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center justify-between border-b border-white/[0.04] bg-background/80 px-8 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--signal)] status-dot" />
            <span className="font-mono text-[10px] tracking-[0.2em] text-zinc-200 uppercase">{company.name}</span>
            <span className="mx-2 h-3 w-px bg-white/[0.06]" />
            <span className="font-mono text-[10px] tracking-[0.18em] text-zinc-600 capitalize">{activeSection}</span>
          </div>
          {experiences.length > 0 && (
            <span className="font-mono text-[10px] tracking-[0.16em] text-zinc-600">
              {experiences.length} report{experiences.length !== 1 ? 's' : ''}
              {offerRate !== null && ` · ${offerRate}% offer rate`}
            </span>
          )}
        </header>

        {/* ── § 1: Interview Process ──────────────────────────────────────── */}
        <section ref={sectionRefs.process} id="process" className="border-b border-white/[0.04] px-8 py-8">
          <SectionLabel>Interview Process · {rounds.length} round{rounds.length !== 1 ? 's' : ''}</SectionLabel>

          {rounds.length > 0 ? (
            <>
              {/* Visual horizontal timeline */}
              <div className="mt-6 flex items-start gap-0 overflow-x-auto pb-4">
                {rounds.map((round, idx) => {
                  const col = ROUND_COLORS[idx % ROUND_COLORS.length];
                  return (
                    <React.Fragment key={idx}>
                      <div className="flex flex-col items-center gap-3 min-w-[130px]">
                        <div className={`flex items-center justify-center h-10 w-10 rounded-xl border text-[11px] font-mono font-bold ${col.border} ${col.bg} ${col.text}`}>
                          {String(idx + 1).padStart(2, '0')}
                        </div>
                        <div className="text-center px-2">
                          <div className="font-sans text-[12px] font-medium text-zinc-100 leading-snug">{round.name}</div>
                          {round.duration && (
                            <div className="mt-0.5 flex items-center justify-center gap-1 font-mono text-[9px] text-zinc-600">
                              <Clock className="h-2.5 w-2.5" strokeWidth={1.5} />
                              {round.duration}
                            </div>
                          )}
                        </div>
                      </div>
                      {idx < rounds.length - 1 && (
                        <div className="flex items-center mt-5 min-w-[24px] flex-1">
                          <div className="h-px w-full bg-gradient-to-r from-white/[0.08] to-white/[0.04]" />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Round detail rows */}
              <div className="mt-4 space-y-0">
                {rounds.map((round, idx) => (
                  <div
                    key={idx}
                    className="stagger-in grid grid-cols-[52px_1fr] gap-5 border-b border-white/[0.04] py-4 hover:bg-white/[0.01] transition-colors duration-200"
                    style={{ animationDelay: `${idx * 40}ms` }}
                  >
                    <span className="font-mono text-[11px] tabular-nums text-zinc-700 pt-0.5">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <div className="flex items-center gap-3 flex-wrap mb-1">
                        <span className="font-sans text-[14px] font-medium text-zinc-100">{round.name}</span>
                        {round.duration && (
                          <span className="rounded border border-white/[0.06] px-2 py-0.5 font-mono text-[9px] tracking-widest text-zinc-600">
                            {round.duration}
                          </span>
                        )}
                      </div>
                      {round.description && (
                        <p className="font-sans text-[13px] text-zinc-500 leading-relaxed">{round.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="mt-6 py-10 text-center font-mono text-[10px] tracking-[0.2em] text-zinc-700 uppercase">
              No process data yet
            </div>
          )}

          {/* Insider tip */}
          {company.interviewProcess?.tipsSummary && (
            <div className="mt-8 flex gap-4">
              <div className="mt-1 w-0.5 shrink-0 rounded-full bg-[var(--signal)]/30 self-stretch min-h-[20px]" />
              <div>
                <div className="font-mono text-[9px] tracking-[0.22em] text-zinc-700 uppercase mb-1.5">Insider Tip</div>
                <p className="font-sans text-[13px] text-zinc-400 leading-relaxed">
                  {company.interviewProcess.tipsSummary}
                </p>
              </div>
            </div>
          )}
        </section>

        {/* ── § 2: Community Reports ──────────────────────────────────────── */}
        <section ref={sectionRefs.reports} id="reports" className="border-b border-white/[0.04] px-8 py-8">
          {/* Section header + offer rate bar */}
          <div className="flex items-center justify-between mb-5 flex-wrap gap-4">
            <SectionLabel>Community Reports · {experiences.length}</SectionLabel>
            {offerRate !== null && (
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] tracking-[0.12em] text-zinc-600">
                  {offerYes}/{experiences.length} got offers
                </span>
                <div className="h-1.5 w-20 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--signal)] transition-all duration-700"
                    style={{ width: `${offerRate}%` }}
                  />
                </div>
                <span className="font-mono text-[11px] font-semibold text-[var(--signal)]">
                  {offerRate}%
                </span>
              </div>
            )}
          </div>

          {/* Controls */}
          {experiences.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <div className="flex items-center gap-1 border border-white/[0.06] bg-white/[0.01] p-[2px]">
                {['All', 'Yes', 'No', 'Pending'].map(o => (
                  <button
                    key={o}
                    onClick={() => setFilterOffer(o)}
                    className={`press ease-signature px-3 py-1 font-mono text-[10px] tracking-[0.12em] uppercase transition-all duration-300 ${
                      filterOffer === o ? 'bg-white/[0.06] text-zinc-100' : 'text-zinc-600 hover:text-zinc-300'
                    }`}
                  >
                    {o === 'All' ? 'All' : `Offer: ${o}`}
                  </button>
                ))}
              </div>
              <div className="relative">
                <select
                  value={sortExp}
                  onChange={e => setSortExp(e.target.value)}
                  className="appearance-none rounded border border-white/[0.06] bg-white/[0.02] pl-3 pr-6 py-1.5 font-mono text-[10px] tracking-widest text-zinc-500 outline-none cursor-pointer"
                >
                  <option value="newest"  className="bg-[#0d1117]">NEWEST</option>
                  <option value="upvotes" className="bg-[#0d1117]">MOST HELPFUL</option>
                </select>
              </div>
            </div>
          )}

          {/* Experience list */}
          {filteredExp.length === 0 ? (
            <EmptyState
              label={experiences.length === 0 ? 'No reports yet' : 'No matches for this filter'}
              cta={experiences.length === 0 ? { label: 'Be the First', onClick: () => setShowSubmit(true) } : null}
            />
          ) : (
            <ul>
              {filteredExp.map((exp, i) => (
                <li
                  key={exp._id}
                  className="stagger-in border-b border-white/[0.04]"
                  style={{ animationDelay: `${Math.min(i * 25, 200)}ms` }}
                >
                  {/* Row */}
                  <div
                    className="ease-signature flex items-center justify-between py-4 cursor-pointer hover:bg-white/[0.01] transition-colors duration-200"
                    onClick={() => setExpandedExp(expandedExp === exp._id ? null : exp._id)}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-1">
                        <span className="font-sans text-[14px] font-medium text-zinc-100">{exp.role}</span>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          exp.offerReceived === 'Yes' ? 'bg-[var(--signal)]' :
                          exp.offerReceived === 'No'  ? 'bg-rose-500' : 'bg-amber-500'
                        }`} />
                        <span className="font-mono text-[10px] text-zinc-600">
                          {exp.offerReceived === 'Yes' ? 'Offer received' :
                           exp.offerReceived === 'No'  ? 'Rejected' : 'Awaiting'}
                        </span>
                        {exp.isVerified && (
                          <span className="flex items-center gap-1 rounded border border-[var(--signal)]/20 bg-[var(--signal)]/5 px-1.5 py-0.5 font-mono text-[9px] text-[var(--signal)]">
                            <BadgeCheck className="h-3 w-3" strokeWidth={1.6} /> Verified
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-4 font-mono text-[10px] text-zinc-700">
                        <span>{exp.month} {exp.year}</span>
                        {exp.difficulty && <span>{exp.difficulty}</span>}
                        {exp.college   && <span>{exp.college}</span>}
                        <span>{exp.isAnonymous ? 'Anonymous' : (exp.userId?.name || 'Anonymous')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-4 shrink-0">
                      <button
                        onClick={e => { e.stopPropagation(); handleUpvote(exp._id); }}
                        className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 font-mono text-[10px] text-zinc-600 hover:text-[var(--signal)] hover:border-[var(--signal)]/20 transition-all duration-200"
                      >
                        <ThumbsUp className="h-3 w-3" strokeWidth={1.6} />
                        <span>{exp.upvotes || 0}</span>
                      </button>
                      {expandedExp === exp._id
                        ? <ChevronUp   className="h-4 w-4 text-zinc-600" strokeWidth={1.6} />
                        : <ChevronDown className="h-4 w-4 text-zinc-600" strokeWidth={1.6} />}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {expandedExp === exp._id && (
                    <div className="pb-6 animate-in fade-in space-y-5">
                      {/* Comp table */}
                      {(exp.compensation?.base || exp.compensation?.bonus || exp.compensation?.stock) && (
                        <div className="grid grid-cols-3 gap-4 border-t border-b border-white/[0.04] py-4">
                          {exp.compensation?.base  && <CompStat label="Base"  value={exp.compensation.base}  />}
                          {exp.compensation?.bonus && <CompStat label="Bonus" value={exp.compensation.bonus} />}
                          {exp.compensation?.stock && <CompStat label="Stock" value={exp.compensation.stock} />}
                        </div>
                      )}

                      {/* Round details */}
                      {exp.rounds?.map((round, rIdx) => (
                        <div key={rIdx} className="grid grid-cols-[40px_1fr] gap-4">
                          <span className="font-mono text-[10px] text-zinc-700 pt-2.5 tabular-nums">R{rIdx + 1}</span>
                          <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <span className="font-sans text-[13px] font-medium text-zinc-200">{round.type}</span>
                              {round.duration && (
                                <span className="rounded border border-white/[0.06] px-2 py-0.5 font-mono text-[9px] text-zinc-600">
                                  {round.duration}
                                </span>
                              )}
                              {round.vibe && (
                                <span className={`rounded px-2 py-0.5 font-mono text-[9px] ${
                                  round.vibe === 'Friendly' ? 'text-[var(--signal)] bg-[var(--signal)]/10' :
                                  round.vibe === 'Grilling' ? 'text-amber-400 bg-amber-500/10'             :
                                  round.vibe === 'Hostile'  ? 'text-rose-400 bg-rose-500/10'               :
                                                              'text-zinc-500 bg-zinc-500/10'
                                }`}>
                                  {round.vibe}
                                </span>
                              )}
                            </div>

                            {round.topics?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-3">
                                {round.topics.map(t => (
                                  <span key={t} className="rounded border border-[var(--signal)]/20 bg-[var(--signal)]/5 px-2 py-0.5 font-mono text-[9px] text-[var(--signal)]">
                                    {t}
                                  </span>
                                ))}
                              </div>
                            )}

                            {round.questions?.map((q, qIdx) => (
                              <div key={qIdx} className="flex gap-3 py-2.5 border-t border-white/[0.04] first:border-t-0">
                                <span className="font-mono text-[9px] text-zinc-700 shrink-0 pt-0.5 tabular-nums">
                                  {String(qIdx + 1).padStart(2, '0')}
                                </span>
                                <p className="font-sans text-[13px] text-zinc-300 leading-snug">{q.text}</p>
                              </div>
                            ))}

                            {round.tips && (
                              <p className="mt-3 border-t border-white/[0.04] pt-3 font-sans text-[11px] text-zinc-600 italic">
                                "{round.tips}"
                              </p>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Overall advice */}
                      {exp.overallTips && (
                        <div className="flex gap-3">
                          <div className="mt-1 w-0.5 shrink-0 rounded-full bg-[var(--signal)]/20 self-stretch min-h-[20px]" />
                          <div>
                            <div className="font-mono text-[9px] tracking-[0.2em] text-zinc-700 uppercase mb-1.5">
                              Overall Advice
                            </div>
                            <p className="font-sans text-[13px] text-zinc-400 leading-relaxed">{exp.overallTips}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ── § 3: Question Bank ─────────────────────────────────────────── */}
        <section ref={sectionRefs.questions} id="questions" className="border-b border-white/[0.04] px-8 py-8">
          <SectionLabel>Question Bank · {allQuestions.length} question{allQuestions.length !== 1 ? 's' : ''}</SectionLabel>

          {allQuestions.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center gap-3 mb-1">
              {/* Inline search */}
              <div className="relative flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 min-w-[200px] focus-within:border-[var(--signal)]/30 transition-colors duration-200">
                <Search className="h-3.5 w-3.5 text-zinc-600 shrink-0" strokeWidth={1.6} />
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={qSearch}
                  onChange={e => setQSearch(e.target.value)}
                  className="flex-1 bg-transparent font-sans text-[12px] text-zinc-300 outline-none placeholder:text-zinc-700"
                />
                {qSearch && (
                  <button onClick={() => setQSearch('')} className="text-zinc-600 hover:text-zinc-400 transition-colors">
                    <X className="h-3 w-3" strokeWidth={1.6} />
                  </button>
                )}
              </div>
              {/* Type filters */}
              <div className="flex items-center gap-1 border border-white/[0.06] bg-white/[0.01] p-[2px]">
                {qTypes.map(t => (
                  <button
                    key={t}
                    onClick={() => setQType(t)}
                    className={`press ease-signature px-3 py-1 font-mono text-[10px] tracking-[0.12em] uppercase transition-all duration-300 ${
                      qType === t ? 'bg-white/[0.06] text-zinc-100' : 'text-zinc-600 hover:text-zinc-300'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredQ.length === 0 ? (
            <EmptyState label={allQuestions.length === 0 ? 'No questions documented yet' : 'No matches'} />
          ) : (
            <>
              <div className="grid grid-cols-[40px_1fr_120px_120px] items-center gap-4 py-2.5 font-mono text-[9px] tracking-[0.24em] text-zinc-700 uppercase border-b border-white/[0.06]">
                <span>No.</span>
                <span>Question</span>
                <span>Type</span>
                <span>Round · Date</span>
              </div>
              <ul>
                {filteredQ.map((q, idx) => (
                  <li
                    key={idx}
                    className="stagger-in ease-signature grid grid-cols-[40px_1fr_120px_120px] items-start gap-4 border-b border-white/[0.04] py-3.5 hover:bg-white/[0.01] transition-colors duration-200"
                    style={{ animationDelay: `${Math.min(idx * 20, 160)}ms` }}
                  >
                    <span className="font-mono text-[10px] tabular-nums text-zinc-700 pt-0.5">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <p className="font-sans text-[13px] text-zinc-200 leading-snug mb-1.5">{q.text}</p>
                      {q.topicTags?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {q.topicTags.slice(0, 3).map(t => (
                            <span key={t} className="rounded border border-white/[0.06] px-1.5 py-0.5 font-mono text-[9px] text-zinc-600">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="font-mono text-[10px] text-zinc-500">{q.questionType || '—'}</span>
                    <div className="font-mono text-[9px] text-zinc-700 space-y-0.5">
                      <div>{q.roundType}</div>
                      <div>{q.date}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        {/* ── § 4: Prep Kit ──────────────────────────────────────────────── */}
        <section ref={sectionRefs.prep} id="prep" className="border-b border-white/[0.04] px-8 py-8">
          <SectionLabel>Prep Kit</SectionLabel>

          {/* Community resources */}
          {resourceFreq.length > 0 && (
            <div className="mt-5 mb-8">
              <div className="font-mono text-[10px] tracking-[0.18em] text-zinc-600 uppercase mb-3">
                Used by this community
              </div>
              <div className="flex flex-wrap gap-2">
                {resourceFreq.map(([resource, count]) => (
                  <div
                    key={resource}
                    className="flex items-center gap-1.5 rounded border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 hover:border-white/[0.10] transition-colors duration-200"
                  >
                    <span className="font-sans text-[12px] text-zinc-300">{resource}</span>
                    {count > 1 && (
                      <span className="font-mono text-[9px] text-zinc-700">×{count}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Prep plan */}
          {!prepPlan ? (
            <div className="flex flex-col items-center justify-center gap-5 rounded-xl border border-white/[0.06] bg-white/[0.01] py-14">
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-[var(--signal)]" strokeWidth={2} />
                <span className="font-mono text-[10px] tracking-[0.22em] text-zinc-600 uppercase">AI-Powered</span>
              </div>
              <h3 className="font-sans text-[22px] font-light tracking-tight text-zinc-100 text-center">
                30-day{' '}
                <span className="font-serif italic" style={{ color: 'var(--signal)' }}>
                  {company.name}
                </span>
                {' '}prep plan
              </h3>
              <p className="font-sans text-[13px] text-zinc-600 max-w-sm text-center leading-relaxed">
                Built from {company.name}'s exact interview patterns
                {experiences.length > 0 ? ` + ${experiences.length} community reports` : ''}.
              </p>
              {planError && (
                <div className="flex items-center gap-2 rounded bg-rose-500/10 px-3 py-2 text-[11px] text-rose-400">
                  <Shield className="h-3 w-3" />
                  {planError}
                </div>
              )}
              <button
                onClick={async () => {
                  setGeneratingPlan(true);
                  setPlanError(null);
                  try {
                    const res = await companiesService.generatePrepPlan(slug, 30);
                    if (res.data.success) {
                      // Handle both string fallback or object from new API
                      if (typeof res.data.data === 'string') {
                        setPrepPlan(res.data.data);
                        setPrepWeaknesses([]);
                      } else {
                        setPrepPlan(res.data.data.plan);
                        setPrepWeaknesses(res.data.data.weaknesses || []);
                      }
                    } else {
                      setPlanError("Failed to generate plan. Please try again.");
                    }
                  } catch (e) {
                    console.error(e);
                    if (e.response?.status === 429) {
                      setPlanError("Rate limit exceeded. Please wait a moment.");
                    } else {
                      setPlanError("AI generation failed or timed out.");
                    }
                  }
                  setGeneratingPlan(false);
                }}
                disabled={generatingPlan}
                className="group flex items-center gap-3 rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 px-8 py-3.5 text-[12px] font-bold tracking-[0.18em] text-white uppercase border border-[var(--signal)]/20 transition-all duration-500 hover:from-emerald-500/25 hover:to-teal-500/25 hover:shadow-[0_0_40px_-5px_rgba(52,211,153,0.35)] hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none"
              >
                {generatingPlan
                  ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.6} />
                  : <Sparkles className="h-4 w-4 text-[var(--signal)]" strokeWidth={1.6} />}
                {generatingPlan ? 'Generating...' : 'Generate Plan'}
              </button>
            </div>
          ) : generatingPlan ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-[var(--signal)]/10 bg-[var(--signal)]/5 py-14 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--signal)]/5 to-transparent animate-[shimmer_2s_infinite] -translate-x-full" />
              <Loader2 className="h-6 w-6 animate-spin text-[var(--signal)]" strokeWidth={1.5} />
              <span className="font-mono text-[11px] tracking-[0.2em] text-[var(--signal)] uppercase animate-pulse">
                Synthesizing BKT Profile & Community Data...
              </span>
              <p className="text-[12px] text-zinc-500 font-sans text-center max-w-xs mt-2">
                Our AI is building a hyper-personalized plan tailored to your exact weaknesses. This usually takes 5-10 seconds.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-white/[0.06] bg-[#090b0e] p-6 relative overflow-hidden">
              {/* Optional: Add a subtle background glow */}
              <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-[var(--signal)]/10 blur-[60px]" />
              
              <div className="flex items-center justify-between mb-5 relative z-10">
                <div className="font-mono text-[10px] tracking-[0.22em] text-zinc-600 uppercase">
                  Your 30-Day Strategy
                </div>
                <button
                  onClick={() => { setPrepPlan(null); setPrepWeaknesses([]); }}
                  className="press rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-1.5 font-mono text-[10px] tracking-widest text-zinc-600 hover:text-[var(--signal)] uppercase transition-all duration-200"
                >
                  Reset
                </button>
              </div>

              {/* BKT Weaknesses Display */}
              {prepWeaknesses.length > 0 && (
                <div className="mb-6 rounded-lg border border-rose-500/10 bg-rose-500/5 p-4 relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-4 w-4 text-rose-400" />
                    <span className="font-mono text-[10px] tracking-[0.1em] text-rose-400 uppercase font-semibold">
                      Identified Weaknesses Target
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {prepWeaknesses.map(w => (
                      <span key={w.name} className="flex items-center gap-1.5 rounded bg-[#060608] border border-rose-500/20 px-2.5 py-1 text-[11px] text-zinc-300">
                        {w.name}
                        <span className="text-rose-500 font-mono">{Math.round(w.masteryP * 100)}%</span>
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-[11px] text-zinc-500">
                    The AI has automatically allocated extra time for these topics based on your BKT radar.
                  </p>
                </div>
              )}

              <div className="font-sans text-[14px] text-zinc-300 leading-[1.7] whitespace-pre-wrap relative z-10 markdown-body">
                {prepPlan}
              </div>
            </div>
          )}
        </section>

        {/* ── § 5: Practice These ─────────────────────────────────────────── */}
        <section ref={sectionRefs.practice} id="practice" className="px-8 py-8 pb-16">
          <SectionLabel>
            Practice These · {relatedProblems.length} problem{relatedProblems.length !== 1 ? 's' : ''}
          </SectionLabel>

          {relatedTopics.length > 0 && (
            <div className="mt-4 mb-5">
              <div className="font-mono text-[9px] tracking-[0.22em] text-zinc-700 uppercase mb-2">Matched from community topics</div>
              <div className="flex flex-wrap gap-1.5">
                {relatedTopics.slice(0, 8).map(t => (
                  <span key={t} className="flex items-center gap-1 rounded border border-[var(--signal)]/20 bg-[var(--signal)]/5 px-2 py-0.5 font-mono text-[9px] text-[var(--signal)]">
                    <Tag className="h-2 w-2" strokeWidth={1.8} />
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {relatedProblems.length === 0 ? (
            <div className="mt-6 flex flex-col items-center justify-center gap-2 py-14 rounded-xl border border-white/[0.04] bg-white/[0.01]">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-700" />
              <span className="font-mono text-[10px] tracking-[0.2em] text-zinc-700 uppercase">No problems matched yet</span>
              <Link
                to="/problems"
                className="mt-2 font-mono text-[10px] text-zinc-600 hover:text-[var(--signal)] underline underline-offset-2 transition-colors"
              >
                Browse all problems →
              </Link>
            </div>
          ) : (
            <>
              {/* Table header */}
              <div className="grid grid-cols-[1fr_80px_120px_80px] items-center gap-4 border-b border-white/[0.06] py-2.5 font-mono text-[9px] tracking-[0.24em] text-zinc-700 uppercase">
                <span>Problem</span>
                <span>Difficulty</span>
                <span>Topics</span>
                <span className="text-right">Action</span>
              </div>
              <ul>
                {relatedProblems.map((prob, idx) => {
                  const diffClass = {
                    Hard: 'text-rose-400', Medium: 'text-amber-400', Easy: 'text-[var(--signal)]'
                  }[prob.difficulty] || 'text-zinc-500';
                  return (
                    <li
                      key={prob._id}
                      className="stagger-in grid grid-cols-[1fr_80px_120px_80px] items-center gap-4 border-b border-white/[0.04] py-3.5 hover:bg-white/[0.01] transition-colors duration-200"
                      style={{ animationDelay: `${Math.min(idx * 20, 200)}ms` }}
                    >
                      <span className="font-sans text-[13px] font-medium text-zinc-200 truncate">
                        {idx + 1}. {prob.title}
                      </span>
                      <span className={`font-mono text-[10px] capitalize ${diffClass}`}>
                        {prob.difficulty || '—'}
                      </span>
                      <span className="font-mono text-[9px] text-zinc-700 truncate">
                        {prob.tags?.slice(0, 2).join(', ') || '—'}
                      </span>
                      <div className="flex justify-end">
                        <Link
                          to={`/problems/${prob._id}`}
                          className="flex items-center gap-1.5 rounded-lg border border-[var(--signal)]/20 bg-[var(--signal)]/5 px-2.5 py-1 font-mono text-[9px] tracking-widest text-[var(--signal)] hover:bg-[var(--signal)]/10 transition-all duration-200 uppercase"
                        >
                          <Play className="h-2.5 w-2.5 fill-current" />
                          Solve
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-4 flex items-center justify-between">
                <p className="font-mono text-[9px] tracking-[0.2em] text-zinc-700 uppercase">
                  Based on {experiences.length} community report{experiences.length !== 1 ? 's' : ''}
                </p>
                <Link
                  to="/problems"
                  className="flex items-center gap-1.5 font-mono text-[9px] tracking-[0.18em] text-zinc-600 hover:text-[var(--signal)] transition-colors uppercase"
                >
                  <ExternalLink className="h-2.5 w-2.5" strokeWidth={1.6} />
                  Browse all problems
                </Link>
              </div>
            </>
          )}
        </section>
      </div>

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {successMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-[var(--signal)]/20 bg-background/90 px-5 py-3 font-mono text-[11px] text-[var(--signal)] shadow-xl backdrop-blur-xl stagger-in">
          <BadgeCheck className="h-3.5 w-3.5 shrink-0" strokeWidth={1.6} />
          <span>Intel published · Thank you</span>
          <button onClick={() => setSuccessMsg(false)} className="ml-2 opacity-50 hover:opacity-100 transition-opacity">
            <X className="h-3.5 w-3.5" strokeWidth={1.6} />
          </button>
        </div>
      )}

      {/* ── Modal ──────────────────────────────────────────────────────────── */}
      {showSubmit && (
        <SubmitExperienceModal
          company={company}
          companies={[company]}
          onClose={() => setShowSubmit(false)}
          onSuccess={() => {
            setShowSubmit(false);
            setSuccessMsg(true);
            companiesService.getCompanyExperiences(slug).then(r => {
              if (r.data.success) setExperiences(r.data.data);
            });
          }}
        />
      )}
    </div>
  );
}

// ── Micro-components ────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div className="font-mono text-[9px] tracking-[0.28em] text-zinc-600 uppercase">{children}</div>
  );
}

function StatCell({ label, value, accent }) {
  return (
    <div className="bg-background/40 flex flex-col items-center justify-center gap-0.5 py-3">
      <span className={`font-mono text-[18px] font-semibold tabular-nums leading-none ${accent ? 'text-[var(--signal)]' : 'text-zinc-200'}`}>
        {value}
      </span>
      <span className="font-mono text-[8px] tracking-[0.2em] text-zinc-700 uppercase">{label}</span>
    </div>
  );
}

function CompStat({ label, value }) {
  return (
    <div>
      <div className="font-mono text-[9px] tracking-[0.18em] text-zinc-700 mb-1 uppercase">{label}</div>
      <div className="font-mono text-[15px] font-semibold text-[var(--signal)]">{value}</div>
    </div>
  );
}

function EmptyState({ label, cta }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <span className="h-1.5 w-1.5 rounded-full bg-zinc-700" />
      <span className="font-mono text-[10px] tracking-[0.2em] text-zinc-700 uppercase">{label}</span>
      {cta && (
        <button
          onClick={cta.onClick}
          className="mt-2 flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 px-6 py-2.5 text-[11px] font-bold tracking-[0.15em] text-white uppercase border border-[var(--signal)]/20 transition-all duration-500 hover:from-emerald-500/25 hover:to-teal-500/25"
        >
          <Shield className="h-3 w-3 text-[var(--signal)]" strokeWidth={1.6} />
          {cta.label}
        </button>
      )}
    </div>
  );
}
