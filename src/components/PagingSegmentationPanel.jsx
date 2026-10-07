import React, { useState } from 'react';
import { 
  Activity, 
  Layers, 
  Cpu, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  Search, 
  ArrowRight,
  Database
} from 'lucide-react';

export function PagingSegmentationPanel({ 
  mmuInstance, 
  onRefresh 
}) {
  const snapshot = mmuInstance?.getSnapshot() || {};
  const { segmentTable = [], pageTable = [], tlb = [], eatMetrics = {}, lookupHistory = [] } = snapshot;

  // Segment Translation Input
  const [segId, setSegId] = useState(0);
  const [segOffset, setSegOffset] = useState(4);
  const [segResult, setSegResult] = useState(null);

  // Page Translation Input
  const [virtPage, setVirtPage] = useState(1);
  const [pageOffset, setPageOffset] = useState(2);
  const [pageResult, setPageResult] = useState(null);

  const handleSegmentTranslate = (e) => {
    e.preventDefault();
    if (!mmuInstance) return;
    const res = mmuInstance.translateSegmentAddress(Number(segId), Number(segOffset));
    setSegResult(res);
    if (onRefresh) onRefresh();
  };

  const handlePageTranslate = (e) => {
    e.preventDefault();
    if (!mmuInstance) return;
    const res = mmuInstance.translatePagedAddress(Number(virtPage), Number(pageOffset));
    setPageResult(res);
    if (onRefresh) onRefresh();
  };

  const handleResolvePageFault = (faultPage) => {
    if (!mmuInstance) return;
    mmuInstance.handlePageFault(faultPage);
    const retryRes = mmuInstance.translatePagedAddress(faultPage, pageOffset);
    setPageResult(retryRes);
    if (onRefresh) onRefresh();
  };

  return (
    <div className="paging-seg-layout animate-fade-in">
      {/* Top EAT & Hardware Telemetry Stats */}
      <div className="stat-cards-grid">
        <div className="glass-panel stat-widget" style={{ borderLeftColor: 'var(--accent-cyan)' }}>
          <span className="stat-label">TLB Hit Ratio</span>
          <span className="stat-value" style={{ color: 'var(--accent-cyan)' }}>
            {eatMetrics.hitRate || 80}%
          </span>
          <span className="stat-subtext">
            {eatMetrics.tlbHits || 0} Hits / {eatMetrics.tlbMisses || 0} Misses
          </span>
        </div>

        <div className="glass-panel stat-widget" style={{ borderLeftColor: 'var(--accent-emerald)' }}>
          <span className="stat-label">Effective Access Time (EAT)</span>
          <span className="stat-value" style={{ color: 'var(--accent-emerald)' }}>
            {eatMetrics.eatNs || 120} ns
          </span>
          <span className="stat-subtext">TLB: 2ns, Main Memory: 100ns</span>
        </div>

        <div className="glass-panel stat-widget" style={{ borderLeftColor: 'var(--accent-amber)' }}>
          <span className="stat-label">Page Faults Encountered</span>
          <span className="stat-value" style={{ color: 'var(--accent-amber)' }}>
            {eatMetrics.pageFaults || 0}
          </span>
          <span className="stat-subtext">Demanded from Secondary Wing</span>
        </div>

        <div className="glass-panel stat-widget" style={{ borderLeftColor: 'var(--accent-rose)' }}>
          <span className="stat-label">Segmentation Faults (Traps)</span>
          <span className="stat-value" style={{ color: 'var(--accent-rose)' }}>
            {eatMetrics.segmentationFaults || 0}
          </span>
          <span className="stat-subtext">Hardware Limit Bounds Violations</span>
        </div>
      </div>

      {/* Main 2 Column: Left = Segmentation, Right = Paging & TLB */}
      <div className="mmu-columns-grid">
        {/* COLUMN 1: SEGMENTATION UNIT */}
        <div className="mmu-column">
          <div className="glass-panel mmu-card">
            <div className="card-header">
              <h3><Layers size={18} /> 1. Segmentation Unit (Ward Segments)</h3>
              <span className="badge badge-purple">Logical Base & Limit</span>
            </div>

            <p className="card-desc">
              Every clinical ward forms an OS Segment. Physical Bed Address = Base + Offset. 
              If <code>Offset &gt;= Limit</code>, a Segmentation Fault Trap is triggered.
            </p>

            {/* Segment Table */}
            <div className="table-wrapper">
              <table className="mmu-table">
                <thead>
                  <tr>
                    <th>Seg #</th>
                    <th>Ward Segment Name</th>
                    <th>Base Bed #</th>
                    <th>Limit (Beds)</th>
                    <th>Protection</th>
                  </tr>
                </thead>
                <tbody>
                  {segmentTable.map(s => (
                    <tr key={s.segId} className={segId === s.segId ? 'active-row' : ''}>
                      <td className="mono-data font-bold">#{s.segId}</td>
                      <td>{s.wardName}</td>
                      <td className="mono-data">{s.base}</td>
                      <td className="mono-data font-bold">{s.limit}</td>
                      <td><span className="badge badge-emerald">{s.access}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Segment Address Translation Tester */}
            <form onSubmit={handleSegmentTranslate} className="translate-form">
              <h4>Test Segment Logical Address Translation</h4>
              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Segment # (Ward)</label>
                  <select 
                    value={segId}
                    onChange={(e) => setSegId(Number(e.target.value))}
                    className="input-field"
                  >
                    {segmentTable.map(s => (
                      <option key={s.segId} value={s.segId}>
                        #{s.segId}: {s.wardName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group flex-1">
                  <label>Bed Offset in Ward</label>
                  <input 
                    type="number"
                    min="0"
                    max="40"
                    value={segOffset}
                    onChange={(e) => setSegOffset(Number(e.target.value))}
                    className="input-field mono-data"
                    required
                  />
                </div>

                <div className="form-group align-end">
                  <button type="submit" className="btn btn-primary">
                    <Search size={14} /> Translate
                  </button>
                </div>
              </div>
            </form>

            {segResult && (
              <div className={`mmu-result-box ${segResult.success ? 'box-safe' : 'box-danger'}`}>
                {segResult.success ? (
                  <>
                    <CheckCircle2 size={20} color="var(--accent-emerald)" />
                    <div>
                      <strong>Physical Address Resolved: Bed #{segResult.physicalBedAddress}</strong>
                      <p>{segResult.detail}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertTriangle size={20} color="var(--accent-rose)" />
                    <div>
                      <strong>HARDWARE TRAP: {segResult.error}</strong>
                      <p>{segResult.detail}</p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 2: PAGING UNIT & TLB CACHE */}
        <div className="mmu-column">
          <div className="glass-panel mmu-card">
            <div className="card-header">
              <h3><Cpu size={18} /> 2. Paging & TLB Cache (Fixed Pod Frames)</h3>
              <span className="badge badge-cyan">Page Size: 4 Beds</span>
            </div>

            <p className="card-desc">
              Physical hospital space is split into uniform 4-bed Pods (Frames). 
              A 4-entry Translation Lookaside Buffer (TLB) speeds up lookups from 102ns to 2ns!
            </p>

            {/* TLB Cache Display */}
            <div className="tlb-cache-box">
              <span className="tlb-title">⚡ High-Speed Hardware TLB Cache (4 Entries)</span>
              <div className="tlb-entries-grid">
                {tlb.map((entry, idx) => (
                  <div key={idx} className="tlb-chip">
                    <span className="tlb-page mono-data">Page #{entry.page}</span>
                    <ArrowRight size={12} />
                    <span className="tlb-frame mono-data">Frame #{entry.frame}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Paging Translation Form */}
            <form onSubmit={handlePageTranslate} className="translate-form">
              <h4>Test Virtual Address Lookup (TLB / Page Table)</h4>
              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Virtual Page # (0..15)</label>
                  <input 
                    type="number"
                    min="0"
                    max="15"
                    value={virtPage}
                    onChange={(e) => setVirtPage(Number(e.target.value))}
                    className="input-field mono-data"
                    required
                  />
                </div>

                <div className="form-group flex-1">
                  <label>Offset (0..3)</label>
                  <input 
                    type="number"
                    min="0"
                    max="3"
                    value={pageOffset}
                    onChange={(e) => setPageOffset(Number(e.target.value))}
                    className="input-field mono-data"
                    required
                  />
                </div>

                <div className="form-group align-end">
                  <button type="submit" className="btn btn-primary">
                    <Search size={14} /> Resolve
                  </button>
                </div>
              </div>
            </form>

            {pageResult && (
              <div className={`mmu-result-box ${pageResult.success ? 'box-safe' : 'box-danger'}`}>
                {pageResult.success ? (
                  <>
                    <CheckCircle2 size={20} color="var(--accent-emerald)" />
                    <div>
                      <strong>Physical Address: Bed #{pageResult.physicalBedAddress} (Frame #{pageResult.frameNumber}, Slot #{pageResult.offset})</strong>
                      <p>{pageResult.detail}</p>
                    </div>
                  </>
                ) : pageResult.isPageFault ? (
                  <>
                    <AlertTriangle size={20} color="var(--accent-amber)" />
                    <div className="flex-1">
                      <strong>PAGE FAULT DETECTED!</strong>
                      <p>{pageResult.detail}</p>
                      <button 
                        type="button"
                        className="btn btn-secondary btn-sm mt-2"
                        onClick={() => handleResolvePageFault(pageResult.virtualPage)}
                      >
                        <Zap size={14} /> Service Page Fault (Swap In)
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertTriangle size={20} color="var(--accent-rose)" />
                    <div>
                      <strong>Translation Error: {pageResult.error}</strong>
                      <p>{pageResult.detail}</p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Page Table Overview */}
            <div className="page-table-preview">
              <span className="pt-title">Main Memory Page Table Snapshot (Sample)</span>
              <div className="pt-chips-row">
                {pageTable.slice(0, 8).map(pt => (
                  <div key={pt.page} className={`pt-chip ${pt.valid ? 'pt-valid' : 'pt-invalid'}`}>
                    <span>P{pt.page} → {pt.valid ? `F${pt.frame}` : 'DISK'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
