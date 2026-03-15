import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { problemsService, skillsService } from '../services/api';
import DifficultyBadge from '../components/DifficultyBadge';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DIFFS = ['all', 'easy', 'medium', 'hard'];

const ProblemsPage = () => {
  const [problems, setProblems] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSkill, setSelectedSkill] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    skillsService.getAllSkills().then((r) => setSkills(r.data.data.skills)).catch(() => {});
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = { page, limit: 15 };
        if (selectedSkill) params.skillId = selectedSkill;
        if (selectedDifficulty !== 'all') params.difficulty = selectedDifficulty;
        const r = await problemsService.getProblems(params);
        setProblems(r.data.data.problems);
        setTotalPages(r.data.data.totalPages);
        setTotalCount(r.data.data.totalCount);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [page, selectedSkill, selectedDifficulty]);

  const diffColor = { easy: 'border-l-emerald-500', medium: 'border-l-amber-500', hard: 'border-l-red-500' };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Problems</h1>
        <span className="text-xs font-mono text-[#8888A0]">{totalCount} total</span>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <select value={selectedSkill} onChange={(e) => { setSelectedSkill(e.target.value); setPage(1); }}
          className="input-field text-xs py-1.5 max-w-[200px]">
          <option value="">All Skills</option>
          {skills.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
        <div className="flex items-center gap-0.5 bg-[#0F0F1A] border border-[#2A2A4A] rounded-md p-0.5">
          {DIFFS.map((d) => (
            <button key={d} onClick={() => { setSelectedDifficulty(d); setPage(1); }}
              className={`px-3 py-1 text-xs font-mono rounded transition-colors ${selectedDifficulty === d ? 'bg-[#6C63FF] text-white' : 'text-[#8888A0] hover:text-white'}`}>
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Problem list */}
      {loading ? (
        <div className="card"><LoadingSkeleton lines={10} /></div>
      ) : problems.length === 0 ? (
        <div className="card text-center py-10"><p className="text-sm text-[#8888A0]">No problems match these filters.</p></div>
      ) : (
        <div className="border border-[#2A2A4A] rounded-lg overflow-hidden divide-y divide-[#2A2A4A]">
          {problems.map((p) => (
            <Link key={p._id} to={`/problems/${p._id}`}
              className={`flex items-center gap-4 px-4 py-3 bg-[#1A1A2E] hover:bg-[#22223A] transition-colors border-l-2 ${diffColor[p.difficulty] || ''}`}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#E8E8F0] truncate">{p.title}</p>
                <p className="text-xs text-[#8888A0] mt-0.5">{p.skillId?.name}</p>
              </div>
              <DifficultyBadge difficulty={p.difficulty} />
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="btn-secondary flex items-center gap-1 text-xs px-2.5 py-1 disabled:opacity-30">
            <ChevronLeft className="w-3 h-3" /> Prev
          </button>
          <span className="text-xs font-mono text-[#8888A0]">{page}/{totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="btn-secondary flex items-center gap-1 text-xs px-2.5 py-1 disabled:opacity-30">
            Next <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ProblemsPage;
