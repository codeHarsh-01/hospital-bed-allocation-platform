/**
 * Operating System Concurrency Pattern: Producer-Consumer (Bounded Buffer)
 * Maps to Unit 3: Bounded Buffer Queue for Incoming Patient Requests
 * 
 * Synchronizes multiple producer sources (Ambulance ER arrivals, OPD referrals,
 * Walk-in emergencies) with multiple consumer worker threads (Bed allocation engines)
 * using classical Mutex and Empty/Full Semaphores.
 */

import { Mutex } from './Mutex.js';
import { Semaphore } from './Semaphore.js';

export class BoundedBuffer {
  constructor(capacity = 8) {
    this.capacity = capacity;
    this.buffer = new Array(capacity).fill(null);
    this.inIndex = 0;   // Producer insertion pointer
    this.outIndex = 0;  // Consumer removal pointer
    this.count = 0;

    // Concurrency Primitives
    this.mutex = new Mutex('BoundedBufferMutex');
    this.emptySlots = new Semaphore(capacity, 'EmptySlotsSemaphore');
    this.fullSlots = new Semaphore(0, 'FullSlotsSemaphore');

    // Metrics & Audit Telemetry
    this.metrics = {
      totalProduced: 0,
      totalConsumed: 0,
      producerBlocks: 0,
      consumerBlocks: 0,
    };
    this.activityLog = [];
  }

  /**
   * Producer operation: Insert patient request into bounded buffer
   * @param {Object} patientRequest 
   * @param {string} producerId 
   * @returns {Promise<{success: boolean, slot: number}>}
   */
  async produce(patientRequest, producerId = 'Ambulance-Triage') {
    // 1. Wait on empty slot semaphore
    const emptyAcquired = await this.emptySlots.wait(producerId, `Producer-${producerId}`);
    if (!emptyAcquired) return { success: false, reason: 'Empty semaphore wait failed' };

    // 2. Acquire mutual exclusion lock on buffer
    await this.mutex.acquire(producerId, `Producer-${producerId}`);

    // Critical Section: Add item to circular buffer
    const assignedSlot = this.inIndex;
    const itemWithMeta = {
      ...patientRequest,
      bufferedAt: Date.now(),
      bufferSlot: assignedSlot,
      producerId
    };

    this.buffer[assignedSlot] = itemWithMeta;
    this.inIndex = (this.inIndex + 1) % this.capacity;
    this.count++;
    this.metrics.totalProduced++;

    this.logActivity('PRODUCE', producerId, `Patient #${patientRequest.id} (${patientRequest.name}) placed in Slot ${assignedSlot}`, assignedSlot);

    // 3. Release mutex
    this.mutex.release(producerId);

    // 4. Signal full slot semaphore (consumer can now read)
    this.fullSlots.signal();

    return { success: true, slot: assignedSlot, item: itemWithMeta };
  }

  /**
   * Consumer operation: Remove highest priority or next patient from bounded buffer
   * @param {string} consumerId 
   * @param {string} consumerName 
   * @returns {Promise<Object|null>}
   */
  async consume(consumerId = 'Worker-01', consumerName = 'AllocationThread-1') {
    // 1. Wait on full slot semaphore
    const fullAcquired = await this.fullSlots.wait(consumerId, consumerName);
    if (!fullAcquired) return null;

    // 2. Acquire mutual exclusion lock on buffer
    await this.mutex.acquire(consumerId, consumerName);

    // Critical Section: Extract item
    const consumedSlot = this.outIndex;
    const item = this.buffer[consumedSlot];
    this.buffer[consumedSlot] = null;
    this.outIndex = (this.outIndex + 1) % this.capacity;
    this.count--;
    this.metrics.totalConsumed++;

    this.logActivity('CONSUME', consumerName, `Patient #${item?.id} extracted from Slot ${consumedSlot} for Allocation`, consumedSlot);

    // 3. Release mutex
    this.mutex.release(consumerId);

    // 4. Signal empty slot semaphore (producer can now insert)
    this.emptySlots.signal();

    return item;
  }

  getSnapshot() {
    return {
      capacity: this.capacity,
      count: this.count,
      inIndex: this.inIndex,
      outIndex: this.outIndex,
      slots: [...this.buffer],
      emptyPermits: this.emptySlots.getValue(),
      fullPermits: this.fullSlots.getValue(),
      isMutexLocked: this.mutex.isLocked(),
      mutexOwner: this.mutex.getOwner(),
      waitingProducers: this.emptySlots.getQueueLength(),
      waitingConsumers: this.fullSlots.getQueueLength(),
      metrics: { ...this.metrics }
    };
  }

  logActivity(action, agent, detail, slot) {
    this.activityLog.unshift({
      timestamp: Date.now(),
      action,
      agent,
      detail,
      slot,
      bufferCount: this.count
    });
    if (this.activityLog.length > 40) this.activityLog.pop();
  }
}
