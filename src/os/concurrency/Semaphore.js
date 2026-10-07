/**
 * Operating System Concurrency Primitive: Counting and Binary Semaphore
 * Maps to Unit 3: Semaphore Protection for Shared Resources
 * 
 * Controls concurrent access to finite pools of hospital resources
 * (e.g. ICU beds, Ventilators, Specialized Medical Staff).
 */

export class Semaphore {
  constructor(initialValue = 1, name = 'ResourceSemaphore') {
    this.name = name;
    this.capacity = initialValue;
    this.value = initialValue;
    this.waitingQueue = [];
    this.history = [];
  }

  /**
   * P() or wait() operation: decrement counter or block
   * @param {string} threadId 
   * @param {string} threadName 
   * @returns {Promise<boolean>}
   */
  async wait(threadId, threadName) {
    if (this.value > 0) {
      this.value--;
      this.logEvent('ACQUIRED_PERMIT', threadId, threadName);
      return true;
    }

    // No permits available - thread is suspended
    this.logEvent('SUSPENDED_WAITING', threadId, threadName);
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
   * V() or signal() operation: increment counter or wake up waiting thread
   */
  signal() {
    if (this.waitingQueue.length > 0) {
      const nextThread = this.waitingQueue.shift();
      this.logEvent('SIGNALLED_WAKEUP', nextThread.id, nextThread.name);
      nextThread.resolve(true);
    } else {
      this.value++;
      this.logEvent('RELEASED_PERMIT', 'system', 'increment');
    }
  }

  getValue() {
    return this.value;
  }

  getCapacity() {
    return this.capacity;
  }

  getQueueLength() {
    return this.waitingQueue.length;
  }

  logEvent(action, threadId, threadName) {
    this.history.unshift({
      timestamp: Date.now(),
      action,
      threadId,
      threadName,
      availablePermits: this.value,
      queueLength: this.waitingQueue.length
    });
    if (this.history.length > 30) this.history.pop();
  }
}
