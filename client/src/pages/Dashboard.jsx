import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { skillsService, usersService, submissionsService } from '../services/api';
import SkillBadge from '../components/SkillBadge';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { ArrowRight } from 'lucide-react';
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
        const [p, s, r, sub] = await Promise.all([
          usersService.getProfile(),
          skillsService.getMySkillStates(),
          usersService.getRecommendations(),
          submissionsService.getHistory({ limit: 10 })
        ]);
        setProfile(p.data.data);
        setSkillStates(s.data.data.skillStates);
        setRecommendation(r.data.data.recommendation);
        setSubmissions(sub.data.data.submissions);
      } catch (err) { console.error('Dashboard load error:', err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) return <div className="space-y-4"><LoadingSkeleton lines={2} /><div className="card"><LoadingSkeleton lines={8} /></div></div>;

  const user = profile?.user;
  const masteredCount = skillStates.filter((s) => s.isMastered && (s.attempts || 0) > 0).length;

  const radarData = skillStates.map((ss) => ({
    skill: ss.skillId?.name?.replace(' & ', '\n') || '?',
    mastery: (ss.attempts || 0) > 0 ? Math.round((ss.masteryP || 0) * 100) : 0,
    fullMark: 100
  }));

  const xpData = submissions.slice().reverse().map((sub, i) => ({
    sub: i + 1,
    xp: sub.xpAwarded || 0
  }));

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold tracking-tight">Welcome back, {user?.name?.split(' ')[0]}</h1>

      {/* Stats row — terminal-style thin bordered blocks */}
      <div className="grid grid-cols-2 lg:grid-cols-4 border border-[#2A2A4A] rounded-lg overflow-hidden divide-x divide-[#2A2A4A]">
        <Stat label="Total XP" value={user?.xp || 0} />
        <Stat label="Level" value={user?.level || 1} />
        <Stat label="Streak" value={`${user?.streak || 0}d`} />
        <Stat label="Mastered" value={`${masteredCount}/12`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Radar */}
        <div className="card">
          <p className="text-sm font-medium text-[#E8E8F0] mb-3">Skill Radar</p>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#2A2A4A" />
                <PolarAngleAxis dataKey="skill" tick={{ fill: '#8888A0', fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#555', fontSize: 9 }} />
                <Radar name="Mastery" dataKey="mastery" stroke="#6C63FF" fill="#6C63FF" fillOpacity={0.1} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          ) : <p className="text-xs text-[#8888A0]">No data yet</p>}
        </div>

        {/* XP line chart */}
        <div className="card">
          <p className="text-sm font-medium text-[#E8E8F0] mb-3">Recent XP</p>
          {xpData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={xpData}>
                <XAxis dataKey="sub" tick={{ fill: '#8888A0', fontSize: 11 }} />
                <YAxis tick={{ fill: '#8888A0', fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1A1A2E', border: '1px solid #2A2A4A', borderRadius: 4 }} labelStyle={{ color: '#8888A0' }} itemStyle={{ color: '#6C63FF' }} />
                <Line type="monotone" dataKey="xp" stroke="#6C63FF" strokeWidth={2} dot={{ fill: '#6C63FF', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="text-xs text-[#8888A0]">Submit solutions to see progress</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recommendation */}
        {recommendation?.problem && (
          <div className="card border-[#6C63FF]/30">
            <p className="text-xs font-mono text-[#6C63FF] uppercase tracking-widest mb-2">Recommended</p>
            <p className="text-sm font-medium text-[#E8E8F0] mb-1">{recommendation.problem.title}</p>
            {recommendation.skill && <p className="text-xs text-[#8888A0] mb-3">{recommendation.skill}</p>}
            <Link to={`/problems/${recommendation.problem._id}`} className="btn-primary inline-flex items-center gap-1.5 text-xs">
              Solve <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}

        {/* Skills overview */}
        <div className="card">
          <p className="text-sm font-medium text-[#E8E8F0] mb-3">Skills</p>
          <div className="space-y-2">
            {skillStates.slice(0, 6).map((ss) => (
              <SkillBadge key={ss._id} skillName={ss.skillId?.name || '?'} masteryP={ss.masteryP} isUnlocked={ss.isUnlocked} attempts={ss.attempts || 0} />
            ))}
            {skillStates.length > 6 && <Link to="/profile" className="text-xs text-[#6C63FF]">View all →</Link>}
          </div>
        </div>
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

export default Dashboard;
