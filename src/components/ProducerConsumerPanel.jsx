import React from 'react';
import { 
  Layers, 
  ArrowRight, 
  ArrowDown, 
  Truck, 
  Cpu, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  PlusCircle, 
  MinusCircle,
  Clock
} from 'lucide-react';

export function ProducerConsumerPanel({ 
  snapshot, 
  onProduceOne, 
  onConsumeOne 
}) {
  const bb = snapshot?.boundedBuffer || {
    capacity: 8,
    count: 0,
    inIndex: 0,
    outIndex: 0,
    slots: [],
    emptyPermits: 8,
    fullPermits: 0,
    isMutexLocked: false,
    waitingProducers: 0,
    waitingConsumers: 0,
    metrics: {}
  };

  const isBufferFull = bb.count === bb.capacity;
  const isBufferEmpty = bb.count === 0;

  return (
    <div className="producer-consumer-layout animate-fade-in">
      {/* Overview Explanation Header */}
      <div className="glass-panel pbc-intro-card">
        <div className="intro-left">
          <div className="intro-icon-circle">
            <Layers size={28} color="var(--accent-cyan)" />
          </div>
          <div>
            <h2>Producer-Consumer Synchronization (Bounded Buffer Queue)</h2>
            <p>
              Synchronizes incoming triage patient arrivals (<strong>Producers</strong>: Ambulances, OPD, Emergency Influx) 
              with hospital allocation engines (<strong>Consumers</strong>: Admission worker daemons) using three synchronization primitives: 
              <code>emptySlots</code> Semaphore ({bb.emptyPermits}), <code>fullSlots</code> Semaphore ({bb.fullPermits}), and <code>bufferMutex</code>.
            </p>
          </div>
        </div>

        <div className="pbc-manual-controls">
          <button 
            className="btn btn-primary"
            onClick={onProduceOne}
            disabled={isBufferFull}
            title={isBufferFull ? "Buffer Full! Producer would block." : "Produce a new patient into buffer"}
          >
            <PlusCircle size={16} /> Produce (Ambulance Arrival)
          </button>
          <button 
            className="btn btn-secondary"
            onClick={onConsumeOne}
            disabled={isBufferEmpty}
            title={isBufferEmpty ? "Buffer Empty! Consumer would block." : "Consume next patient and allocate bed"}
          >
            <MinusCircle size={16} /> Consume (Allocate Bed)
          </button>
        </div>
      </div>

      {/* Semaphore & Buffer State Grid */}
      <div className="pbc-state-grid">
        {/* Empty Slots Semaphore Widget */}
        <div className="glass-panel pbc-stat-box">
          <span className="pbc-stat-title">Semaphore: emptySlots</span>
          <span className="pbc-stat-val" style={{ color: 'var(--accent-emerald)' }}>
            {bb.emptyPermits}
          </span>
          <span className="pbc-stat-detail">
            Available empty buffer slots. If 0, producers wait on <code>emptySlots.wait()</code>.
          </span>
          <div className="semaphore-queue-tag">
            Blocked Producers: <strong className="mono-data">{bb.waitingProducers}</strong>
          </div>
        </div>

        {/* Full Slots Semaphore Widget */}
        <div className="glass-panel pbc-stat-box">
          <span className="pbc-stat-title">Semaphore: fullSlots</span>
          <span className="pbc-stat-val" style={{ color: 'var(--accent-amber)' }}>
            {bb.fullPermits}
          </span>
          <span className="pbc-stat-detail">
            Available unconsumed patient items. If 0, consumers wait on <code>fullSlots.wait()</code>.
          </span>
          <div className="semaphore-queue-tag">
            Blocked Consumers: <strong className="mono-data">{bb.waitingConsumers}</strong>
          </div>
        </div>

        {/* Buffer Mutex State Widget */}
        <div className="glass-panel pbc-stat-box">
          <span className="pbc-stat-title">Binary Semaphore: bufferMutex</span>
          <span className="pbc-stat-val" style={{ color: bb.isMutexLocked ? 'var(--accent-rose)' : 'var(--accent-cyan)' }}>
            {bb.isMutexLocked ? '0 (Locked)' : '1 (Unlocked)'}
          </span>
          <span className="pbc-stat-detail">
            Guarantees mutual exclusion when updating buffer pointers <code>in</code> and <code>out</code>.
          </span>
          <div className="semaphore-queue-tag">
            Owner: <strong className="mono-data">{bb.mutexOwner?.name || 'None'}</strong>
          </div>
        </div>

        {/* Buffer Fill Ratio Widget */}
        <div className="glass-panel pbc-stat-box">
          <span className="pbc-stat-title">Buffer Occupancy</span>
          <span className="pbc-stat-val">
            {bb.count} / {bb.capacity}
          </span>
          <span className="pbc-stat-detail">
            Circular array slot usage ({Math.round((bb.count / bb.capacity) * 100)}% capacity)
          </span>
          <div className="semaphore-queue-tag">
            Total Handled: <strong className="mono-data">{bb.metrics?.totalConsumed || 0}</strong>
          </div>
        </div>
      </div>

      {/* The Circular Bounded Buffer Visual Pipeline */}
      <div className="glass-panel circular-buffer-panel">
        <div className="buffer-visual-header">
          <div className="pipeline-agent-badge producer-badge">
            <Truck size={18} /> Producers (Ambulance Fleet)
          </div>
          <ArrowRight size={20} className="pipeline-arrow" />
          <div className="pipeline-title">
            Bounded Buffer Circular Array [Capacity: {bb.capacity}]
          </div>
          <ArrowRight size={20} className="pipeline-arrow" />
          <div className="pipeline-agent-badge consumer-badge">
            <Cpu size={18} /> Consumers (Worker Daemons)
          </div>
        </div>

        {/* Circular Slots Grid */}
        <div className="buffer-slots-container">
          {bb.slots.map((item, slotIndex) => {
            const isFull = item !== null;
            const isInPointer = bb.inIndex === slotIndex;
            const isOutPointer = bb.outIndex === slotIndex;

            return (
              <div 
                key={slotIndex} 
                className={`buffer-slot-box ${isFull ? 'slot-occupied' : 'slot-empty'} ${isInPointer ? 'is-in-pointer' : ''} ${isOutPointer ? 'is-out-pointer' : ''}`}
              >
                {/* Pointer Indicators */}
                <div className="slot-pointers">
                  {isInPointer && (
                    <span className="pointer-tag in-tag" title="Next item produced goes here">
                      IN ↓
                    </span>
                  )}
                  {isOutPointer && (
                    <span className="pointer-tag out-tag" title="Next item consumed leaves from here">
                      OUT ↑
                    </span>
                  )}
                </div>

                <div className="slot-index-badge">Slot {slotIndex}</div>

                {isFull ? (
                  <div className="slot-item-content">
                    <span className="item-patient-id mono-data">{item.id}</span>
                    <span className="item-patient-name">{item.name}</span>
                    <span className={`badge ${item.priority === 1 ? 'badge-rose' : item.priority === 2 ? 'badge-amber' : 'badge-cyan'}`}>
                      Priority {item.priority}
                    </span>
                    <span className="item-ward-target">{item.targetWardId?.replace('W-', '')}</span>
                  </div>
                ) : (
                  <div className="slot-empty-content">
                    <span className="empty-slot-text">EMPTY</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Pointer Explanatory Legend */}
        <div className="buffer-legend-bar">
          <div className="legend-entry">
            <span className="pointer-pill in-pill">IN Pointer ({bb.inIndex})</span>
            <span>Index where next arriving patient will be placed by producer.</span>
          </div>
          <div className="legend-entry">
            <span className="pointer-pill out-pill">OUT Pointer ({bb.outIndex})</span>
            <span>Index from where worker thread will consume next patient for allocation.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
