/**
 * Master Hospital Operating System Engine (MedOS Simulation Core)
 * Unifies all OS concepts from Unit 1, 2, 3 & 4 into an industrial-grade clinical core:
 * - Mutex & Semaphore Protection (Critical Section)
 * - Race Condition Detector (Synchronized vs Unsynchronized mode)
 * - Bounded Buffer Producer-Consumer Queue
 * - Readers-Writers Lock (Shared Status Reads vs Exclusive Admissions)
 * - Banker's Algorithm (Multi-Resource Deadlock Avoidance)
 * - Dynamic Partition Allocation (First Fit, Best Fit, Worst Fit, Compaction)
 * - Paging & Segmentation Unit (Virtual Bed Translation, TLB Cache)
 * - Priority & FCFS Scheduler with Dynamic Aging
 */

import { Mutex } from '../concurrency/Mutex.js';
import { Semaphore } from '../concurrency/Semaphore.js';
import { BoundedBuffer } from '../concurrency/BoundedBuffer.js';
import { ReadWriteLock } from '../concurrency/RWLock.js';
import { BankersAlgorithm } from '../deadlock/BankersAlgorithm.js';
import { MemoryManager } from '../memory/MemoryManager.js';
import { PagingSegmentationUnit } from '../memory/PagingSegmentation.js';
import { PriorityScheduler } from '../scheduler/PriorityScheduler.js';

export class HospitalSimulationEngine {
  constructor() {
    // 1. Hospital Wards Configuration & Physical Beds
    this.wards = [
      { id: 'W-ICU', name: 'Intensive Care Unit (ICU)', totalBeds: 12, type: 'CRITICAL', color: '#ef4444' },
      { id: 'W-ER', name: 'Emergency & Trauma Bay', totalBeds: 16, type: 'EMERGENCY', color: '#f97316' },
      { id: 'W-CARD', name: 'Cardiology Care Ward', totalBeds: 16, type: 'URGENT', color: '#8b5cf6' },
      { id: 'W-PED', name: 'Pediatric Care Ward', totalBeds: 12, type: 'STANDARD', color: '#06b6d4' },
      { id: 'W-GEN', name: 'General Medicine Ward', totalBeds: 24, type: 'STANDARD', color: '#10b981' }
    ];

    this.beds = this.initializeBeds();

    // 2. OS Subsystems
    this.bedMutex = new Mutex('HospitalBedCriticalSection');
    this.icuSemaphore = new Semaphore(4, 'ICUBedCapacitySemaphore');
    this.ventilatorSemaphore = new Semaphore(6, 'VentilatorCapacitySemaphore');
    this.boundedBuffer = new BoundedBuffer(8);
    this.rwLock = new ReadWriteLock('BedOccupancyDashboardRWLock');
    this.bankers = new BankersAlgorithm();
    this.memoryManager = new MemoryManager(64);
    this.mmu = new PagingSegmentationUnit();
    this.scheduler = new PriorityScheduler('PRIORITY_AGING');

    // 3. Concurrency Safety Control
    this.synchronizationEnabled = true; // Toggle to false to demonstrate race conditions!
    this.doubleAllocationViolations = 0;
    this.raceConditionIncidents = [];

    // 4. Worker Threads (Allocation Engines)
    this.workerThreads = [
      { id: 'TH-01', name: 'Admission Daemon Alpha', status: 'IDLE', activeTask: null, allocations: 0 },
      { id: 'TH-02', name: 'Emergency Dispatch Beta', status: 'IDLE', activeTask: null, allocations: 0 },
      { id: 'TH-03', name: 'Triage Worker Gamma', status: 'IDLE', activeTask: null, allocations: 0 },
      { id: 'TH-04', name: 'Transfer Scheduler Delta', status: 'IDLE', activeTask: null, allocations: 0 }
    ];

    // 5. System Clock & State
    this.isRunning = false;
    this.simulationSpeed = 1; // 0.5x, 1x, 2x, 5x
    this.timerId = null;
    this.eventAuditLog = [];
    this.patientCounter = 100;

    // Seed initial patients
    this.seedInitialOccupancy();
  }

  initializeBeds() {
    const beds = [];
    let globalBedId = 1;

    for (const ward of this.wards) {
      for (let i = 1; i <= ward.totalBeds; i++) {
        beds.push({
          id: globalBedId++,
          wardId: ward.id,
          wardName: ward.name,
          bedNumber: i,
          status: 'FREE', // 'FREE', 'OCCUPIED', 'CLEANING', 'RESERVED'
          patient: null,
          ventilatorAttached: false,
          lockedByThread: null,
          assignedAt: null
        });
      }
    }
    return beds;
  }

  seedInitialOccupancy() {
    const samplePatients = [
      { name: 'Aarav Sharma', age: 58, condition: 'Post-Myocardial Infarction', priority: 2, wardId: 'W-CARD', vent: false },
      { name: 'Zoya Siddiqui', age: 34, condition: 'Acute Respiratory Distress', priority: 1, wardId: 'W-ICU', vent: true },
      { name: 'Devendra Joshi', age: 71, condition: 'Severe Sepsis', priority: 1, wardId: 'W-ICU', vent: true },
      { name: 'Tanvi Verma', age: 9, condition: 'Pediatric Pneumonia', priority: 3, wardId: 'W-PED', vent: false },
      { name: 'Rajesh Nair', age: 46, condition: 'Compound Femur Fracture', priority: 2, wardId: 'W-ER', vent: false },
      { name: 'Sunita Devi', age: 62, condition: 'Hypertensive Crisis', priority: 3, wardId: 'W-GEN', vent: false }
    ];

    for (const p of samplePatients) {
      const freeBed = this.beds.find(b => b.wardId === p.wardId && b.status === 'FREE');
      if (freeBed) {
        freeBed.status = 'OCCUPIED';
        freeBed.patient = {
          id: `PT-${this.patientCounter++}`,
          name: p.name,
          age: p.age,
          condition: p.condition,
          priority: p.priority,
          admittedAt: Date.now() - Math.floor(Math.random() * 3600000)
        };
        freeBed.ventilatorAttached = p.vent;
      }
    }
  }

  /**
   * Produce a new patient request (Producer-Consumer)
   */
  async producePatientArrival(customData = null) {
    const patientConditions = [
      { condition: 'Severe Cardiac Arrest', priority: 1, ward: 'W-ICU', vent: true },
      { condition: 'Acute Trauma / Hemorrhage', priority: 1, ward: 'W-ER', vent: false },
      { condition: 'Hypoxic Respiratory Failure', priority: 2, ward: 'W-ICU', vent: true },
      { condition: 'Severe Diabetic Ketoacidosis', priority: 2, ward: 'W-CARD', vent: false },
      { condition: 'Acute Appendicitis', priority: 3, ward: 'W-GEN', vent: false },
      { condition: 'Pediatric Asthma Exacerbation', priority: 3, ward: 'W-PED', vent: false },
      { condition: 'Mild Concussion / Observation', priority: 4, ward: 'W-ER', vent: false },
      { condition: 'Elective Pre-op Admission', priority: 5, ward: 'W-GEN', vent: false }
    ];

    const pick = customData || patientConditions[Math.floor(Math.random() * patientConditions.length)];
    const indianNames = ['Vikram Rathore', 'Pooja Iyer', 'Rahul Sengupta', 'Simran Kaur', 'Aditya Menon', 'Neha Kapoor', 'Gautam Bose', 'Farhan Akhtar'];
    const randomName = customData?.name || indianNames[Math.floor(Math.random() * indianNames.length)];

    const patient = {
      id: `PT-${this.patientCounter++}`,
      name: randomName,
      age: Math.floor(Math.random() * 65) + 12,
      condition: pick.condition,
      priority: pick.priority,
      targetWardId: pick.ward,
      needsVentilator: pick.vent,
      arrivedAt: Date.now()
    };

    // 1. Add to Bounded Buffer (Producer-Consumer queue)
    const produceResult = await this.boundedBuffer.produce(patient, 'Ambulance-Triage');
    
    // 2. Also register in Priority Scheduler
    this.scheduler.enqueue(patient);

    this.logEvent('PATIENT_INGRESS', `Patient ${patient.id} (${patient.name}) arrived. Priority ${patient.priority}. Queued in Bounded Buffer.`);
    return patient;
  }

  /**
   * Consume patient from Bounded Buffer & Allocate Bed via Worker Thread
   */
  async processNextAdmission(workerId = 'TH-01') {
    const worker = this.workerThreads.find(w => w.id === workerId) || this.workerThreads[0];
    worker.status = 'CONSUMING';

    // 1. Consumer extracts request from Bounded Buffer
    const patient = await this.boundedBuffer.consume(worker.id, worker.name);
    if (!patient) {
      worker.status = 'IDLE';
      return null;
    }

    worker.status = 'ALLOCATING';
    worker.activeTask = `Allocating bed for Patient ${patient.id}`;

    // 2. Dequeue from Priority Scheduler
    this.scheduler.dequeue();

    // 3. Allocate bed with Critical Section protection
    const allocationResult = await this.executeBedAllocation(patient, worker);

    worker.status = 'IDLE';
    worker.activeTask = null;
    if (allocationResult.success) worker.allocations++;

    return allocationResult;
  }

  /**
   * Core Bed Allocation Routine (Critical Section)
   * Protected by Mutex when synchronizationEnabled is true.
   */
  async executeBedAllocation(patient, worker) {
    const targetWard = patient.targetWardId;

    if (this.synchronizationEnabled) {
      // PROPER OS SYNCHRONIZATION: Acquire Mutex before accessing bed inventory
      await this.bedMutex.acquire(worker.id, worker.name);
      
      // Acquire Writer lock for Readers-Writers safety
      await this.rwLock.acquireWrite(worker.id, worker.name);
    } else {
      // UNSYNCHRONIZED (RACE CONDITION VULNERABLE): Mutex intentionally bypassed!
      this.logEvent('UNSYNC_WARNING', `Thread ${worker.id} entered Critical Section WITHOUT Mutex lock!`);
    }

    // --- CRITICAL SECTION START ---
    let chosenBed = null;
    
    // Search for available bed in target ward
    for (const bed of this.beds) {
      if (bed.wardId === targetWard && bed.status === 'FREE') {
        chosenBed = bed;
        break;
      }
    }

    // Fallback to General Ward if preferred ward is full and not ICU
    if (!chosenBed && targetWard !== 'W-ICU') {
      for (const bed of this.beds) {
        if (bed.wardId === 'W-GEN' && bed.status === 'FREE') {
          chosenBed = bed;
          break;
        }
      }
    }

    let success = false;
    let failureReason = '';

    if (chosenBed) {
      // Artificial context-switch delay to simulate race condition window if unsynchronized
      if (!this.synchronizationEnabled) {
        await new Promise(r => setTimeout(r, 60)); // Yield thread during critical section
        if (chosenBed.status !== 'FREE') {
          // RACE CONDITION DETECTED!
          this.doubleAllocationViolations++;
          const incident = {
            timestamp: Date.now(),
            bedId: chosenBed.id,
            collidingThreads: [chosenBed.lockedByThread, worker.id],
            victimPatient: patient.id,
            reason: `Race Condition Collision! Bed #${chosenBed.id} was already assigned to ${chosenBed.patient?.id} while thread ${worker.id} held a stale reference.`
          };
          this.raceConditionIncidents.unshift(incident);
          this.logEvent('RACE_CONDITION_ALARM', incident.reason);
        }
      }

      chosenBed.status = 'OCCUPIED';
      chosenBed.patient = patient;
      chosenBed.ventilatorAttached = patient.needsVentilator;
      chosenBed.assignedAt = Date.now();
      chosenBed.lockedByThread = worker.id;
      success = true;

      this.logEvent('BED_ALLOCATED', `Bed #${chosenBed.id} (${chosenBed.wardName}) assigned to Patient ${patient.id} (${patient.name}) by ${worker.name}`);
    } else {
      failureReason = `No available beds in ${targetWard} or General Ward. Patient queued for transfer.`;
      this.logEvent('ALLOCATION_FAILED', `Failed to allocate bed for ${patient.id}: ${failureReason}`);
    }

    // --- CRITICAL SECTION END ---
    if (this.synchronizationEnabled) {
      this.rwLock.releaseWrite(worker.id);
      this.bedMutex.release(worker.id);
    }

    return {
      success,
      patient,
      bed: chosenBed,
      failureReason
    };
  }

  /**
   * Discharge Patient from a Bed
   */
  async dischargeBed(bedId, staffId = 'Staff-Discharge') {
    const bed = this.beds.find(b => b.id === bedId);
    if (!bed || bed.status !== 'OCCUPIED') return false;

    if (this.synchronizationEnabled) {
      await this.bedMutex.acquire(staffId, 'DischargeWorker');
      await this.rwLock.acquireWrite(staffId, 'DischargeWorker');
    }

    const patient = bed.patient;
    bed.status = 'CLEANING';
    bed.patient = null;
    bed.ventilatorAttached = false;
    bed.lockedByThread = null;

    if (this.synchronizationEnabled) {
      this.rwLock.releaseWrite(staffId);
      this.bedMutex.release(staffId);
    }

    this.logEvent('PATIENT_DISCHARGED', `Patient ${patient?.id} discharged from Bed #${bed.id}. Bed marked for sanitization.`);

    // Sanitization timer (becomes FREE after 4 seconds)
    setTimeout(() => {
      bed.status = 'FREE';
      this.logEvent('BED_READY', `Bed #${bed.id} (${bed.wardName}) sanitized and returned to FREE pool.`);
    }, 4000);

    return true;
  }

  /**
   * Readers-Writers Query: Read Bed Status concurrently
   */
  async queryBedStatus(readerId = 'DashboardReader') {
    await this.rwLock.acquireRead(readerId, `Reader-${readerId}`);
    // Simulate read latency
    const snapshot = this.beds.map(b => ({
      id: b.id,
      wardId: b.wardId,
      wardName: b.wardName,
      status: b.status,
      patientName: b.patient?.name || null,
      ventilator: b.ventilatorAttached
    }));
    this.rwLock.releaseRead(readerId);
    return snapshot;
  }

  /**
   * Run Stress Test with High Concurrency
   * Fires N concurrent allocation requests to verify lock correctness
   */
  async triggerConcurrentStressTest(requestCount = 8) {
    this.logEvent('STRESS_TEST_START', `Initiating stress test with ${requestCount} simultaneous concurrent requests. Mutex: ${this.synchronizationEnabled ? 'ENABLED (Safe)' : 'DISABLED (Race Condition Hazard)'}`);

    const promises = [];
    for (let i = 0; i < requestCount; i++) {
      promises.push((async () => {
        const p = await this.producePatientArrival({
          name: `Emergency Case #${i + 1}`,
          priority: (i % 3) + 1,
          ward: 'W-ER',
          vent: false
        });
        const worker = this.workerThreads[i % this.workerThreads.length];
        return this.processNextAdmission(worker.id);
      })());
    }

    await Promise.all(promises);
    this.logEvent('STRESS_TEST_COMPLETE', `Stress test completed. Total Double-Allocation Violations: ${this.doubleAllocationViolations}`);
  }

  /**
   * Apply Disaster / Scenario Presets
   */
  applyScenarioPreset(presetName) {
    this.logEvent('SCENARIO_PRESET', `Loading scenario preset: "${presetName}"`);

    switch (presetName) {
      case 'MASS_CASUALTY':
        // Overwhelm ER and Bounded Buffer with high-priority trauma arrivals
        for (let i = 0; i < 6; i++) {
          this.producePatientArrival({
            name: `Trauma Victim #${i + 1}`,
            priority: 1,
            ward: 'W-ER',
            vent: i % 2 === 0
          });
        }
        break;

      case 'ICU_CRUNCH':
        // Exhaust ventilators and ICU beds to demonstrate Banker's deadlock avoidance
        for (const bed of this.beds) {
          if (bed.wardId === 'W-ICU') {
            bed.status = 'OCCUPIED';
            bed.ventilatorAttached = true;
            bed.patient = { id: `CRIT-${Math.floor(Math.random() * 900)}`, name: 'ICU Critical Patient', priority: 1 };
          }
        }
        break;

      case 'PANDEMIC_COHORT':
        // Test Memory Allocation (First Fit vs Best Fit vs Worst Fit on isolation blocks)
        this.memoryManager.allocateBestFit(6, 'Infectious Isolation Cohort');
        this.memoryManager.allocateFirstFit(4, 'Quarantine Cohort B');
        break;

      case 'RESET_BALANCED':
      default:
        this.beds = this.initializeBeds();
        this.seedInitialOccupancy();
        this.doubleAllocationViolations = 0;
        this.raceConditionIncidents = [];
        break;
    }
  }

  /**
   * Simulation Timer Loop
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.timerId = setInterval(() => {
      this.simulationTick();
    }, 2500 / this.simulationSpeed);
    this.logEvent('ENGINE_STARTED', 'Hospital Simulation Engine started in real-time execution mode.');
  }

  stop() {
    this.isRunning = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.logEvent('ENGINE_STOPPED', 'Hospital Simulation Engine paused.');
  }

  setSpeed(speed) {
    this.simulationSpeed = speed;
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }

  async simulationTick() {
    // 1. Randomly produce patient arrival with probability 60%
    if (Math.random() < 0.65) {
      await this.producePatientArrival();
    }

    // 2. Worker threads consume and allocate
    const availableWorker = this.workerThreads.find(w => w.status === 'IDLE');
    if (availableWorker && this.boundedBuffer.count > 0) {
      await this.processNextAdmission(availableWorker.id);
    }

    // 3. Random discharge of stable patient with probability 20%
    if (Math.random() < 0.25) {
      const occupiedBeds = this.beds.filter(b => b.status === 'OCCUPIED');
      if (occupiedBeds.length > 5) {
        const randomBed = occupiedBeds[Math.floor(Math.random() * occupiedBeds.length)];
        await this.dischargeBed(randomBed.id);
      }
    }
  }

  logEvent(type, message) {
    this.eventAuditLog.unshift({
      timestamp: Date.now(),
      type,
      message
    });
    if (this.eventAuditLog.length > 50) this.eventAuditLog.pop();
  }

  getComprehensiveSnapshot() {
    const totalBeds = this.beds.length;
    const occupiedCount = this.beds.filter(b => b.status === 'OCCUPIED').length;
    const freeCount = this.beds.filter(b => b.status === 'FREE').length;
    const cleaningCount = this.beds.filter(b => b.status === 'CLEANING').length;
    const ventilatorCount = this.beds.filter(b => b.ventilatorAttached).length;

    return {
      isRunning: this.isRunning,
      simulationSpeed: this.simulationSpeed,
      synchronizationEnabled: this.synchronizationEnabled,
      doubleAllocationViolations: this.doubleAllocationViolations,
      raceConditionIncidents: [...this.raceConditionIncidents],
      overallStats: {
        totalBeds,
        occupiedCount,
        freeCount,
        cleaningCount,
        ventilatorCount,
        occupancyPercent: Number(((occupiedCount / totalBeds) * 100).toFixed(1))
      },
      wards: this.wards.map(w => {
        const wardBeds = this.beds.filter(b => b.wardId === w.id);
        const occ = wardBeds.filter(b => b.status === 'OCCUPIED').length;
        return {
          ...w,
          occupiedBeds: occ,
          availableBeds: wardBeds.length - occ,
          occupancyPercent: Number(((occ / wardBeds.length) * 100).toFixed(1))
        };
      }),
      beds: this.beds.map(b => ({ ...b })),
      workerThreads: this.workerThreads.map(w => ({ ...w })),
      mutex: {
        isLocked: this.bedMutex.isLocked(),
        owner: this.bedMutex.getOwner(),
        waitingQueue: this.bedMutex.getQueue(),
        contentionCount: this.bedMutex.contentionCount
      },
      rwLock: this.rwLock.getSnapshot(),
      boundedBuffer: this.boundedBuffer.getSnapshot(),
      bankers: this.bankers.getSnapshot(),
      memoryManager: this.memoryManager.getSnapshot(),
      mmu: this.mmu.getSnapshot(),
      scheduler: this.scheduler.getSnapshot(),
      eventAuditLog: [...this.eventAuditLog]
    };
  }
}

// Global Singleton instance for application access
export const hospitalEngine = new HospitalSimulationEngine();
