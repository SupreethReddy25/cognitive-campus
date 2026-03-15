const SkillBadge = ({ skillName, masteryP, isUnlocked = true, attempts = 0 }) => {
  const displayMastery = attempts > 0 ? Math.round((masteryP || 0) * 100) : 0;
  const isMastered = masteryP >= 0.85 && attempts > 0;

  if (!isUnlocked) {
    return (
      <div className="flex items-center justify-between py-1.5">
        <span className="text-sm text-[#555] flex items-center gap-1.5">
          <span className="text-xs">🔒</span> {skillName}
        </span>
        <span className="text-xs font-mono text-[#555]">Locked</span>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-[#E8E8F0]">
          {skillName}
          {isMastered && <span className="ml-1.5 text-[#00D4AA]">✓</span>}
        </span>
        <span className="text-xs font-mono text-[#8888A0]">
          {attempts > 0 ? `${displayMastery}%` : 'Not started'}
        </span>
      </div>
      <div className="w-full bg-[#2A2A4A] rounded-sm h-1">
        <div
          className={`h-1 rounded-sm transition-all duration-500 ${isMastered ? 'bg-[#00D4AA]' : 'bg-[#6C63FF]'}`}
          style={{ width: `${displayMastery}%` }}
        />
      </div>
    </div>
  );
};

export default SkillBadge;
