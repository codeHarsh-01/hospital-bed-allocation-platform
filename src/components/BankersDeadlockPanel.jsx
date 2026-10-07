import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  Play, 
  RefreshCw, 
  Zap, 
  Activity, 
  ArrowRight,
  Info
} from 'lucide-react';

export function BankersDeadlockPanel({ 
  bankersInstance, 
  onRefresh 
}) {
  const snapshot = bankersInstance?.getSnapshot() || {};
  const { resourceNames = [], totalSystemResources = [], patients = [], available = [], safety = {} } = snapshot;

  const [selectedPatientIdx, setSelectedPatientIdx] = useState(1);
  const [requestVec, setRequestVec] = useState([1, 0, 1, 1, 0]);
  const [lastResult, setLastResult] = useState(null);

  const handleRequestSubmit = (e) => {
    e.preventDefault();
    if (!bankersInstance) return;
    const result = bankersInstance.requestResources(selectedPatientIdx, requestVec);
    setLastResult(result);
    if (onRefresh) onRefresh();
  };

  const handleRelease = (patientIdx) => {
    if (!bankersInstance) return;
    const result = bankersInstance.releaseResources(patientIdx);
    setLastResult(result);
    if (onRefresh) onRefresh();
  };

  const triggerTestUnsafeRequest = () => {
    // Attempt to request all remaining available ventilators and beds for P2, putting system in unsafe state
    setSelectedPatientIdx(2);
    setRequestVec([2, 1, 2, 2, 1]);
    const result = bankersInstance.requestResources(2, [2, 1, 2, 2, 1]);
    setLastResult(result);
    if (onRefresh) onRefresh();
  };

  const triggerTestSafeRequest = () => {
    setSelectedPatientIdx(3);
    setRequestVec([1, 0, 0, 1, 0]);
    const result = bankersInstance.requestResources(3, [1, 0, 0, 1, 0]);
    setLastResult(result);
    if (onRefresh) onRefresh();
  };

  return (
    <div className="bankers-layout animate-fade-in">
      {/* Top Safety Status Banner */}
      <div className={`glass-panel bankers-safety-banner ${safety.isSafe ? 'banner-safe' : 'banner-danger'}`}>
        <div className="safety-badge-icon">
          {safety.isSafe ? <ShieldCheck size={36} color="var(--accent-emerald)" /> : <AlertTriangle size={36} color="var(--accent-rose)" />}
        </div>
        <div className="safety-banner-content">
          <div className="safety-title-row">
            <h2>
              {safety.isSafe 
                ? 'System State: SAFE (Deadlock Avoided)' 
                : 'System State: UNSAFE (Deadlock Hazard!)'}
            </h2>
            <span className={`badge ${safety.isSafe ? 'badge-emerald' : 'badge-rose'}`}>
              Dijkstra Safety Proof
            </span>
          </div>
          <p>
            {safety.isSafe ? (
              <>
                A verified Safe Execution Sequence exists: {' '}
                <span className="safe-sequence-chip mono-data">
                  ⟨ {safety.safeSequence?.join(' → ')} ⟩
                </span>
                . The hospital can satisfy all critical patient resource requirements without entering cyclic circular wait.
              </>
            ) : (
              <>
                CRITICAL DEADLOCK RISK! No safe sequence exists. Unsafe allocations were proactively intercepted and blocked.
              </>
            )}
          </p>
        </div>
      </div>

      {/* Available Resource Vector Display */}
      <div className="glass-panel available-resources-bar">
        <div className="res-bar-title">
          <span>Currently Available Scarce Resources Pool</span>
          <span className="mono-data badge badge-cyan">Vector: Available [A]</span>
        </div>
        <div className="resource-pills-row">
          {resourceNames.map((name, idx) => (
            <div key={idx} className="resource-pill-card">
              <span className="res-name">{name}</span>
              <div className="res-values">
                <span className="res-avail mono-data">{available[idx]} Free</span>
                <span className="res-total mono-data">/ {totalSystemResources[idx]} Total</span>
              </div>
              <div className="res-mini-track">
                <div 
                  className="res-mini-fill"
                  style={{ width: `${(available[idx] / totalSystemResources[idx]) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Matrices Table: Max, Allocation, Need */}
      <div className="glass-panel matrix-container">
        <div className="matrix-header">
          <h3><Activity size={18} /> Multi-Resource Demand & Allocation Matrices</h3>
          <span className="badge badge-purple">Need = Max - Allocation</span>
        </div>

        <div className="matrix-table-wrap">
          <table className="matrix-table">
            <thead>
              <tr>
                <th rowSpan="2" className="th-patient">Patient Case</th>
                <th colSpan={resourceNames.length} className="th-group th-max">Max Demand Matrix (M)</th>
                <th colSpan={resourceNames.length} className="th-group th-alloc">Current Allocation (C)</th>
                <th colSpan={resourceNames.length} className="th-group th-need">Remaining Need (N = M - C)</th>
                <th rowSpan="2" className="th-action">Discharge</th>
              </tr>
              <tr>
                {/* Max columns */}
                {resourceNames.map((_, i) => <th key={`m-${i}`} className="th-sub">{`R${i}`}</th>)}
                {/* Allocation columns */}
                {resourceNames.map((_, i) => <th key={`a-${i}`} className="th-sub">{`R${i}`}</th>)}
                {/* Need columns */}
                {resourceNames.map((_, i) => <th key={`n-${i}`} className="th-sub">{`R${i}`}</th>)}
              </tr>
            </thead>
            <tbody>
              {patients.map((p, pIdx) => (
                <tr key={p.id}>
                  <td className="td-patient">
                    <div className="p-cell-id mono-data">{p.id}</div>
                    <div className="p-cell-name">{p.name}</div>
                    <span className="p-cell-badge">{p.condition}</span>
                  </td>

                  {/* Max Demand */}
                  {p.max.map((val, rIdx) => (
                    <td key={`max-${rIdx}`} className="td-num td-max-val mono-data">{val}</td>
                  ))}

                  {/* Allocation */}
                  {p.allocation.map((val, rIdx) => (
                    <td key={`alloc-${rIdx}`} className="td-num td-alloc-val mono-data">{val}</td>
                  ))}

                  {/* Need */}
                  {p.need.map((val, rIdx) => (
                    <td key={`need-${rIdx}`} className="td-num td-need-val mono-data font-bold">{val}</td>
                  ))}

                  {/* Discharge Action */}
                  <td className="td-action">
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleRelease(pIdx)}
                      title="Discharge patient and release all held resources"
                    >
                      Release
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="matrix-footnote">
          <strong>Resource Codes:</strong> R0 = ICU Bed, R1 = Ventilator, R2 = Senior Physician, R3 = ICU Nurse, R4 = Cardiac Monitor
        </div>
      </div>

      {/* Interactive Resource Request Evaluator & Result */}
      <div className="bankers-actions-grid">
        {/* Request Form */}
        <div className="glass-panel req-evaluator-card">
          <div className="card-header">
            <h3><Zap size={18} /> Test Multi-Resource Bundle Request</h3>
            <span className="badge badge-cyan">Banker's Safety Check</span>
          </div>

          <form onSubmit={handleRequestSubmit} className="req-form">
            <div className="form-group">
              <label>Target Critical Patient</label>
              <select 
                value={selectedPatientIdx}
                onChange={(e) => setSelectedPatientIdx(Number(e.target.value))}
                className="input-field"
              >
                {patients.map((p, idx) => (
                  <option key={p.id} value={idx}>
                    {p.id}: {p.name} (Need: [{p.need.join(', ')}])
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Resource Bundle Vector [R0 Bed, R1 Vent, R2 Doc, R3 Nurse, R4 Mon]</label>
              <div className="vector-inputs-row">
                {resourceNames.map((name, idx) => (
                  <div key={idx} className="vector-input-cell">
                    <span className="cell-label">{name.split(' ')[0]}</span>
                    <input 
                      type="number" 
                      min="0" 
                      max="4"
                      value={requestVec[idx] || 0}
                      onChange={(e) => {
                        const next = [...requestVec];
                        next[idx] = Math.max(0, parseInt(e.target.value) || 0);
                        setRequestVec(next);
                      }}
                      className="input-field mono-data input-center"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="req-buttons-row">
              <button type="submit" className="btn btn-primary">
                <Play size={15} /> Evaluate Safety & Grant
              </button>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={triggerTestSafeRequest}
              >
                Safe Preset
              </button>
              <button 
                type="button" 
                className="btn btn-danger"
                onClick={triggerTestUnsafeRequest}
              >
                Test Unsafe Deadlock
              </button>
            </div>
          </form>
        </div>

        {/* Evaluation Output / Audit Verdict */}
        <div className="glass-panel req-verdict-card">
          <div className="card-header">
            <h3><Info size={18} /> Algorithmic Safety Verdict</h3>
            {lastResult && (
              <span className={`badge ${lastResult.status === 'GRANTED_SAFE' ? 'badge-emerald' : 'badge-rose'}`}>
                {lastResult.status}
              </span>
            )}
          </div>

          {lastResult ? (
            <div className="verdict-content">
              <div className={`verdict-box ${lastResult.status === 'GRANTED_SAFE' ? 'box-safe' : 'box-danger'}`}>
                <div className="verdict-icon">
                  {lastResult.status === 'GRANTED_SAFE' ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                </div>
                <div>
                  <h4>{lastResult.patientId} ({lastResult.patientName})</h4>
                  <p>{lastResult.reason}</p>
                </div>
              </div>

              {/* Step-by-step Trace */}
              {lastResult.trace && (
                <div className="trace-steps-list">
                  <span className="trace-title">Execution Steps (Dijkstra Proof):</span>
                  {lastResult.trace.map((step, sIdx) => (
                    <div key={sIdx} className="trace-step-item">
                      <span className="step-num mono-data">Step {step.step}:</span>
                      <span className="step-desc">{step.description}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="verdict-placeholder">
              <HelpCircle size={28} color="var(--text-dim)" />
              <p>Select a patient and vector, then click <strong>Evaluate Safety</strong> to run Dijkstra's safety algorithm live.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
