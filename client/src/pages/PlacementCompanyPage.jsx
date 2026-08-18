import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { collegesService } from '../services/api';
import {
  ArrowLeft, Building2, GraduationCap, Loader2, AlertCircle,
  ChevronDown, ChevronUp, ThumbsUp, BadgeCheck,
  Shield, Plus, CheckCircle2, Users, Calendar
} from 'lucide-react';
import { PrepPriorities } from '../components/placement/PrepPriorities';
import { DataConfidenceBadge, TopicBar } from '../components/placement/PlacementUIComponents';
import { SubmitExperienceModal } from '../components/intel/SubmitExperienceModal';

const TIER_COLORS = {
  FAANG:   'text-violet-400 bg-violet-400/10 border-violet-400/20',
  Product: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  Service: 'text-sky-400 bg-sky-400/10 border-sky-400/20',
  Startup: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  Other:   'text-zinc-500 bg-zinc-500/10 border-zinc-500/20',
};

const DIFF_DOT = {
  'Brain-melting': 'bg-rose-500', 'Very Hard': 'bg-rose-500', 'Hard': 'bg-rose-500',
  'Grueling': 'bg-amber-500', 'Challenging': 'bg-amber-500', 'Medium': 'bg-amber-500',
  'Easy': 'bg-emerald-500', 'Smooth': 'bg-emerald-500',
};

// ─── Experience Card ──────────────────────────────────────────────────────────
function ExperienceCard({ exp }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.1] transition-all duration-200">
      <button
        className="w-full text-left px-5 py-4 flex items-start justify-between gap-3"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-2 h-2 rounded-full shrink-0 mt-1 ${
            exp.offerReceived === 'Yes' ? 'bg-emerald-500' :
            exp.offerReceived === 'No' ? 'bg-rose-500' : 'bg-zinc-600'
          }`} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-zinc-200">{exp.role}</span>
              <span className="text-xs text-zinc-600">{exp.month} {exp.year}</span>
              {exp.isVerified && (
                <div className="flex items-center gap-1 text-emerald-400 text-[10px]">
                  <BadgeCheck className="h-3 w-3" strokeWidth={2} />
                  Verified
                </div>
              )}
              {exp.source === 'curated' && (
                <span className="text-[10px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded">Curated</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {exp.difficulty && (
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${DIFF_DOT[exp.difficulty] || 'bg-zinc-600'}`} />
                  <span className="text-[11px] text-zinc-500">{exp.difficulty}</span>
                </div>
              )}
              {exp.offerReceived !== 'Pending' && (
                <span className={`text-[11px] ${exp.offerReceived === 'Yes' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {exp.offerReceived === 'Yes' ? 'Offer received' : 'No offer'}
                </span>
              )}
              {exp.roundCount > 0 && (
                <span className="text-[11px] text-zinc-600">{exp.roundCount} round{exp.roundCount !== 1 ? 's' : ''}</span>
              )}
            </div>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-3">
          {exp.upvotes > 0 && (
            <div className="flex items-center gap-1 text-zinc-500 text-xs">
              <ThumbsUp className="h-3 w-3" strokeWidth={1.6} />
              {exp.upvotes}
            </div>
          )}
          {expanded
            ? <ChevronUp className="h-4 w-4 text-zinc-600" strokeWidth={1.6} />
            : <ChevronDown className="h-4 w-4 text-zinc-600" strokeWidth={1.6} />
          }
        </div>
      </button>

      {expanded && (
        <div className="border-t border-white/[0.06] px-5 pb-5 pt-4 space-y-4">
          {/* Rounds */}
          {exp.rounds?.map((round, i) => (
            <div key={i} className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-zinc-300">{round.type}</span>
                {round.duration && <span className="text-[11px] text-zinc-600">{round.duration}</span>}
              </div>
              {round.topics?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {round.topics.map(t => (
                    <span key={t} className="text-[10px] font-mono bg-[var(--signal)]/5 border border-[var(--signal)]/10 rounded px-2 py-0.5 text-[var(--signal)]/80">
                      {t}
                    </span>
                  ))}
                </div>
              )}
              {round.questions?.map((q, qi) => (
                <div key={qi} className="text-xs text-zinc-400 leading-relaxed mb-1.5">
                  Q{qi + 1}: {q.text}
                </div>
              ))}
              {round.tips && (
                <p className="text-[11px] text-zinc-600 italic mt-2 border-t border-white/[0.04] pt-2">
                  Tip: {round.tips}
                </p>
              )}
            </div>
          ))}

          {/* Overall tips */}
          {exp.overallTips && (
            <div className="rounded-xl bg-[var(--signal)]/5 border border-[var(--signal)]/10 p-4">
              <p className="text-[11px] font-mono tracking-[0.1em] text-[var(--signal)]/60 mb-1 uppercase">Overall Tips</p>
              <p className="text-xs text-zinc-300 leading-relaxed">{exp.overallTips}</p>
            </div>
          )}

          {/* Resources */}
          {exp.resourcesUsed && (
            <p className="text-[11px] text-zinc-600">
              <span className="text-zinc-500">Resources: </span>{exp.resourcesUsed}
            </p>
          )}

          {/* Author */}
          {exp.author && (
            <p className="text-[11px] text-zinc-700">— {exp.author}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Placement Record Table ───────────────────────────────────────────────────
function PlacementRecordsTable({ records }) {
  if (!records?.length) return null;

  return (
    <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
      <div className="px-5 py-3 border-b border-white/[0.06] flex items-center gap-2">
        <Shield className="h-4 w-4 text-zinc-500" strokeWidth={1.6} />
        <h3 className="text-sm font-semibold text-zinc-300">Verified Placement Records</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/[0.04]">
              {['Year', 'Season', 'Roles', 'Package', 'Eligibility', 'Students'].map(h => (
                <th key={h} className="px-4 py-2 text-left text-[10px] font-mono tracking-[0.1em] text-zinc-600 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map((rec, i) => (
              <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3 text-zinc-300 font-medium tabular-nums">{rec.hiringYear}</td>
                <td className="px-4 py-3 text-zinc-500">{rec.hiringSeason}</td>
                <td className="px-4 py-3 text-zinc-400">{rec.roles?.join(', ') || '—'}</td>
                <td className="px-4 py-3 text-zinc-400">{rec.packageOffered?.ctc || '—'}</td>
                <td className="px-4 py-3 text-zinc-500">
                  {rec.eligibility?.minCGPA ? `≥ ${rec.eligibility.minCGPA} CGPA` : '—'}
                </td>
                <td className="px-4 py-3 text-zinc-500">{rec.studentsHired ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function PlacementCompanyPage() {
  const { companySlug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [showSubmit, setShowSubmit] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [filterOffer, setFilterOffer] = useState('All');

  // Derive college slug from user profile
  const userCollege = user?.collegeId && typeof user.collegeId === 'object' && user.collegeId.slug
    ? user.collegeId : null;
  const [resolvedCollege, setResolvedCollege] = useState(userCollege);

  // If collegeId is an ObjectId (not populated), resolve it
  useEffect(() => {
    if (user?.collegeId && !resolvedCollege) {
      usersService.getProfile()
        .then(res => {
          const u = res.data?.data?.user || res.data?.user;
          if (u?.collegeId && typeof u.collegeId === 'object' && u.collegeId.slug) {
            setResolvedCollege(u.collegeId);
          }
        })
        .catch(() => null);
    }
  }, [user?.collegeId]);

  const collegeSlug = resolvedCollege?.slug;

  const load = useCallback(() => {
    if (!collegeSlug) return;
    setLoading(true);
    collegesService.getCollegeCompanyIntel(collegeSlug, companySlug)
      .then(res => {
        if (res.data.success) setData(res.data.data || res.data);
        else setError('Failed to load intel.');
      })
      .catch(() => setError('Failed to load intel.'))
      .finally(() => setLoading(false));
  }, [collegeSlug, companySlug]);

  useEffect(() => { load(); }, [load]);

  // ── Guard: no college set ────────────────────────────────────────────────
  if (!collegeSlug) {
    return (
      <div className="p-8 max-w-md mx-auto text-center">
        <GraduationCap className="h-12 w-12 text-zinc-700 mx-auto mb-4" strokeWidth={1.2} />
        <h2 className="text-lg font-semibold text-zinc-300 mb-2">Set your college first</h2>
        <p className="text-sm text-zinc-600 mb-4">Go to your Placement dashboard to select your college.</p>
        <Link to="/placement" className="text-sm text-[var(--signal)] hover:opacity-80 transition-opacity">
          ← Go to Placement Dashboard
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-[var(--signal)]" strokeWidth={1.6} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <Link to="/placement" className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" strokeWidth={1.6} /> Back to Placement
        </Link>
        <div className="flex items-center gap-2 text-rose-400">
          <AlertCircle className="h-5 w-5" strokeWidth={1.6} />
          <p className="text-sm">{error || 'No data available.'}</p>
        </div>
        {/* If dataConfidence is none, offer to go global */}
        <div className="mt-4">
          <Link to={`/companies/${companySlug}`} className="text-sm text-[var(--signal)] hover:opacity-80 transition-opacity">
            View global intel for this company →
          </Link>
        </div>
      </div>
    );
  }

  const { college, company, stats, experiences, placementRecords, prepPriorities, dataConfidence } = data;

  // Filter experiences
  const filteredExps = experiences.filter(exp => {
    if (filterOffer === 'All') return true;
    if (filterOffer === 'Offer') return exp.offerReceived === 'Yes';
    if (filterOffer === 'No Offer') return exp.offerReceived === 'No';
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      {/* ── Back nav ──────────────────────────────────────────────────────────── */}
      <Link
        to="/placement"
        className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.6} />
        Back to {college?.shortName} Placement
      </Link>

      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-zinc-100">{company?.name}</h1>
              <span className="text-zinc-600">at</span>
              <span className="text-xl font-semibold text-zinc-400">{college?.name}</span>
            </div>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {company?.tier && (
                <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${TIER_COLORS[company.tier] || TIER_COLORS.Other}`}>
                  {company.tier}
                </span>
              )}
              <DataConfidenceBadge confidence={dataConfidence} count={stats.totalReports} />
              {stats.offerRate !== null && (
                <span className="text-sm text-zinc-400">
                  <span className="font-bold text-zinc-100">{stats.offerRate}%</span> offer rate
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to={`/companies/${companySlug}`}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors border border-white/[0.06] rounded-lg px-3 py-1.5"
            >
              Global intel →
            </Link>
            <button
              onClick={() => setShowSubmit(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--signal)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
              Share Experience
            </button>
          </div>
        </div>

        {/* Stats mini-row */}
        {stats.yearsActive?.length > 0 && (
          <div className="flex items-center gap-2 text-[11px] text-zinc-600">
            <Calendar className="h-3.5 w-3.5" strokeWidth={1.6} />
            Active: {stats.yearsActive.join(', ')}
          </div>
        )}
      </div>

      {/* ── Main 2-col layout ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Prep priorities + experiences (3/5) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Prep Priorities — THE KEY SECTION */}
          <PrepPriorities
            prepPriorities={prepPriorities}
            companyName={company?.name}
            collegeName={college?.shortName}
          />

          {/* Experiences */}
          <div>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h2 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                <Users className="h-4 w-4 text-zinc-500" strokeWidth={1.6} />
                Reported Experiences
                <span className="text-zinc-600 font-normal">({stats.totalReports})</span>
              </h2>
              {/* Offer filter */}
              <div className="flex items-center gap-1.5">
                {['All', 'Offer', 'No Offer'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFilterOffer(f)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg transition-colors ${
                      filterOffer === f
                        ? 'bg-[var(--signal)]/10 text-[var(--signal)] border border-[var(--signal)]/20'
                        : 'text-zinc-600 hover:text-zinc-400'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {dataConfidence === 'none' ? (
              <div className="rounded-2xl border border-dashed border-white/[0.06] p-8 text-center">
                <p className="text-sm text-zinc-600 mb-3">No experiences reported for {company?.name} at {college?.name} yet.</p>
                <button
                  onClick={() => setShowSubmit(true)}
                  className="text-sm text-[var(--signal)] hover:opacity-80 transition-opacity"
                >
                  Be the first to share →
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredExps.length === 0 ? (
                  <p className="text-sm text-zinc-600 py-4">No experiences match the current filter.</p>
                ) : (
                  filteredExps.map((exp, i) => (
                    <ExperienceCard key={exp._id || i} exp={exp} />
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar: topics + placement records (2/5) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Topic frequency */}
          {stats.topTopics?.length > 0 && (
            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5">
              <h3 className="text-sm font-semibold text-zinc-300 mb-4">Reported Topics</h3>
              <TopicBar topics={stats.topTopics} limit={8} />
            </div>
          )}

          {/* Round types */}
          {Object.keys(stats.roundTypeDistribution || {}).length > 0 && (
            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5">
              <h3 className="text-sm font-semibold text-zinc-300 mb-3">Round Types</h3>
              <div className="space-y-2">
                {Object.entries(stats.roundTypeDistribution)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">{type}</span>
                      <span className="text-zinc-600 tabular-nums">{count}</span>
                    </div>
                  ))
                }
              </div>
            </div>
          )}

          {/* Roles */}
          {stats.commonRoles?.length > 0 && (
            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5">
              <h3 className="text-sm font-semibold text-zinc-300 mb-3">Roles Offered</h3>
              <div className="flex flex-wrap gap-1.5">
                {stats.commonRoles.map(r => (
                  <span key={r} className="text-xs bg-white/[0.04] border border-white/[0.06] rounded-full px-2.5 py-1 text-zinc-400">
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Link to full company page */}
          <Link
            to={`/companies/${companySlug}`}
            className="block rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.1] hover:bg-white/[0.04] transition-all duration-200 p-5 group text-center"
          >
            <Building2 className="h-6 w-6 text-zinc-600 group-hover:text-zinc-400 transition-colors mx-auto mb-2" strokeWidth={1.4} />
            <p className="text-sm text-zinc-500 group-hover:text-zinc-300 transition-colors">
              View all {company?.name} intel globally →
            </p>
          </Link>
        </div>
      </div>

      {/* Placement records full width */}
      {placementRecords?.length > 0 && (
        <PlacementRecordsTable records={placementRecords} />
      )}

      {/* Success toast */}
      {successMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[var(--signal)] text-white text-sm px-4 py-2.5 rounded-xl shadow-lg">
          <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
          Experience submitted! Thank you.
        </div>
      )}

      {showSubmit && (
        <SubmitExperienceModal
          company={company ? { _id: company._id, slug: company.slug, name: company.name } : null}
          companies={[]}
          onClose={() => setShowSubmit(false)}
          onSuccess={() => {
            setShowSubmit(false);
            setSuccessMsg(true);
            setTimeout(() => setSuccessMsg(false), 3500);
            load();
          }}
        />
      )}
    </div>
  );
}
