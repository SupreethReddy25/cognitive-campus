import React, { useRef } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import InlineSlot from './InlineSlot';
import { ROUND_TYPE_SUGGESTIONS, DURATION_SUGGESTIONS, TOPIC_SUGGESTIONS, reorderSuggestions } from './suggestion-data';

const VIBES = [
  { value: 'Friendly',  emoji: '😊', color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' },
  { value: 'Neutral',   emoji: '😐', color: 'border-zinc-500/40  bg-zinc-500/10  text-zinc-400'   },
  { value: 'Grilling',  emoji: '😤', color: 'border-amber-500/40  bg-amber-500/10  text-amber-400'  },
  { value: 'Hostile',   emoji: '💀', color: 'border-red-500/40    bg-red-500/10    text-red-400'    },
];

/**
 * RoundCard — structured card for a single interview round.
 * Contains slots for type, duration, vibe (emoji radio), topic chips, question rows, and notes.
 */
export default function RoundCard({
  index,
  data,
  onChange,
  onRemove,
  priorityTopics = [],
  isOnly = false,
}) {
  const questionInputRefs = useRef([]);

  function set(field, val) {
    onChange({ ...data, [field]: val });
  }

  function addQuestion() {
    set('questions', [...data.questions, { text: '' }]);
  }

  function updateQuestion(qIdx, text) {
    const next = data.questions.map((q, i) => i === qIdx ? { ...q, text } : q);
    set('questions', next);
  }

  function removeQuestion(qIdx) {
    set('questions', data.questions.filter((_, i) => i !== qIdx));
  }

  function handleQuestionKeyDown(e, qIdx) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addQuestion();
      // Focus new input
      setTimeout(() => {
        questionInputRefs.current[qIdx + 1]?.focus();
      }, 30);
    } else if (e.key === 'Backspace' && !data.questions[qIdx].text && data.questions.length > 1) {
      e.preventDefault();
      removeQuestion(qIdx);
      setTimeout(() => {
        questionInputRefs.current[qIdx - 1]?.focus();
      }, 30);
    }
  }

  const orderedTopics = reorderSuggestions(TOPIC_SUGGESTIONS, priorityTopics);

  return (
    <div className="border border-white/[0.07] bg-gradient-to-b from-white/[0.02] to-transparent relative group overflow-hidden">
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--signal)]/30 to-transparent" />

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.05] bg-black/20">
        <div className="flex items-center gap-2">
          <span className="h-5 w-5 rounded-sm bg-[var(--signal)]/20 text-[var(--signal)] text-[10px] font-bold flex items-center justify-center font-mono">
            {index + 1}
          </span>
          <span className="text-[10px] font-mono tracking-[0.18em] uppercase text-zinc-500">Round {index + 1}</span>
          {data.type && (
            <span className="text-[10px] font-mono text-[var(--signal)]/70 ml-1">— {data.type}</span>
          )}
        </div>
        {!isOnly && (
          <button
            type="button"
            onClick={onRemove}
            className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all p-1 rounded"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="p-5 space-y-5">
        {/* Row 1: Type + Duration */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-[9px] font-mono tracking-[0.18em] uppercase text-zinc-600 mb-2">Type</div>
            <InlineSlot
              value={data.type}
              onChange={v => set('type', v)}
              suggestions={ROUND_TYPE_SUGGESTIONS}
              placeholder="select type..."
              mode="single"
              size="xl"
              allowCustom
            />
          </div>
          <div>
            <div className="text-[9px] font-mono tracking-[0.18em] uppercase text-zinc-600 mb-2">Duration</div>
            <InlineSlot
              value={data.duration}
              onChange={v => set('duration', v)}
              suggestions={DURATION_SUGGESTIONS}
              placeholder="e.g. 60 min"
              mode="single"
              size="md"
              allowCustom
            />
          </div>
        </div>

        {/* Vibe Selector */}
        <div>
          <div className="text-[9px] font-mono tracking-[0.18em] uppercase text-zinc-600 mb-2">Interviewer Vibe</div>
          <div className="flex gap-2">
            {VIBES.map(v => (
              <button
                key={v.value}
                type="button"
                onClick={() => set('vibe', data.vibe === v.value ? '' : v.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 border text-xs font-medium transition-all duration-150 rounded-sm ${
                  data.vibe === v.value
                    ? v.color
                    : 'border-white/[0.07] text-zinc-600 hover:border-white/20 hover:text-zinc-400'
                }`}
              >
                <span className="text-sm">{v.emoji}</span>
                {v.value}
              </button>
            ))}
          </div>
        </div>

        {/* Topics */}
        <div>
          <div className="text-[9px] font-mono tracking-[0.18em] uppercase text-zinc-600 mb-2">Topics Covered</div>
          <div className="flex flex-wrap items-center gap-1.5">
            {data.topics.map(t => (
              <span
                key={t}
                className="inline-flex items-center gap-1 bg-[var(--signal)]/10 border border-[var(--signal)]/25 text-[var(--signal)] text-xs font-mono px-2 py-0.5 rounded-sm group"
              >
                {t}
                <button
                  type="button"
                  onClick={() => set('topics', data.topics.filter(x => x !== t))}
                  className="opacity-0 group-hover:opacity-100 text-[var(--signal)]/60 hover:text-[var(--signal)] transition-opacity"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
            <InlineSlot
              value={data.topics}
              onChange={v => set('topics', v)}
              suggestions={orderedTopics}
              placeholder="+ add topic"
              mode="multi"
              size="sm"
              allowCustom
            />
          </div>
        </div>

        {/* Questions */}
        <div>
          <div className="text-[9px] font-mono tracking-[0.18em] uppercase text-zinc-600 mb-2">Questions Asked <span className="text-zinc-700">(optional)</span></div>
          <div className="space-y-1.5">
            {data.questions.map((q, qIdx) => (
              <div key={qIdx} className="flex items-center gap-2 group/q">
                <span className="text-[10px] font-mono text-zinc-700 shrink-0 w-4 text-right">{qIdx + 1}.</span>
                <input
                  ref={el => (questionInputRefs.current[qIdx] = el)}
                  value={q.text}
                  onChange={e => updateQuestion(qIdx, e.target.value)}
                  onKeyDown={e => handleQuestionKeyDown(e, qIdx)}
                  placeholder="describe the question..."
                  className="flex-1 bg-transparent border-b border-white/[0.06] focus:border-[var(--signal)]/40 text-sm text-zinc-300 placeholder:text-zinc-700 outline-none py-1 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => removeQuestion(qIdx)}
                  className="opacity-0 group-hover/q:opacity-100 text-zinc-700 hover:text-zinc-400 transition-all shrink-0"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addQuestion}
              className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-700 hover:text-[var(--signal)] transition-colors mt-1"
            >
              <Plus className="h-3 w-3" /> add question
            </button>
          </div>
        </div>

        {/* Notes */}
        <div>
          <div className="text-[9px] font-mono tracking-[0.18em] uppercase text-zinc-600 mb-2">Round Notes <span className="text-zinc-700">(optional)</span></div>
          <textarea
            value={data.notes}
            onChange={e => set('notes', e.target.value)}
            placeholder="anything else to add about this round?"
            rows={2}
            className="w-full bg-transparent border-b border-white/[0.06] focus:border-[var(--signal)]/40 text-sm text-zinc-400 placeholder:text-zinc-700 outline-none py-1 transition-colors resize-none"
          />
        </div>
      </div>
    </div>
  );
}
