import React, { useState, useMemo, useRef, useEffect } from 'react';

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAY_LABELS  = ['S','M','T','W','T','F','S'];
const CELL_SIZE   = 11;
const CELL_GAP    = 2;
const WEEKS       = 53; // 53 weeks covers a full year reliably
const CELL_STEP   = CELL_SIZE + CELL_GAP; // 13px per week column
const DAY_COL_W   = 14; // px for the M/W/F day label column
const DAY_COL_GAP = 6;  // gap between day labels and grid

function lvlStyle(lvl, isToday, isHov) {
  if (isToday) return {
    backgroundColor: lvl > 0 ? 'rgba(74,124,89,0.95)' : 'rgba(74,124,89,0.18)',
    border: '2px solid rgba(255,255,255,0.9)',
    boxShadow: '0 0 0 2px rgba(74,124,89,0.4), 0 0 12px rgba(255,255,255,0.18)',
  };
  if (isHov && !isToday) return {
    backgroundColor: 'rgba(255,255,255,0.38)',
    border: '1px solid rgba(255,255,255,0.6)',
    transform: 'scale(1.5)',
  };
  const alphas  = [0.03, 0.24, 0.48, 0.72, 0.96];
  const borders = [0.05, 0.30, 0.56, 0.82, 1.00];
  return {
    backgroundColor: lvl === 0 ? 'rgba(255,255,255,0.03)' : `rgba(74,124,89,${alphas[lvl]})`,
    border: `1px solid ${lvl === 0 ? 'rgba(255,255,255,0.05)' : `rgba(74,124,89,${borders[lvl]})`}`,
    ...(lvl === 4 ? { boxShadow: '0 0 5px rgba(74,124,89,0.4)' } : {}),
  };
}

function toIntensity(n) {
  if (!n) return 0;
  if (n <= 1) return 1;
  if (n <= 3) return 2;
  if (n <= 5) return 3;
  return 4;
}

export function ActivityHeatmap({ dateMap = {} }) {
  const [hover, setHover] = useState(null);
  const scrollRef = useRef(null);

  // ── Build grid anchored to TODAY ──────────────────────────────────────────
  const { cells, segments, todayCol, todayRow } = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // The "today" day-of-week (0=Sun…6=Sat)
    const dow = now.getDay();

    // The Sunday that starts the LAST week column (col = WEEKS-1)
    const lastSun = new Date(now);
    lastSun.setDate(now.getDate() - dow);

    // startDate = Sunday of the FIRST column (WEEKS-1 weeks before lastSun)
    const startDate = new Date(lastSun);
    startDate.setDate(lastSun.getDate() - (WEEKS - 1) * 7);

    // Build all cells
    const result = [];
    for (let w = 0; w < WEEKS; w++) {
      for (let d = 0; d < 7; d++) {
        const dt = new Date(startDate);
        dt.setDate(startDate.getDate() + w * 7 + d);
        const key = dt.toISOString().slice(0, 10);
        const count = dateMap[key] || 0;
        // Flag any future cells
        const isFuture = dt > now;
        result.push({ date: key, count, lvl: isFuture ? 0 : toIntensity(count), isFuture });
      }
    }

    // Month boundary segments — track by year+month to avoid Dec/Jan collision
    const bounds = [];
    let lastKey = '';
    for (let w = 0; w < WEEKS; w++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + w * 7);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (key !== lastKey) {
        bounds.push({ w, month: d.getMonth(), year: d.getFullYear() });
        lastKey = key;
      }
    }

    // Compute segments with start/end week for centering labels
    const segs = bounds.map((b, i) => {
      const endW = i < bounds.length - 1 ? bounds[i + 1].w - 1 : WEEKS - 1;
      const midW = (b.w + endW) / 2;
      return { month: b.month, year: b.year, startW: b.w, endW, midW };
    });

    // Today is always in the last column (WEEKS-1), at row = dow
    return { cells: result, segments: segs, todayCol: WEEKS - 1, todayRow: dow };
  }, [dateMap]);

  const gridW = WEEKS * CELL_STEP - CELL_GAP;
  const gridH = 7  * CELL_STEP - CELL_GAP;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear  = now.getFullYear();

  // X center of the "today" cell inside the SCROLLABLE content (grid starts after DAY_COL_W + DAY_COL_GAP)
  const todayGridX = todayCol * CELL_STEP + CELL_SIZE / 2;
  const todayAbsX  = DAY_COL_W + DAY_COL_GAP + todayGridX;

  // Auto-scroll so today is visible ~60px from the right edge
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Small timeout so the DOM has rendered
    const tid = setTimeout(() => {
      el.scrollLeft = Math.max(0, todayAbsX - el.clientWidth + 80);
    }, 50);
    return () => clearTimeout(tid);
  }, [todayAbsX]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%', userSelect: 'none' }}>

      {/* ── Scrollable pane ─────────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        style={{ overflowX: 'auto', overflowY: 'visible', paddingBottom: 2 }}
        className="scrollbar-thin scrollbar-thumb-white/[0.08] scrollbar-track-transparent"
      >
        {/* Total width = day-labels + gap + grid */}
        <div style={{ width: DAY_COL_W + DAY_COL_GAP + gridW, position: 'relative', minWidth: DAY_COL_W + DAY_COL_GAP + gridW }}>

          {/* ── Row 1: "you are here" chevron above today ─────────────── */}
          <div style={{ height: 20, position: 'relative', marginBottom: 2 }}>
            <div style={{
              position: 'absolute',
              left: todayAbsX,
              transform: 'translateX(-50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1,
              pointerEvents: 'none',
            }}>
              <span style={{
                fontFamily: 'monospace',
                fontSize: 7,
                letterSpacing: '0.06em',
                color: 'rgba(161,161,170,0.65)',
                whiteSpace: 'nowrap',
                lineHeight: 1,
              }}>
                you are here
              </span>
              <svg width="8" height="5" viewBox="0 0 8 5" fill="none">
                <path d="M1 1L4 4L7 1" stroke="rgba(161,161,170,0.55)"
                  strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          {/* ── Row 2: Month labels ────────────────────────────────────── */}
          {/* Each label is absolutely positioned relative to the FULL container width.
              The grid starts at DAY_COL_W + DAY_COL_GAP from the left. */}
          <div style={{ height: 14, position: 'relative', marginBottom: 4 }}>
            {segments.map((seg, i) => {
              const isNow = seg.month === currentMonth && seg.year === currentYear;
              // X in the full container = day-labels offset + (midWeek * CELL_STEP) + half a cell
              const labelX = DAY_COL_W + DAY_COL_GAP + seg.midW * CELL_STEP + CELL_SIZE / 2;
              // Only show label if segment is wide enough to fit it
              const segWidthPx = (seg.endW - seg.startW + 1) * CELL_STEP;
              if (segWidthPx < 18) return null;
              return (
                <span key={i} style={{
                  position: 'absolute',
                  left: labelX,
                  transform: 'translateX(-50%)',
                  fontFamily: 'monospace',
                  fontSize: 8,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: isNow ? 'rgba(255,255,255,0.9)' : 'rgba(113,113,122,0.5)',
                  fontWeight: isNow ? 700 : 400,
                  userSelect: 'none',
                  whiteSpace: 'nowrap',
                }}>
                  {MONTH_NAMES[seg.month]}
                </span>
              );
            })}
          </div>

          {/* ── Row 3: Day labels + Grid ───────────────────────────────── */}
          <div style={{ display: 'flex', gap: DAY_COL_GAP, alignItems: 'flex-start' }}>

            {/* Day-of-week labels (M, W, F only) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: CELL_GAP, width: DAY_COL_W, flexShrink: 0 }}>
              {DAY_LABELS.map((lbl, i) => (
                <div key={i} style={{
                  height: CELL_SIZE,
                  lineHeight: CELL_SIZE + 'px',
                  fontSize: 8,
                  fontFamily: 'monospace',
                  color: 'rgba(113,113,122,0.55)',
                  textAlign: 'right',
                  paddingRight: 2,
                }}>
                  {[1, 3, 5].includes(i) ? lbl : ''}
                </div>
              ))}
            </div>

            {/* Week columns */}
            <div style={{ display: 'flex', gap: CELL_GAP, position: 'relative' }}>

              {/* Month separator lines */}
              {segments.slice(1).map((seg, i) => (
                <div key={i} style={{
                  position: 'absolute',
                  left: seg.startW * CELL_STEP - CELL_GAP - 1,
                  top: -2,
                  width: 1,
                  height: gridH + 4,
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  pointerEvents: 'none',
                }} />
              ))}

              {/* Cell columns */}
              {Array.from({ length: WEEKS }).map((_, w) => (
                <div key={w} style={{ display: 'flex', flexDirection: 'column', gap: CELL_GAP }}>
                  {Array.from({ length: 7 }).map((_, d) => {
                    const cell    = cells[w * 7 + d] || { lvl: 0, count: 0, date: '' };
                    const isToday = w === todayCol && d === todayRow;
                    const isHov   = hover?.w === w && hover?.d === d;
                    const s       = lvlStyle(cell.lvl, isToday, isHov);
                    return (
                      <div
                        key={d}
                        onMouseEnter={() => setHover({ w, d, count: cell.count, date: cell.date })}
                        onMouseLeave={() => setHover(null)}
                        style={{
                          width: CELL_SIZE,
                          height: CELL_SIZE,
                          borderRadius: 2,
                          position: 'relative',
                          cursor: 'default',
                          zIndex: isToday ? 15 : isHov ? 20 : 1,
                          transition: 'transform 0.08s ease, box-shadow 0.1s ease',
                          opacity: cell.isFuture ? 0.25 : 1,
                          ...s,
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer: hover info + legend ──────────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop: 4 }}>
        <span style={{ fontFamily: 'monospace', fontSize: 10, minWidth: 130 }}>
          {hover
            ? <>
                <span style={{ color:'rgba(228,228,231,0.9)', fontWeight: 600 }}>
                  {hover.count} solve{hover.count !== 1 ? 's' : ''}
                </span>
                {hover.date &&
                  <span style={{ color:'rgba(113,113,122,0.8)' }}> on {hover.date}</span>}
              </>
            : <span style={{ color:'rgba(63,63,70,0.7)' }}>Hover to inspect</span>
          }
        </span>
        <div style={{ display:'flex', alignItems:'center', gap: 4 }}>
          <span style={{ fontFamily:'monospace', fontSize:8, color:'rgba(63,63,70,0.8)', marginRight:2 }}>Less</span>
          {[0,1,2,3,4].map(n => (
            <div key={n} style={{ width:CELL_SIZE, height:CELL_SIZE, borderRadius:2, ...lvlStyle(n,false,false) }} />
          ))}
          <span style={{ fontFamily:'monospace', fontSize:8, color:'rgba(63,63,70,0.8)', marginLeft:2 }}>More</span>
        </div>
      </div>
    </div>
  );
}
