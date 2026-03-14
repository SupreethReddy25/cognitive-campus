import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { skillsService, usersService, submissionsService } from '../services/api';
import SkillBadge from '../components/SkillBadge';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { Zap, Trophy, Flame, BookOpen, ArrowRight } from 'lucide-react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';

const Dashboard = () => {
  const [profile, setProfile] = useState(null);
  const [skillStates, setSkillStates] = useState([]);
  const [recommendation, setRecommendation] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, skillsRes, recoRes, subRes] = await Promise.all([
          usersService.getProfile(),
          skillsService.getMySkillStates(),
          usersService.getRecommendations(),
          submissionsService.getHistory({ limit: 10 })
        ]);
        setProfile(profileRes.data.data);
        setSkillStates(skillsRes.data.data.skillStates);
        setRecommendation(recoRes.data.data.recommendation);
        setSubmissions(subRes.data.data.submissions);
      } catch (err) {
        console.error('Dashboard load error:', err);
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="card"><LoadingSkeleton lines={2} /></div>)}
        </div>
        <div className="card"><LoadingSkeleton lines={8} /></div>
      </div>
    );
  }

  const user = profile?.user;
  const masteredCount = skillStates.filter((s) => s.isMastered).length;

  // Radar chart data
  const radarData = skillStates.map((ss) => ({
    skill: ss.skillId?.name?.replace('&', '&\n') || 'Unknown',
    mastery: Math.round((ss.masteryP || 0) * 100),
    fullMark: 100
  }));

  // XP progression from recent submissions
  const xpData = submissions
    .slice()
    .reverse()
    .map((sub, index) => ({
      submission: index + 1,
      xp: sub.xpAwarded || 0
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-muted text-sm mt-1">Here&apos;s your learning progress</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Zap} label="Total XP" value={user?.xp || 0} color="text-amber-400" />
        <StatCard icon={Trophy} label="Level" value={user?.level || 1} color="text-primary" />
        <StatCard icon={Flame} label="Streak" value={`${user?.streak || 0} days`} color="text-orange-400" />
        <StatCard icon={BookOpen} label="Mastered" value={`${masteredCount}/12`} color="text-accent" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar chart */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Skill Mastery Radar</h2>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis dataKey="skill" tick={{ fill: '#A0A0B0', fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#A0A0B0', fontSize: 10 }} />
                <Radar
                  name="Mastery"
                  dataKey="mastery"
                  stroke="#6C63FF"
                  fill="#6C63FF"
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted text-sm">No skill data yet</p>
          )}
        </div>

        {/* XP progression */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Recent XP Gains</h2>
          {xpData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={xpData}>
                <XAxis dataKey="submission" tick={{ fill: '#A0A0B0', fontSize: 12 }} />
                <YAxis tick={{ fill: '#A0A0B0', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#2A2A3E', border: '1px solid #374151', borderRadius: 8 }}
                  labelStyle={{ color: '#A0A0B0' }}
                  itemStyle={{ color: '#6C63FF' }}
                />
                <Line type="monotone" dataKey="xp" stroke="#6C63FF" strokeWidth={2} dot={{ fill: '#6C63FF', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted text-sm">Submit solutions to see your progress</p>
          )}
        </div>
      </div>

      {/* Continue Learning + Skills */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recommendation */}
        {recommendation && (
          <div className="card border-primary/30">
            <h2 className="text-lg font-semibold mb-3">Continue Learning</h2>
            <div className="space-y-2">
              <p className="text-sm text-muted">Recommended for you:</p>
              <p className="font-medium text-gray-100">{recommendation.problem?.title || 'Practice more problems'}</p>
              {recommendation.skill && (
                <p className="text-xs text-muted">Skill: {recommendation.skill}</p>
              )}
              {recommendation.problem && (
                <Link
                  to={`/problems/${recommendation.problem._id}`}
                  className="btn-primary inline-flex items-center gap-2 text-sm mt-3"
                >
                  Solve Now <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Skills overview */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Skill Overview</h2>
          <div className="space-y-3">
            {skillStates.slice(0, 6).map((ss) => (
              <SkillBadge
                key={ss._id}
                skillName={ss.skillId?.name || 'Unknown'}
                masteryP={ss.masteryP}
                isUnlocked={ss.isUnlocked}
              />
            ))}
            {skillStates.length > 6 && (
              <Link to="/profile" className="text-sm text-primary hover:underline">
                View all skills →
              </Link>
            )}
          </div>
        </div>
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

export default Dashboard;
