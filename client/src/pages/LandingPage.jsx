import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#0F0F1A]" style={{
      backgroundImage: 'linear-gradient(rgba(42,42,74,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(42,42,74,0.15) 1px, transparent 1px)',
      backgroundSize: '60px 60px'
    }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 lg:px-16 py-4 border-b border-[#1E1E35]">
        <span className="text-sm font-semibold tracking-tight">
          <span className="text-[#6C63FF]">Cognitive</span>
          <span className="text-[#E8E8F0]"> Campus</span>
        </span>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm text-[#8888A0] hover:text-[#E8E8F0] transition-colors">Login</Link>
          <Link to="/register" className="btn-primary">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 lg:px-16 py-24 lg:py-40 max-w-4xl mx-auto">
        <p className="font-mono text-xs text-[#6C63FF] mb-4 tracking-widest uppercase">Adaptive Learning Platform</p>
        <h1 className="text-4xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6 text-[#E8E8F0]">
          Master DSA with<br />
          <span className="text-[#6C63FF]">adaptive intelligence</span>
        </h1>
        <p className="text-base text-[#8888A0] max-w-xl mb-10 leading-relaxed">
          BKT-powered knowledge tracing models your mastery per skill.
          AST analysis reads your code structure. The engine recommends
          the exact problem you need next.
        </p>
        <div className="flex items-center gap-3">
          <Link to="/register" className="btn-primary flex items-center gap-2 px-5 py-2.5">
            Start Learning <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/login" className="btn-secondary px-5 py-2.5">Login</Link>
        </div>
      </section>

      {/* Feature blocks */}
      <section className="px-6 lg:px-16 pb-24 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: 'BKT Engine', code: 'P(L|correct) = P(L)×(1−P(S)) / P(correct)', desc: 'Bayesian Knowledge Tracing models your knowledge state per skill in real-time.' },
            { title: 'AST Analysis', code: 'nestingDepth: 2 → O(n²) detected', desc: 'Your code is parsed into an AST to detect patterns, anti-patterns, and complexity.' },
            { title: 'Recommendations', code: 'next → skill: "Trees", difficulty: "medium"', desc: 'The engine picks the optimal problem for your current level and weakest skill.' }
          ].map(({ title, code, desc }) => (
            <div key={title} className="card">
              <p className="text-sm font-semibold text-[#E8E8F0] mb-2">{title}</p>
              <div className="bg-[#0F0F1A] rounded border border-[#2A2A4A] px-3 py-2 mb-3">
                <code className="font-mono text-xs text-[#6C63FF]">{code}</code>
              </div>
              <p className="text-xs text-[#8888A0] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-[#1E1E35] px-6 py-5 text-center">
        <p className="text-xs text-[#555]">Cognitive Campus — Built for learners, powered by intelligence.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
