import { useEffect, useState } from 'react';
import { usersService, submissionsService } from '../services/api';
import SkillBadge from '../components/SkillBadge';
import DifficultyBadge from '../components/DifficultyBadge';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { CheckCircle2, XCircle } from 'lucide-react';

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [p, s] = await Promise.all([usersService.getProfile(), submissionsService.getHistory({ limit: 20 })]);
        setProfile(p.data.data);
        setSubs(s.data.data.submissions);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <div className="space-y-4"><div className="card"><LoadingSkeleton lines={4} /></div><div className="card"><LoadingSkeleton lines={8} /></div></div>;

  const user = profile?.user;
  const skillStates = profile?.skillStates || [];
  const solvedCount = subs.filter((s) => s.isCorrect).length;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">Profile</h1>

      {/* User card */}
      <div className="card flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-[#6C63FF]/15 flex items-center justify-center text-lg font-bold text-[#6C63FF] shrink-0">
          {user?.name?.charAt(0)?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold">{user?.name}</p>
          <p className="text-xs text-[#8888A0]">{user?.email}</p>
        </div>
        <span className="font-mono text-xs px-2 py-0.5 bg-[#0F0F1A] border border-[#2A2A4A] rounded text-[#6C63FF]">[LVL {user?.level}]</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 border border-[#2A2A4A] rounded-lg overflow-hidden divide-x divide-[#2A2A4A]">
        <Stat label="Total XP" value={user?.xp || 0} />
        <Stat label="Solved" value={solvedCount} />
        <Stat label="Submissions" value={profile?.submissionCount || 0} />
        <Stat label="Streak" value={`${user?.streak || 0}d`} />
      </div>

      {/* Skills */}
      <div className="card">
        <p className="text-sm font-medium text-[#E8E8F0] mb-3">Skill Mastery</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {skillStates.map((ss) => (
            <div key={ss._id} className="bg-[#0F0F1A] border border-[#2A2A4A] rounded p-3">
              <SkillBadge skillName={ss.skillId?.name || '?'} masteryP={ss.masteryP} isUnlocked={ss.isUnlocked} attempts={ss.attempts || 0} />
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[10px] font-mono text-[#8888A0]">{ss.attempts || 0} attempts</span>
                {ss.isMastered && (ss.attempts || 0) > 0 && (
                  <span className="text-[10px] font-mono bg-[#00D4AA]/10 text-[#00D4AA] px-1.5 py-0.5 rounded">Mastered</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submission history */}
      <div className="card">
        <p className="text-sm font-medium text-[#E8E8F0] mb-3">Submission History</p>
        {subs.length > 0 ? (
          <div className="border border-[#2A2A4A] rounded-lg overflow-hidden divide-y divide-[#2A2A4A]">
            {subs.map((sub) => (
              <div key={sub._id} className="flex items-center gap-3 px-3 py-2 bg-[#0F0F1A] hover:bg-[#15152A] transition-colors">
                {sub.isCorrect ? <CheckCircle2 className="w-4 h-4 text-[#00D4AA] shrink-0" /> : <XCircle className="w-4 h-4 text-[#FF4757] shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#E8E8F0] truncate">{sub.problemId?.title || '?'}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <DifficultyBadge difficulty={sub.problemId?.difficulty || 'easy'} />
                    {sub.language && sub.language !== 'javascript' && <span className="text-[10px] font-mono text-[#8888A0]">{sub.language}</span>}
                  </div>
                </div>
                <span className="font-mono text-xs text-[#FFA726] font-semibold shrink-0">+{sub.xpAwarded}</span>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-[#8888A0] text-center py-6">No submissions yet.</p>}
      </div>
    </div>
  );
};

const Stat = ({ label, value }) => (
  <div className="px-4 py-4 bg-[#1A1A2E]">
    <p className="font-mono text-2xl font-bold text-white">{value}</p>
    <p className="text-[10px] text-[#8888A0] uppercase tracking-widest mt-1">{label}</p>
  </div>
);

export default ProfilePage;
