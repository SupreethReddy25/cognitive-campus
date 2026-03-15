import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { usersService, skillsService } from '../services/api';
import SkillBadge from '../components/SkillBadge';
import DifficultyBadge from '../components/DifficultyBadge';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { ArrowRight } from 'lucide-react';

const RecommendationsPage = () => {
  const [reco, setReco] = useState(null);
  const [skillStates, setSkillStates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [r, s] = await Promise.all([usersService.getRecommendations(), skillsService.getMySkillStates()]);
        setReco(r.data.data.recommendation);
        setSkillStates(s.data.data.skillStates);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <div className="space-y-4"><LoadingSkeleton lines={2} /><div className="card"><LoadingSkeleton lines={8} /></div></div>;

  const unlocked = skillStates.filter((s) => s.isUnlocked);
  const locked = skillStates.filter((s) => !s.isUnlocked);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">Recommendations</h1>

      {reco?.problem ? (
        <div className="card border-[#6C63FF]/30">
          <p className="text-[10px] font-mono text-[#6C63FF] uppercase tracking-widest mb-2">Top Pick</p>
          <p className="text-base font-semibold text-[#E8E8F0] mb-1">{reco.problem.title}</p>
          <div className="flex items-center gap-2 mb-3">
            <DifficultyBadge difficulty={reco.problem.difficulty} />
            {reco.skill && <span className="text-xs text-[#8888A0]">{reco.skill}</span>}
          </div>
          {reco.currentMastery !== undefined && (
            <div className="mb-3">
              <p className="text-[10px] text-[#8888A0] mb-1">Current mastery</p>
              <div className="w-full max-w-xs bg-[#2A2A4A] rounded-sm h-1">
                <div className="bg-[#6C63FF] h-1 rounded-sm transition-all" style={{ width: `${Math.round(reco.currentMastery * 100)}%` }} />
              </div>
              <p className="text-xs font-mono text-[#6C63FF] mt-0.5">{Math.round(reco.currentMastery * 100)}%</p>
            </div>
          )}
          <Link to={`/problems/${reco.problem._id}`} className="btn-primary inline-flex items-center gap-1.5 text-xs">
            Solve <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      ) : (
        <div className="card text-center py-10"><p className="text-sm text-[#8888A0]">No recommendations right now. Keep practicing!</p></div>
      )}

      <div className="card">
        <p className="text-sm font-medium text-[#E8E8F0] mb-3">Skill Mastery</p>
        <div className="space-y-2">
          {unlocked.map((ss) => (
            <SkillBadge key={ss._id} skillName={ss.skillId?.name || '?'} masteryP={ss.masteryP} isUnlocked attempts={ss.attempts || 0} />
          ))}
        </div>
        {locked.length > 0 && (
          <div className="mt-4 pt-3 border-t border-[#2A2A4A]">
            <p className="text-[10px] text-[#8888A0] uppercase tracking-widest mb-2">Locked</p>
            <div className="space-y-2">
              {locked.map((ss) => (
                <SkillBadge key={ss._id} skillName={ss.skillId?.name || '?'} masteryP={ss.masteryP} isUnlocked={false} attempts={0} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendationsPage;
