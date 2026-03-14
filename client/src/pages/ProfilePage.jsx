import { useEffect, useState } from 'react';
import { usersService, submissionsService } from '../services/api';
import SkillBadge from '../components/SkillBadge';
import DifficultyBadge from '../components/DifficultyBadge';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { User, Zap, Trophy, Flame, Calendar, CheckCircle2, XCircle } from 'lucide-react';

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, subRes] = await Promise.all([
          usersService.getProfile(),
          submissionsService.getHistory({ limit: 20 })
        ]);
        setProfile(profileRes.data.data);
        setSubmissions(subRes.data.data.submissions);
      } catch (err) {
        console.error('Profile load error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="card"><LoadingSkeleton lines={4} /></div>
        <div className="card"><LoadingSkeleton lines={8} /></div>
        <div className="card"><LoadingSkeleton lines={6} /></div>
      </div>
    );
  }

  const user = profile?.user;
  const skillStates = profile?.skillStates || [];
  const subCount = profile?.submissionCount || 0;
  const solvedCount = submissions.filter((s) => s.isCorrect).length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <User className="w-7 h-7 text-primary" />
        Profile
      </h1>

      {/* User info card */}
      <div className="card flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary shrink-0">
          {user?.name?.charAt(0)?.toUpperCase()}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold">{user?.name}</h2>
          <p className="text-sm text-muted">{user?.email}</p>
          <p className="text-xs text-muted mt-1">
            <Calendar className="w-3 h-3 inline mr-1" />
            Member since {new Date(user?.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg">
          <Trophy className="w-5 h-5 text-primary" />
          <span className="font-bold text-primary">Level {user?.level}</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Zap} label="Total XP" value={user?.xp || 0} color="text-amber-400" />
        <StatCard icon={CheckCircle2} label="Problems Solved" value={solvedCount} color="text-accent" />
        <StatCard icon={Trophy} label="Submissions" value={subCount} color="text-primary" />
        <StatCard icon={Flame} label="Current Streak" value={`${user?.streak || 0}d`} color="text-orange-400" />
      </div>

      {/* Skill mastery grid */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Skill Mastery</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {skillStates.map((ss) => (
            <div key={ss._id} className="bg-secondary rounded-lg p-4">
              <SkillBadge
                skillName={ss.skillId?.name || 'Unknown'}
                masteryP={ss.masteryP}
                isUnlocked={ss.isUnlocked}
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted">
                  {ss.attempts || 0} attempts
                </span>
                {ss.isMastered && (
                  <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full font-medium">
                    Mastered
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submission history table */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Submission History</h2>
        {submissions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700/50 text-left">
                  <th className="px-4 py-2 text-xs font-medium text-muted uppercase">Problem</th>
                  <th className="px-4 py-2 text-xs font-medium text-muted uppercase text-center">Result</th>
                  <th className="px-4 py-2 text-xs font-medium text-muted uppercase text-right">XP</th>
                  <th className="px-4 py-2 text-xs font-medium text-muted uppercase text-right hidden sm:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/30">
                {submissions.map((sub) => (
                  <tr key={sub._id} className="hover:bg-surface/50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium">{sub.problemId?.title || 'Unknown'}</p>
                        <DifficultyBadge difficulty={sub.problemId?.difficulty || 'easy'} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {sub.isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-accent inline" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400 inline" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm text-amber-400 font-medium">+{sub.xpAwarded}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-muted hidden sm:table-cell">
                      {new Date(sub.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted text-sm text-center py-6">
            No submissions yet. Start solving problems!
          </p>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="card flex items-center gap-4">
    <div className={`w-10 h-10 rounded-lg bg-surface flex items-center justify-center ${color}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  </div>
);

export default ProfilePage;
