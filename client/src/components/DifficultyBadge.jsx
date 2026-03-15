const DifficultyBadge = ({ difficulty }) => {
  const styles = {
    easy: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    hard: 'bg-red-500/10 text-red-400 border-red-500/20'
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono border ${styles[difficulty] || styles.easy}`}>
      {difficulty?.charAt(0).toUpperCase() + difficulty?.slice(1)}
    </span>
  );
};

export default DifficultyBadge;
