import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { problemsService, skillsService } from '../services/api';
import DifficultyBadge from '../components/DifficultyBadge';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { Search, ChevronLeft, ChevronRight, CheckCircle2, Clock, Circle } from 'lucide-react';

const DIFFICULTIES = ['all', 'easy', 'medium', 'hard'];

const ProblemsPage = () => {
  const [problems, setProblems] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSkill, setSelectedSkill] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const res = await skillsService.getAllSkills();
        setSkills(res.data.data.skills);
      } catch (err) {
        console.error('Failed to load skills:', err);
      }
    };
    fetchSkills();
  }, []);

  useEffect(() => {
    const fetchProblems = async () => {
      setLoading(true);
      try {
        const params = { page: currentPage, limit: 12 };
        if (selectedSkill) params.skillId = selectedSkill;
        if (selectedDifficulty !== 'all') params.difficulty = selectedDifficulty;

        const res = await problemsService.getProblems(params);
        setProblems(res.data.data.problems);
        setTotalPages(res.data.data.totalPages);
        setTotalCount(res.data.data.totalCount);
      } catch (err) {
        console.error('Failed to load problems:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProblems();
  }, [currentPage, selectedSkill, selectedDifficulty]);

  const handleSkillChange = (skillId) => {
    setSelectedSkill(skillId);
    setCurrentPage(1);
  };

  const handleDifficultyChange = (diff) => {
    setSelectedDifficulty(diff);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Problems</h1>
        <p className="text-muted text-sm mt-1">{totalCount} problems available</p>
      </div>

      {/* Filter bar */}
      <div className="card flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Skill filter */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Search className="w-4 h-4 text-muted shrink-0" />
          <select
            value={selectedSkill}
            onChange={(e) => handleSkillChange(e.target.value)}
            className="input-field text-sm py-1.5"
          >
            <option value="">All Skills</option>
            {skills.map((skill) => (
              <option key={skill._id} value={skill._id}>{skill.name}</option>
            ))}
          </select>
        </div>

        {/* Difficulty toggle */}
        <div className="flex items-center gap-1 bg-secondary rounded-lg p-0.5">
          {DIFFICULTIES.map((diff) => (
            <button
              key={diff}
              onClick={() => handleDifficultyChange(diff)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                selectedDifficulty === diff
                  ? 'bg-primary text-white'
                  : 'text-muted hover:text-gray-100'
              }`}
            >
              {diff.charAt(0).toUpperCase() + diff.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Problem grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card"><LoadingSkeleton lines={4} /></div>
          ))}
        </div>
      ) : problems.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-muted">No problems found with these filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {problems.map((problem) => (
            <Link
              key={problem._id}
              to={`/problems/${problem._id}`}
              className="card hover:border-primary/30 transition-all duration-200 group"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-medium text-gray-100 group-hover:text-primary transition-colors">
                  {problem.title}
                </h3>
                <StatusIcon status="new" />
              </div>
              <p className="text-xs text-muted mb-4 line-clamp-2">{problem.description}</p>
              <div className="flex items-center justify-between">
                <DifficultyBadge difficulty={problem.difficulty} />
                <span className="text-xs text-muted">{problem.skillId?.name}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="btn-secondary flex items-center gap-1 text-sm px-3 py-1.5 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" /> Prev
          </button>
          <span className="text-sm text-muted">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="btn-secondary flex items-center gap-1 text-sm px-3 py-1.5 disabled:opacity-40"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

const StatusIcon = ({ status }) => {
  if (status === 'solved') return <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />;
  if (status === 'attempted') return <Clock className="w-5 h-5 text-amber-400 shrink-0" />;
  return <Circle className="w-5 h-5 text-gray-600 shrink-0" />;
};

export default ProblemsPage;
