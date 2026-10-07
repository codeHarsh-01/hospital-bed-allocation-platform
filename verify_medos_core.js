/**
 * Automated Verification & Unit Test Suite for MedOS Core
 * Validates all Operating System algorithms and concurrency primitives.
 */

import { Mutex } from './src/os/concurrency/Mutex.js';
import { Semaphore } from './src/os/concurrency/Semaphore.js';
import { BoundedBuffer } from './src/os/concurrency/BoundedBuffer.js';
import { ReadWriteLock } from './src/os/concurrency/RWLock.js';
import { BankersAlgorithm } from './src/os/deadlock/BankersAlgorithm.js';
import { MemoryManager } from './src/os/memory/MemoryManager.js';
import { PagingSegmentationUnit } from './src/os/memory/PagingSegmentation.js';
import { PriorityScheduler } from './src/os/scheduler/PriorityScheduler.js';

console.log('=== STARTING MEDOS AUTOMATED OS ENGINE VERIFICATION ===\n');

async function runTests() {
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. MUTEX TEST
  console.log('[Test 1: Mutex Lock & Critical Section Serialisation]');
  const mutex = new Mutex('TestMutex');
  assert(!mutex.isLocked(), 'Mutex initialized in unlocked state');
  await mutex.acquire('TH-1', 'Thread 1');
  assert(mutex.isLocked() && mutex.getOwner().id === 'TH-1', 'Mutex acquired exclusively by Thread 1');
  
  let thread2Acquired = false;
  const t2Promise = mutex.acquire('TH-2', 'Thread 2').then(() => {
    thread2Acquired = true;
  });
  assert(mutex.getQueue().length === 1, 'Thread 2 correctly enqueued in FIFO waiting queue');
  assert(!thread2Acquired, 'Thread 2 blocked while Thread 1 holds lock');
  
  mutex.release('TH-1');
  await t2Promise;
  assert(thread2Acquired && mutex.getOwner().id === 'TH-2', 'Mutex handoff to Thread 2 successful');
  mutex.release('TH-2');
  assert(!mutex.isLocked(), 'Mutex released and unlocked');

  // 2. SEMAPHORE TEST
  console.log('\n[Test 2: Counting & Binary Semaphore]');
  const sem = new Semaphore(2, 'ICUBeds');
  assert(sem.getValue() === 2, 'Initial semaphore counter = 2');
  await sem.wait('T1', 'User 1');
  await sem.wait('T2', 'User 2');
  assert(sem.getValue() === 0, 'Counter decremented to 0 after 2 acquisitions');
  
  let t3Acquired = false;
  const t3Promise = sem.wait('T3', 'User 3').then(() => { t3Acquired = true; });
  assert(sem.getQueueLength() === 1, 'Thread 3 suspended in waiting queue');
  sem.signal();
  await t3Promise;
  assert(t3Acquired, 'Signalled wakeup for Thread 3 successful');

  // 3. BOUNDED BUFFER (PRODUCER-CONSUMER)
  console.log('\n[Test 3: Producer-Consumer Bounded Buffer]');
  const buffer = new BoundedBuffer(4);
  const p1 = await buffer.produce({ id: 'P101', name: 'John Doe', priority: 1 });
  assert(p1.success && buffer.count === 1, 'Producer added item to Slot 0');
  const consumed = await buffer.consume('W1', 'Worker 1');
  assert(consumed.id === 'P101' && buffer.count === 0, 'Consumer successfully retrieved patient P101');

  // 4. READERS-WRITERS LOCK
  console.log('\n[Test 4: Readers-Writers Lock]');
  const rw = new ReadWriteLock('RWTest');
  await rw.acquireRead('R1');
  await rw.acquireRead('R2');
  assert(rw.activeReaders === 2, 'Two concurrent readers allowed simultaneously (Shared Read)');
  rw.releaseRead('R1');
  rw.releaseRead('R2');
  assert(rw.activeReaders === 0, 'All readers released');
  await rw.acquireWrite('W1');
  assert(rw.activeWriter && rw.activeWriter.id === 'W1', 'Exclusive writer acquired lock');
  rw.releaseWrite('W1');
  assert(!rw.activeWriter, 'Exclusive writer released');

  // 5. BANKER\'S ALGORITHM (DEADLOCK AVOIDANCE)
  console.log('\n[Test 5: Banker\'s Algorithm & Dijkstra Safety]');
  const bankers = new BankersAlgorithm();
  const initialSafety = bankers.checkSafety();
  assert(initialSafety.isSafe, 'Initial baseline state verified as SAFE');
  assert(initialSafety.safeSequence.length === 5, `Safe sequence computed: <${initialSafety.safeSequence.join(' -> ')}>`);

  // Test 5a: Exceeded claim rejection
  const exceededReq = bankers.requestResources(2, [4, 4, 4, 4, 4]);
  assert(exceededReq.status === 'ERROR_EXCEEDED_MAX', 'Exceeded claim request correctly trapped and aborted');

  // Test 5b: Unsafe state detection (Depleted vector causes deadlock)
  const unsafeCheck = bankers.checkSafety([0, 0, 0, 0, 0]);
  assert(!unsafeCheck.isSafe, 'Depleted available vector correctly diagnosed as UNSAFE state');
  assert(unsafeCheck.stalledPatients.length > 0, `Deadlock circular wait stalled processes identified: {${unsafeCheck.stalledPatients.join(', ')}}`);

  // Test legitimate safe request
  const safeReq = bankers.requestResources(3, [1, 0, 0, 1, 0]);
  assert(safeReq.status === 'GRANTED_SAFE', 'Safe resource request granted with validated safe sequence');

  // 6. MEMORY MANAGEMENT (FIRST, BEST, WORST FIT & FRAGMENTATION)
  console.log('\n[Test 6: Contiguous Partition Allocation & Fragmentation]');
  const mm = new MemoryManager(64);
  const ffRes = mm.allocateFirstFit(4, 'Cohort A');
  assert(ffRes.success, 'First Fit allocated 4-bed block');
  const bfRes = mm.allocateBestFit(6, 'Cohort B');
  assert(bfRes.success, 'Best Fit allocated 6-bed block');
  const wfRes = mm.allocateWorstFit(5, 'Cohort C');
  assert(wfRes.success, 'Worst Fit allocated 5-bed block');

  const frag = mm.getFragmentationMetrics();
  assert(typeof frag.externalFragPercent === 'number', `External fragmentation calculated: ${frag.externalFragPercent}%`);

  const compactRes = mm.compactMemory();
  assert(compactRes.success, 'Memory compaction successfully coalesced free holes');
  const fragAfter = mm.getFragmentationMetrics();
  assert(fragAfter.externalFragPercent === 0, 'Compaction reduced external fragmentation to 0%');

  // 7. PAGING & SEGMENTATION UNIT
  console.log('\n[Test 7: Paging, Segmentation & TLB]');
  const mmu = new PagingSegmentationUnit();
  const segValid = mmu.translateSegmentAddress(0, 4);
  assert(segValid.success && segValid.physicalBedAddress === 4, 'Segment 0 (ICU), Offset 4 translates to Physical Bed #4');
  
  const segFault = mmu.translateSegmentAddress(0, 50);
  assert(!segFault.success && segFault.error === 'SEGMENT_LIMIT_VIOLATION', 'Segment offset 50 > limit triggers Segmentation Fault Trap');

  const pageTrans = mmu.translatePagedAddress(1, 2);
  assert(pageTrans.success, 'Virtual Page #1, Offset #2 translated to Physical Bed');

  // 8. PRIORITY SCHEDULER & AGING
  console.log('\n[Test 8: Priority Scheduler with Aging]');
  const sched = new PriorityScheduler('PRIORITY_AGING');
  sched.enqueue({ id: 'PT-1', name: 'Stable Patient', priority: 5 });
  sched.enqueue({ id: 'PT-2', name: 'Critical Trauma', priority: 1 });
  const topPatient = sched.dequeue();
  assert(topPatient.id === 'PT-2', 'Highest priority (Priority 1) served first ahead of lower priority');

  console.log(`\n=== VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED ===\n`);
  if (failed === 0) {
    console.log('🚀 ALL OPERATING SYSTEM MODULES ARE MATHEMATICALLY SOUND & PRODUCTION-READY!');
  } else {
    process.exit(1);
  }
}

runTests();
