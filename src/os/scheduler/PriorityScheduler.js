/**
 * Operating System Scheduling: Triage Priority & FCFS Scheduler
 * Maps to Unit 1 & 2: Process Scheduling, Priority Queues & Starvation Prevention
 * 
 * Clinical Triage Priority Levels:
 * 1 - Red (Immediate Resuscitation / Severe Trauma) [Highest]
 * 2 - Orange (Very Urgent / Unstable Cardiac / Sepsis)
 * 3 - Yellow (Urgent / Acute Fracture / Stable Chest Pain)
 * 4 - Green (Standard / Minor Trauma / Mild Infection)
 * 5 - Blue (Non-urgent / Routine Observation / Elective) [Lowest]
 * 
 * Features dynamic Priority Aging to mathematically eliminate starvation.
 */

export class PriorityScheduler {
  constructor(mode = 'PRIORITY_AGING') {
    this.mode = mode; // 'PRIORITY_AGING', 'STRICT_PRIORITY', 'FCFS'
    this.queue = [];
    this.completedRequests = [];
    this.agingIntervalMs = 6000; // Boost priority every 6 seconds of waiting
    this.lastAgingTick = Date.now();
    this.metrics = {
      totalAdmitted: 0,
      totalWaitTimeMs: 0,
      maxWaitTimeMs: 0,
      starvationPreventedCount: 0,
      priorityDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
  }

  /**
   * Enqueue patient admission request
   */
  enqueue(patient) {
    const item = {
      ...patient,
      originalPriority: patient.priority,
      effectivePriority: patient.priority,
      arrivedAt: Date.now(),
      lastAgedAt: Date.now(),
      agingBoosts: 0,
      waitTimeMs: 0
    };

    this.queue.push(item);
    this.metrics.priorityDistribution[patient.priority] = (this.metrics.priorityDistribution[patient.priority] || 0) + 1;
    this.sortQueue();
    return item;
  }

  /**
   * Dequeue next patient according to current scheduling algorithm
   */
  dequeue() {
    this.applyAging();
    this.sortQueue();

    if (this.queue.length === 0) return null;

    const patient = this.queue.shift();
    const waitTime = Date.now() - patient.arrivedAt;
    patient.waitTimeMs = waitTime;
    patient.admittedAt = Date.now();

    this.completedRequests.unshift(patient);
    if (this.completedRequests.length > 50) this.completedRequests.pop();

    this.metrics.totalAdmitted++;
    this.metrics.totalWaitTimeMs += waitTime;
    if (waitTime > this.metrics.maxWaitTimeMs) {
      this.metrics.maxWaitTimeMs = waitTime;
    }

    return patient;
  }

  /**
   * Apply Aging Mechanism: Boost priority of long-waiting processes
   * Eliminates priority inversion and starvation of low-priority patients
   */
  applyAging() {
    if (this.mode !== 'PRIORITY_AGING') return;

    const now = Date.now();
    for (const p of this.queue) {
      const waitDuration = now - p.lastAgedAt;
      if (waitDuration >= this.agingIntervalMs && p.effectivePriority > 1) {
        p.effectivePriority--;
        p.agingBoosts++;
        p.lastAgedAt = now;
        this.metrics.starvationPreventedCount++;
      }
      p.waitTimeMs = now - p.arrivedAt;
    }
  }

  /**
   * Sort queue according to scheduling policy
   */
  sortQueue() {
    if (this.mode === 'FCFS') {
      // First-Come First-Served: strictly by arrival timestamp
      this.queue.sort((a, b) => a.arrivedAt - b.arrivedAt);
    } else {
      // Priority (or Priority with Aging):
      // Primary key: effectivePriority ascending (1 = highest)
      // Tie-breaker: arrivedAt ascending (FCFS for equal priority)
      this.queue.sort((a, b) => {
        if (a.effectivePriority !== b.effectivePriority) {
          return a.effectivePriority - b.effectivePriority;
        }
        return a.arrivedAt - b.arrivedAt;
      });
    }
  }

  setMode(newMode) {
    this.mode = newMode;
    this.sortQueue();
  }

  getSnapshot() {
    this.applyAging();
    const now = Date.now();
    const queueWithLiveWait = this.queue.map(p => ({
      ...p,
      liveWaitSec: Math.floor((now - p.arrivedAt) / 1000)
    }));

    const avgWaitTimeSec = this.metrics.totalAdmitted > 0
      ? Number(((this.metrics.totalWaitTimeMs / this.metrics.totalAdmitted) / 1000).toFixed(1))
      : 0;

    return {
      mode: this.mode,
      queueLength: this.queue.length,
      queue: queueWithLiveWait,
      completedCount: this.completedRequests.length,
      recentCompleted: this.completedRequests.slice(0, 10),
      metrics: {
        ...this.metrics,
        avgWaitTimeSec,
        maxWaitTimeSec: Math.floor(this.metrics.maxWaitTimeMs / 1000)
      }
    };
  }
}
