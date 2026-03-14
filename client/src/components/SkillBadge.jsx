const SkillBadge = ({ skillName, masteryP, isUnlocked = true }) => {
  const percentage = Math.round((masteryP || 0) * 100);
  const isMastered = masteryP >= 0.85;

  let barColor = 'bg-gray-600';
  let textColor = 'text-muted';

  if (!isUnlocked) {
    barColor = 'bg-gray-700';
    textColor = 'text-gray-600';
  } else if (isMastered) {
    barColor = 'bg-accent';
    textColor = 'text-accent';
  } else {
    barColor = 'bg-primary';
    textColor = 'text-gray-200';
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className={`text-sm font-medium ${textColor}`}>
          {skillName}
          {isMastered && <span className="ml-1.5 text-accent">✓</span>}
          {!isUnlocked && <span className="ml-1.5 text-gray-600">🔒</span>}
        </span>
        <span className={`text-xs ${textColor}`}>{percentage}%</span>
      </div>
      <div className="w-full bg-gray-700/50 rounded-full h-2">
        <div
          className={`${barColor} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default SkillBadge;
