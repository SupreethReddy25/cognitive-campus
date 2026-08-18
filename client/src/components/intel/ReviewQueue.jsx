import React, { useState, useEffect } from 'react';
import { problemsService } from '../../services/api';
import { Loader2, ThumbsUp, ThumbsDown, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function ReviewQueue() {
  const { refreshUser } = useAuth();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [removingIds, setRemovingIds] = useState(new Set());

  useEffect(() => {
    fetchQueue(page);
  }, [page]);

  const fetchQueue = async (p) => {
    setLoading(true);
    try {
      const res = await problemsService.getReviewQueue({ page: p, limit: 10 });
      if (res.data.success) {
        setProblems(res.data.data.problems);
        setTotalPages(res.data.data.totalPages);
        setTotalCount(res.data.data.totalCount);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (id, vote) => {
    try {
      let newlyPromoted = false;
      // Optimistic update
      setProblems(prev => prev.map(p => {
        if (p._id !== id) return p;
        let { upvotes, downvotes, netVotes, userVote } = p;
        if (userVote === vote) {
           userVote = null;
           if (vote === 'up') upvotes--;
           else downvotes--;
        } else {
           if (vote === 'up') { upvotes++; if (userVote === 'down') downvotes--; }
           else { downvotes++; if (userVote === 'up') upvotes--; }
           userVote = vote;
        }
        netVotes = upvotes - downvotes;
        
        if (netVotes >= 3) {
          newlyPromoted = true;
        }
        return { ...p, upvotes, downvotes, netVotes, userVote };
      }));

      // Optimistic UI removal
      if (newlyPromoted) {
        setRemovingIds(prev => new Set([...prev, id]));
        setTimeout(() => {
          setProblems(prev => prev.filter(p => p._id !== id));
          setRemovingIds(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
          setTotalCount(c => Math.max(0, c - 1));
        }, 400); // Wait for transition
      }

      const res = await problemsService.voteProblem(id, vote);
      if (res.data.success && res.data.data.promoted) {
        if (!newlyPromoted) {
          // If it was promoted but not caught by optimistic update (e.g. concurrent votes)
          setRemovingIds(prev => new Set([...prev, id]));
          setTimeout(() => {
            setProblems(prev => prev.filter(p => p._id !== id));
          }, 400);
        }
        refreshUser(); // Update XP
      }
    } catch (e) {
      console.error("Vote failed", e);
      fetchQueue(page); // Revert on failure
    }
  };

  return (
    <div className="px-10 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-semibold text-zinc-100">Community Review Queue</h2>
          <p className="mt-1 font-sans text-[13px] text-zinc-500">
            Help verify crowd-sourced problems. Problems with +3 net votes get published to the global workspace.
          </p>
        </div>
        <div className="font-mono text-[10px] tracking-[0.2em] text-zinc-600 uppercase">
          {totalCount} Pending
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-700">
          <Loader2 className="h-5 w-5 animate-spin mb-3" strokeWidth={1.5} />
          <span className="font-mono text-[10px] tracking-[0.2em]">LOADING QUEUE...</span>
        </div>
      ) : problems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
          <CheckCircle2 className="h-8 w-8 mb-3 opacity-50" strokeWidth={1.5} />
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase">Queue is empty</span>
          <span className="mt-1 text-[12px]">All intel has been processed.</span>
        </div>
      ) : (
        <div className="space-y-4">
          {problems.map((prob) => {
            const isRemoving = removingIds.has(prob._id);
            return (
              <div 
                key={prob._id} 
                className={`rounded-xl border border-white/[0.06] bg-white/[0.01] p-5 hover:border-white/[0.1] transition-all duration-300 ${
                  isRemoving ? 'opacity-0 scale-95 h-0 overflow-hidden py-0 my-0 border-transparent' : 'opacity-100 scale-100'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-[16px] font-medium text-zinc-100">{prob.title}</h3>
                    <div className="mt-1 flex items-center gap-3 font-mono text-[10px] text-zinc-500">
                      <span className="uppercase text-[var(--signal)]">{prob.difficulty}</span>
                      <span>•</span>
                      <span className="uppercase">{prob.skillId?.name}</span>
                      {prob.company && (
                        <>
                          <span>•</span>
                          <span>{prob.company}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>By {prob.authorId?.name || 'Anonymous'}</span>
                    </div>
                  </div>
                  
                  {/* Voting Controls */}
                  <div className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-[#0a0a0a] p-1">
                    <button 
                      onClick={() => handleVote(prob._id, 'up')}
                      className={`press flex h-7 items-center gap-1.5 rounded px-2.5 transition-colors ${
                        prob.userVote === 'up' ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-500 hover:text-emerald-400 hover:bg-white/[0.02]'
                      }`}
                    >
                      <ThumbsUp className="h-3 w-3" strokeWidth={prob.userVote === 'up' ? 2.5 : 1.5} />
                    </button>
                    <span className="font-mono text-[11px] font-semibold text-zinc-300 min-w-[20px] text-center">
                      {prob.netVotes > 0 ? `+${prob.netVotes}` : prob.netVotes}
                    </span>
                    <button 
                      onClick={() => handleVote(prob._id, 'down')}
                      className={`press flex h-7 items-center gap-1.5 rounded px-2.5 transition-colors ${
                        prob.userVote === 'down' ? 'bg-rose-500/10 text-rose-400' : 'text-zinc-500 hover:text-rose-400 hover:bg-white/[0.02]'
                      }`}
                    >
                      <ThumbsDown className="h-3 w-3" strokeWidth={prob.userVote === 'down' ? 2.5 : 1.5} />
                    </button>
                  </div>
                </div>
                
                <div className="font-sans text-[13px] text-zinc-400 line-clamp-3 mb-4 leading-relaxed">
                  {prob.description}
                </div>

                <div className="flex items-center justify-between border-t border-white/[0.04] pt-4">
                  <div className="flex items-center gap-2 text-zinc-500">
                    <AlertCircle className="h-3.5 w-3.5" strokeWidth={1.5} />
                    <span className="font-sans text-[11px]">Passes automated execution tests</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-4">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))} 
                disabled={page === 1}
                className="font-mono text-[10px] tracking-[0.2em] text-zinc-500 hover:text-zinc-200 disabled:opacity-30 uppercase"
              >
                Prev
              </button>
              <span className="font-mono text-[10px] text-zinc-600">{page} / {totalPages}</span>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                disabled={page === totalPages}
                className="font-mono text-[10px] tracking-[0.2em] text-zinc-500 hover:text-zinc-200 disabled:opacity-30 uppercase"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
