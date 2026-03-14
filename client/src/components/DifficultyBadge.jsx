const DifficultyBadge = ({ difficulty }) => {
  const colorMap = {
    easy: 'bg-green-500/20 text-green-400 border-green-500/30',
    medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    hard: 'bg-red-500/20 text-red-400 border-red-500/30'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorMap[difficulty] || colorMap.easy}`}>
      {difficulty?.charAt(0).toUpperCase() + difficulty?.slice(1)}
    </span>
  );
};

export default DifficultyBadge;
