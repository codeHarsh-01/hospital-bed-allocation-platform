import React from 'react';
import { 
  Play, 
  Pause, 
  FastForward, 
  RotateCcw, 
  Zap, 
  ShieldAlert, 
  FileText, 
  Activity, 
  Clock, 
  Layers, 
  Cpu, 
  Server
} from 'lucide-react';

export function Header({ 
  snapshot, 
  onTogglePlay, 
  onStep, 
  onSetSpeed, 
  onApplyPreset, 
  onOpenReport, 
  activeTab, 
  setActiveTab 
}) {
  const isRunning = snapshot?.isRunning;
  const speed = snapshot?.simulationSpeed || 1;

  return (
    <header className="header-container">
      {/* Top Banner: University, Course, SDG 3 & Team Info */}
      <div className="top-metadata-bar">
        <div className="meta-left">
          <span className="course-tag">
            <Cpu size={13} /> OS PBL (CCSEH0303A)
          </span>
          <span className="faculty-tag">
            Faculty: <strong>Rashmi Bhardwaj</strong>
          </span>
          <span className="team-tag">
            Team G-5: <strong>Harsh Goyal</strong> (Lead) • Aashi • Ananya • Arpit • Kesar
          </span>
        </div>
        <div className="meta-right">
          <span className="sdg-badge">
            <span className="sdg-icon">🌐</span> SDG 3: Good Health & Well-Being
          </span>
          <button 
            className="btn btn-secondary btn-sm report-btn"
            onClick={onOpenReport}
          >
            <FileText size={14} /> PBL Report & Viva
          </button>
        </div>
      </div>

      {/* Main App Bar */}
      <div className="main-navbar">
        <div className="brand-section">
          <div className="brand-logo">
            <Activity className="brand-icon" size={24} />
          </div>
          <div>
            <div className="brand-title-wrap">
              <h1 className="brand-title">MedOS</h1>
              <span className="brand-version">v2.4-PRO</span>
              <span className="badge badge-emerald pulse-tag">
                <span className="pulse-dot pulse-dot-green"></span> Live Engine
              </span>
            </div>
            <p className="brand-subtitle">
              Industrial Hospital Bed Allocation Platform • Operating System Architecture
            </p>
          </div>
        </div>

        {/* Global Simulation Engine Controls */}
        <div className="controls-group">
          <div className="engine-playback-controls">
            <button 
              className={`btn ${isRunning ? 'btn-danger' : 'btn-primary'}`}
              onClick={onTogglePlay}
              title={isRunning ? "Pause Engine" : "Start Live Simulation"}
            >
              {isRunning ? <><Pause size={15} /> Pause</> : <><Play size={15} /> Run Live</>}
            </button>

            <button 
              className="btn btn-secondary"
              onClick={onStep}
              disabled={isRunning}
              title="Execute Single Simulation Tick"
            >
              <FastForward size={14} /> Step
            </button>

            <div className="speed-selector">
              <span className="speed-label"><Clock size={12} /> Speed:</span>
              {[0.5, 1, 2, 4].map(s => (
                <button
                  key={s}
                  className={`speed-btn ${speed === s ? 'active' : ''}`}
                  onClick={() => onSetSpeed(s)}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          {/* Scenario Disaster Presets */}
          <div className="preset-selector">
            <select 
              className="preset-dropdown"
              onChange={(e) => {
                if (e.target.value) {
                  onApplyPreset(e.target.value);
                  e.target.value = '';
                }
              }}
              defaultValue=""
            >
              <option value="" disabled>⚡ Stress Scenarios...</option>
              <option value="MASS_CASUALTY">🚨 Mass Casualty (Trauma Surge)</option>
              <option value="ICU_CRUNCH">⚠️ ICU Crunch (Banker's Stress)</option>
              <option value="PANDEMIC_COHORT">🦠 Pandemic Cohort (Fragmentation)</option>
              <option value="RESET_BALANCED">🔄 Reset to Balanced Day</option>
            </select>
          </div>
        </div>
      </div>

      {/* OS Navigation Tabs */}
      <nav className="os-navigation-tabs">
        <button 
          className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <Server size={15} /> 1. Floorplan & Beds
        </button>
        <button 
          className={`nav-tab ${activeTab === 'concurrency' ? 'active' : ''}`}
          onClick={() => setActiveTab('concurrency')}
        >
          <ShieldAlert size={15} /> 2. Concurrency & Race Lab
          {snapshot?.doubleAllocationViolations > 0 && (
            <span className="tab-alert-badge">{snapshot.doubleAllocationViolations}</span>
          )}
        </button>
        <button 
          className={`nav-tab ${activeTab === 'producer-consumer' ? 'active' : ''}`}
          onClick={() => setActiveTab('producer-consumer')}
        >
          <Layers size={15} /> 3. Bounded Buffer Queue
        </button>
        <button 
          className={`nav-tab ${activeTab === 'bankers' ? 'active' : ''}`}
          onClick={() => setActiveTab('bankers')}
        >
          <Zap size={15} /> 4. Banker's Deadlock
        </button>
        <button 
          className={`nav-tab ${activeTab === 'memory' ? 'active' : ''}`}
          onClick={() => setActiveTab('memory')}
        >
          <Cpu size={15} /> 5. Memory Allocation (Fit/Frag)
        </button>
        <button 
          className={`nav-tab ${activeTab === 'paging' ? 'active' : ''}`}
          onClick={() => setActiveTab('paging')}
        >
          <Activity size={15} /> 6. Paging & Segmentation
        </button>
      </nav>
    </header>
  );
}
