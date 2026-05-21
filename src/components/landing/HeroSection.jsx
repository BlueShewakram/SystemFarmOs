import { ArrowRight, Play, Droplets, Users, TrendingUp, Zap, Shield } from 'lucide-react';
import './HeroSection.css';

const HeroSection = () => {
  return (
    <section className="hero">
      {/* Ambient background effects */}
      <div className="hero-bg">
        <div className="hero-orb orb-1"></div>
        <div className="hero-orb orb-2"></div>
        <div className="hero-orb orb-3"></div>
        <div className="hero-grid"></div>
      </div>

      <div className="container hero-inner">
        {/* Left: Content */}
        <div className="hero-content fade-up">
          <div className="hero-badge glass-subtle">
            <Zap size={14} />
            <span>Now with AI-Powered Automation</span>
          </div>

          <h1 className="hero-title">
            The Intelligent
            <br />
            <span className="text-gradient-hero">Farm Operating System</span>
          </h1>

          <p className="hero-description">
            Automate irrigation, manage workers, assign tasks intelligently, and track payroll - all from one unified, powerful platform built for modern agriculture.
          </p>

          <div className="hero-actions">
            <a href="/auth" className="btn btn-primary btn-lg">
              Get Started Now
              <ArrowRight size={18} />
            </a>
            <button className="btn btn-outline btn-lg">
              <Play size={16} />
              Watch Demo
            </button>
          </div>

          <div className="hero-stats">
            <div className="hero-stat">
              <span className="stat-number">2,400+</span>
              <span className="stat-label">Active Farms</span>
            </div>
            <div className="stat-divider"></div>
            <div className="hero-stat">
              <span className="stat-number">98.7%</span>
              <span className="stat-label">Uptime</span>
            </div>
            <div className="stat-divider"></div>
            <div className="hero-stat">
              <span className="stat-number">35%</span>
              <span className="stat-label">Cost Reduction</span>
            </div>
          </div>
        </div>

        {/* Right: Floating UI cards composition */}
        <div className="hero-visuals">
          <div className="vis-main glass float">
            <div className="vis-toolbar">
              <div className="vis-dots">
                <span style={{background:'#ef4444'}}></span>
                <span style={{background:'#f59e0b'}}></span>
                <span style={{background:'#10b981'}}></span>
              </div>
              <span className="vis-toolbar-title">FarmOS Dashboard</span>
              <div></div>
            </div>
            <div className="vis-body">
              <div className="vis-chart">
                <div className="chart-bar" style={{'--h':'35%','--d':'0s'}}></div>
                <div className="chart-bar" style={{'--h':'55%','--d':'0.1s'}}></div>
                <div className="chart-bar" style={{'--h':'45%','--d':'0.2s'}}></div>
                <div className="chart-bar accent" style={{'--h':'80%','--d':'0.3s'}}></div>
                <div className="chart-bar" style={{'--h':'60%','--d':'0.4s'}}></div>
                <div className="chart-bar" style={{'--h':'70%','--d':'0.5s'}}></div>
                <div className="chart-bar accent" style={{'--h':'90%','--d':'0.6s'}}></div>
                <div className="chart-bar" style={{'--h':'50%','--d':'0.7s'}}></div>
              </div>
              <div className="vis-rows">
                <div className="vis-row"><div className="row-dot green"></div><div className="row-line" style={{width:'80%'}}></div></div>
                <div className="vis-row"><div className="row-dot blue"></div><div className="row-line" style={{width:'60%'}}></div></div>
                <div className="vis-row"><div className="row-dot amber"></div><div className="row-line" style={{width:'45%'}}></div></div>
              </div>
            </div>
          </div>

          {/* Floating card: Irrigation status */}
          <div className="vis-float-card card-irrigation glass float-delay-1">
            <div className="fc-icon blue-bg">
              <Droplets size={18} />
            </div>
            <div className="fc-info">
              <span className="fc-label">Irrigation</span>
              <span className="fc-value fc-active">Active</span>
            </div>
          </div>

          {/* Floating card: Worker count */}
          <div className="vis-float-card card-workers glass float-delay-2">
            <div className="fc-icon green-bg">
              <Users size={18} />
            </div>
            <div className="fc-info">
              <span className="fc-label">Workers Online</span>
              <span className="fc-value">24 / 30</span>
            </div>
          </div>

          {/* Floating card: Yield metric */}
          <div className="vis-float-card card-yield glass float-delay-3">
            <div className="fc-icon purple-bg">
              <TrendingUp size={18} />
            </div>
            <div className="fc-info">
              <span className="fc-label">Yield</span>
              <span className="fc-value text-gradient-accent">+24.5%</span>
            </div>
          </div>

          {/* Floating mini card: Shield */}
          <div className="vis-mini-card glass float-slow">
            <Shield size={16} color="var(--accent)" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
