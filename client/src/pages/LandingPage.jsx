import { Link } from 'react-router-dom';
import { Brain, Code2, Target, ArrowRight, Sparkles } from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'Bayesian Knowledge Tracing',
    description: 'Our BKT engine models your knowledge state per skill — it knows what you\'ve mastered and what needs more practice, adapting difficulty in real-time.'
  },
  {
    icon: Code2,
    title: 'AST Code Analysis',
    description: 'Every submission is analysed using Abstract Syntax Trees. We detect your algorithmic patterns, nesting depth, and suggest optimisations.'
  },
  {
    icon: Target,
    title: 'Adaptive Recommendations',
    description: 'No more guessing what to solve next. The engine recommends the perfect problem for your current level, maximising learning velocity.'
  }
];

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-secondary">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 lg:px-16 py-5 border-b border-gray-700/30">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          <span className="text-xl font-bold">
            <span className="text-primary">Cognitive</span> Campus
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm text-muted hover:text-gray-100 transition-colors">
            Login
          </Link>
          <Link to="/register" className="btn-primary text-sm">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 lg:px-16 py-20 lg:py-32 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm text-primary font-medium">AI-Powered Learning</span>
        </div>
        <h1 className="text-4xl lg:text-6xl font-bold leading-tight mb-6">
          Master DSA with{' '}
          <span className="text-primary">adaptive</span>
          <br />
          intelligence
        </h1>
        <p className="text-lg text-muted max-w-2xl mx-auto mb-10">
          Cognitive Campus uses Bayesian Knowledge Tracing and AST analysis to understand
          exactly where you are in your learning journey — then guides you to mastery
          through personalised problem recommendations.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/register" className="btn-primary flex items-center gap-2 text-base px-8 py-3">
            Start Learning <ArrowRight className="w-5 h-5" />
          </Link>
          <Link to="/login" className="btn-secondary text-base px-8 py-3">
            Login
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 lg:px-16 pb-20 lg:pb-32 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="card hover:border-primary/30 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{title}</h3>
              <p className="text-sm text-muted leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-700/30 px-6 lg:px-16 py-6">
        <p className="text-center text-sm text-muted">
          Cognitive Campus — Built for learners, powered by intelligence.
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
