/**
 * Operating System Deadlock Avoidance: Banker's Algorithm (Edsger Dijkstra)
 * Maps to Unit 3: Multi-Resource Deadlock Prevention & Avoidance
 * 
 * In a tertiary hospital, critical admissions require bundles of scarce resources:
 * [Bed, Ventilator, Senior Physician, ICU Nurse, Cardiac Monitor]
 * 
 * Before granting any resource bundle, the Banker's Safety Algorithm simulates
 * state transition to guarantee that circular wait and deadlock are impossible.
 */

export class BankersAlgorithm {
  constructor(resourceTypes = null, initialAvailable = null) {
    this.resourceNames = resourceTypes || [
      'ICU Bed',
      'Ventilator',
      'Physician',
      'ICU Nurse',
      'Cardiac Monitor'
    ];

    this.numResources = this.resourceNames.length;

    // Total system resources
    this.totalSystemResources = [10, 6, 8, 12, 10];

    // Default 5 patient cases with clinical demands
    this.patients = [
      { id: 'P0', name: 'Rohan Sharma (Polytrauma)', condition: 'Critical' },
      { id: 'P1', name: 'Meera Patel (ARDS / Sepsis)', condition: 'Severe' },
      { id: 'P2', name: 'Vikram Singh (Post-CABG)', condition: 'Intensive' },
      { id: 'P3', name: 'Anita Das (Respiratory Failure)', condition: 'Critical' },
      { id: 'P4', name: 'Kabir Khan (Neuro Emergency)', condition: 'Guarded' }
    ];

    // Current Allocation Matrix [5 x 5]
    this.allocation = [
      [1, 1, 1, 2, 1], // P0
      [2, 0, 1, 2, 1], // P1
      [2, 1, 1, 2, 2], // P2
      [1, 1, 1, 1, 1], // P3
      [1, 1, 1, 2, 1]  // P4
    ];

    // Max Demand Matrix [5 x 5]
    this.max = [
      [3, 2, 2, 4, 3], // P0
      [3, 2, 2, 4, 2], // P1
      [4, 2, 3, 4, 3], // P2
      [2, 2, 2, 2, 2], // P3
      [3, 2, 2, 3, 2]  // P4
    ];

    // Available Vector
    this.available = initialAvailable || [3, 2, 2, 3, 3];

    // Audit log
    this.evaluationHistory = [];
  }

  /**
   * Calculate Need Matrix: Need[i][j] = Max[i][j] - Allocation[i][j]
   */
  getNeedMatrix() {
    const need = [];
    for (let i = 0; i < this.patients.length; i++) {
      need[i] = [];
      for (let j = 0; j < this.numResources; j++) {
        need[i][j] = Math.max(0, this.max[i][j] - this.allocation[i][j]);
      }
    }
    return need;
  }

  /**
   * Run Dijkstra's Safety Algorithm.
   * Returns { isSafe, safeSequence, traceSteps, workMatrix }
   */
  checkSafety(customAvailable = null, customAllocation = null, customNeed = null) {
    const available = customAvailable ? [...customAvailable] : [...this.available];
    const allocation = customAllocation ? customAllocation.map(row => [...row]) : this.allocation.map(row => [...row]);
    const need = customNeed ? customNeed.map(row => [...row]) : this.getNeedMatrix();
    const numPatients = this.patients.length;

    const work = [...available];
    const finish = new Array(numPatients).fill(false);
    const safeSequence = [];
    const traceSteps = [];

    traceSteps.push({
      step: 0,
      description: `Initialization: Work = [${work.join(', ')}], Finish = [${finish.map(f => f ? 'T' : 'F').join(', ')}]`,
      work: [...work],
      finish: [...finish]
    });

    let count = 0;
    while (count < numPatients) {
      let found = false;

      for (let i = 0; i < numPatients; i++) {
        if (!finish[i]) {
          // Check if Need[i] <= Work
          let canAllocate = true;
          for (let j = 0; j < this.numResources; j++) {
            if (need[i][j] > work[j]) {
              canAllocate = false;
              break;
            }
          }

          if (canAllocate) {
            // Patient i can finish!
            // Work = Work + Allocation[i]
            const prevWork = [...work];
            for (let j = 0; j < this.numResources; j++) {
              work[j] += allocation[i][j];
            }
            finish[i] = true;
            safeSequence.push(this.patients[i].id);
            found = true;
            count++;

            traceSteps.push({
              step: count,
              patientId: this.patients[i].id,
              patientName: this.patients[i].name,
              description: `Patient ${this.patients[i].id} satisfied! Need: [${need[i].join(', ')}] <= Work: [${prevWork.join(', ')}]. Released Allocation: [${allocation[i].join(', ')}]. New Work: [${work.join(', ')}]`,
              work: [...work],
              finish: [...finish]
            });
            break; // Restart loop to check next eligible candidate
          }
        }
      }

      // If no patient could be satisfied in this pass, system is in UNSAFE state
      if (!found) {
        const deadlockedPatients = this.patients.filter((_, idx) => !finish[idx]).map(p => p.id);
        traceSteps.push({
          step: count + 1,
          isDeadlock: true,
          description: `Deadlock Avoidance Alert! No remaining patient can be safely completed. Stalled Processes: { ${deadlockedPatients.join(', ')} }. State is UNSAFE.`,
          work: [...work],
          finish: [...finish]
        });
        return {
          isSafe: false,
          safeSequence: [],
          traceSteps,
          stalledPatients: deadlockedPatients,
          work
        };
      }
    }

    return {
      isSafe: true,
      safeSequence,
      traceSteps,
      work
    };
  }

  /**
   * Evaluate a Resource Request from Patient P_i
   * @param {number} patientIndex 
   * @param {number[]} requestVector 
   */
  requestResources(patientIndex, requestVector) {
    const patient = this.patients[patientIndex];
    const need = this.getNeedMatrix();
    const result = {
      patientId: patient.id,
      patientName: patient.name,
      request: [...requestVector],
      timestamp: Date.now(),
      status: 'PENDING',
      reason: ''
    };

    // Rule 1: Request[j] <= Need[i][j]
    for (let j = 0; j < this.numResources; j++) {
      if (requestVector[j] > need[patientIndex][j]) {
        result.status = 'ERROR_EXCEEDED_MAX';
        result.reason = `Request exceeds declared maximum need for ${this.resourceNames[j]} (${requestVector[j]} > ${need[patientIndex][j]}). Process aborted.`;
        this.evaluationHistory.unshift(result);
        return result;
      }
    }

    // Rule 2: Request[j] <= Available[j]
    for (let j = 0; j < this.numResources; j++) {
      if (requestVector[j] > this.available[j]) {
        result.status = 'WAIT_INSUFFICIENT';
        result.reason = `Insufficient ${this.resourceNames[j]} available (${this.available[j]} available < ${requestVector[j]} requested). Patient ${patient.id} must wait.`;
        this.evaluationHistory.unshift(result);
        return result;
      }
    }

    // Pretend Allocation (Trial state)
    const trialAvailable = [...this.available];
    const trialAllocation = this.allocation.map(r => [...r]);
    const trialNeed = need.map(r => [...r]);

    for (let j = 0; j < this.numResources; j++) {
      trialAvailable[j] -= requestVector[j];
      trialAllocation[patientIndex][j] += requestVector[j];
      trialNeed[patientIndex][j] -= requestVector[j];
    }

    // Run Safety Algorithm on trial state
    const safetyCheck = this.checkSafety(trialAvailable, trialAllocation, trialNeed);

    if (safetyCheck.isSafe) {
      // Commit the allocation!
      this.available = trialAvailable;
      this.allocation = trialAllocation;

      result.status = 'GRANTED_SAFE';
      result.safeSequence = safetyCheck.safeSequence;
      result.reason = `Safe state confirmed. Safe Sequence exists: <${safetyCheck.safeSequence.join(' -> ')}>. Resources successfully allocated!`;
      result.trace = safetyCheck.traceSteps;
    } else {
      // Rollback trial allocation
      result.status = 'REJECTED_UNSAFE';
      result.reason = `Unsafe State Detected! Granting this request could cause cyclic dependency deadlock among processes {${safetyCheck.stalledPatients?.join(', ')}}. Request safely denied.`;
      result.trace = safetyCheck.traceSteps;
    }

    this.evaluationHistory.unshift(result);
    if (this.evaluationHistory.length > 20) this.evaluationHistory.pop();
    return result;
  }

  /**
   * Release resources held by a discharged patient
   */
  releaseResources(patientIndex) {
    const patient = this.patients[patientIndex];
    const released = [...this.allocation[patientIndex]];

    for (let j = 0; j < this.numResources; j++) {
      this.available[j] += this.allocation[patientIndex][j];
      this.allocation[patientIndex][j] = 0;
    }

    const logEntry = {
      patientId: patient.id,
      patientName: patient.name,
      timestamp: Date.now(),
      status: 'RELEASED',
      released,
      newAvailable: [...this.available],
      reason: `Patient ${patient.id} discharged. All held resources safely returned to available pool.`
    };
    this.evaluationHistory.unshift(logEntry);
    return logEntry;
  }

  getSnapshot() {
    return {
      resourceNames: [...this.resourceNames],
      totalSystemResources: [...this.totalSystemResources],
      patients: this.patients.map((p, idx) => ({
        ...p,
        allocation: [...this.allocation[idx]],
        max: [...this.max[idx]],
        need: this.getNeedMatrix()[idx]
      })),
      available: [...this.available],
      safety: this.checkSafety(),
      recentEvaluations: [...this.evaluationHistory]
    };
  }
}
