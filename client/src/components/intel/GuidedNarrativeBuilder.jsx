import React, { useState, useEffect } from 'react';
import { Plus, Lightbulb, Sparkles, Loader2, AlertCircle, Check, ChevronDown, ChevronUp } from 'lucide-react';
import InlineSlot from './InlineSlot';
import RoundCard from './RoundCard';
import LiveQualityMeter from './LiveQualityMeter';
import {
  PREP_SUGGESTIONS,
  PREP_DURATION_SUGGESTIONS,
  ADVICE_SUGGESTIONS,
  OVERALL_FEEL_SUGGESTIONS,
  reorderSuggestions,
} from './suggestion-data';
import { getCompanyTemplate, makeEmptyRound } from './company-templates';
import { experiencesService } from '../../services/api';

// ─── AI Raw Dump Panel ────────────────────────────────────────────────────────
/**
 * AiAutoFillPanel — paste a raw brain dump, click "Parse with AI",
 * and the Groq/LLaMA-3.3 backend parses it into structured GNB data.
 */
function AiAutoFillPanel({ onFilled, companyName }) {
  const [rawText, setRawText]     = useState('');
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState(null);   // { qualityScore, validationMessage }
  const [error, setError]         = useState(null);
  const [expanded, setExpanded]   = useState(true);

  const MIN_LENGTH = 80; // require at least a sentence or two

  async function handleParse() {
    if (rawText.trim().length < MIN_LENGTH) {
      setError(`Please write at least ${MIN_LENGTH} characters — the more detail, the better the output.`);
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await experiencesService.parseRawDump(rawText.trim());
      if (!res.data.success) throw new Error('AI parse failed');

      const parsed = res.data.data; // Groq structured response

      // ── Map Groq response → GNB data ─────────────────────────────────────
      // Groq returns: { role, year, month, offerReceived, college, cgpa,
      //                 qualityScore, validationMessage,
      //                 rounds: [{ type, duration, questions, tips, vibe }],
      //                 overallTips, resourcesUsed }

      const mappedRounds = (parsed.rounds || []).map(r => ({
        type:      normalizeRoundType(r.type),
        duration:  r.duration || '',
        vibe:      normalizeVibe(r.vibe),
        topics:    extractTopics(r),
        questions: (r.questions || []).map(q => ({
          text:         q.text || '',
          questionType: q.questionType || 'DSA',
          topicTags:    q.topicTags || [],
        })),
        notes: r.tips || '',
      }));

      // Resources: Groq returns a comma-separated string → split into array
      const resourceArr = parsed.resourcesUsed
        ? parsed.resourcesUsed
            .split(/,|;|\n/)
            .map(s => s.trim())
            .filter(Boolean)
        : [];

      // Tips: Groq returns overallTips as a paragraph → split into sentences
      const tipsArr = parsed.overallTips
        ? parsed.overallTips
            .split(/\.\s+/)
            .map(s => s.trim().replace(/\.$/, ''))
            .filter(s => s.length > 5)
            .slice(0, 5)
        : [];

      const gnbData = {
        resources:     resourceArr,
        prepDuration:  '',
        prepNotes:     '',
        rounds:        mappedRounds.length > 0 ? mappedRounds : [makeEmptyRound()],
        tips:          tipsArr,
        retrospective: '',
        overallFeel:   parsed.offerReceived === 'Yes' ? 'rewarding' : parsed.offerReceived === 'No' ? 'humbling' : '',
      };

      onFilled(gnbData);
      setResult({
        qualityScore:      parsed.qualityScore || 0,
        validationMessage: parsed.validationMessage || '',
        roundCount:        mappedRounds.length,
      });
      setExpanded(false); // collapse panel after successful fill

    } catch (err) {
      console.error('AI parse error:', err);
      setError('AI parsing failed — check your internet or try again. Your raw text is saved.');
    } finally {
      setLoading(false);
    }
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────
  function normalizeRoundType(type = '') {
    const t = type.toLowerCase();
    if (t.includes('oa') || t.includes('online')) return 'Online Assessment (OA)';
    if (t.includes('technical') || t.includes('coding') || t.includes('dsa')) return 'Technical';
    if (t.includes('system') || t.includes('design')) return 'Technical'; // system design is still technical round
    if (t.includes('hr') || t.includes('human resource')) return 'HR';
    if (t.includes('managerial') || t.includes('manager') || t.includes('bar raiser')) return 'Managerial';
    if (t.includes('group') || t.includes('gd')) return 'GD';
    return type || 'Technical';
  }

  function normalizeVibe(vibe = '') {
    const v = vibe.toLowerCase();
    if (v.includes('conversational') || v.includes('casual') || v.includes('chat')) return 'Conversational';
    if (v.includes('grill') || v.includes('intense') || v.includes('tough')) return 'Grilling';
    if (v.includes('friendly') || v.includes('warm') || v.includes('helpful')) return 'Friendly';
    return vibe || '';
  }

  function extractTopics(round) {
    // Collect all topicTags from all questions in this round
    const tags = new Set();
    (round.questions || []).forEach(q => {
      (q.topicTags || []).forEach(t => tags.add(t));
    });
    return Array.from(tags).slice(0, 6);
  }

  const qualityColor =
    result?.qualityScore >= 75 ? 'text-emerald-400' :
    result?.qualityScore >= 45 ? 'text-amber-400' :
    'text-red-400';

  return (
    <div className="border border-[var(--signal)]/20 bg-[var(--signal)]/[0.03] rounded-sm overflow-hidden">
      {/* Header — always visible */}
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="h-6 w-6 rounded-sm bg-[var(--signal)]/15 flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 text-[var(--signal)]" strokeWidth={1.6} />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-zinc-200">AI Auto-Fill</span>
              <span className="text-[9px] font-mono text-[var(--signal)] bg-[var(--signal)]/10 px-2 py-0.5 rounded-sm border border-[var(--signal)]/20 uppercase tracking-wider">
                Powered by LLaMA-3.3
              </span>
            </div>
            <p className="text-[11px] text-zinc-600 mt-0.5">
              Paste your raw memory dump — AI structures it into rounds, topics &amp; questions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {result && (
            <div className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-400" strokeWidth={1.6} />
              <span className="text-xs text-emerald-400 font-mono">{result.roundCount} rounds filled</span>
            </div>
          )}
          {expanded
            ? <ChevronUp className="h-4 w-4 text-zinc-600" strokeWidth={1.6} />
            : <ChevronDown className="h-4 w-4 text-zinc-600" strokeWidth={1.6} />
          }
        </div>
      </button>

      {/* Expandable body */}
      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-white/[0.04]">
          {/* Instructions */}
          <div className="pt-4">
            <div className="text-[9px] font-mono tracking-[0.15em] uppercase text-zinc-600 mb-2">
              Paste your raw experience below — don't worry about formatting
            </div>
            <textarea
              value={rawText}
              onChange={e => { setRawText(e.target.value); setError(null); setResult(null); }}
              placeholder={`Write everything you remember. Don't format it. For example:\n\nI interviewed at ${companyName || 'the company'} in July 2024 for SDE-1. Got an OA first — two questions, one was easy array problem about sliding window, second one was a medium graph problem about shortest path. Then had two technical rounds. First one the guy asked me to find the LCA of a binary tree and also one DP problem — coin change. Second was a system design — design a rate limiter. They also asked behavioral questions about a time I disagreed with someone. I was nervous but the interviewer was helpful. Finally HR round, salary negotiation. Got an offer at 24 LPA. I used Striver sheet and read Amazon LPs...`}
              rows={10}
              className="w-full rounded-lg bg-white/[0.03] border border-white/[0.07] hover:border-white/[0.12] px-4 py-3 text-sm text-zinc-300 outline-none focus:border-[var(--signal)]/30 focus:bg-[var(--signal)]/[0.02] transition-all duration-200 placeholder:text-zinc-700 resize-none leading-relaxed font-sans"
            />
            <div className="flex items-center justify-between mt-1.5">
              <span className={`text-[10px] font-mono ${rawText.length < MIN_LENGTH ? 'text-zinc-700' : 'text-zinc-500'}`}>
                {rawText.length} chars {rawText.length < MIN_LENGTH ? `— need ${MIN_LENGTH - rawText.length} more` : '✓ ready to parse'}
              </span>
              {rawText.length > 0 && (
                <button
                  type="button"
                  onClick={() => { setRawText(''); setResult(null); setError(null); }}
                  className="text-[10px] font-mono text-zinc-700 hover:text-zinc-400 transition-colors"
                >
                  clear
                </button>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 p-3 border border-red-500/20 bg-red-500/5 rounded-sm">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" strokeWidth={1.6} />
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          {/* Result banner */}
          {result && (
            <div className="flex items-start gap-3 p-4 border border-emerald-500/20 bg-emerald-500/5 rounded-sm">
              <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" strokeWidth={1.6} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-sm font-semibold text-emerald-400">
                    Auto-filled! {result.roundCount} round{result.roundCount !== 1 ? 's' : ''} structured.
                  </span>
                  <span className={`text-xs font-bold font-mono ${qualityColor}`}>
                    Quality: {result.qualityScore}/100
                  </span>
                </div>
                {result.validationMessage && (
                  <p className="text-[11px] text-zinc-500 leading-relaxed">{result.validationMessage}</p>
                )}
                <p className="text-[11px] text-zinc-600 mt-1.5">
                  Scroll down to review and refine the auto-filled rounds below.
                </p>
              </div>
            </div>
          )}

          {/* Parse button */}
          <button
            type="button"
            onClick={handleParse}
            disabled={loading || rawText.trim().length < MIN_LENGTH}
            className="w-full flex items-center justify-center gap-2.5 py-3 rounded-lg bg-gradient-to-r from-[var(--signal)]/15 to-teal-500/10 border border-[var(--signal)]/25 text-sm font-bold text-white tracking-wider uppercase transition-all duration-300 hover:from-[var(--signal)]/25 hover:to-teal-500/20 hover:shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)] disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-[var(--signal)]" strokeWidth={1.6} />
                Parsing with AI…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-[var(--signal)]" strokeWidth={1.6} />
                Parse &amp; Auto-Fill
              </>
            )}
          </button>

          <p className="text-[10px] text-zinc-700 text-center">
            Your raw text is not stored. Only the structured output is saved.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Main GuidedNarrativeBuilder ─────────────────────────────────────────────
/**
 * GuidedNarrativeBuilder — the orchestrator for Step 3 of the Intel submission wizard.
 *
 * Two modes:
 *  1. AI Auto-Fill: paste raw brain dump → Groq LLaMA-3.3 structures it → populates form
 *  2. Manual (Guided): sentence-completion slots, company-aware round templates
 *
 * Outputs structured data directly via `onChange`.
 */
export default function GuidedNarrativeBuilder({
  companySlug,
  companyName,
  onChange,
}) {
  const template = getCompanyTemplate(companySlug);

  const [data, setData] = useState({
    resources: [],
    prepDuration: '',
    prepNotes: '',
    rounds: template.autoRounds.map(r => ({
      type: r.type,
      duration: r.duration,
      vibe: '',
      topics: [...r.defaultTopics],
      questions: [],
      notes: '',
    })),
    tips: [],
    retrospective: '',
    overallFeel: '',
  });

  // Propagate structured data up to parent on every change
  useEffect(() => {
    onChange(data);
  }, [data]);

  function setField(field, val) {
    setData(prev => ({ ...prev, [field]: val }));
  }

  function updateRound(idx, updatedRound) {
    setData(prev => ({
      ...prev,
      rounds: prev.rounds.map((r, i) => i === idx ? updatedRound : r),
    }));
  }

  function addRound() {
    setData(prev => ({
      ...prev,
      rounds: [...prev.rounds, makeEmptyRound()],
    }));
  }

  function removeRound(idx) {
    setData(prev => ({
      ...prev,
      rounds: prev.rounds.filter((_, i) => i !== idx),
    }));
  }

  // Called by AiAutoFillPanel — replaces entire data state with AI-parsed result
  function handleAiFilled(gnbData) {
    setData(gnbData);
  }

  const orderedResources = reorderSuggestions(PREP_SUGGESTIONS, template.priorityResources);
  const orderedAdvice = reorderSuggestions(ADVICE_SUGGESTIONS, []);

  return (
    <div className="space-y-10 max-w-3xl mx-auto">

      {/* ─────────────────────────────── AI AUTO-FILL PANEL ─── */}
      <AiAutoFillPanel
        onFilled={handleAiFilled}
        companyName={companyName}
      />

      {/* Divider with "or fill manually" label */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-white/[0.05]" />
        <span className="text-[9px] font-mono text-zinc-700 uppercase tracking-[0.2em] shrink-0">
          or fill manually below
        </span>
        <div className="flex-1 h-px bg-white/[0.05]" />
      </div>

      {/* Company Hint Banner */}
      {template.hint && (
        <div className="flex gap-3 p-4 bg-[var(--signal)]/5 border border-[var(--signal)]/15 rounded-sm">
          <Lightbulb className="h-4 w-4 text-[var(--signal)] shrink-0 mt-0.5" />
          <p className="text-xs text-zinc-400 leading-relaxed">
            <span className="text-[var(--signal)] font-semibold">{companyName || 'Company'} insight: </span>
            {template.hint}
          </p>
        </div>
      )}

      {/* ─────────────────────────────── SECTION 1: PREPARATION ─── */}
      <section>
        <SectionHeader
          number="1"
          title="Preparation"
          subtitle="How did you get ready?"
        />

        <div className="mt-5 space-y-5 bg-white/[0.01] border border-white/[0.05] p-6">
          {/* Sentence 1: Resources */}
          <NarrativeLine>
            I prepared using{' '}
            <InlineSlot
              value={data.resources}
              onChange={v => setField('resources', v)}
              suggestions={orderedResources}
              placeholder="select resources..."
              mode="multi"
              size="lg"
              allowCustom
            />
          </NarrativeLine>

          {/* Sentence 2: Duration */}
          <NarrativeLine>
            I studied for about{' '}
            <InlineSlot
              value={data.prepDuration}
              onChange={v => setField('prepDuration', v)}
              suggestions={PREP_DURATION_SUGGESTIONS}
              placeholder="duration"
              mode="single"
              size="md"
              allowCustom
            />
            {' '}before the interviews.
          </NarrativeLine>

          {/* Free text for extra prep notes */}
          <div>
            <div className="text-[9px] font-mono tracking-[0.15em] uppercase text-zinc-700 mb-2">Anything else about your prep? <span className="text-zinc-800">(optional)</span></div>
            <textarea
              value={data.prepNotes}
              onChange={e => setField('prepNotes', e.target.value)}
              placeholder="e.g. I also watched specific YouTube playlists, did company-tagged problems, etc."
              rows={2}
              className="w-full bg-transparent border-b border-white/[0.06] focus:border-[var(--signal)]/30 text-sm text-zinc-400 placeholder:text-zinc-700 outline-none py-1.5 transition-colors resize-none"
            />
          </div>
        </div>
      </section>

      {/* ─────────────────────────────── SECTION 2: ROUNDS ─── */}
      <section>
        <SectionHeader
          number="2"
          title="Interview Rounds"
          subtitle={
            companySlug && template.autoRounds[0]?.type
              ? `Pre-filled with known ${companyName || ''} structure — edit freely`
              : 'Add each round below'
          }
          accentText={companySlug && template.autoRounds[0]?.type ? 'Company-aware ✦' : null}
        />

        <div className="mt-5 space-y-3">
          {data.rounds.map((round, idx) => (
            <RoundCard
              key={idx}
              index={idx}
              data={round}
              onChange={updated => updateRound(idx, updated)}
              onRemove={() => removeRound(idx)}
              priorityTopics={template.priorityTopics}
              isOnly={data.rounds.length === 1}
            />
          ))}

          {/* Add Round Button */}
          <button
            type="button"
            onClick={addRound}
            className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-white/[0.1] hover:border-[var(--signal)]/30 text-zinc-600 hover:text-[var(--signal)] text-xs font-mono tracking-widest uppercase transition-all duration-200 group"
          >
            <Plus className="h-3.5 w-3.5 group-hover:rotate-90 transition-transform duration-200" />
            Add Another Round
          </button>
        </div>
      </section>

      {/* ─────────────────────────────── SECTION 3: ADVICE ─── */}
      <section>
        <SectionHeader
          number="3"
          title="Retrospective & Advice"
          subtitle="Help future candidates with what you learned"
        />

        <div className="mt-5 space-y-5 bg-white/[0.01] border border-white/[0.05] p-6">
          {/* Tips multi-select */}
          <NarrativeLine>
            My top tips for others:{' '}
            <InlineSlot
              value={data.tips}
              onChange={v => setField('tips', v)}
              suggestions={orderedAdvice}
              placeholder="add advice..."
              mode="multi"
              size="lg"
              allowCustom
            />
          </NarrativeLine>

          {/* Looking back freetext */}
          <div>
            <div className="text-[9px] font-mono tracking-[0.15em] uppercase text-zinc-700 mb-2">Looking back, I would have... <span className="text-zinc-800">(optional)</span></div>
            <textarea
              value={data.retrospective}
              onChange={e => setField('retrospective', e.target.value)}
              placeholder="e.g. started with system design earlier, done more mock interviews, focused on LPs sooner..."
              rows={2}
              className="w-full bg-transparent border-b border-white/[0.06] focus:border-[var(--signal)]/30 text-sm text-zinc-400 placeholder:text-zinc-700 outline-none py-1.5 transition-colors resize-none"
            />
          </div>

          {/* Overall feel */}
          <NarrativeLine>
            Overall, this process was{' '}
            <InlineSlot
              value={data.overallFeel}
              onChange={v => setField('overallFeel', v)}
              suggestions={OVERALL_FEEL_SUGGESTIONS}
              placeholder="one word..."
              mode="single"
              size="md"
              allowCustom
            />
          </NarrativeLine>
        </div>
      </section>

      {/* ─────────────────────────────── LIVE QUALITY METER ─── */}
      <LiveQualityMeter data={data} />
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionHeader({ number, title, subtitle, accentText }) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-6 w-6 rounded-sm bg-[var(--signal)]/20 text-[var(--signal)] text-xs font-bold flex items-center justify-center font-mono shrink-0 mt-0.5">
        {number}
      </div>
      <div>
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-bold text-zinc-200 uppercase tracking-widest">{title}</h4>
          {accentText && (
            <span className="text-[9px] font-mono text-[var(--signal)] bg-[var(--signal)]/10 px-2 py-0.5 rounded-sm border border-[var(--signal)]/20">
              {accentText}
            </span>
          )}
        </div>
        <p className="text-xs text-zinc-600 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

function NarrativeLine({ children }) {
  return (
    <div className="text-sm text-zinc-300 leading-relaxed flex flex-wrap items-center gap-x-1.5 gap-y-2">
      {children}
    </div>
  );
}
