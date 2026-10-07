import React from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Eye, 
  Edit3, 
  AlertOctagon, 
  Zap, 
  Flame, 
  GitFork, 
  Clock,
  CheckCircle2,
  XCircle
} from 'lucide-react';

export function CriticalSectionPanel({ 
  snapshot, 
  onToggleSync, 
  onRunStressTest 
}) {
  const mutex = snapshot?.mutex || { isLocked: false, owner: null, waitingQueue: [], contentionCount: 0 };
  const rwLock = snapshot?.rwLock || { activeReaders: 0, activeWriter: null, waitingReadersCount: 0, waitingWritersCount: 0, metrics: {} };
  const syncEnabled = snapshot?.synchronizationEnabled;
  const violations = snapshot?.doubleAllocationViolations || 0;
  const incidents = snapshot?.raceConditionIncidents || [];
  const workerThreads = snapshot?.workerThreads || [];

  return (
    <div className="concurrency-lab-layout animate-fade-in">
      {/* Race Condition Safety Control Header */}
      <div className={`glass-panel sync-toggle-banner ${syncEnabled ? 'sync-safe' : 'sync-danger'}`}>
        <div className="sync-banner-text">
          <div className="sync-icon-bubble">
            {syncEnabled ? <ShieldCheck size={32} /> : <ShieldAlert size={32} />}
          </div>
          <div>
            <h2>
              {syncEnabled 
                ? 'Operating System Mutual Exclusion Active (Safe Mode)' 
                : 'SYNCHRONIZATION DISABLED (Race Condition Hazard Mode)'}
            </h2>
            <p>
              {syncEnabled 
                ? 'Mutex locks guarantee critical section serialisation. At most 1 worker thread can modify bed inventory simultaneously. 0 Double Allocations guaranteed.'
                : 'MUTEX LOCK IS BYPASSED! Concurrent worker threads access bed state simultaneously without synchronization. Race conditions will cause double allocation of identical beds!'}
            </p>
          </div>
        </div>

        <div className="sync-banner-actions">
          <button 
            className={`btn ${syncEnabled ? 'btn-danger' : 'btn-primary'}`}
            onClick={onToggleSync}
          >
            {syncEnabled ? <Flame size={16} /> : <Lock size={16} />}
            {syncEnabled ? 'Disable Mutex (Test Race Hazard)' : 'Enable Mutex (Restore OS Safety)'}
          </button>

          <button 
            className="btn btn-secondary"
            onClick={() => onRunStressTest(8)}
          >
            <Zap size={16} /> Fire 8-Thread Concurrent Race
          </button>
        </div>
      </div>

      {/* Top 3 Concurrency Monitors */}
      <div className="concurrency-grid-3">
        {/* 1. Critical Section Mutex Monitor */}
        <div className="glass-panel concurrency-card">
          <div className="card-header">
            <h3><Lock size={18} /> Bed Inventory Mutex</h3>
            <span className={`badge ${mutex.isLocked ? 'badge-rose' : 'badge-emerald'}`}>
              {mutex.isLocked ? 'LOCKED (In Critical Section)' : 'UNLOCKED (Free)'}
            </span>
          </div>

          <div className="mutex-visualizer">
            <div className="critical-section-box">
              <span className="cs-label">Protected Critical Section: Bed State Records</span>
              {mutex.isLocked && mutex.owner ? (
                <div className="cs-active-thread">
                  <div className="thread-pill">
                    <span className="pulse-dot pulse-dot-red"></span>
                    <strong>{mutex.owner.name}</strong> ({mutex.owner.id})
                  </div>
                  <span className="cs-action-text">Holding Exclusive Bed Mutation Lock</span>
                </div>
              ) : (
                <div className="cs-empty-state">
                  <Unlock size={20} color="var(--accent-emerald)" /> Critical Section Vacant
                </div>
              )}
            </div>

            {/* FIFO Waiting Queue */}
            <div className="waiting-queue-section">
              <div className="queue-title-row">
                <span>Blocked Threads Waiting in Mutex Queue</span>
                <span className="mono-data badge badge-purple">{mutex.waitingQueue?.length || 0} Blocked</span>
              </div>
              <div className="thread-queue-list">
                {mutex.waitingQueue && mutex.waitingQueue.length > 0 ? (
                  mutex.waitingQueue.map((t, idx) => (
                    <div key={idx} className="queue-thread-item">
                      <span className="queue-pos">#{idx + 1}</span>
                      <span className="queue-name">{t.name}</span>
                      <span className="queue-wait mono-data">{Math.floor(t.waitTime / 1000)}s wait</span>
                    </div>
                  ))
                ) : (
                  <div className="queue-empty-msg">No threads blocked. Zero lock contention.</div>
                )}
              </div>
            </div>

            <div className="mutex-stats-row">
              <div className="stat-sub">
                <span>Total Lock Contentions:</span>
                <span className="mono-data font-bold">{mutex.contentionCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Readers-Writers Lock Monitor */}
        <div className="glass-panel concurrency-card">
          <div className="card-header">
            <h3><GitFork size={18} /> Readers-Writers Lock (RWLock)</h3>
            <span className="badge badge-cyan">Shared vs Exclusive</span>
          </div>

          <div className="rw-visualizer">
            {/* Active State */}
            <div className="rw-state-display">
              <div className="rw-reader-box">
                <div className="rw-metric-header">
                  <Eye size={18} color="var(--accent-cyan)" />
                  <span>Concurrent Readers</span>
                </div>
                <div className="rw-big-num" style={{ color: 'var(--accent-cyan)' }}>
                  {rwLock.activeReaders}
                </div>
                <div className="rw-note">Shared Read Locks Active (Dashboards/Nurses)</div>
              </div>

              <div className="rw-writer-box">
                <div className="rw-metric-header">
                  <Edit3 size={18} color="var(--accent-rose)" />
                  <span>Active Writer</span>
                </div>
                <div className="rw-big-num" style={{ color: rwLock.activeWriter ? 'var(--accent-rose)' : 'var(--text-muted)' }}>
                  {rwLock.activeWriter ? '1' : '0'}
                </div>
                <div className="rw-note">
                  {rwLock.activeWriter ? rwLock.activeWriter.name : 'No Exclusive Write in Progress'}
                </div>
              </div>
            </div>

            {/* RW Queue Stats */}
            <div className="rw-queues-summary">
              <div className="rw-queue-metric">
                <span>Waiting Readers:</span>
                <span className="mono-data">{rwLock.waitingReadersCount}</span>
              </div>
              <div className="rw-queue-metric">
                <span>Waiting Writers:</span>
                <span className="mono-data">{rwLock.waitingWritersCount}</span>
              </div>
              <div className="rw-queue-metric">
                <span>Max Concurrent Readers Seen:</span>
                <span className="mono-data">{rwLock.metrics?.maxConcurrentReaders || 0}</span>
              </div>
              <div className="rw-queue-metric">
                <span>Total Read Transactions:</span>
                <span className="mono-data">{rwLock.metrics?.totalReads || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Double-Allocation Violation Counter */}
        <div className="glass-panel concurrency-card">
          <div className="card-header">
            <h3><AlertOctagon size={18} /> Race Condition Detector</h3>
            <span className={`badge ${violations > 0 ? 'badge-rose' : 'badge-emerald'}`}>
              {violations > 0 ? 'INTEGRITY VIOLATED' : 'INTEGRITY SECURE'}
            </span>
          </div>

          <div className="violation-box-content">
            <div className="violation-counter-huge" style={{ color: violations > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
              {violations}
            </div>
            <div className="violation-desc">
              {violations === 0 
                ? 'Zero Double Allocations. OS Mutual Exclusion guarantees that every bed is strictly single-tenant.'
                : `${violations} Double Allocation(s) Detected! Race condition permitted multiple worker threads to assign the exact same bed to different patients.`}
            </div>

            {/* Worker Threads Status */}
            <div className="workers-list-preview">
              <span className="workers-title">Worker Allocation Daemons:</span>
              <div className="workers-chips-grid">
                {workerThreads.map(w => (
                  <div key={w.id} className="worker-chip">
                    <span className="worker-name">{w.name.split(' ')[0]}</span>
                    <span className={`worker-status ${w.status.toLowerCase()}`}>{w.status}</span>
                    <span className="worker-count mono-data">{w.allocations} allocs</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Race Condition Incident Log */}
      <div className="glass-panel incident-log-panel">
        <div className="log-panel-header">
          <h3><Flame size={18} color="var(--accent-rose)" /> Concurrency & Collision Audit Trail</h3>
          <span className="badge badge-amber mono-data">{incidents.length} Recorded Collisions</span>
        </div>

        <div className="incident-table-wrap">
          {incidents.length > 0 ? (
            <table className="incident-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Bed Number</th>
                  <th>Colliding Threads</th>
                  <th>Victim Patient</th>
                  <th>Collision Diagnostic Detail</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((inc, i) => (
                  <tr key={i} className="incident-row-danger">
                    <td className="mono-data">{new Date(inc.timestamp).toLocaleTimeString()}</td>
                    <td><span className="badge badge-rose">Bed #{inc.bedId}</span></td>
                    <td className="mono-data">{inc.collidingThreads?.join(' ⚔️ ')}</td>
                    <td className="mono-data">{inc.victimPatient}</td>
                    <td className="detail-text">{inc.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="incident-empty-state">
              <CheckCircle2 size={28} color="var(--accent-emerald)" />
              <div>
                <strong>No race condition incidents recorded.</strong>
                <p>To demonstrate a race condition collision for faculty or viva evaluation, toggle "Disable Mutex" above and fire the 8-thread stress test.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
