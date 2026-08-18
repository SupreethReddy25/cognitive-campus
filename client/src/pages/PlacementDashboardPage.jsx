import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { collegesService, usersService } from '../services/api';
import {
  GraduationCap, Building2, ChevronRight, TrendingUp,
  Users, AlertCircle, Loader2, Plus, ArrowRight,
  CheckCircle2, BarChart3, Calendar
} from 'lucide-react';
import { CollegeSelector } from '../components/placement/CollegeSelector';
import { DataConfidenceBadge, TopicBar } from '../components/placement/PlacementUIComponents';
import { SubmitExperienceModal } from '../components/intel/SubmitExperienceModal';

const TIER_COLORS = {
  IIT:     'text-violet-400 bg-violet-400/10 border-violet-400/20',
  NIT:     'text-sky-400 bg-sky-400/10 border-sky-400/20',
  BITS:    'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  IIIT:    'text-indigo-400 bg-indigo-400/10 border-indigo-400/20',
  Deemed:  'text-amber-400 bg-amber-400/10 border-amber-400/20',
  State:   'text-zinc-400 bg-zinc-400/10 border-zinc-400/20',
  Private: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
  Other:   'text-zinc-500 bg-zinc-500/10 border-zinc-500/20',
};

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, sub }) {
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-3 flex flex-col gap-1">
      <p className="text-[10px] font-mono tracking-[0.15em] text-zinc-600 uppercase">{label}</p>
      <p className="text-2xl font-bold text-zinc-100 tabular-nums">{value ?? '—'}</p>
      {sub && <p className="text-[11px] text-zinc-600">{sub}</p>}
    </div>
  );
}

// ─── Company Placement Card ──────────────────────────────────────────────────
function CompanyCard({ item, collegeSlug }) {
  const { company, yearsActive, roles, experienceCount, latestOfferRate, topTopics } = item;
  if (!company) return null;

  return (
    <Link
      to={`/placement/companies/${company.slug}`}
      className="block rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-200 p-5 group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
            <Building2 className="h-4 w-4 text-zinc-500" strokeWidth={1.6} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-zinc-200 group-hover:text-zinc-100 transition-colors truncate">
              {company.name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${TIER_COLORS[company.tier] || TIER_COLORS.Other}`}>
                {company.tier}
              </span>
              <span className="text-[11px] text-zinc-600">
                {experienceCount} report{experienceCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {latestOfferRate !== null && (
            <div className="text-right">
              <p className="text-lg font-bold text-zinc-100 tabular-nums">{latestOfferRate}%</p>
              <p className="text-[10px] text-zinc-600">offer rate</p>
            </div>
          )}
          <ChevronRight className="h-4 w-4 text-zinc-700 group-hover:text-zinc-400 transition-colors" strokeWidth={1.6} />
        </div>
      </div>

      {/* Roles */}
      {roles?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {roles.slice(0, 4).map(role => (
            <span key={role} className="text-[11px] bg-white/[0.04] border border-white/[0.06] rounded-full px-2.5 py-0.5 text-zinc-400">
              {role}
            </span>
          ))}
          {roles.length > 4 && (
            <span className="text-[11px] text-zinc-600">+{roles.length - 4} more</span>
          )}
        </div>
      )}

      {/* Top topics */}
      {topTopics?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {topTopics.slice(0, 4).map(t => (
            <span key={t.topic} className="text-[10px] font-mono bg-[var(--signal)]/5 border border-[var(--signal)]/10 rounded px-2 py-0.5 text-[var(--signal)]/80">
              {t.topic}
            </span>
          ))}
        </div>
      )}

      {/* Years active */}
      {yearsActive?.length > 0 && (
        <div className="mt-2 flex items-center gap-1 text-[11px] text-zinc-700">
          <Calendar className="h-3 w-3" strokeWidth={1.6} />
          {yearsActive.slice(0, 4).join(', ')}
        </div>
      )}
    </Link>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function PlacementDashboardPage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const [dashData, setDashData]       = useState(null);
  const [loading, setLoading]         = useState(false);
  const [savingCollege, setSaving]    = useState(false);
  const [error, setError]             = useState(null);
  const [showSubmit, setShowSubmit]   = useState(false);
  const [successMsg, setSuccessMsg]   = useState(false);

  // Current college from user profile (may be an ObjectId initially — enrich below)
  const [selectedCollege, setSelectedCollege] = useState(
    user?.collegeId && typeof user.collegeId === 'object' && user.collegeId.slug
      ? user.collegeId
      : null
  );

  // If collegeId is an ObjectId string (not yet populated), fetch full profile to get slug
  useEffect(() => {
    if (user?.collegeId && !selectedCollege) {
      usersService.getProfile()
        .then(res => {
          const u = res.data?.data?.user || res.data?.user;
          if (u?.collegeId && typeof u.collegeId === 'object' && u.collegeId.slug) {
            setSelectedCollege(u.collegeId);
          }
        })
        .catch(() => null);
    }
  }, [user?.collegeId]);

  // If user.collegeId is populated already (object with slug), fetch dashboard
  const collegeSlug = selectedCollege?.slug || null;

  const loadDashboard = useCallback((slug) => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    collegesService.getCollegeDashboard(slug)
      .then(res => {
        if (res.data.success) setDashData(res.data.data || res.data);
      })
      .catch(() => setError('Failed to load placement data.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (collegeSlug) loadDashboard(collegeSlug);
  }, [collegeSlug, loadDashboard]);

  const handleCollegeSelect = async (college) => {
    if (!college) {
      // Clear
      setSaving(true);
      try {
        const res = await usersService.updateProfile({ collegeId: null });
        if (res.data.success) {
          setSelectedCollege(null);
          setDashData(null);
          if (setUser) setUser(res.data.data?.user || res.data.user);
        }
      } catch { /* silent */ }
      setSaving(false);
      return;
    }

    setSelectedCollege(college);
    setSaving(true);
    try {
      const res = await usersService.updateProfile({ collegeId: college._id });
      if (res.data.success && setUser) {
        setUser(res.data.data?.user || res.data.user);
      }
    } catch { /* non-blocking */ }
    setSaving(false);
    loadDashboard(college.slug);
  };

  // ── State: No college selected ─────────────────────────────────────────────
  if (!selectedCollege) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--signal)]/10 border border-[var(--signal)]/20 mb-4">
              <GraduationCap className="h-8 w-8 text-[var(--signal)]" strokeWidth={1.4} />
            </div>
            <h1 className="text-2xl font-bold text-zinc-100 mb-2">College Placement Intel</h1>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Select your college to unlock placement intelligence — companies that recruit there,
              topics they test, offer rates, and personalized preparation priorities based on your skill profile.
            </p>
          </div>

          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-6 space-y-4">
            <p className="text-xs font-mono tracking-[0.15em] uppercase text-zinc-600">Your College</p>
            <CollegeSelector value={null} onChange={handleCollegeSelect} disabled={savingCollege} />
            {savingCollege && (
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving…
              </div>
            )}
          </div>

          <div className="mt-6 flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <AlertCircle className="h-4 w-4 text-zinc-600 shrink-0 mt-0.5" strokeWidth={1.6} />
            <p className="text-xs text-zinc-600 leading-relaxed">
              This is your personal placement dashboard, scoped to your college. You can change your college anytime from Profile settings.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-[var(--signal)]" strokeWidth={1.6} />
          <p className="text-sm text-zinc-500">Loading placement intelligence…</p>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-2 text-rose-400">
          <AlertCircle className="h-5 w-5" strokeWidth={1.6} />
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const college = dashData?.college;
  const companies = dashData?.companies || [];
  const stats = dashData?.stats || {};
  const topTopics = dashData?.topTopics || [];
  const recentExps = dashData?.recentExperiences || [];
  const confidence = dashData?.dataConfidence || 'none';

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-zinc-100">
              {college?.name || selectedCollege.name}
            </h1>
            {college?.tier && (
              <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${TIER_COLORS[college.tier] || TIER_COLORS.Other}`}>
                {college.tier}
              </span>
            )}
            {college?.verified && (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" strokeWidth={2} />
            )}
          </div>
          {college?.location && (
            <p className="text-sm text-zinc-500">{college.location}</p>
          )}
          <div className="mt-2">
            <DataConfidenceBadge confidence={confidence} count={stats.totalExperiences} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Change college */}
          <div className="w-64">
            <CollegeSelector value={selectedCollege} onChange={handleCollegeSelect} disabled={savingCollege} />
          </div>
          <button
            onClick={() => setShowSubmit(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--signal)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            Share Experience
          </button>
        </div>
      </div>

      {/* ── Stats Row ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Companies" value={stats.totalCompanies} />
        <StatCard label="Experiences" value={stats.totalExperiences} />
        <StatCard
          label="Offer Rate"
          value={stats.overallOfferRate !== null ? `${stats.overallOfferRate}%` : null}
          sub={stats.overallOfferRate === null ? 'Need 3+ reports' : undefined}
        />
        <StatCard
          label="Placement Records"
          value={stats.totalRecords}
          sub="Admin-verified"
        />
      </div>

      {/* ── No data yet ─────────────────────────────────────────────────────── */}
      {confidence === 'none' && (
        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-10 text-center">
          <GraduationCap className="h-10 w-10 text-zinc-700 mx-auto mb-4" strokeWidth={1.2} />
          <h2 className="text-lg font-semibold text-zinc-400 mb-2">No placement data yet</h2>
          <p className="text-sm text-zinc-600 mb-6 max-w-sm mx-auto">
            Be the first from {college?.name || selectedCollege.name} to contribute an interview experience.
            Your report helps the entire cohort prepare smarter.
          </p>
          <button
            onClick={() => setShowSubmit(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--signal)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            Contribute First Experience
          </button>
        </div>
      )}

      {/* ── Main content (only when there's data) ───────────────────────────── */}
      {confidence !== 'none' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Companies list — left 2/3 */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-zinc-500" strokeWidth={1.6} />
                Companies at {college?.shortName || selectedCollege.shortName}
              </h2>
              <span className="text-xs text-zinc-600">{companies.length} total</span>
            </div>

            {companies.length === 0 ? (
              <div className="rounded-2xl bg-white/[0.02] border border-dashed border-white/[0.06] p-8 text-center text-zinc-600 text-sm">
                No company data yet.
              </div>
            ) : (
              <div className="space-y-3">
                {companies.map((item, i) => (
                  <CompanyCard key={item.company?._id || i} item={item} collegeSlug={selectedCollege.slug} />
                ))}
              </div>
            )}
          </div>

          {/* Right sidebar — top topics + recent */}
          <div className="space-y-6">
            {/* Top technical areas */}
            {topTopics.length > 0 && (
              <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5">
                <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2 mb-4">
                  <TrendingUp className="h-4 w-4 text-zinc-500" strokeWidth={1.6} />
                  Top Technical Areas
                </h3>
                <TopicBar topics={topTopics} limit={8} />
              </div>
            )}

            {/* Recent experiences */}
            {recentExps.length > 0 && (
              <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5">
                <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2 mb-4">
                  <Users className="h-4 w-4 text-zinc-500" strokeWidth={1.6} />
                  Recent Reports
                </h3>
                <div className="space-y-3">
                  {recentExps.map((exp, i) => (
                    <Link
                      key={exp._id || i}
                      to={`/placement/companies/${exp.company?.slug}`}
                      className="flex items-start gap-3 group"
                    >
                      <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                        exp.offerReceived === 'Yes' ? 'bg-emerald-500' :
                        exp.offerReceived === 'No' ? 'bg-rose-500' : 'bg-zinc-600'
                      }`} />
                      <div className="min-w-0">
                        <p className="text-xs text-zinc-300 group-hover:text-zinc-100 transition-colors truncate">
                          {exp.company?.name} · {exp.role}
                        </p>
                        <p className="text-[11px] text-zinc-600">{exp.year} · {exp.difficulty}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <button
              onClick={() => setShowSubmit(true)}
              className="w-full rounded-xl border border-dashed border-white/[0.08] hover:border-[var(--signal)]/30 hover:bg-[var(--signal)]/5 transition-all duration-200 p-4 flex items-center gap-3 group"
            >
              <Plus className="h-4 w-4 text-zinc-600 group-hover:text-[var(--signal)] transition-colors" strokeWidth={2} />
              <span className="text-sm text-zinc-600 group-hover:text-zinc-300 transition-colors">
                Share your interview experience
              </span>
            </button>
          </div>
        </div>
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
          companies={[]}
          onClose={() => setShowSubmit(false)}
          onSuccess={() => {
            setShowSubmit(false);
            setSuccessMsg(true);
            setTimeout(() => setSuccessMsg(false), 3500);
            if (collegeSlug) loadDashboard(collegeSlug);
          }}
        />
      )}
    </div>
  );
}
