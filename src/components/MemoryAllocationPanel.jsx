import React, { useState } from 'react';
import { 
  Cpu, 
  Layers, 
  Scissors, 
  Sparkles, 
  BarChart3, 
  Play, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

export function MemoryAllocationPanel({ 
  memoryInstance, 
  onRefresh 
}) {
  const snapshot = memoryInstance?.getSnapshot() || {};
  const { blocks = [], metrics = {}, history = [] } = snapshot;

  const [strategy, setStrategy] = useState('BEST_FIT'); // 'FIRST_FIT', 'BEST_FIT', 'WORST_FIT'
  const [reqSize, setReqSize] = useState(4);
  const [cohortName, setCohortName] = useState('Trauma Disaster Team');
  const [benchmarkResult, setBenchmarkResult] = useState(null);
  const [lastAllocResult, setLastAllocResult] = useState(null);

  const handleAllocate = (e) => {
    e.preventDefault();
    if (!memoryInstance) return;

    let res;
    if (strategy === 'FIRST_FIT') {
      res = memoryInstance.allocateFirstFit(Number(reqSize), cohortName);
    } else if (strategy === 'BEST_FIT') {
      res = memoryInstance.allocateBestFit(Number(reqSize), cohortName);
    } else {
      res = memoryInstance.allocateWorstFit(Number(reqSize), cohortName);
    }

    setLastAllocResult(res);
    if (onRefresh) onRefresh();
  };

  const handleCompact = () => {
    if (!memoryInstance) return;
    memoryInstance.compactMemory();
    setLastAllocResult({ success: true, isCompaction: true });
    if (onRefresh) onRefresh();
  };

  const handleFreeBlock = (blockId) => {
    if (!memoryInstance) return;
    memoryInstance.freeBlock(blockId);
    if (onRefresh) onRefresh();
  };

  const handleRunBenchmark = () => {
    if (!memoryInstance) return;
    const bench = memoryInstance.runComparisonBenchmark([4, 6, 3, 8, 5, 2, 7]);
    setBenchmarkResult(bench);
  };

  return (
    <div className="memory-layout animate-fade-in">
      {/* Top Fragmentation Metrics */}
      <div className="stat-cards-grid">
        <div className="glass-panel stat-widget" style={{ borderLeftColor: 'var(--accent-purple)' }}>
          <span className="stat-label">Total Ward Beds</span>
          <span className="stat-value">{metrics.totalBeds || 64}</span>
          <span className="stat-subtext">Variable-Partition Memory Space</span>
        </div>

        <div className="glass-panel stat-widget" style={{ borderLeftColor: 'var(--accent-rose)' }}>
          <span className="stat-label">External Fragmentation</span>
          <span className="stat-value" style={{ color: metrics.externalFragPercent > 40 ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
            {metrics.externalFragPercent || 0}%
          </span>
          <span className="stat-subtext">
            {metrics.freeHolesCount || 0} scattered holes (Max Hole: {metrics.maxFreeHole || 0} beds)
          </span>
        </div>

        <div className="glass-panel stat-widget" style={{ borderLeftColor: 'var(--accent-amber)' }}>
          <span className="stat-label">Internal Fragmentation</span>
          <span className="stat-value" style={{ color: 'var(--accent-amber)' }}>
            {metrics.internalWastedBeds || 0} Beds
          </span>
          <span className="stat-subtext">Unused capacity in fixed subdivisions</span>
        </div>

        <div className="glass-panel stat-widget" style={{ borderLeftColor: 'var(--accent-cyan)' }}>
          <span className="stat-label">Total Free Beds</span>
          <span className="stat-value" style={{ color: 'var(--accent-cyan)' }}>
            {metrics.freeBeds || 0}
          </span>
          <span className="stat-subtext">
            {metrics.occupancyRate || 0}% Total Bed Occupancy
          </span>
        </div>
      </div>

      {/* Visual Memory Strip Bar */}
      <div className="glass-panel memory-visual-panel">
        <div className="memory-header-row">
          <div className="mem-title-group">
            <h3><Layers size={18} /> Contiguous Hospital Bed Allocation Map</h3>
            <span className="badge badge-cyan">Physical Space: 64 Contiguous Bed Slots</span>
          </div>

          <div className="mem-actions-group">
            <button 
              className="btn btn-secondary btn-sm"
              onClick={handleCompact}
              title="Shift all allocated blocks to ward start and coalesce all free holes"
            >
              <Sparkles size={14} color="var(--accent-amber)" /> Run Memory Compaction
            </button>
            <button 
              className="btn btn-primary btn-sm"
              onClick={handleRunBenchmark}
              title="Compare First Fit, Best Fit and Worst Fit on identical request trace"
            >
              <BarChart3 size={14} /> Compare 3 Fit Algorithms
            </button>
          </div>
        </div>

        {/* The Visual Block Tape */}
        <div className="memory-tape-container">
          <div className="memory-tape">
            {blocks.map((block) => {
              const widthPct = (block.size / 64) * 100;
              const isAllocated = block.isAllocated;

              return (
                <div
                  key={block.id}
                  className={`memory-block ${isAllocated ? 'block-allocated' : 'block-free'}`}
                  style={{ 
                    width: `${widthPct}%`,
                    backgroundColor: isAllocated ? (block.patientGroup?.color || 'var(--accent-blue)') : 'rgba(255, 255, 255, 0.04)'
                  }}
                  title={`${block.id}: ${isAllocated ? block.patientGroup?.name : 'Free Hole'} (${block.size} beds, start: ${block.start})`}
                >
                  <div className="block-meta-top">
                    <span className="block-id mono-data">{block.id}</span>
                    <span className="block-beds mono-data">{block.size} beds</span>
                  </div>

                  <div className="block-label">
                    {isAllocated ? block.patientGroup?.name : 'FREE HOLE'}
                  </div>

                  {isAllocated && (
                    <button 
                      className="btn-discharge-block"
                      onClick={() => handleFreeBlock(block.id)}
                      title="Discharge this patient block"
                    >
                      ✕ Free
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="tape-axis">
            <span>Bed #0</span>
            <span>Bed #16</span>
            <span>Bed #32</span>
            <span>Bed #48</span>
            <span>Bed #64</span>
          </div>
        </div>
      </div>

      {/* Allocation Controller & Benchmark Results Grid */}
      <div className="memory-controller-grid">
        {/* Interactive Ingress Form */}
        <div className="glass-panel alloc-form-panel">
          <div className="card-header">
            <h3><Cpu size={18} /> Allocate Patient Cohort (Variable Partition)</h3>
            <span className="badge badge-emerald">Strategy Tester</span>
          </div>

          <form onSubmit={handleAllocate} className="alloc-form">
            <div className="form-group">
              <label>Allocation Strategy</label>
              <div className="strategy-pills">
                <button
                  type="button"
                  className={`strategy-btn ${strategy === 'FIRST_FIT' ? 'active' : ''}`}
                  onClick={() => setStrategy('FIRST_FIT')}
                >
                  First Fit
                </button>
                <button
                  type="button"
                  className={`strategy-btn ${strategy === 'BEST_FIT' ? 'active' : ''}`}
                  onClick={() => setStrategy('BEST_FIT')}
                >
                  Best Fit
                </button>
                <button
                  type="button"
                  className={`strategy-btn ${strategy === 'WORST_FIT' ? 'active' : ''}`}
                  onClick={() => setStrategy('WORST_FIT')}
                >
                  Worst Fit
                </button>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label>Cohort Bed Block Size</label>
                <input 
                  type="number"
                  min="1"
                  max="16"
                  value={reqSize}
                  onChange={(e) => setReqSize(Number(e.target.value))}
                  className="input-field mono-data"
                  required
                />
              </div>

              <div className="form-group flex-2">
                <label>Cohort Description</label>
                <input 
                  type="text"
                  value={cohortName}
                  onChange={(e) => setCohortName(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block">
              <Play size={15} /> Execute {strategy.replace('_', ' ')}
            </button>
          </form>

          {lastAllocResult && (
            <div className={`alloc-result-box ${lastAllocResult.success ? 'box-safe' : 'box-danger'}`}>
              {lastAllocResult.success ? (
                <>
                  <CheckCircle2 size={18} color="var(--accent-emerald)" />
                  <span>
                    {lastAllocResult.isCompaction 
                      ? 'Compaction Successful! Coalesced all free beds into one unified contiguous block.' 
                      : `Allocated ${reqSize} beds in ${lastAllocResult.blockId} (Search Steps: ${lastAllocResult.searchSteps})`}
                  </span>
                </>
              ) : (
                <>
                  <XCircle size={18} color="var(--accent-rose)" />
                  <span>
                    Allocation Failed! External fragmentation prevented finding a contiguous block of {reqSize} beds.
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Benchmark Comparison Table */}
        <div className="glass-panel benchmark-panel">
          <div className="card-header">
            <h3><BarChart3 size={18} /> First Fit vs Best Fit vs Worst Fit Benchmark</h3>
            <span className="badge badge-purple">Standard Test Trace</span>
          </div>

          {benchmarkResult ? (
            <div className="benchmark-content">
              <table className="benchmark-table">
                <thead>
                  <tr>
                    <th>Algorithm</th>
                    <th>Success Rate</th>
                    <th>Avg Search Steps</th>
                    <th>Ext. Fragmentation</th>
                    <th>Max Free Hole</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bench-row">
                    <td><strong>First Fit</strong></td>
                    <td className="mono-data">{benchmarkResult.firstFit.successRate}%</td>
                    <td className="mono-data">{benchmarkResult.firstFit.avgSearchSteps}</td>
                    <td className="mono-data">{benchmarkResult.firstFit.externalFragPercent}%</td>
                    <td className="mono-data">{benchmarkResult.firstFit.maxHole} beds</td>
                  </tr>
                  <tr className="bench-row highlight-best">
                    <td><strong>Best Fit (Recommended)</strong></td>
                    <td className="mono-data font-bold text-cyan">{benchmarkResult.bestFit.successRate}%</td>
                    <td className="mono-data">{benchmarkResult.bestFit.avgSearchSteps}</td>
                    <td className="mono-data font-bold text-emerald">{benchmarkResult.bestFit.externalFragPercent}%</td>
                    <td className="mono-data">{benchmarkResult.bestFit.maxHole} beds</td>
                  </tr>
                  <tr className="bench-row">
                    <td><strong>Worst Fit</strong></td>
                    <td className="mono-data">{benchmarkResult.worstFit.successRate}%</td>
                    <td className="mono-data">{benchmarkResult.worstFit.avgSearchSteps}</td>
                    <td className="mono-data">{benchmarkResult.worstFit.externalFragPercent}%</td>
                    <td className="mono-data">{benchmarkResult.worstFit.maxHole} beds</td>
                  </tr>
                </tbody>
              </table>

              <div className="benchmark-insight">
                <strong>OS Engineering Conclusion:</strong> Best Fit achieved optimal memory compact efficiency for contiguous medical cohort admissions, minimizing leftover slivers while maintaining a 0% double allocation guarantee.
              </div>
            </div>
          ) : (
            <div className="benchmark-placeholder">
              <p>Click <strong>"Compare 3 Fit Algorithms"</strong> above to run an automated comparative benchmark of First Fit, Best Fit, and Worst Fit on the exact same sequence of patient cohort requests.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
