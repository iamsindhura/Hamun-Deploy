"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  BrainCircuit, Users, Target, Mouse, ArrowDown,
  Activity, ListTodo, Play, Calendar, CheckCircle2,
  Sparkles, BarChart3, Layers, LayoutGrid, Sun,
  Smile, FileText, TrendingUp, Paperclip, PenTool,
  Check, Minus, Mic, Coins, Heart, Bot, Library, ShieldCheck, Lock
} from "lucide-react";
import { useState, useEffect } from "react";

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  const navItems = [
    { label: "Home", id: "home" },
    { label: "Problem", id: "problem" },
    { label: "Workspace", id: "workspace" },
    { label: "Workflow", id: "workflow" },
    { label: "AI", id: "ai" },
    { label: "Roadmap", id: "roadmap" }
  ];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);

      const sections = ["home", "problem", "workspace", "workflow", "ai", "roadmap", "login"];
      let current = "home";
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= window.innerHeight / 3 && rect.bottom >= 0) {
            current = section;
          }
        }
      }
      setActiveSection(current);
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 animate-slide-down ${scrolled ? "bg-[#050510]/80 backdrop-blur-md border-b border-white/5 py-4" : "bg-transparent py-6"}`}>
      <div className="max-w-[1400px] mx-auto px-6 flex items-center justify-between">
        
        <a href="#home" onClick={(e) => scrollToSection(e, "home")} className="flex items-center gap-3 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(99,102,241,0.5)] border border-white/10">
            <img src="/logo/hamun-logo.png" alt="HAMUN Logo" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold tracking-tight text-white leading-none">HAMUN</span>
            <span className="text-[10px] uppercase font-semibold text-indigo-300/70 tracking-widest mt-1">AI Life Operating System</span>
          </div>
        </a>

        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item, i) => {
            const isActive = activeSection === item.id;
            return (
              <a 
                key={item.id} 
                href={`#${item.id}`}
                onClick={(e) => scrollToSection(e, item.id)}
                className={`text-sm font-medium transition-all animate-fade-in relative ${isActive ? "text-violet-400" : "text-slate-300 hover:text-white"}`} 
                style={{ animationDelay: `${0.3 + (i * 0.1)}s`, animationFillMode: 'forwards' }}
              >
                {item.label}
                {isActive && (
                  <span className="absolute -bottom-2 left-0 w-full h-[2px] bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.8)]"></span>
                )}
              </a>
            );
          })}
        </nav>

        <div className="flex items-center gap-4 animate-fade-in" style={{ animationDelay: '0.8s' }}>
          <a href="#login" onClick={(e) => scrollToSection(e, "login")} className={`hidden md:block text-sm font-medium transition-colors relative ${activeSection === "login" ? "text-violet-400" : "text-slate-300 hover:text-white"}`}>
            Login
            {activeSection === "login" && (
              <span className="absolute -bottom-2 left-0 w-full h-[2px] bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.8)]"></span>
            )}
          </a>
          <a href="#login" onClick={(e) => scrollToSection(e, "login")}>
            <Button className="bg-white text-slate-950 hover:bg-slate-100 hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] rounded-full px-6 font-semibold">
              Get Started
            </Button>
          </a>
        </div>
      </div>
    </header>
  );
}

function LiveDashboardMockup() {
  return (
    <div className="relative w-full max-w-6xl mx-auto -mt-10 lg:-mt-16 animate-scale-up-fade z-20" style={{ animationDelay: '0.8s' }}>
      
      {/* Ecosystem Connecting Lines (SVG behind mockup) - Updated order CRM -> Tasks -> Deep Work -> Journal -> Insights */}
      <div className="absolute inset-0 -z-10 overflow-visible pointer-events-none opacity-60">
        <svg className="absolute w-full h-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-[1.3]" viewBox="0 0 1000 600" fill="none">
          <path d="M 200,400 C 200,200 400,100 500,100" stroke="url(#glow-line-1)" strokeWidth="2.5" strokeDasharray="8 8" className="animate-dash-line" />
          <path d="M 500,100 C 700,100 800,200 800,400" stroke="url(#glow-line-2)" strokeWidth="2.5" strokeDasharray="8 8" className="animate-dash-line" style={{ animationDelay: '1s' }} />
          <path d="M 800,400 C 800,550 500,550 500,400" stroke="url(#glow-line-3)" strokeWidth="2.5" strokeDasharray="8 8" className="animate-dash-line" style={{ animationDelay: '2s' }} />
          <defs>
            <linearGradient id="glow-line-1" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#ec4899" stopOpacity="0" />
              <stop offset="50%" stopColor="#ec4899" stopOpacity="1" />
              <stop offset="100%" stopColor="#4ade80" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="glow-line-2" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#4ade80" stopOpacity="0" />
              <stop offset="50%" stopColor="#f97316" stopOpacity="1" />
              <stop offset="100%" stopColor="#c084fc" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="glow-line-3" x1="1" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#c084fc" stopOpacity="0" />
              <stop offset="50%" stopColor="#22d3ee" stopOpacity="1" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Main Dashboard Frame */}
      <div className="relative rounded-t-3xl border-t border-x border-white/10 bg-[#0B0B14]/90 backdrop-blur-3xl shadow-[0_0_100px_rgba(99,102,241,0.15)] overflow-hidden flex flex-col md:flex-row w-full ring-1 ring-white/5 mx-4">
        
        {/* Sidebar */}
        <div className="hidden md:flex w-64 border-r border-white/5 bg-black/40 flex-col p-5 gap-6">
          <div className="h-7 w-28 bg-white/10 rounded animate-pulse-slow"></div>
          <div className="space-y-4 mt-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                <div className="w-5 h-5 rounded bg-white/10"></div>
                <div className="h-4 w-20 bg-white/5 rounded"></div>
              </div>
            ))}
          </div>
          <div className="mt-auto p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-indigo-300 tracking-wide uppercase">AI Active</span>
            </div>
            <div className="h-1.5 w-full bg-indigo-950 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-400 w-3/4 animate-[flow-line_3s_linear_infinite]" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)' }}></div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-8 lg:p-12 flex flex-col gap-8 overflow-hidden bg-gradient-to-br from-transparent to-indigo-900/5">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Today's Overview</h2>
              <div className="h-4 w-64 bg-white/5 rounded"></div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-[2px]">
                <div className="w-full h-full bg-[#0B0B14] rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Widgets Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
            
            {/* CRM Widget */}
            <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-6 animate-float hover:bg-white/[0.04] transition-colors" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-pink-500/20 rounded-lg"><Users className="w-5 h-5 text-pink-400" /></div>
                <span className="font-semibold text-white">Network Velocity</span>
              </div>
              <div className="flex items-end gap-3 h-24">
                {[40, 70, 45, 90, 65, 80].map((h, i) => (
                  <div key={i} className="flex-1 bg-pink-500/10 rounded-t-md relative group overflow-hidden">
                    <div className="absolute bottom-0 w-full bg-pink-500 rounded-t-md transition-all duration-1000 ease-out animate-fade-in-up" style={{ height: `${h}%`, animationDelay: `${i * 0.1 + 1}s` }}></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tasks Widget */}
            <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-6 animate-float-delayed hover:bg-white/[0.04] transition-colors" style={{ animationDelay: '1s' }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-500/20 rounded-lg"><ListTodo className="w-5 h-5 text-green-400" /></div>
                <span className="font-semibold text-white">Active Sprints</span>
              </div>
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-5 h-5 rounded-full border-2 border-white/20 flex-shrink-0"></div>
                    <div className={`h-3 rounded-full bg-white/10 flex-1 ${i === 2 ? 'w-3/4' : 'w-full'}`}></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Deep Work Widget */}
            <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-6 animate-float hover:bg-white/[0.04] transition-colors" style={{ animationDelay: '1.5s' }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-orange-500/20 rounded-lg"><Target className="w-5 h-5 text-orange-400" /></div>
                <span className="font-semibold text-white">Flow State</span>
              </div>
              <div className="flex flex-col items-center justify-center h-24">
                <div className="text-4xl font-mono font-bold text-white tracking-widest shadow-orange-500/20 drop-shadow-lg">45:00</div>
                <div className="text-sm font-medium text-orange-300 mt-2 uppercase tracking-widest">In Progress</div>
              </div>
            </div>

            {/* AI Journal Widget */}
            <div className="lg:col-span-2 rounded-2xl bg-white/[0.02] border border-white/5 p-6 flex flex-col animate-float-delayed hover:bg-white/[0.04] transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-500/20 rounded-lg"><BrainCircuit className="w-5 h-5 text-purple-400" /></div>
                <span className="font-semibold text-white">Synthesized Intelligence</span>
              </div>
              <div className="space-y-4 flex-1">
                <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 text-sm text-indigo-100 leading-relaxed font-medium">
                  "You've maintained exceptional focus today, completing 3 major sprint tasks. Your network velocity is up 12%—consider reaching out to Sarah for that follow-up."
                </div>
                <div className="flex gap-2">
                  <div className="h-2 w-full bg-white/5 rounded-full mt-2"></div>
                  <div className="h-2 w-5/6 bg-white/5 rounded-full mt-2"></div>
                </div>
              </div>
            </div>

            {/* Score Widget */}
            <div className="rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 p-6 flex flex-col justify-center items-center animate-float hover:scale-[1.02] transition-transform shadow-[0_0_30px_rgba(6,182,212,0.15)]">
              <span className="text-sm font-bold text-cyan-300 mb-3 uppercase tracking-widest">Daily Alignment</span>
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                  <circle cx="72" cy="72" r="64" className="stroke-white/5" strokeWidth="14" fill="none" />
                  <circle cx="72" cy="72" r="64" className="stroke-cyan-400" strokeWidth="14" fill="none" strokeDasharray="402" strokeDashoffset="60" style={{ transition: 'stroke-dashoffset 2s cubic-bezier(0.4, 0, 0.2, 1)', animation: 'fade-in 1s forwards' }} />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-4xl font-extrabold text-white">85</span>
                  <span className="text-[10px] text-cyan-200 font-medium uppercase mt-1">Score</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(to_bottom,#1e1b4b_0%,#1e3a8a_20%,#09090f_40%,#4c1d95_60%,#0f172a_80%,#1e1b4b_100%)] text-slate-50 relative overflow-hidden font-sans selection:bg-indigo-500/30">
      
      {/* Global Background Enhancements */}
      <div className="absolute inset-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        
        {/* Large Blurred Orbs */}
        <div className="absolute top-[-5%] left-[-10%] w-[50%] h-[800px] bg-purple-600/20 rounded-full blur-[150px] mix-blend-screen animate-orb-move"></div>
        <div className="absolute top-[10%] right-[-10%] w-[40%] h-[700px] bg-indigo-500/20 rounded-full blur-[150px] mix-blend-screen animate-orb-move-reverse"></div>
        <div className="absolute top-[40%] left-[20%] w-[50%] h-[800px] bg-violet-600/15 rounded-full blur-[150px] mix-blend-screen animate-orb-move" style={{ animationDuration: '30s' }}></div>
        <div className="absolute bottom-[10%] right-[10%] w-[60%] h-[900px] bg-indigo-900/40 rounded-full blur-[150px] mix-blend-screen animate-orb-move-reverse" style={{ animationDuration: '35s' }}></div>
        
        {/* Soft grid pattern (Noise) */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] mix-blend-overlay"></div>
        
        {/* Soft animated light streaks */}
        <div className="absolute top-1/4 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent blur-[2px] animate-flow-line opacity-50"></div>
        <div className="absolute top-[45%] left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-400/20 to-transparent blur-[3px] animate-flow-line opacity-40" style={{ animationDuration: '8s', animationDirection: 'reverse' }}></div>
        <div className="absolute top-[75%] left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-400/20 to-transparent blur-[2px] animate-flow-line opacity-30" style={{ animationDuration: '6s' }}></div>
      </div>

      {/* Hero Spotlight */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-[radial-gradient(ellipse_at_top,rgba(109,40,217,0.15)_0%,transparent_70%)] pointer-events-none -z-10"></div>


      <Navbar />

      {/* Spacing reduced in the main wrapper to pull dashboard up */}
      <main id="home" className="relative max-w-[1400px] mx-auto px-6 pt-36 lg:pt-44 min-h-screen flex flex-col items-center text-center">
        
        {/* Hero Text Content */}
        <div className="max-w-4xl mx-auto z-10 flex flex-col items-center">
          <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight mb-8 leading-[1.05] drop-shadow-2xl">
              The AI Operating System.<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-400 to-cyan-400 pb-2">
                For Your Entire Life.
              </span>
            </h1>
          </div>

          <div className="animate-fade-in-up  max-w-2xl" style={{ animationDelay: '0.4s' }}>
            <p className="text-xl text-slate-300 mb-10 leading-relaxed font-medium">
              HAMUN connects your Tasks, CRM, Deep Work, AI Journal, Planning, and Intelligent Insights into one connected workspace that grows with you every day.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 w-full animate-fade-in-up " style={{ animationDelay: '0.5s' }}>
            <a href="#login" onClick={(e) => { e.preventDefault(); document.getElementById('login')?.scrollIntoView({behavior: 'smooth'}) }} className="w-full sm:w-auto">
              <Button size="lg" className="w-full h-14 px-8 text-base bg-white text-slate-950 hover:bg-slate-100 hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] rounded-full font-bold">
                🚀 Get Started
              </Button>
            </a>
            <Link href="#demo" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full h-14 px-8 text-base border-white/10 bg-white/5 backdrop-blur-md text-white hover:bg-white/10 rounded-full font-semibold transition-all">
                <Play className="mr-2 w-5 h-5 fill-white/80" />
                Watch Demo
              </Button>
            </Link>
          </div>

          {/* Value Proposition Banner */}
          <div className="mt-12 animate-fade-in-up " style={{ animationDelay: '0.6s' }}>
            <div className="px-6 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm shadow-xl">
              <span className="text-sm font-medium text-indigo-200 tracking-wide">
                One workspace where every action becomes intelligence.
              </span>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="mt-10 mb-8 flex flex-wrap justify-center items-center gap-8 md:gap-12 animate-fade-in-up " style={{ animationDelay: '0.7s' }}>
            {[
              { icon: "🤖", text: "AI Powered" },
              { icon: "🔒", text: "Private by Design" },
              { icon: "⚡", text: "Everything Connected" },
            ].map((badge, i) => (
              <div key={i} className="flex items-center gap-2 text-slate-300 text-sm font-semibold tracking-wide">
                <span className="text-lg">{badge.icon}</span>
                <span>{badge.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live Ecosystem Dashboard Mockup (Pulled up significantly) */}
        <LiveDashboardMockup />
        
      </main>

      <ProblemSection />
      <SolutionSection />
      <WorkflowSection />
      <JournalSection />
      <ComparisonSection />
      <RoadmapSection />
      <CTASection />
    </div>
  );
}

function ProblemSection() {
  return (
    <section id="problem" className="relative w-full pt-16 md:pt-20 flex flex-col items-center justify-center overflow-hidden">
      {/* Section Spotlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[800px] bg-[radial-gradient(circle_at_center,rgba(49,46,129,0.15)_0%,transparent_60%)] pointer-events-none -z-10"></div>


      <div className="max-w-[1400px] w-full px-6 relative z-10 flex flex-col items-center text-center">
        
        {/* Title */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-8 leading-[1.1]">
            Your Life Isn't Disorganized.<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400">
              Your Tools Are.
            </span>
          </h2>
        </div>

        {/* Subtitle */}
        <div className="animate-fade-in-up max-w-2xl text-lg md:text-xl text-slate-400 leading-relaxed font-medium space-y-4 mb-24" style={{ animationDelay: '0.4s' }}>
          <p>Every day you switch between dozens of apps.</p>
          <p>Each one stores information. None of them truly work together.</p>
          <div className="py-4 space-y-2 text-slate-300">
            <p>Your tasks don't know your calendar.</p>
            <p>Your journal doesn't know your goals.</p>
            <p>Your focus sessions don't know your deadlines.</p>
            <p>Your contacts don't know your projects.</p>
          </div>
          <p className="text-red-300/80 font-semibold">You're forced to connect everything yourself.</p>
        </div>

        {/* Animated Scattered Workspace */}
        <div className="relative w-full max-w-5xl h-[600px] rounded-3xl border border-white/5 bg-[#0B0B14]/50 backdrop-blur-sm p-8 flex items-center justify-center overflow-hidden">
          
          {/* SVG Dotted Connection Lines (Broken) */}
          <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none" style={{ filter: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.5))' }}>
            <path d="M 300,200 Q 400,100 500,250" stroke="#ef4444" strokeWidth="2" fill="none" strokeDasharray="6 12" className="animate-dash-broken" />
            <path d="M 550,250 Q 700,400 800,200" stroke="#ef4444" strokeWidth="2" fill="none" strokeDasharray="6 12" className="animate-dash-broken" style={{ animationDirection: 'reverse' }} />
            <path d="M 800,200 Q 900,100 900,300" stroke="#ef4444" strokeWidth="2" fill="none" strokeDasharray="6 12" className="animate-dash-broken" />
            <path d="M 350,450 Q 200,300 300,200" stroke="#ef4444" strokeWidth="2" fill="none" strokeDasharray="6 12" className="animate-dash-broken" style={{ animationDirection: 'reverse' }} />
          </svg>

          {/* Floating Cards (Absolute Positioned Constellation) */}
          <div className="absolute top-[15%] left-[20%] w-48 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl animate-fade-in-up" style={{ animationDelay: '1s' }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500/20 rounded-lg"><Calendar className="w-4 h-4 text-blue-400" /></div>
              <span className="text-sm font-semibold text-white">Calendar</span>
            </div>
            <div className="h-2 w-3/4 bg-white/10 rounded"></div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-flash-warning ring-2 ring-[#0B0B14]"></div>
          </div>

          <div className="absolute top-[35%] left-[45%] w-56 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl animate-fade-in-up" style={{ animationDelay: '2s' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-green-500/20 rounded-lg"><ListTodo className="w-4 h-4 text-green-400" /></div>
              <span className="text-sm font-semibold text-white">Tasks</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full border border-white/20"></div><div className="h-1.5 w-full bg-white/10 rounded"></div></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full border border-white/20"></div><div className="h-1.5 w-4/5 bg-white/10 rounded"></div></div>
            </div>
            <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-red-500 rounded-full animate-flash-warning ring-2 ring-[#0B0B14]" style={{ animationDelay: '0.5s' }}></div>
          </div>

          <div className="absolute top-[20%] right-[20%] w-52 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl animate-fade-in-up" style={{ animationDelay: '5s' }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-pink-500/20 rounded-lg"><Users className="w-4 h-4 text-pink-400" /></div>
              <span className="text-sm font-semibold text-white">CRM</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-2">Follow up required</div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-flash-warning ring-2 ring-[#0B0B14]" style={{ animationDelay: '1s' }}></div>
          </div>

          <div className="absolute top-[50%] right-[15%] w-48 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl animate-fade-in-up" style={{ animationDelay: '3s' }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-500/20 rounded-lg"><Target className="w-4 h-4 text-orange-400" /></div>
              <span className="text-sm font-semibold text-white">Focus Timer</span>
            </div>
            <div className="text-xl font-mono text-white/50">00:00</div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-flash-warning ring-2 ring-[#0B0B14]" style={{ animationDelay: '1.5s' }}></div>
          </div>

          <div className="absolute bottom-[20%] left-[25%] w-52 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl animate-fade-in-up" style={{ animationDelay: '4s' }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-500/20 rounded-lg"><BrainCircuit className="w-4 h-4 text-purple-400" /></div>
              <span className="text-sm font-semibold text-white">Notes</span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded mb-1"></div>
            <div className="h-1.5 w-2/3 bg-white/10 rounded"></div>
            <div className="absolute -top-1 -left-1 w-3 h-3 bg-red-500 rounded-full animate-flash-warning ring-2 ring-[#0B0B14]" style={{ animationDelay: '2s' }}></div>
          </div>

          <div className="absolute bottom-8 text-center animate-fade-in-up" style={{ animationDelay: '6s' }}>
            <span className="px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold uppercase tracking-widest">
              Data Silos Detected
            </span>
          </div>
        </div>

        {/* Bottom Message */}
        <div className="mt-16 md:mt-20 flex flex-col items-center animate-fade-in-up" style={{ animationDelay: '7s' }}>
          <h3 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight">
            Your life is already connected.<br/>
            <span className="text-slate-500">Your software isn't.</span>
          </h3>
        </div>
      </div>
    </section>
  );
}

function SolutionSection() {
  const cards = [
    {
      id: "crm",
      title: "CRM",
      icon: Users,
      color: "text-pink-400",
      bg: "bg-pink-500/20",
      ring: "group-hover:ring-pink-500/30",
      desc: "Manage professional relationships. Track contacts, companies, priorities, and relationship insights.",
      preview: (
        <div className="bg-[#050510]/50 rounded-xl p-3 border border-white/5 space-y-2 mt-4 opacity-70 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-pink-500/20 flex items-center justify-center"><Users className="w-3 h-3 text-pink-400"/></div>
              <span className="text-xs font-semibold text-white">Sarah Jenkins</span>
            </div>
            <span className="text-[9px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">High</span>
          </div>
          <div className="text-[10px] text-slate-400 flex items-center gap-1"><Layers className="w-3 h-3"/> Acme Corp</div>
        </div>
      )
    },
    {
      id: "tasks",
      title: "Tasks",
      icon: ListTodo,
      color: "text-green-400",
      bg: "bg-green-500/20",
      ring: "group-hover:ring-green-500/30",
      desc: "Organize your daily work. Create, prioritize, and timebox tasks to stay on track.",
      preview: (
        <div className="bg-[#050510]/50 rounded-xl p-3 border border-white/5 space-y-2 mt-4 opacity-70 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-green-500/50"></div>
              <span className="text-xs font-semibold text-white">Update Pitch Deck</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">10:00 AM</span>
          </div>
          <div className="flex items-center gap-2 opacity-50">
            <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center"><CheckCircle2 className="w-3 h-3 text-green-400"/></div>
            <span className="text-xs font-semibold text-slate-400 line-through">Review Metrics</span>
          </div>
        </div>
      )
    },
    {
      id: "deepwork",
      title: "Deep Work",
      icon: Target,
      color: "text-orange-400",
      bg: "bg-orange-500/20",
      ring: "group-hover:ring-orange-500/30",
      desc: "Track focused work sessions. Monitor focus time, streaks, and productivity.",
      preview: (
        <div className="bg-[#050510]/50 rounded-xl p-3 border border-white/5 mt-4 opacity-70 group-hover:opacity-100 transition-opacity flex justify-between items-center">
          <div className="text-center">
            <div className="text-base font-mono font-bold text-orange-400">45:00</div>
            <div className="text-[8px] text-slate-500 uppercase tracking-widest mt-0.5">Timer</div>
          </div>
          <div className="h-8 w-[1px] bg-white/10"></div>
          <div className="text-center">
            <div className="text-sm font-bold text-white">4.5h</div>
            <div className="text-[8px] text-slate-500 uppercase tracking-widest mt-0.5">Today</div>
          </div>
          <div className="h-8 w-[1px] bg-white/10"></div>
          <div className="text-center">
            <div className="text-sm font-bold text-white">5 🔥</div>
            <div className="text-[8px] text-slate-500 uppercase tracking-widest mt-0.5">Streak</div>
          </div>
        </div>
      )
    },
    {
      id: "journal",
      title: "AI Journal",
      icon: Sparkles,
      color: "text-purple-400",
      bg: "bg-purple-500/20",
      ring: "group-hover:ring-purple-500/30",
      desc: "Reflect on your day with intelligent journaling. Generate beautiful, editable reflections.",
      preview: (
        <div className="bg-[#050510]/50 rounded-xl p-3 border border-white/5 mt-4 opacity-70 group-hover:opacity-100 transition-opacity relative">
          <div className="flex items-center gap-2 mb-2">
            <div className="px-2 py-0.5 bg-purple-500/20 rounded-md text-[9px] text-purple-300 flex items-center gap-1 font-semibold uppercase tracking-wider"><Smile className="w-3 h-3"/> Inspired</div>
            <div className="px-2 py-0.5 bg-yellow-500/20 rounded-md text-[9px] text-yellow-300 flex items-center gap-1 font-semibold uppercase tracking-wider"><Sparkles className="w-3 h-3"/> Gratitude</div>
          </div>
          <div className="text-[10px] text-slate-300 font-serif italic leading-relaxed">
            "Productive morning today. The focus session really helped me push through the remaining tasks."
          </div>
        </div>
      )
    },
    {
      id: "projects",
      title: "Projects",
      icon: Layers,
      color: "text-blue-400",
      bg: "bg-blue-500/20",
      ring: "group-hover:ring-blue-500/30",
      desc: "Organize work into meaningful projects. Track progress across every stage.",
      preview: (
        <div className="bg-[#050510]/50 rounded-xl p-3 border border-white/5 space-y-3 mt-4 opacity-70 group-hover:opacity-100 transition-opacity">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-white">Website Redesign</span>
            <span className="text-[10px] text-blue-400 font-mono">75%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-1.5">
            <div className="bg-blue-400 h-1.5 rounded-full" style={{ width: '75%' }}></div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 h-6 bg-white/5 rounded text-[9px] flex items-center justify-center text-slate-400">12 Tasks</div>
            <div className="flex-1 h-6 bg-white/5 rounded text-[9px] flex items-center justify-center text-slate-400">3 Milestones</div>
          </div>
        </div>
      )
    },
    {
      id: "insights",
      title: "AI Insights",
      icon: BrainCircuit,
      color: "text-cyan-400",
      bg: "bg-cyan-500/20",
      ring: "group-hover:ring-cyan-500/30",
      desc: "Receive intelligent observations based on your activity.",
      preview: (
        <div className="bg-[#050510]/50 rounded-xl p-3 border border-white/5 space-y-2 mt-4 opacity-70 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-2">
            <div className="w-1 h-3 bg-green-400 rounded-full"></div>
            <span className="text-[10px] text-slate-300">Productivity up 15% this week.</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1 h-3 bg-pink-400 rounded-full"></div>
            <span className="text-[10px] text-slate-300">3 new professional connections.</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1 h-3 bg-orange-400 rounded-full"></div>
            <span className="text-[10px] text-slate-300">Deep work consistency improved.</span>
          </div>
        </div>
      )
    }
  ];

  return (
    <section id="workspace" className="relative w-full pt-16 md:pt-20 pb-0 flex flex-col items-center justify-center overflow-hidden">
      {/* Background Lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[800px] bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.15)_0%,transparent_60%)] pointer-events-none -z-10"></div>

      <div className="max-w-[1200px] w-full px-6 relative z-10 flex flex-col items-center">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mb-16 animate-fade-in-up">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
            Meet HAMUN.<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
              One Intelligent Workspace.
            </span>
          </h2>
          <p className="text-lg text-slate-300 leading-relaxed font-medium">
            Everything you need to plan, manage, focus, reflect, and grow—all connected in one AI-powered ecosystem.
          </p>
        </div>

        {/* Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-16">
          {cards.map((card, idx) => (
            <div 
              key={card.id} 
              className="bg-[#0B0B14]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative overflow-hidden group hover:-translate-y-1 hover:scale-[1.01] hover:shadow-2xl transition-all duration-300 animate-fade-in-up"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${card.bg}`}>
                  <card.icon className={`w-6 h-6 ${card.color}`} />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-white mb-2">{card.title}</h4>
                  <p className="text-sm text-slate-400 leading-relaxed">{card.desc}</p>
                </div>
              </div>
              
              {/* Mini UI Preview */}
              {card.preview}

              {/* Hover Glow Ring */}
              <div className={`absolute inset-0 rounded-3xl ring-1 ring-inset ring-transparent ${card.ring} pointer-events-none transition-all duration-300`}></div>
            </div>
          ))}
        </div>

        {/* Bottom Statement */}
        <div className="text-center animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
          <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-snug">
            Every module works together.<br/>
            <span className="text-slate-500 font-medium text-xl md:text-2xl">Every action builds context.</span>
          </h3>
        </div>

      </div>
    </section>
  );
}

function EcosystemNodes() {
  const nodes = [
    { label: "Tasks", icon: ListTodo, color: "text-green-400", bg: "bg-green-500/20", ring: "ring-green-400/50", angle: 0, content: <div className="space-y-2 mt-3"><div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full border border-white/30"></div><div className="h-1.5 w-full bg-white/20 rounded"></div></div><div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-green-400 rounded-full"></div><div className="h-1.5 w-4/5 bg-white/10 rounded"></div></div></div> },
    { label: "Projects", icon: Layers, color: "text-blue-400", bg: "bg-blue-500/20", ring: "ring-blue-400/50", angle: 60, content: <div className="flex gap-2 mt-3"><div className="flex-1 h-12 bg-white/5 rounded-md p-1 space-y-1"><div className="h-1 w-full bg-blue-400/50 rounded"></div><div className="h-1 w-3/4 bg-white/20 rounded"></div></div><div className="flex-1 h-12 bg-white/5 rounded-md p-1 space-y-1"><div className="h-1 w-full bg-white/20 rounded"></div></div></div> },
    { label: "Insights", icon: BarChart3, color: "text-cyan-400", bg: "bg-cyan-500/20", ring: "ring-cyan-400/50", angle: 120, content: <div className="flex items-end gap-1 mt-3 h-10 px-2">{[40, 70, 50, 90, 60].map((h, i) => <div key={i} className="flex-1 bg-cyan-400/80 rounded-t-sm" style={{ height: `${h}%` }}></div>)}</div> },
    { label: "Journal", icon: Sparkles, color: "text-purple-400", bg: "bg-purple-500/20", ring: "ring-purple-400/50", angle: 180, content: <div className="space-y-1.5 mt-3"><div className="h-1.5 w-full bg-purple-400/40 rounded"></div><div className="h-1.5 w-5/6 bg-white/20 rounded"></div><div className="h-1.5 w-4/6 bg-white/20 rounded"></div></div> },
    { label: "Deep Work", icon: Target, color: "text-orange-400", bg: "bg-orange-500/20", ring: "ring-orange-400/50", angle: 240, content: <div className="flex flex-col items-center justify-center mt-2"><div className="text-lg font-mono text-white/80 tracking-widest">45:00</div><div className="h-1 w-full bg-white/10 rounded-full mt-1"><div className="h-full w-1/3 bg-orange-400 rounded-full"></div></div></div> },
    { label: "CRM", icon: Users, color: "text-pink-400", bg: "bg-pink-500/20", ring: "ring-pink-400/50", angle: 300, content: <div className="flex items-center gap-3 mt-3"><div className="w-8 h-8 rounded-full bg-pink-500/30"></div><div className="flex-1 space-y-1.5"><div className="h-1.5 w-full bg-white/20 rounded"></div><div className="h-1.5 w-2/3 bg-white/10 rounded"></div></div></div> },
  ];

  return (
    <>
      {nodes.map((node, i) => {
        // Trigonometry to place items in a circle. 0 degrees is top.
        const rad = (node.angle - 90) * (Math.PI / 180);
        // Using percentages relative to center for responsiveness
        const radiusPercent = 45; // Distance from center as a % of container width/2
        const top = `calc(50% + ${Math.sin(rad) * radiusPercent}%)`;
        const left = `calc(50% + ${Math.cos(rad) * radiusPercent}%)`;

        return (
          <div 
            key={i} 
            className="absolute w-36 h-28 md:w-44 md:h-32 bg-[#0B0B14]/90 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-2xl z-30 transition-transform hover:scale-105 group"
            style={{ 
              top, left, 
              transform: 'translate(-50%, -50%)',
              animation: `float 4s ease-in-out infinite`,
              animationDelay: `${i * 0.5}s`
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className={`p-1.5 rounded-lg ${node.bg}`}>
                <node.icon className={`w-3.5 h-3.5 md:w-4 md:h-4 ${node.color}`} />
              </div>
              <span className="text-[10px] md:text-xs font-semibold text-white tracking-wide">{node.label}</span>
            </div>
            {/* Miniature UI Content */}
            <div className="opacity-70 group-hover:opacity-100 transition-opacity">
              {node.content}
            </div>
            
            {/* Subtle Node Glow */}
            <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity ring-1 ring-inset pointer-events-none ${node.ring}`}></div>
          </div>
        );
      })}
    </>
  );
}

function LiveWorkflow() {
  const steps = [
    {
      id: "morning",
      icon: Sun,
      title: "🌅 Morning",
      content: <><p className="text-slate-400 mb-1">You create a task:</p><p className="text-white font-semibold">"Prepare Internship Presentation"</p></>,
      delay: 0,
      color: "text-amber-400"
    },
    {
      id: "timeboxing",
      icon: Calendar,
      title: "📅 Timeboxing",
      content: <p className="text-slate-300 text-sm leading-relaxed">You choose the date and time that works best for you.<br/>HAMUN organizes it into your daily schedule and keeps it visible throughout your workday.</p>,
      delay: 2,
      color: "text-blue-400"
    },
    {
      id: "crm",
      icon: Users,
      title: "🤝 CRM",
      content: <p className="text-slate-300 text-sm leading-relaxed">You add a new contact from the company where you'll be presenting.<br/>You record their role, company, interests, priority, and notes.<br/>HAMUN keeps your professional relationships organized and ready for future follow-ups.</p>,
      delay: 4,
      color: "text-pink-400"
    },
    {
      id: "work",
      icon: Target,
      title: "🎯 Deep Work",
      content: <p className="text-slate-300 text-sm leading-relaxed">When it's time, you start your Focus Session. HAMUN tracks:<br/>• Total focus time<br/>• Session duration<br/>• Focus streak<br/>• Deep Work history</p>,
      delay: 6,
      color: "text-orange-400"
    },
    {
      id: "journal",
      icon: Sparkles,
      title: "📒 AI Journal",
      content: <p className="text-slate-300 text-sm leading-relaxed">At the end of the day, you click <strong>Regenerate Journal</strong>. HAMUN analyzes your day by understanding:<br/>• Your completed tasks & scheduled work<br/>• CRM activity and relationship updates<br/>• Deep Work sessions & Productivity patterns<br/>• Journal attachments</p>,
      delay: 8,
      color: "text-purple-400"
    },
    {
      id: "insights",
      icon: BrainCircuit,
      title: "🧠 AI Insights",
      content: <p className="text-slate-300 text-sm leading-relaxed">HAMUN generates personalized insights about:<br/>• Productivity & Relationships<br/>• Focus habits<br/>• Daily progress<br/>• Areas for improvement</p>,
      delay: 10,
      color: "text-violet-400"
    },
  ];

  return (
    <div className="relative">
      
      {/* Background track for the connection line */}
      <div className="absolute left-6 top-10 bottom-10 w-[2px] bg-white/5"></div>
      
      {/* Animated Connection Light Particle */}
      <div className="absolute left-[23px] top-10 bottom-10 w-1 overflow-hidden pointer-events-none">
        <div className="w-full h-1/4 bg-gradient-to-b from-transparent via-cyan-400 to-transparent blur-[1px] animate-[slide-down_12s_linear_infinite]"></div>
      </div>

      <div className="space-y-8 relative">
        {steps.map((step, idx) => (
          <div key={idx} className="relative pl-16 animate-fade-in-up" style={{ animationDelay: `${step.delay}s`, animationFillMode: 'both' }}>
            
            {/* Icon Node */}
            <div className="absolute left-0 top-0 w-12 h-12 rounded-full bg-[#0B0B14] border border-white/10 flex items-center justify-center z-10 shadow-lg">
              <step.icon className={`w-5 h-5 ${step.color}`} />
              
              {/* Glowing Checkmark (Appears after the step is "processed") */}
              <div className="absolute -bottom-1 -right-1 bg-[#0B0B14] rounded-full animate-scale-up-fade" style={{ animationDelay: `${step.delay + 1.5}s`, animationFillMode: 'both' }}>
                <CheckCircle2 className="w-5 h-5 text-green-500 bg-green-500/20 rounded-full" />
              </div>
            </div>

            {/* Content */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 shadow-sm hover:bg-white/[0.04] transition-colors">
              <h4 className={`font-bold text-sm mb-2 uppercase tracking-wider ${step.color}`}>{step.title}</h4>
              <div className="text-sm">
                {step.content}
              </div>
            </div>
            
          </div>
        ))}

        {/* Final Result Panel */}
        <div className="relative pl-16 animate-fade-in-up" style={{ animationDelay: `13s`, animationFillMode: 'both' }}>
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center z-10 shadow-[0_0_20px_rgba(99,102,241,0.5)]">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-6 shadow-xl">
            <h4 className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300 mb-2 uppercase tracking-widest text-sm">✨ One Connected Workspace</h4>
            <p className="text-indigo-100/90 font-medium leading-relaxed text-sm">
              Instead of switching between multiple disconnected apps, everything you manage throughout the day contributes to one unified workspace.
              <br/><br/>
              Your tasks, contacts, focus sessions, journal, and insights stay connected—giving you a complete picture of your personal and professional growth.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

function JournalSection() {
  return (
    <section id="ai" className="relative w-full pt-16 md:pt-20 pb-0 flex flex-col items-center justify-center overflow-hidden">
      {/* Background Lighting - Warmer brighter purple glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1400px] h-[1200px] bg-[radial-gradient(ellipse_at_center,rgba(167,139,250,0.18)_0%,transparent_60%)] pointer-events-none -z-10"></div>

      <div className="max-w-[1400px] w-full px-6 relative z-10 flex flex-col items-center">
        
        {/* Header */}
        <div className="text-center max-w-3xl mb-24 animate-fade-in-up">
          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-8 leading-tight">
            Your Day Doesn't End.<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-fuchsia-300">
              That's When HAMUN Begins.
            </span>
          </h2>
          <p className="text-lg text-slate-300 leading-relaxed font-medium">
            Every task you complete, every focus session you finish, every relationship you build, and every memory you capture becomes meaningful context. HAMUN transforms your daily activities into intelligent reflections, insights, and personal growth.
          </p>
        </div>

        {/* Main 3-Column Brain Layout */}
        <div className="w-full flex flex-col xl:flex-row items-center xl:items-start justify-center gap-12 xl:gap-8 mb-32">
          
          {/* Left: AI Journal Preview */}
          <div className="flex-1 w-full max-w-lg bg-[#0B0B14]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden group hover:border-violet-500/30 transition-colors">
            {/* Journal Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg"><Sparkles className="w-5 h-5 text-purple-400" /></div>
                <div>
                  <h4 className="font-semibold text-white">Daily Reflection</h4>
                  <p className="text-xs text-slate-400">June 29, 2026</p>
                </div>
              </div>
              <div className="px-3 py-1 bg-amber-500/20 text-amber-400 text-xs font-semibold rounded-full flex items-center gap-2">
                <Smile className="w-3 h-3" /> Inspired
              </div>
            </div>

            {/* Handwritten AI text block */}
            <div className="space-y-4 mb-6">
              <p className="text-slate-300 leading-relaxed font-serif italic text-lg opacity-90">
                "Today was a breakthrough. The 2-hour Deep Work session in the morning helped me finally finalize the Internship Presentation. Met with Sarah from Acme Corp—she seemed very interested in the new roadmap."
              </p>
            </div>

            {/* Attachments & Context */}
            <div className="flex flex-wrap gap-2 mb-6">
              <div className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-300 flex items-center gap-2"><FileText className="w-3 h-3 text-blue-400"/> presentation_v2.pdf</div>
              <div className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-300 flex items-center gap-2"><Users className="w-3 h-3 text-pink-400"/> Sarah Jenkins</div>
            </div>

            {/* Sticky Note */}
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6 rotate-1 hover:rotate-0 transition-transform">
              <h5 className="text-xs font-bold text-yellow-500 uppercase tracking-widest mb-1">Gratitude</h5>
              <p className="text-sm text-yellow-100/80 font-medium">Grateful for the uninterrupted time to focus this morning.</p>
            </div>

            {/* Tomorrow's Intention */}
            <div className="bg-gradient-to-r from-violet-500/10 to-transparent border-l-2 border-violet-500 pl-4 py-2">
              <h5 className="text-xs font-bold text-violet-400 uppercase tracking-widest mb-1">Tomorrow's Intention</h5>
              <p className="text-sm text-slate-300">Review feedback with the team and begin the deployment phase.</p>
            </div>
            
            <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/5 pointer-events-none"></div>
          </div>

          {/* Center: The AI Brain Engine */}
          <div className="flex-shrink-0 w-full sm:w-[300px] flex flex-col items-center justify-center relative py-8 xl:py-16">
            
            {/* Input Data Flow */}
            <div className="flex justify-center gap-4 md:gap-6 mb-6">
              {[
                { icon: ListTodo, color: "text-green-400" },
                { icon: Users, color: "text-pink-400" },
                { icon: Target, color: "text-orange-400" },
                { icon: Paperclip, color: "text-blue-400" }
              ].map((item, i) => (
                <div key={i} className="relative flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-[#0B0B14] border border-white/10 flex items-center justify-center z-10 shadow-lg">
                    <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                  </div>
                  {/* Glowing line down to core */}
                  <div className="w-[1px] h-10 md:h-14 bg-gradient-to-b from-white/10 to-violet-500/50 mt-1 relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-full h-1/2 bg-white blur-[1px] animate-[slide-down_2s_linear_infinite]" style={{ animationDelay: `${i * 0.3}s` }}></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Core Brain */}
            <div className="relative z-20 w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-indigo-600 p-[2px] shadow-[0_0_100px_rgba(167,139,250,0.4)] animate-pulse-slow">
              <div className="w-full h-full bg-[#050510] rounded-full flex flex-col items-center justify-center relative overflow-hidden">
                <BrainCircuit className="w-10 h-10 md:w-12 md:h-12 text-violet-300 mb-2 drop-shadow-[0_0_10px_rgba(167,139,250,0.8)]" />
                <span className="text-[10px] md:text-xs font-bold tracking-[0.2em] text-white uppercase drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">HAMUN AI</span>
                
                {/* Internal Core Rotation */}
                <div className="absolute inset-0 border border-violet-500/30 rounded-full animate-[spin_10s_linear_infinite]"></div>
              </div>
            </div>

            {/* Output Data Flow using SVG */}
            <div className="w-full mt-2 flex justify-center hidden xl:flex">
              <svg width="240" height="80" viewBox="0 0 240 80" className="overflow-visible">
                {/* Left Branch */}
                <path d="M 120,0 L 120,30 L 0,30 L 0,80" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
                <path d="M 120,0 L 120,30 L 0,30 L 0,80" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="6 12" className="animate-[dash-line_3s_linear_infinite]" />
                
                {/* Right Branch */}
                <path d="M 120,0 L 120,30 L 240,30 L 240,80" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
                <path d="M 120,0 L 120,30 L 240,30 L 240,80" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="6 12" className="animate-[dash-line_3s_linear_infinite]" />
              </svg>
            </div>
            
            {/* Output Flow for Mobile/Tablet */}
            <div className="w-[1px] h-12 bg-gradient-to-b from-violet-500/50 to-transparent mt-2 xl:hidden relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1/2 bg-white blur-[1px] animate-[slide-down_2s_linear_infinite]"></div>
            </div>
          </div>

          {/* Right: AI Insights */}
          <div className="flex-1 w-full max-w-lg space-y-4">
            
            <div className="bg-[#0B0B14]/60 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-lg hover:-translate-y-1 transition-transform animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-1.5 bg-green-500/20 rounded-md"><ListTodo className="w-4 h-4 text-green-400" /></div>
                <h5 className="font-semibold text-white text-sm tracking-wide">Productivity</h5>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">You maintained excellent focus during your planned work sessions, completing your top priority 2 hours ahead of schedule.</p>
            </div>

            <div className="bg-[#0B0B14]/60 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-lg hover:-translate-y-1 transition-transform animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-1.5 bg-pink-500/20 rounded-md"><Users className="w-4 h-4 text-pink-400" /></div>
                <h5 className="font-semibold text-white text-sm tracking-wide">Relationships</h5>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">A valuable professional connection was added today. Consider setting a follow-up reminder for Sarah Jenkins next week.</p>
            </div>

            <div className="bg-[#0B0B14]/60 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-lg hover:-translate-y-1 transition-transform animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-1.5 bg-orange-500/20 rounded-md"><Target className="w-4 h-4 text-orange-400" /></div>
                <h5 className="font-semibold text-white text-sm tracking-wide">Focus</h5>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">Your Deep Work consistency continues to improve. You've hit your 2-hour daily focus goal for 4 consecutive days.</p>
            </div>

            <div className="bg-[#0B0B14]/60 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-lg hover:-translate-y-1 transition-transform animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-1.5 bg-cyan-500/20 rounded-md"><TrendingUp className="w-4 h-4 text-cyan-400" /></div>
                <h5 className="font-semibold text-white text-sm tracking-wide">Growth</h5>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">Today's progress builds a stronger foundation for tomorrow. Your balanced approach to deep work and networking is highly effective.</p>
            </div>

          </div>

        </div>

        {/* Key Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full mb-32">
          {[
            { title: "AI Journal", desc: "Create beautiful, editable daily reflections.", icon: Sparkles },
            { title: "AI Insights", desc: "Receive personalized observations based on your activity.", icon: BrainCircuit },
            { title: "Smart Attachments", desc: "Images, PDFs, and voice notes become meaningful journal context.", icon: Paperclip },
            { title: "Manual + AI", desc: "Write freely or let HAMUN help you reflect.", icon: PenTool }
          ].map((feat, i) => (
            <div key={i} className="bg-white/[0.03] hover:bg-white/[0.08] transition-colors border border-white/5 hover:border-white/20 rounded-2xl p-6 flex flex-col items-center text-center group cursor-default shadow-lg hover:shadow-2xl hover:-translate-y-1">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <feat.icon className="w-5 h-5 text-violet-300" />
              </div>
              <h4 className="text-white font-bold mb-2">{feat.title}</h4>
              <p className="text-sm text-slate-400">{feat.desc}</p>
            </div>
          ))}
        </div>

        {/* Final Message */}
        <div className="mt-8 mb-20 flex flex-col items-center text-center animate-fade-in-up" style={{ animationDelay: '1s' }}>
          <h3 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
            More than productivity.<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
              A memory of your journey.
            </span>
          </h3>
        </div>

      </div>
    </section>
  );
}

function WorkflowSection() {
  const steps = [
    {
      title: "Plan Your Day",
      icon: Sun,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      bullets: ["Create today's tasks", "Assign priorities", "Choose timeboxes"],
      preview: (
        <div className="bg-[#050510]/50 rounded-lg p-3 border border-white/5 space-y-1.5 mt-4 group-hover:border-amber-500/30 transition-colors">
          <div className="text-[10px] font-bold text-white uppercase tracking-wider">Today's Tasks</div>
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-slate-400 font-mono">9:00–10:30</span>
            <span className="text-red-400 font-bold bg-red-500/10 px-1.5 rounded">High</span>
          </div>
        </div>
      )
    },
    {
      title: "Stay Organized",
      icon: LayoutGrid,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      bullets: ["View today's schedule", "Track planned hours", "Monitor pending work"],
      preview: (
        <div className="bg-[#050510]/50 rounded-lg p-3 border border-white/5 space-y-1.5 mt-4 group-hover:border-blue-500/30 transition-colors">
          <div className="text-[10px] font-bold text-white uppercase tracking-wider">Overview</div>
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>Scheduled: <span className="text-white font-medium">4</span></span>
            <span>Planned: <span className="text-white font-medium">6h</span></span>
          </div>
        </div>
      )
    },
    {
      title: "Build Relationships",
      icon: Users,
      color: "text-pink-400",
      bg: "bg-pink-500/10",
      border: "border-pink-500/20",
      bullets: ["Add professional contacts", "Track companies", "Save notes & interests"],
      preview: (
        <div className="bg-[#050510]/50 rounded-lg p-3 border border-white/5 space-y-1.5 mt-4 group-hover:border-pink-500/30 transition-colors">
          <div className="text-[10px] font-bold text-white uppercase tracking-wider">Sarah Jenkins</div>
          <div className="flex justify-between text-[10px]">
            <span className="text-pink-400 font-bold bg-pink-500/10 px-1.5 rounded">Priority</span>
            <span className="text-green-400">Good Health</span>
          </div>
        </div>
      )
    },
    {
      title: "Focus Without Distractions",
      icon: Target,
      color: "text-orange-400",
      bg: "bg-orange-500/10",
      border: "border-orange-500/20",
      bullets: ["Start focus sessions", "Track total focus time", "Maintain focus streaks"],
      preview: (
        <div className="bg-[#050510]/50 rounded-lg p-3 border border-white/5 space-y-1.5 mt-4 text-center group-hover:border-orange-500/30 transition-colors">
          <div className="text-base font-bold text-orange-400 font-mono">45:00</div>
          <div className="flex justify-between text-[9px] text-slate-400 uppercase tracking-wide">
            <span>Today: <span className="text-white">4.5h</span></span>
            <span>Streak: <span className="text-white">5🔥</span></span>
          </div>
        </div>
      )
    },
    {
      title: "Reflect on Your Day",
      icon: Sparkles,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
      bullets: ["Generate beautiful journal", "Include Tasks & CRM", "Add Smart Attachments"],
      preview: (
        <div className="bg-[#050510]/50 rounded-lg p-3 border border-white/5 space-y-2 mt-4 group-hover:border-purple-500/30 transition-colors">
          <div className="flex gap-1.5">
            <span className="bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider">Inspired</span>
            <span className="bg-yellow-500/20 text-yellow-300 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider">Gratitude</span>
          </div>
          <div className="text-[9px] text-slate-400 italic leading-relaxed">"Productive morning today. Focused deeply on..."</div>
        </div>
      )
    },
    {
      title: "Understand Progress",
      icon: BrainCircuit,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/20",
      bullets: ["Personalized observations", "Productivity & Focus", "Daily Growth Trends"],
      preview: (
        <div className="bg-[#050510]/50 rounded-lg p-3 border border-white/5 space-y-2 mt-4 group-hover:border-cyan-500/30 transition-colors">
          <div className="flex items-center gap-1.5">
            <div className="w-0.5 h-3 bg-green-400 rounded-full"></div>
            <span className="text-[9px] text-slate-300">Focus consistency up</span>
          </div>
          <div className="w-full bg-white/5 h-1.5 mt-1 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 w-3/4 h-full rounded-full"></div>
          </div>
        </div>
      )
    }
  ];

  return (
    <section id="workflow" className="relative w-full pt-16 md:pt-20 pb-0 flex flex-col items-center justify-center overflow-hidden">
      {/* Background Lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1400px] h-[1000px] bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.1)_0%,transparent_65%)] pointer-events-none -z-10"></div>

      <div className="max-w-[1400px] w-full px-6 relative z-10 flex flex-col items-center">
        
        {/* Header */}
        <div className="text-center max-w-3xl mb-20 animate-fade-in-up">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
            A Day with HAMUN
          </h2>
          <p className="text-lg text-slate-300 leading-relaxed font-medium">
            One action naturally leads to the next.<br/>
            Every activity becomes meaningful context for your day.
          </p>
        </div>

        {/* 6-Step Workflow Container */}
        <div className="w-full relative mb-24">
          
          {/* Connecting Animated Line (Desktop only) */}
          <div className="hidden lg:block absolute top-[60px] left-[8%] right-[8%] h-[2px] bg-white/5 z-0">
             {/* Animated Particle overlay on the line */}
             <div className="absolute inset-0 w-full h-full overflow-hidden">
                <div className="w-48 h-full bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent animate-[slide-right_4s_linear_infinite]"></div>
             </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6 relative z-10">
            {steps.map((step, idx) => (
              <div 
                key={idx}
                className="bg-[#0B0B14]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-5 relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl transition-all duration-300 animate-fade-in-up flex flex-col h-full"
                style={{ animationDelay: `${idx * 0.15}s` }}
              >
                {/* Step Connector (Mobile/Tablet vertical lines) */}
                {idx < steps.length - 1 && (
                  <div className="lg:hidden absolute -bottom-6 left-1/2 -translate-x-1/2 w-[2px] h-6 bg-gradient-to-b from-indigo-500/50 to-transparent"></div>
                )}

                <div className={`w-12 h-12 rounded-2xl ${step.bg} ${step.border} border flex items-center justify-center mb-5 mx-auto lg:mx-0 shadow-lg relative z-10 group-hover:scale-110 transition-transform duration-300`}>
                  <step.icon className={`w-6 h-6 ${step.color}`} />
                </div>
                
                <h4 className="text-sm font-bold text-white mb-4 text-center lg:text-left h-10 flex items-center justify-center lg:justify-start">{step.title}</h4>
                
                <ul className="space-y-2 mb-4 flex-1">
                  {step.bullets.map((b, i) => (
                    <li key={i} className="text-[11px] text-slate-400 flex items-start justify-center lg:justify-start gap-1.5 leading-snug">
                      <span className={`w-1 h-1 rounded-full ${step.color} mt-1.5 flex-shrink-0 opacity-60`}></span>
                      <span className="text-center lg:text-left">{b}</span>
                    </li>
                  ))}
                </ul>

                {step.preview}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Statement */}
        <div className="text-center animate-fade-in-up" style={{ animationDelay: '1s' }}>
          <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-white leading-snug">
            Every action builds context.<br/>
            <span className="text-indigo-400">Every day becomes meaningful.</span>
          </h3>
        </div>

      </div>
    </section>
  );
}

function ComparisonSection() {
  const comparisons = [
    { traditional: "Multiple disconnected tools", hamun: "One connected workspace" },
    { traditional: "Manual organization", hamun: "Everything stays connected" },
    { traditional: "Static notes", hamun: "AI-powered reflections" },
    { traditional: "Separate apps for every task", hamun: "One ecosystem for your daily life" },
    { traditional: "Track activity", hamun: "Understand progress" }
  ];
  
  return (
    <section className="relative w-full pt-16 md:pt-20 pb-0 flex flex-col items-center justify-center overflow-hidden">
      <div className="max-w-[1000px] w-full px-6 relative z-10 flex flex-col items-center">
        
        <div className="text-center max-w-3xl mb-16 animate-fade-in-up">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">Why Choose HAMUN?</h2>
          <p className="text-lg text-slate-300 font-medium">Most productivity tools organize information.<br/><span className="text-violet-300">HAMUN understands it.</span></p>
        </div>
        
        <div className="w-full bg-[#0B0B14]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-10 shadow-2xl animate-fade-in-up">
          <div className="grid grid-cols-2 gap-4 border-b border-white/10 pb-6 mb-6">
            <h3 className="text-center font-semibold text-slate-400 text-sm tracking-widest uppercase">Traditional Productivity</h3>
            <h3 className="text-center font-bold text-violet-400 text-sm tracking-widest uppercase">HAMUN</h3>
          </div>
          <div className="space-y-4">
            {comparisons.map((item, i) => (
              <div key={i} className="grid grid-cols-2 gap-4 items-stretch group">
                <div className="flex items-center gap-3 bg-white/5 rounded-xl p-4 transition-colors group-hover:bg-white/10 border border-white/5">
                  <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0"><Minus className="w-3 h-3 text-slate-500" /></div>
                  <span className="text-sm text-slate-300">{item.traditional}</span>
                </div>
                <div className="flex items-center gap-3 bg-violet-500/10 rounded-xl p-4 transition-colors group-hover:bg-violet-500/20 border border-violet-500/20 shadow-[0_0_15px_rgba(139,92,246,0.1)]">
                  <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0"><Check className="w-3 h-3 text-violet-400" /></div>
                  <span className="text-sm font-semibold text-white">{item.hamun}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function RoadmapSection() {
  const features = [
    { icon: Calendar, title: "Smart Calendar", desc: "AI-assisted scheduling and planning.", color: "text-blue-400" },
    { icon: Mic, title: "Voice Assistant", desc: "Talk naturally with HAMUN.", color: "text-indigo-400" },
    { icon: Coins, title: "Finance Tracker", desc: "Track expenses and financial goals.", color: "text-green-400" },
    { icon: Heart, title: "Health & Wellness", desc: "Connect productivity with healthy habits.", color: "text-pink-400" },
    { icon: Bot, title: "AI Life Coach", desc: "Personalized recommendations based on long-term growth.", color: "text-orange-400" },
    { icon: Library, title: "Knowledge Vault", desc: "Store ideas, notes, and memories in one searchable space.", color: "text-amber-400" }
  ];
  
  return (
    <section id="roadmap" className="relative w-full pt-20 md:pt-32 pb-0 flex flex-col items-center justify-center overflow-hidden">
      <div className="max-w-[1200px] w-full px-6 relative z-10 flex flex-col items-center">
        
        <div className="text-center max-w-3xl mb-16 animate-fade-in-up">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">The Journey Has Just Begun.</h2>
          <p className="text-lg text-slate-300 font-medium">HAMUN continues to evolve into a complete AI-powered Life Operating System.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {features.map((item, i) => (
            <div key={i} className="bg-[#0B0B14]/80 backdrop-blur-md border border-white/10 rounded-2xl p-6 group hover:-translate-y-1 hover:border-white/20 transition-all duration-300 animate-fade-in-up" style={{animationDelay: `${i * 0.1}s`}}>
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <item.icon className={`w-6 h-6 ${item.color}`} />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">{item.title}</h4>
              <p className="text-sm text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section id="login" className="relative w-full pt-32 pb-8 flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(139,92,246,0.15)_0%,transparent_60%)] pointer-events-none -z-10"></div>
      
      <div className="max-w-[800px] w-full px-6 relative z-10 flex flex-col items-center text-center">
        
        <div className="w-24 h-24 rounded-[28px] overflow-hidden shadow-[0_0_80px_rgba(139,92,246,0.5)] mb-8 animate-fade-in-up border border-white/10">
          <img src="/logo/hamun-logo.png" alt="HAMUN Logo" className="w-full h-full object-cover" />
        </div>

        <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-8 leading-tight animate-fade-in-up" style={{animationDelay: '0.1s'}}>
          Your Journey Starts Here.
        </h2>
        
        <p className="text-lg text-slate-300 leading-relaxed font-medium mb-10 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
          Everything you've seen throughout this page becomes your personal workspace the moment you sign in.<br/><br/>
          <span className="text-white/80">Plan your day. Build meaningful relationships. Stay focused. Reflect intelligently. Grow consistently.</span>
        </p>

        <div className="mb-12 animate-fade-in-up" style={{animationDelay: '0.3s'}}>
          <Button size="lg" className="h-14 px-10 bg-white hover:bg-slate-100 text-[#050510] font-bold rounded-2xl text-lg shadow-[0_0_40px_rgba(255,255,255,0.2)] transition-all hover:scale-105" asChild>
            <Link href="/login">
              Get Started with Google
            </Link>
          </Button>
        </div>

        <div className="flex flex-wrap justify-center gap-4 md:gap-8 mb-32 animate-fade-in-up" style={{animationDelay: '0.4s'}}>
          {[
            { icon: ShieldCheck, text: "Secure Authentication" },
            { icon: Sparkles, text: "AI Powered" },
            { icon: Lock, text: "Private by Design" },
            { icon: TrendingUp, text: "Built for Growth" }
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <item.icon className="w-4 h-4 text-violet-400" />
              {item.text}
            </div>
          ))}
        </div>

      </div>

      {/* Minimal Footer */}
      <footer className="w-full max-w-[1400px] mx-auto px-6 border-t border-white/10 pt-8 pb-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500 relative z-10">
        <div className="flex items-center gap-2">
          <img src="/logo/hamun-logo.png" alt="HAMUN Logo" className="w-6 h-6 rounded-md" />
          <span className="font-bold text-white tracking-widest uppercase">HAMUN</span>
          <span>© 2026. All rights reserved.</span>
        </div>
        <div className="flex items-center gap-6 font-medium">
          <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
          <Link href="#" className="hover:text-white transition-colors">Terms</Link>
          <Link href="#" className="hover:text-white transition-colors">Contact</Link>
        </div>
      </footer>
    </section>
  );
}
