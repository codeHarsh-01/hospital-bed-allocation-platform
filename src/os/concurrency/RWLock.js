/**
 * Operating System Concurrency Pattern: Readers-Writers Problem
 * Maps to Unit 3: Concurrent Bed Status Queries vs Exclusive Allocation Updates
 * 
 * Allows multiple medical staff & dashboards to view bed status concurrently,
 * while ensuring that bed allocation or discharge operations obtain an
 * exclusive writer lock, preventing dirty reads and write-write conflicts.
 */

export class ReadWriteLock {
  constructor(name = 'HospitalBedStatusRWLock') {
    this.name = name;
    this.activeReaders = 0;
    this.activeWriter = null;
    this.waitingReaders = [];
    this.waitingWriters = [];
    this.history = [];
    this.metrics = {
      totalReads: 0,
      totalWrites: 0,
      maxConcurrentReaders: 0
    };
  }

  /**
   * Acquire Shared Read Lock
   */
  async acquireRead(readerId, readerName = 'DashboardViewer') {
    // If there is an active writer or waiting writers (writer preference to prevent writer starvation)
    if (this.activeWriter !== null || this.waitingWriters.length > 0) {
      return new Promise((resolve) => {
        this.waitingReaders.push({
          id: readerId,
          name: readerName,
          enqueuedAt: Date.now(),
          resolve
        });
        this.log('READER_BLOCKED', readerId, readerName);
      });
    }

    this.activeReaders++;
    this.metrics.totalReads++;
    if (this.activeReaders > this.metrics.maxConcurrentReaders) {
      this.metrics.maxConcurrentReaders = this.activeReaders;
    }
    this.log('READER_ACQUIRED', readerId, readerName);
    return true;
  }

  /**
   * Release Shared Read Lock
   */
  releaseRead(readerId) {
    if (this.activeReaders <= 0) return;
    this.activeReaders--;
    this.log('READER_RELEASED', readerId, 'ReadFinished');

    // If last reader released, and there are waiting writers, grant write lock
    if (this.activeReaders === 0 && this.waitingWriters.length > 0) {
      const nextWriter = this.waitingWriters.shift();
      this.activeWriter = { id: nextWriter.id, name: nextWriter.name, acquiredAt: Date.now() };
      this.metrics.totalWrites++;
      this.log('WRITER_ACQUIRED_FROM_QUEUE', nextWriter.id, nextWriter.name);
      nextWriter.resolve(true);
    }
  }

  /**
   * Acquire Exclusive Write Lock
   */
  async acquireWrite(writerId, writerName = 'BedAllocationOfficer') {
    // Writers require exclusive access: 0 active readers and 0 active writers
    if (this.activeWriter === null && this.activeReaders === 0) {
      this.activeWriter = { id: writerId, name: writerName, acquiredAt: Date.now() };
      this.metrics.totalWrites++;
      this.log('WRITER_ACQUIRED', writerId, writerName);
      return true;
    }

    return new Promise((resolve) => {
      this.waitingWriters.push({
        id: writerId,
        name: writerName,
        enqueuedAt: Date.now(),
        resolve
      });
      this.log('WRITER_BLOCKED', writerId, writerName);
    });
  }

  /**
   * Release Exclusive Write Lock
   */
  releaseWrite(writerId) {
    if (!this.activeWriter || this.activeWriter.id !== writerId) {
      console.warn(`[RWLock] Illegal write release by ${writerId}`);
      return;
    }

    const prevWriter = this.activeWriter;
    this.activeWriter = null;
    this.log('WRITER_RELEASED', prevWriter.id, prevWriter.name);

    // Prioritize next waiting writer if any (or drain readers)
    if (this.waitingWriters.length > 0) {
      const nextWriter = this.waitingWriters.shift();
      this.activeWriter = { id: nextWriter.id, name: nextWriter.name, acquiredAt: Date.now() };
      this.metrics.totalWrites++;
      this.log('WRITER_ACQUIRED_FROM_QUEUE', nextWriter.id, nextWriter.name);
      nextWriter.resolve(true);
    } else if (this.waitingReaders.length > 0) {
      // Release all waiting readers simultaneously (shared read)
      const readersToWake = [...this.waitingReaders];
      this.waitingReaders = [];
      this.activeReaders = readersToWake.length;
      this.metrics.totalReads += readersToWake.length;
      if (this.activeReaders > this.metrics.maxConcurrentReaders) {
        this.metrics.maxConcurrentReaders = this.activeReaders;
      }
      for (const r of readersToWake) {
        this.log('READER_ACQUIRED_BATCH', r.id, r.name);
        r.resolve(true);
      }
    }
  }

  getSnapshot() {
    return {
      activeReaders: this.activeReaders,
      activeWriter: this.activeWriter ? { ...this.activeWriter } : null,
      waitingReadersCount: this.waitingReaders.length,
      waitingWritersCount: this.waitingWriters.length,
      waitingWriters: this.waitingWriters.map(w => ({ id: w.id, name: w.name })),
      waitingReaders: this.waitingReaders.map(r => ({ id: r.id, name: r.name })),
      metrics: { ...this.metrics }
    };
  }

  log(event, id, name) {
    this.history.unshift({
      timestamp: Date.now(),
      event,
      id,
      name,
      activeReaders: this.activeReaders,
      hasWriter: !!this.activeWriter
    });
    if (this.history.length > 30) this.history.pop();
  }
}
