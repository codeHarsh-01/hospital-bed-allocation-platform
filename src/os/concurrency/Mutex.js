/**
 * Operating System Concurrency Primitive: Mutex Lock
 * Maps to Unit 3: Race Condition Prevention & Critical Section Problem
 * 
 * Guarantees Mutual Exclusion: At most one thread can enter the critical
 * section accessing bed allocation records at any given instant.
 */

export class Mutex {
  constructor(name = 'BedAllocationMutex') {
    this.name = name;
    this.locked = false;
    this.owner = null; // Thread ID currently holding lock
    this.waitingQueue = []; // FIFO Queue of waiting threads
    this.lockHistory = [];
    this.contentionCount = 0;
  }

  /**
   * Acquire mutex lock. Returns true if acquired immediately, or enqueues thread.
   * @param {string} threadId 
   * @param {string} threadName 
   * @returns {Promise<boolean>}
   */
  async acquire(threadId, threadName) {
    if (!this.locked) {
      this.locked = true;
      this.owner = { id: threadId, name: threadName, acquiredAt: Date.now() };
      this.logEvent('ACQUIRED', threadId, threadName);
      return true;
    }

    // Lock is contended - thread must wait in queue
    this.contentionCount++;
    this.logEvent('BLOCKED', threadId, threadName);
    
    return new Promise((resolve) => {
      this.waitingQueue.push({
        id: threadId,
        name: threadName,
        enqueuedAt: Date.now(),
        resolve
      });
    });
  }

  /**
   * Release mutex lock and unblock the next waiting thread in FIFO order.
   * @param {string} threadId 
   */
  release(threadId) {
    if (!this.locked) {
      console.warn(`[Mutex ${this.name}] Release called on unlocked mutex`);
      return;
    }

    if (this.owner && this.owner.id !== threadId) {
      console.error(`[Mutex ${this.name}] ILLEGAL RELEASE: Thread ${threadId} tried to release lock held by ${this.owner.id}`);
      return;
    }

    const previousOwner = this.owner;
    this.logEvent('RELEASED', previousOwner?.id, previousOwner?.name);

    if (this.waitingQueue.length > 0) {
      // Wake up head of waiting queue
      const nextThread = this.waitingQueue.shift();
      this.owner = { id: nextThread.id, name: nextThread.name, acquiredAt: Date.now() };
      this.logEvent('HANDOFF', nextThread.id, nextThread.name);
      nextThread.resolve(true);
    } else {
      this.locked = false;
      this.owner = null;
    }
  }

  isLocked() {
    return this.locked;
  }

  getOwner() {
    return this.owner;
  }

  getQueue() {
    return this.waitingQueue.map(t => ({ id: t.id, name: t.name, waitTime: Date.now() - t.enqueuedAt }));
  }

  logEvent(action, threadId, threadName) {
    this.lockHistory.unshift({
      timestamp: Date.now(),
      action,
      threadId,
      threadName,
      queueLength: this.waitingQueue.length
    });
    if (this.lockHistory.length > 30) this.lockHistory.pop();
  }
}
