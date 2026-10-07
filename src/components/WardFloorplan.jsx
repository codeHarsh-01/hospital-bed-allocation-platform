import React, { useState } from 'react';
import { 
  Bed, 
  Wind, 
  CheckCircle2, 
  AlertTriangle, 
  UserPlus, 
  LogOut, 
  Sparkles, 
  Activity, 
  HeartPulse, 
  Clock,
  Info
} from 'lucide-react';

export function WardFloorplan({ 
  snapshot, 
  onDischargeBed, 
  onAdmitPatient 
}) {
  const [selectedWard, setSelectedWard] = useState('ALL');
  const [activeBedModal, setActiveBedModal] = useState(null);
  const [customName, setCustomName] = useState('');
  const [customCondition, setCustomCondition] = useState('Acute Trauma');
  const [customPriority, setCustomPriority] = useState(2);
  const [customWard, setCustomWard] = useState('W-ER');
  const [needsVent, setNeedsVent] = useState(false);

  const wards = snapshot?.wards || [];
  const beds = snapshot?.beds || [];
  const stats = snapshot?.overallStats || { totalBeds: 0, occupiedCount: 0, freeCount: 0, cleaningCount: 0, ventilatorCount: 0, occupancyPercent: 0 };

  const filteredBeds = selectedWard === 'ALL' 
    ? beds 
    : beds.filter(b => b.wardId === selectedWard);

  const handleManualAdmit = (e) => {
    e.preventDefault();
    if (!customName.trim()) return;
    onAdmitPatient({
      name: customName.trim(),
      condition: customCondition,
      priority: Number(customPriority),
      ward: customWard,
      vent: needsVent
    });
    setCustomName('');
  };

  return (
    <div className="floorplan-layout animate-fade-in">
      {/* Top Telemetry Stats */}
      <div className="stat-cards-grid">
        <div className="glass-panel stat-widget">
          <span className="stat-label">Total Hospital Capacity</span>
          <span className="stat-value">{stats.totalBeds} Beds</span>
          <span className="stat-subtext">5 Operational Clinical Wards</span>
        </div>

        <div className="glass-panel stat-widget" style={{ borderLeftColor: 'var(--accent-rose)' }}>
          <span className="stat-label">Occupied Beds</span>
          <span className="stat-value" style={{ color: 'var(--accent-rose)' }}>{stats.occupiedCount}</span>
          <span className="stat-subtext">{stats.occupancyPercent}% Hospital Occupancy</span>
        </div>

        <div className="glass-panel stat-widget" style={{ borderLeftColor: 'var(--accent-emerald)' }}>
          <span className="stat-label">Available Free Beds</span>
          <span className="stat-value" style={{ color: 'var(--accent-emerald)' }}>{stats.freeCount}</span>
          <span className="stat-subtext">Ready for Immediate Ingress</span>
        </div>

        <div className="glass-panel stat-widget" style={{ borderLeftColor: 'var(--accent-amber)' }}>
          <span className="stat-label">Sanitizing / Turning</span>
          <span className="stat-value" style={{ color: 'var(--accent-amber)' }}>{stats.cleaningCount}</span>
          <span className="stat-subtext">Terminal Disinfection Cycle</span>
        </div>

        <div className="glass-panel stat-widget" style={{ borderLeftColor: 'var(--accent-cyan)' }}>
          <span className="stat-label">Ventilators Active</span>
          <span className="stat-value" style={{ color: 'var(--accent-cyan)' }}>{stats.ventilatorCount}</span>
          <span className="stat-subtext">Mechanical Life Support</span>
        </div>
      </div>

      {/* Main Grid: Wards & Bed Cards + Admission Drawer */}
      <div className="floorplan-main-content">
        <div className="beds-section glass-panel">
          {/* Ward Filter Tabs */}
          <div className="ward-filter-bar">
            <div className="filter-tabs">
              <button 
                className={`filter-tab ${selectedWard === 'ALL' ? 'active' : ''}`}
                onClick={() => setSelectedWard('ALL')}
              >
                All Wards ({beds.length})
              </button>
              {wards.map(w => (
                <button
                  key={w.id}
                  className={`filter-tab ${selectedWard === w.id ? 'active' : ''}`}
                  onClick={() => setSelectedWard(w.id)}
                >
                  <span className="ward-dot" style={{ backgroundColor: w.color }}></span>
                  {w.name} ({w.occupiedBeds}/{w.totalBeds})
                </button>
              ))}
            </div>

            <div className="legend-pills">
              <span className="legend-item"><span className="legend-dot dot-free"></span> Free</span>
              <span className="legend-item"><span className="legend-dot dot-occupied"></span> Occupied</span>
              <span className="legend-item"><span className="legend-dot dot-cleaning"></span> Sanitizing</span>
              <span className="legend-item"><Wind size={12} color="var(--accent-cyan)" /> Ventilator</span>
            </div>
          </div>

          {/* Interactive Beds Floorplan Grid */}
          <div className="beds-grid">
            {filteredBeds.map(bed => {
              const isOccupied = bed.status === 'OCCUPIED';
              const isCleaning = bed.status === 'CLEANING';
              const isFree = bed.status === 'FREE';

              let statusClass = 'bed-free';
              if (isOccupied) statusClass = 'bed-occupied';
              if (isCleaning) statusClass = 'bed-cleaning';

              return (
                <div 
                  key={bed.id}
                  className={`bed-card ${statusClass}`}
                  onClick={() => setActiveBedModal(bed)}
                  title={`Bed #${bed.id} (${bed.wardName}) - Click to inspect`}
                >
                  <div className="bed-header">
                    <span className="bed-number">#{bed.id}</span>
                    <span className="bed-ward-tag">{bed.wardId.replace('W-', '')}</span>
                  </div>

                  <div className="bed-icon-wrapper">
                    <Bed size={22} className="bed-icon" />
                    {bed.ventilatorAttached && (
                      <span className="vent-indicator" title="Ventilator Connected">
                        <Wind size={12} />
                      </span>
                    )}
                  </div>

                  <div className="bed-body">
                    {isOccupied && bed.patient ? (
                      <>
                        <div className="patient-name-truncate">{bed.patient.name}</div>
                        <div className="patient-priority-pill" style={{
                          backgroundColor: bed.patient.priority === 1 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(249, 115, 22, 0.2)',
                          color: bed.patient.priority === 1 ? '#f87171' : '#fb923c'
                        }}>
                          P{bed.patient.priority} • {bed.patient.condition?.slice(0, 16)}...
                        </div>
                      </>
                    ) : isCleaning ? (
                      <div className="cleaning-indicator">
                        <Sparkles size={13} className="spin-icon" /> Sanitizing
                      </div>
                    ) : (
                      <div className="free-indicator">
                        <CheckCircle2 size={13} /> Available
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Triage Admission Panel */}
        <div className="admission-sidebar glass-panel">
          <div className="sidebar-header">
            <h3><UserPlus size={18} /> Direct Triage Ingress</h3>
            <span className="badge badge-cyan">Producer Client</span>
          </div>

          <form onSubmit={handleManualAdmit} className="admission-form">
            <div className="form-group">
              <label>Patient Full Name</label>
              <input 
                type="text" 
                placeholder="e.g. Priyanshu Bansal"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                required
                className="input-field"
              />
            </div>

            <div className="form-group">
              <label>Clinical Diagnosis / Presentation</label>
              <select 
                value={customCondition}
                onChange={(e) => setCustomCondition(e.target.value)}
                className="input-field"
              >
                <option value="Severe Polytrauma (Chest & Head)">Severe Polytrauma (Chest & Head)</option>
                <option value="Acute Myocardial Infarction">Acute Myocardial Infarction (STEMI)</option>
                <option value="Severe Septic Shock">Severe Septic Shock</option>
                <option value="Acute Hypoxic Respiratory Failure">Acute Hypoxic Respiratory Failure</option>
                <option value="High Grade Compound Fracture">High Grade Compound Fracture</option>
                <option value="Pediatric Febrile Seizure">Pediatric Febrile Seizure</option>
                <option value="Elective Surgical Recovery">Elective Surgical Recovery</option>
              </select>
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label>Triage Priority</label>
                <select 
                  value={customPriority}
                  onChange={(e) => setCustomPriority(e.target.value)}
                  className="input-field"
                >
                  <option value={1}>P1 - Red (Immediate Resuscitation)</option>
                  <option value={2}>P2 - Orange (Very Urgent)</option>
                  <option value={3}>P3 - Yellow (Urgent)</option>
                  <option value={4}>P4 - Green (Standard)</option>
                  <option value={5}>P5 - Blue (Non-urgent)</option>
                </select>
              </div>

              <div className="form-group flex-1">
                <label>Target Ward</label>
                <select 
                  value={customWard}
                  onChange={(e) => setCustomWard(e.target.value)}
                  className="input-field"
                >
                  <option value="W-ICU">ICU Ward</option>
                  <option value="W-ER">Emergency Bay</option>
                  <option value="W-CARD">Cardiology Wing</option>
                  <option value="W-PED">Pediatric Ward</option>
                  <option value="W-GEN">General Medicine</option>
                </select>
              </div>
            </div>

            <div className="form-checkbox">
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={needsVent}
                  onChange={(e) => setNeedsVent(e.target.checked)}
                />
                <span>Requires Mechanical Ventilator Support</span>
              </label>
            </div>

            <button type="submit" className="btn btn-primary btn-block">
              <UserPlus size={15} /> Inject into Bounded Buffer
            </button>
          </form>

          {/* Quick Ward Health Meter */}
          <div className="ward-breakdown-box">
            <h4>Ward Occupancy Telemetry</h4>
            {wards.map(w => (
              <div key={w.id} className="ward-progress-row">
                <div className="ward-progress-info">
                  <span>{w.name}</span>
                  <span className="mono-data">{w.occupiedBeds}/{w.totalBeds} ({w.occupancyPercent}%)</span>
                </div>
                <div className="progress-track">
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${w.occupancyPercent}%`,
                      backgroundColor: w.occupancyPercent > 85 ? 'var(--accent-rose)' : w.color 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bed Inspection / Discharge Modal */}
      {activeBedModal && (
        <div className="modal-overlay" onClick={() => setActiveBedModal(null)}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <Bed size={24} className="accent-text" />
                <div>
                  <h3>Bed #{activeBedModal.id} — {activeBedModal.wardName}</h3>
                  <span className="badge badge-cyan">Physical Frame Slot</span>
                </div>
              </div>
              <button className="btn-close" onClick={() => setActiveBedModal(null)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="bed-details-grid">
                <div className="detail-item">
                  <span className="detail-label">Status</span>
                  <span className="detail-value">{activeBedModal.status}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Ventilator</span>
                  <span className="detail-value">{activeBedModal.ventilatorAttached ? 'Connected (Active)' : 'None'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Assigned Worker Thread</span>
                  <span className="detail-value mono-data">{activeBedModal.lockedByThread || 'None'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Occupancy Duration</span>
                  <span className="detail-value">
                    {activeBedModal.assignedAt ? `${Math.floor((Date.now() - activeBedModal.assignedAt) / 60000)} mins` : 'N/A'}
                  </span>
                </div>
              </div>

              {activeBedModal.patient ? (
                <div className="patient-clinical-card glass-card">
                  <h4><HeartPulse size={16} /> Admitted Patient Profile</h4>
                  <div className="patient-info-row">
                    <strong>ID:</strong> <span className="mono-data">{activeBedModal.patient.id}</span>
                  </div>
                  <div className="patient-info-row">
                    <strong>Name:</strong> <span>{activeBedModal.patient.name} ({activeBedModal.patient.age} yrs)</span>
                  </div>
                  <div className="patient-info-row">
                    <strong>Diagnosis:</strong> <span>{activeBedModal.patient.condition}</span>
                  </div>
                  <div className="patient-info-row">
                    <strong>Triage Priority:</strong> 
                    <span className="badge badge-rose">Priority {activeBedModal.patient.priority}</span>
                  </div>

                  <div className="modal-actions">
                    <button 
                      className="btn btn-danger"
                      onClick={() => {
                        onDischargeBed(activeBedModal.id);
                        setActiveBedModal(null);
                      }}
                    >
                      <LogOut size={15} /> Discharge & Clean Bed
                    </button>
                  </div>
                </div>
              ) : (
                <div className="empty-bed-note">
                  <Info size={16} /> Bed is currently unoccupied and ready to receive incoming patient requests from the bounded buffer queue.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
