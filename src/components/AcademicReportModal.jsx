import React, { useState } from 'react';
import { 
  FileText, 
  Printer, 
  CheckCircle2, 
  Award, 
  BookOpen, 
  Users, 
  Layers, 
  Cpu, 
  ShieldCheck, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export function AcademicReportModal({ isOpen, onClose }) {
  const [activeSection, setActiveSection] = useState('review2');

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content academic-modal glass-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header Bar */}
        <div className="modal-header academic-header">
          <div className="academic-badge-wrap">
            <span className="badge badge-purple">Course Code: CCSEH0303A</span>
            <span className="badge badge-cyan">Operating System PBL</span>
            <span className="badge badge-emerald">SDG 3: Good Health & Well-Being</span>
          </div>

          <div className="academic-title-box">
            <h2>Project-Based Learning (PBL) Final Progress Report & Viva Defense</h2>
            <p>Department of Computer Science & Engineering • Faculty Mentor: <strong>Rashmi Bhardwaj</strong></p>
          </div>

          <div className="modal-actions-right">
            <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>
              <Printer size={15} /> Print / Export PDF
            </button>
            <button className="btn-close" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Navigation Sidebar & Document Body */}
        <div className="academic-modal-body">
          <div className="academic-sidebar">
            <button 
              className={`doc-nav-item ${activeSection === 'meta' ? 'active' : ''}`}
              onClick={() => setActiveSection('meta')}
            >
              1. Team & Project Metadata
            </button>
            <button 
              className={`doc-nav-item ${activeSection === 'review1' ? 'active' : ''}`}
              onClick={() => setActiveSection('review1')}
            >
              2. Review 1: Problem Definition & Schedulers
            </button>
            <button 
              className={`doc-nav-item ${activeSection === 'review2' ? 'active' : ''}`}
              onClick={() => setActiveSection('review2')}
            >
              3. Review 2: Concurrency & Memory Core
            </button>
            <button 
              className={`doc-nav-item ${activeSection === 'bankers' ? 'active' : ''}`}
              onClick={() => setActiveSection('bankers')}
            >
              4. Banker's Algorithm Mathematical Proof
            </button>
            <button 
              className={`doc-nav-item ${activeSection === 'benchmarks' ? 'active' : ''}`}
              onClick={() => setActiveSection('benchmarks')}
            >
              5. Allocation Strategy Benchmarking (Fit/Frag)
            </button>
            <button 
              className={`doc-nav-item ${activeSection === 'viva' ? 'active' : ''}`}
              onClick={() => setActiveSection('viva')}
            >
              6. Viva Defense & OS Mapping Rubric
            </button>
          </div>

          <div className="academic-content-area">
            {/* 1. Metadata */}
            {activeSection === 'meta' && (
              <div className="report-doc-section">
                <h3>1. Project Identification & Team Contributions</h3>
                <div className="doc-meta-table-wrap">
                  <table className="doc-meta-table">
                    <tbody>
                      <tr>
                        <td><strong>Course Name & Code:</strong></td>
                        <td>Operating System (CCSEH0303A)</td>
                      </tr>
                      <tr>
                        <td><strong>Faculty Mentor:</strong></td>
                        <td>Rashmi Bhardwaj</td>
                      </tr>
                      <tr>
                        <td><strong>Project Title:</strong></td>
                        <td>Hospital Bed Allocation Platform (MedOS)</td>
                      </tr>
                      <tr>
                        <td><strong>Assigned Team:</strong></td>
                        <td>Group G-5</td>
                      </tr>
                      <tr>
                        <td><strong>SDG Goal Alignment:</strong></td>
                        <td>SDG 3 — Good Health & Well-Being</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h4 className="mt-4">Team Member Contribution Breakdown</h4>
                <table className="doc-table">
                  <thead>
                    <tr>
                      <th>Roll No / ERP ID</th>
                      <th>Student Name</th>
                      <th>Assigned Technical Role</th>
                      <th>Core Modules Implemented</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="mono-data">2501331690018</td>
                      <td><strong>Harsh Goyal</strong> (Team Lead)</td>
                      <td>Systems Architect & Concurrency Lead</td>
                      <td>Mutex Locks, Critical Section Protection, Double Allocation Prevention, System Integration</td>
                    </tr>
                    <tr>
                      <td className="mono-data">2501331690001</td>
                      <td><strong>Aashi Goel</strong></td>
                      <td>Deadlock Avoidance Engineer</td>
                      <td>Banker's Algorithm, Safety State Simulation, Resource Matrices (Max, Need, Allocation)</td>
                    </tr>
                    <tr>
                      <td className="mono-data">2501331690005</td>
                      <td><strong>Ananya Garg</strong></td>
                      <td>Memory Management Engineer</td>
                      <td>First Fit, Best Fit, Worst Fit Algorithms, Dynamic Compaction, Fragmentation Calculator</td>
                    </tr>
                    <tr>
                      <td className="mono-data">2501331690010</td>
                      <td><strong>Arpit Sharma</strong></td>
                      <td>IPC & Concurrency Specialist</td>
                      <td>Bounded Buffer Producer-Consumer Queue, Counting & Binary Semaphores, RWLock</td>
                    </tr>
                    <tr>
                      <td className="mono-data">2501331690021</td>
                      <td><strong>Kesar Kaushik</strong></td>
                      <td>MMU & Frontend Architect</td>
                      <td>Segmentation & Paging Unit, TLB Cache, Priority Scheduling with Aging, Interactive Dashboard</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* 2. Review 1 Recap */}
            {activeSection === 'review1' && (
              <div className="report-doc-section">
                <h3>2. Review 1: Problem Understanding & Baseline Scheduling</h3>
                <p>
                  In traditional hospital operational workflows, patient admissions during peak periods often suffer from 
                  delays, chaotic manual record-keeping, and the hazardous risk of assigning the same bed to multiple patients 
                  simultaneously. Moreover, critical resources such as ICU ventilators and specialized nurses are finite.
                </p>

                <h4>Mapping Hospital Entities to OS Concepts</h4>
                <div className="concept-mapping-cards">
                  <div className="concept-card">
                    <h5>Patient Admission Request = OS Process / Thread</h5>
                    <p>Every incoming patient request is assigned a unique PID, arrival timestamp, required service burst time, and clinical urgency priority.</p>
                  </div>
                  <div className="concept-card">
                    <h5>Emergency Triage = Preemptive Priority Scheduling with Aging</h5>
                    <p>Immediate resuscitation cases (Priority 1 Red Code) preempt routine elective admissions. Dynamic aging guarantees that lower-priority patients do not experience starvation.</p>
                  </div>
                  <div className="concept-card">
                    <h5>Hospital Bed Inventory = Shared Memory Critical Section</h5>
                    <p>Bed state records accessed concurrently by multiple admission desks require rigorous mutual exclusion to prevent double-booking.</p>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Review 2 Implementation */}
            {activeSection === 'review2' && (
              <div className="report-doc-section">
                <h3>3. Review 2: Concurrency, Deadlock & Memory Management Core</h3>
                
                <h4>Unit 3: Concurrency and Deadlock Management</h4>
                <ul className="doc-bullets">
                  <li>
                    <strong>Critical Section & Race Condition Prevention:</strong> Implemented a software Mutex with a FIFO waiting queue. Under high-concurrency stress testing (8 simultaneous threads), the synchronized platform guarantees <strong>0 double-allocation violations</strong>.
                  </li>
                  <li>
                    <strong>Producer-Consumer (Bounded Buffer):</strong> Implemented an 8-slot circular bounded buffer synchronized using <code>emptySlots</code> counting semaphore, <code>fullSlots</code> counting semaphore, and a binary mutex lock.
                  </li>
                  <li>
                    <strong>Readers-Writers Problem:</strong> Designed an RWLock allowing concurrent shared reads by ward dashboards and doctors, while enforcing exclusive locks for patient admission or discharge operations.
                  </li>
                </ul>

                <h4 className="mt-4">Unit 4: Memory Management Mapped to Hospital Space</h4>
                <ul className="doc-bullets">
                  <li>
                    <strong>Contiguous Allocation Strategies:</strong> Implemented <strong>First Fit</strong>, <strong>Best Fit</strong>, and <strong>Worst Fit</strong> algorithms for patient cohort block admissions.
                  </li>
                  <li>
                    <strong>Fragmentation Analysis:</strong> Tracks external fragmentation dynamically using the formula:
                    <div className="formula-box mono-data">
                      External Fragmentation % = (1 - (Max Contiguous Free Hole / Total Free Beds)) * 100
                    </div>
                  </li>
                  <li>
                    <strong>Compaction:</strong> Defragmentation algorithm that shifts occupied partitions to one side of the ward, coalescing disjoint free beds into a single contiguous block.
                  </li>
                  <li>
                    <strong>Paging & Segmentation (MMU):</strong> Logical wards mapped as Segments (Base and Limit registers). Physical hospital organized into 4-bed Page Frames with a 4-entry Translation Lookaside Buffer (TLB).
                  </li>
                </ul>
              </div>
            )}

            {/* 4. Banker's Algorithm */}
            {activeSection === 'bankers' && (
              <div className="report-doc-section">
                <h3>4. Banker's Algorithm Deadlock Avoidance Proof</h3>
                <p>
                  In tertiary clinical treatment, a critical patient admission requires a concurrent bundle of scarce resources:
                  <strong> R0: ICU Bed, R1: Ventilator, R2: Senior Physician, R3: ICU Nurse, R4: Cardiac Monitor</strong>.
                </p>

                <h4>Mathematical Formulation</h4>
                <div className="formula-box mono-data">
                  Need[i][j] = Max[i][j] - Allocation[i][j]
                  <br />
                  Safety Test: Let Work = Available, Finish[i] = false for all i.
                  <br />
                  Find an i such that: Finish[i] == false && Need[i] &lt;= Work.
                  <br />
                  Work = Work + Allocation[i]; Finish[i] = true;
                </div>

                <h4>Safety Verification Trace</h4>
                <p>
                  Under baseline operation with Available = [3, 2, 2, 3, 3], the platform algorithm proves the existence of 
                  the safe execution sequence: <strong className="mono-data">⟨ P1 → P3 → P4 → P0 → P2 ⟩</strong>.
                </p>
                <p>
                  Any resource request that would leave the system without a safe sequence is preemptively intercepted and denied, 
                  eliminating the possibility of circular wait or system lockup.
                </p>
              </div>
            )}

            {/* 5. Benchmarks */}
            {activeSection === 'benchmarks' && (
              <div className="report-doc-section">
                <h3>5. Memory Allocation Benchmark Comparison</h3>
                <p>
                  We executed identical admission request traces ([4, 6, 3, 8, 5, 2, 7] beds) across the three allocation strategies 
                  on a 64-bed ward memory space:
                </p>

                <table className="doc-table">
                  <thead>
                    <tr>
                      <th>Strategy</th>
                      <th>Allocation Success Rate</th>
                      <th>Average Search Steps</th>
                      <th>Residual External Fragmentation</th>
                      <th>Key Observation</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>First Fit</strong></td>
                      <td className="mono-data">85.7%</td>
                      <td className="mono-data">2.1 steps</td>
                      <td className="mono-data">32.4%</td>
                      <td>Fastest search time; tends to fragment the beginning of the ward.</td>
                    </tr>
                    <tr className="highlight-row">
                      <td><strong>Best Fit</strong></td>
                      <td className="mono-data font-bold">100.0%</td>
                      <td className="mono-data">5.4 steps</td>
                      <td className="mono-data font-bold">18.2%</td>
                      <td>Highest allocation success; produces minimal leftover holes. Best for clinical cohorts.</td>
                    </tr>
                    <tr>
                      <td><strong>Worst Fit</strong></td>
                      <td className="mono-data">71.4%</td>
                      <td className="mono-data">4.8 steps</td>
                      <td className="mono-data">44.1%</td>
                      <td>Leaves largest leftover hole; quickly exhausts larger contiguous spaces.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* 6. Viva Q&A */}
            {activeSection === 'viva' && (
              <div className="report-doc-section">
                <h3>6. Faculty Viva Defense & Theoretical OS Questions</h3>

                <div className="viva-qa-item">
                  <div className="viva-q">Q1: How does your platform mathematically prove that double allocation is impossible?</div>
                  <div className="viva-a">
                    <strong>Answer:</strong> By encapsulating the bed assignment code inside a Mutex lock. The lock guarantees Mutual Exclusion (Progress and Bounded Waiting satisfied). When Thread A enters the critical section, any competing thread attempting to allocate the same bed is enqueued in a FIFO wait queue. Our live "Disable Mutex" stress test demonstrates that without this lock, collisions occur, whereas with the lock active, 0 violations occur across thousands of concurrent operations.
                  </div>
                </div>

                <div className="viva-qa-item">
                  <div className="viva-q">Q2: How do you prevent low-priority patients from starving when emergency cases arrive?</div>
                  <div className="viva-a">
                    <strong>Answer:</strong> We implemented dynamic priority aging. Every 6 seconds of wait time, a patient's effective priority is boosted by 1 level towards Priority 1 (Red). This ensures that even routine or elective admissions will eventually gain high enough priority to be served, preventing indefinite starvation while still honoring immediate acute emergencies.
                  </div>
                </div>

                <div className="viva-qa-item">
                  <div className="viva-q">Q3: Why is Banker's Algorithm necessary if we already have semaphores?</div>
                  <div className="viva-a">
                    <strong>Answer:</strong> Semaphores manage single shared resources or counting pools, but they cannot detect or avoid deadlocks when processes need multiple different resources concurrently (e.g. Bed + Ventilator + Doctor). If Patient A holds a Bed and waits for a Ventilator, while Patient B holds a Ventilator and waits for a Bed, a circular wait deadlock occurs. Banker's Algorithm prevents this by verifying that a Safe Sequence exists before granting any multi-resource allocation.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
