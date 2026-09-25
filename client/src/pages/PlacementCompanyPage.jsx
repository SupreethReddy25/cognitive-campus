import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ChevronDown, Plus, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { collegesService, usersService } from '../services/api';
import { PrepPriorities } from '../components/placement/PrepPriorities';
import { SubmitExperienceModal } from '../components/intel/SubmitExperienceModal';
import { useToast } from '../context/ToastContext';
import { Page, PrimaryButton, Skeleton, ErrorNote, CountUp, cn } from '../components/ui/kit';

const CONF = { none: 'no data yet', low: 'low confidence', medium: 'medium confidence', high: 'high confidence' };
const chip = (on) => cn('rounded-sm border px-3.5 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.16em] transition-colors', on ? 'border-[var(--ember)] bg-[var(--ember)]/10 text-[var(--ember-soft)]' : 'border-[var(--line)] text-zinc-500 hover:border-[var(--line-strong)] hover:text-zinc-200');

function Section({ title, kicker, children }) {
  return (
    <section className="pt-20">
      <div className="mb-8 flex items-end justify-between gap-6 border-b border-[var(--line-strong)] pb-4">
        <h2 className="display text-[clamp(27px,3.7vw,45px)] text-zinc-50">{title}</h2>
        {kicker && <div className="hidden max-w-xs pb-1.5 text-right text-[13px] leading-snug text-zinc-500 md:block">{kicker}</div>}
      </div>
      {children}
    </section>
  );
}

function Voice({ exp }) {
  const [open, setOpen] = useState(false);
  const outcome = exp.offerReceived === 'Yes' ? ['Offer', 'text-emerald-400'] : exp.offerReceived === 'No' ? ['No offer', 'text-rose-400'] : ['Pending', 'text-amber-400'];
  return (
    <article className="border-b border-[var(--line)] py-6">
      <button onClick={() => setOpen((o) => !o)} className="group flex w-full items-start justify-between gap-6 text-left">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-4">
            <span className="display text-[24px] leading-none text-zinc-100 transition-colors group-hover:text-[var(--ember)]">{exp.role}</span>
            <span className={cn('text-[13px] font-medium', outcome[1])}>{outcome[0]}</span>
            {exp.isVerified && <span className="inline-flex items-center gap-1 text-[12px] text-sky-300"><ShieldCheck className="h-3.5 w-3.5" />verified</span>}
            {exp.source === 'curated' && <span className="rounded-sm border border-[var(--line-strong)] px-2.5 py-0.5 text-[11.5px] text-zinc-500">sample report</span>}
          </div>
          <div className="tag mt-1.5">{exp.month} {exp.year}{exp.difficulty ? ` · felt ${String(exp.difficulty).toLowerCase()}` : ''}{exp.roundCount > 0 ? ` · ${exp.roundCount} round${exp.roundCount !== 1 ? 's' : ''}` : ''}{exp.upvotes > 0 ? ` · ${exp.upvotes} helpful` : ''}</div>
        </div>
        <ChevronDown className={cn('mt-2 h-5 w-5 shrink-0 text-zinc-600 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="mt-6 space-y-7 border-l border-[var(--line-strong)] pl-7">
          {exp.rounds?.map((r, i) => (
            <div key={i}>
              <div className="flex flex-wrap items-baseline gap-3"><span className="display text-[20.8px] text-zinc-600">{String(i + 1).padStart(2, '0')}</span><span className="text-[16px] font-medium text-zinc-100">{r.type}</span>{r.duration && <span className="text-[13px] text-zinc-500">{r.duration}</span>}</div>
              {r.topics?.length > 0 && <div className="mt-1.5 text-[13px] text-[var(--ember-soft)]">{r.topics.join(' · ')}</div>}
              <ul className="mt-2.5 space-y-2">{r.questions?.map((q, j) => <li key={j} className="max-w-3xl text-[15px] leading-relaxed text-zinc-300">{q.text}</li>)}</ul>
              {r.tips && <p className="mt-2 text-[13.5px] italic text-zinc-500">{r.tips}</p>}
            </div>
          ))}
          {exp.overallTips && <p className="max-w-3xl text-[16px] leading-relaxed text-zinc-300"><span className="text-[var(--star)]">Advice — </span>{exp.overallTips}</p>}
          {exp.resourcesUsed && <p className="text-[13px] text-zinc-500">Prepared with: {exp.resourcesUsed}</p>}
          {exp.author && <p className="text-[12.5px] text-zinc-700">— {exp.author}</p>}
        </div>
      )}
    </article>
  );
}

export default function PlacementCompanyPage() {
  const { companySlug } = useParams();
  const { user } = useAuth();
  const toast = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSubmit, setShowSubmit] = useState(false);
  const [filterOffer, setFilterOffer] = useState('All');

  const userCollege = user?.collegeId && typeof user.collegeId === 'object' && user.collegeId.slug ? user.collegeId : null;
  const [resolvedCollege, setResolvedCollege] = useState(userCollege);

  // collegeId may arrive as a bare ObjectId — resolve the populated college from the profile
  useEffect(() => {
    if (user?.collegeId && !resolvedCollege) {
      usersService.getProfile().then((res) => {
        const u = res.data?.data?.user || res.data?.user;
        if (u?.collegeId && typeof u.collegeId === 'object' && u.collegeId.slug) setResolvedCollege(u.collegeId);
      }).catch(() => null);
    }
  }, [user?.collegeId, resolvedCollege]);

  const collegeSlug = resolvedCollege?.slug;

  const load = useCallback(() => {
    if (!collegeSlug) return;
    setLoading(true);
    collegesService.getCollegeCompanyIntel(collegeSlug, companySlug)
      .then((res) => { if (res.data.success) setData(res.data.data || res.data); else setError('Failed to load intel.'); })
      .catch(() => setError('Failed to load intel.'))
      .finally(() => setLoading(false));
  }, [collegeSlug, companySlug]);
  useEffect(() => { load(); }, [load]);

  if (!collegeSlug) {
    return (
      <Page><div className="mx-auto max-w-xl pt-32 text-center">
        <h1 className="display text-[clamp(35px,5.1vw,58px)] text-zinc-50">Pick your <em className="text-[var(--ember)]">college</em> first.</h1>
        <p className="mt-5 text-[16px] text-zinc-500">This view is scoped to reports from your own campus.</p>
        <Link to="/placement" className="mt-8 inline-block text-[15px] text-[var(--ember)] hover:underline">Go to the placement dashboard →</Link>
      </div></Page>
    );
  }
  if (loading) return <Page><div className="space-y-5 pt-24"><Skeleton className="h-40" /><Skeleton className="h-80" /></div></Page>;
  if (error || !data) {
    return (
      <Page><div className="pt-20">
        <Link to="/placement" className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-zinc-500 hover:text-zinc-100"><ArrowLeft className="h-4 w-4" /> Placement</Link>
        <ErrorNote>{error || 'No data available.'}</ErrorNote>
        <Link to={`/companies/${companySlug}`} className="mt-5 inline-block text-[14px] text-[var(--ember)] hover:underline">View the global dossier for this company →</Link>
      </div></Page>
    );
  }

  const { college, company, stats, experiences, placementRecords, prepPriorities, dataConfidence } = data;
  const filtered = experiences.filter((e) => filterOffer === 'All' || (filterOffer === 'Offer' ? e.offerReceived === 'Yes' : e.offerReceived === 'No'));
  const rounds = Object.entries(stats.roundTypeDistribution || {}).sort((a, b) => b[1] - a[1]);
  const maxRound = Math.max(1, ...rounds.map(([, n]) => n));

  return (
    <Page>
      <header className="pt-0 md:pt-2">
        <Link to="/placement" className="inline-flex items-center gap-1.5 text-[13px] text-zinc-500 transition-colors hover:text-zinc-100"><ArrowLeft className="h-4 w-4" /> {college?.shortName} placement</Link>
        <div className="mt-10 flex flex-wrap items-end justify-between gap-8">
          <div>
            <div className="tag">{company?.tier} · at {college?.name} · {CONF[dataConfidence]}</div>
            <h1 className="display mt-5 text-[clamp(45px,8.5vw,120px)] leading-[0.92] text-zinc-50">{company?.name}</h1>
          </div>
          <div className="flex items-center gap-6">
            <Link to={`/companies/${companySlug}`} className="text-[14px] text-zinc-400 transition-colors hover:text-[var(--ember)]">Global dossier →</Link>
            <PrimaryButton onClick={() => setShowSubmit(true)} icon={Plus}>Share yours</PrimaryButton>
          </div>
        </div>
        <div className="mt-12 grid grid-cols-2 gap-x-10 gap-y-8 lg:grid-cols-4">
          <div className="border-t border-[var(--line-strong)] pt-4"><div className="display text-[51.2px] leading-none tnum text-zinc-50">{stats.offerRate != null ? <><CountUp value={stats.offerRate} /><span className="text-[26px] text-zinc-500">%</span></> : '—'}</div><div className="tag mt-3">offer rate at your campus</div></div>
          <div className="border-t border-[var(--line-strong)] pt-4"><div className="display text-[51.2px] leading-none tnum text-zinc-50"><CountUp value={stats.totalReports} /></div><div className="tag mt-3">reports from seniors</div></div>
          <div className="border-t border-[var(--line-strong)] pt-4"><div className="display text-[51.2px] leading-none tnum text-zinc-50">{stats.yearsActive?.length || 0}</div><div className="tag mt-3">seasons active{stats.yearsActive?.length ? ` · ${stats.yearsActive[stats.yearsActive.length - 1]}–${stats.yearsActive[0]}` : ''}</div></div>
          <div className="border-t border-[var(--line-strong)] pt-4"><div className="text-[15px] leading-relaxed text-zinc-300">{(stats.commonRoles || []).slice(0, 4).join(' · ') || '—'}</div><div className="tag mt-3">roles offered</div></div>
        </div>
      </header>

      <Section title={<>What to <em>prepare</em></>} kicker="Your mastery against what this company actually asked your seniors.">
        <PrepPriorities prepPriorities={prepPriorities} companyName={company?.name} collegeName={college?.shortName} />
      </Section>

      {(stats.topTopics?.length > 0 || rounds.length > 0) && (
        <Section title={<>The <em>shape</em> of it</>}>
          <div className="grid gap-16 lg:grid-cols-2">
            {stats.topTopics?.length > 0 && (
              <div><div className="mb-4 text-[13px] text-zinc-500">Topics reported</div>
                {stats.topTopics.slice(0, 8).map((t) => (
                  <div key={t.topic} className="flex items-baseline justify-between border-b border-[var(--line)] py-3"><span className="display text-[20.8px] text-zinc-100">{t.topic}</span><span className="text-[13px] tnum text-zinc-500">{t.pct != null ? `${t.pct}%` : t.count}</span></div>
                ))}
              </div>
            )}
            {rounds.length > 0 && (
              <div><div className="mb-4 text-[13px] text-zinc-500">Round types</div>
                <div className="space-y-4">{rounds.map(([type, n]) => <div key={type}><div className="flex justify-between text-[15px]"><span className="text-zinc-200">{type}</span><span className="tnum text-zinc-500">{n}</span></div><div className="mt-1.5 h-[3px] rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-[var(--ember)]" style={{ width: `${(n / maxRound) * 100}%` }} /></div></div>)}</div>
              </div>
            )}
          </div>
        </Section>
      )}

      <Section title={<>Told by <em>seniors</em></>} kicker="Open one to read every round.">
        {dataConfidence === 'none' ? (
          <div className="py-10 text-[16px] text-zinc-500">No one has shared a {company?.name} interview from {college?.shortName} yet. <button onClick={() => setShowSubmit(true)} className="text-[var(--ember)] hover:underline">Be the first.</button></div>
        ) : (
          <>
            <div className="mb-2 flex gap-1.5">{['All', 'Offer', 'No Offer'].map((f) => <button key={f} onClick={() => setFilterOffer(f)} className={chip(filterOffer === f)}>{f === 'Offer' ? 'Got the offer' : f}</button>)}</div>
            {filtered.length === 0 ? <p className="py-8 text-[15px] text-zinc-600">Nothing matches that filter.</p> : filtered.map((e, i) => <Voice key={e._id || i} exp={e} />)}
          </>
        )}
      </Section>

      {placementRecords?.length > 0 && (
        <Section title={<>On the <em>record</em></>} kicker="Placement records for your college. Rows marked “modelled” are estimates until your placement cell uploads real ones.">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left">
              <thead><tr>{['Year', 'Season', 'Roles', 'Package', 'Eligibility', 'Hired'].map((h) => <th key={h} className="pb-3 text-[12.5px] font-normal text-zinc-600">{h}</th>)}</tr></thead>
              <tbody>{placementRecords.map((rec, i) => (
                <tr key={i} className="border-t border-[var(--line)]">
                  <td className="py-3.5 pr-6 display text-[19.2px] tnum text-zinc-100">{rec.hiringYear}</td>
                  <td className="py-3.5 pr-6 text-[14px] text-zinc-500">{rec.hiringSeason}{rec.source === 'modelled' && <span className="ml-2 text-[11.5px] text-amber-400/80">modelled</span>}</td>
                  <td className="py-3.5 pr-6 text-[14px] text-zinc-300">{rec.roles?.join(', ') || '—'}</td>
                  <td className="py-3.5 pr-6 text-[14px] text-zinc-300">{rec.packageOffered?.ctc || '—'}</td>
                  <td className="py-3.5 pr-6 text-[14px] text-zinc-500">{rec.eligibility?.minCGPA ? `≥ ${rec.eligibility.minCGPA} CGPA` : '—'}</td>
                  <td className="py-3.5 text-[14px] tnum text-zinc-300">{rec.studentsHired ?? '—'}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </Section>
      )}

      {showSubmit && (
        <SubmitExperienceModal
          company={company ? { _id: company._id, slug: company.slug, name: company.name } : null}
          companies={[]}
          onClose={() => setShowSubmit(false)}
          onSuccess={() => { setShowSubmit(false); toast.success('Experience submitted', 'Thank you — it helps your juniors.'); load(); }}
        />
      )}
    </Page>
  );
}
