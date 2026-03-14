import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { usersService, skillsService } from '../services/api';
import SkillBadge from '../components/SkillBadge';
import DifficultyBadge from '../components/DifficultyBadge';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { Compass, ArrowRight, Target } from 'lucide-react';

const RecommendationsPage = () => {
  const [recommendation, setRecommendation] = useState(null);
  const [skillStates, setSkillStates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [recoRes, skillsRes] = await Promise.all([
          usersService.getRecommendations(),
          skillsService.getMySkillStates()
        ]);
        setRecommendation(recoRes.data.data.recommendation);
        setSkillStates(skillsRes.data.data.skillStates);
      } catch (err) {
        console.error('Recommendations load error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton lines={2} />
        <div className="card"><LoadingSkeleton lines={6} /></div>
        <div className="card"><LoadingSkeleton lines={8} /></div>
      </div>
    );
  }

  const unlockedSkills = skillStates.filter((s) => s.isUnlocked);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Compass className="w-7 h-7 text-primary" />
          Recommendations
        </h1>
        <p className="text-muted text-sm mt-1">Personalised problems based on your mastery</p>
      </div>

      {/* Featured recommendation */}
      {recommendation?.problem ? (
        <div className="card border-primary/30 bg-gradient-to-br from-surface to-primary/5">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-primary">Top Pick For You</span>
          </div>

          <h2 className="text-xl font-bold mb-2">{recommendation.problem.title}</h2>

          <div className="flex items-center gap-3 mb-4">
            <DifficultyBadge difficulty={recommendation.problem.difficulty} />
            {recommendation.skill && (
              <span className="text-sm text-muted">Skill: {recommendation.skill}</span>
            )}
          </div>

          {recommendation.reason && (
            <p className="text-sm text-muted mb-4">{recommendation.reason}</p>
          )}

          {recommendation.currentMastery !== undefined && (
            <div className="mb-4">
              <p className="text-xs text-muted mb-1">Current mastery for this skill</p>
              <div className="w-full bg-gray-700/50 rounded-full h-2.5 max-w-xs">
                <div
                  className="bg-primary h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.round(recommendation.currentMastery * 100)}%` }}
                />
              </div>
              <p className="text-xs text-primary mt-1">{Math.round(recommendation.currentMastery * 100)}%</p>
            </div>
          )}

          <Link
            to={`/problems/${recommendation.problem._id}`}
            className="btn-primary inline-flex items-center gap-2"
          >
            Solve Now <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="card text-center py-12">
          <Compass className="w-10 h-10 text-muted mx-auto mb-3" />
          <p className="text-muted">No recommendations right now. Keep practicing!</p>
        </div>
      )}

      {/* Skills mastery progress */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Your Skill Mastery</h2>
        <div className="space-y-4">
          {unlockedSkills.map((ss) => (
            <SkillBadge
              key={ss._id}
              skillName={ss.skillId?.name || 'Unknown'}
              masteryP={ss.masteryP}
              isUnlocked={ss.isUnlocked}
            />
          ))}
        </div>
        {skillStates.filter((s) => !s.isUnlocked).length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-700/50">
            <p className="text-xs text-muted mb-3">Locked Skills — master prerequisites to unlock:</p>
            <div className="space-y-3">
              {skillStates.filter((s) => !s.isUnlocked).map((ss) => (
                <SkillBadge
                  key={ss._id}
                  skillName={ss.skillId?.name || 'Unknown'}
                  masteryP={ss.masteryP}
                  isUnlocked={false}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendationsPage;
