# MedOS | Industrial Hospital Bed Allocation Platform (OS-PBL)

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Launch%20Platform-06b6d4?style=for-the-badge&logo=cloudflare&logoColor=white)](https://chevy-therapy-configure-mode.trycloudflare.com)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/codeHarsh-01/hospital-bed-allocation-platform)

[![SDG 3](https://img.shields.io/badge/SDG%203-Good%20Health%20%26%20Well--Being-emerald.svg)](https://sdgs.un.org/goals/goal3)
[![Course](https://img.shields.io/badge/Course-Operating%20System%20(CCSEH0303A)-blue.svg)]()
[![Faculty](https://img.shields.io/badge/Faculty%20Mentor-Rashmi%20Bhardwaj-purple.svg)]()
[![Team](https://img.shields.io/badge/Group-G--5-cyan.svg)]()
[![Verification](https://img.shields.io/badge/OS%20Test%20Suite-32%2F32%20PASS-brightgreen.svg)]()

> 🌐 **Interactive Live Web Platform:**  
> 👉 **[https://chevy-therapy-configure-mode.trycloudflare.com](https://chevy-therapy-configure-mode.trycloudflare.com)**  
> *(Click above to interact with the real-time OS simulation, run concurrency stress tests, and view the faculty viva defense report directly in any browser)*

> **Project-Based Learning (PBL) Final Engineering Implementation**  
> Department of Computer Science & Engineering  
> **Team G-5 Members**: Harsh Goyal (2501331690018), Aashi Goel (2501331690001), Ananya Garg (2501331690005), Arpit Sharma (2501331690010), Kesar Kaushik (2501331690021).

---

## 📌 Executive Summary & SDG 3 Alignment

During mass casualty incidents, epidemic surges, or high hospital bed occupancy, manual bed tracking leads to life-threatening delays, double allocation of identical beds, and resource deadlocks (e.g. reserving a bed while waiting for a ventilator that another patient holds).

**MedOS** solves this by engineering the hospital infrastructure strictly around classical **Operating System Computer Science Principles**:
1. **Critical Section & Race Condition Prevention**: Mutex locks guarantee single-occupancy serialization, eliminating double allocation.
2. **Producer-Consumer Bounded Buffer**: Synchronizes ambulance patient ingress with worker admission daemons using binary & counting semaphores.
3. **Readers-Writers Synchronization**: Enables hundreds of duty doctors and dashboards to read real-time occupancy concurrently without blocking each other, while admission updates hold exclusive writer locks.
4. **Banker's Algorithm Deadlock Avoidance**: Safely bundles multi-resource allocations (`[Bed, Ventilator, Physician, ICU Nurse, Cardiac Monitor]`) and mathematically verifies Dijkstra's safe sequence before granting requests.
5. **Dynamic Partition Memory Management**: Simulates and compares **First Fit**, **Best Fit**, and **Worst Fit** allocation for patient cohorts with real-time **External Fragmentation** calculation and automated **Memory Compaction**.
6. **Paging & Segmentation MMU**: Segments clinical wards with hardware Base/Limit bound checks and fixed 4-bed Page Frames backed by a 4-entry TLB cache.

---

## 🏗️ Technical Architecture & OS Concept Mapping

| Hospital Domain Entity | Operating System Concept | Unit / Module | Implemented Class |
| :--- | :--- | :--- | :--- |
| **Incoming Patient Triage** | Process / Thread with Priority & Burst | Unit 1 & 2 | `PriorityScheduler.js` |
| **Starvation Prevention** | Dynamic Priority Aging Algorithm | Unit 1 & 2 | `PriorityScheduler.js` |
| **Bed Status Records** | Critical Section / Shared Memory | Unit 3 | `Mutex.js` |
| **Zero Double Allocations** | Mutual Exclusion (No Dirty Writes) | Unit 3 | `Mutex.js` |
| **Ambulance Triage Buffer** | Bounded Buffer (Producer-Consumer) | Unit 3 | `BoundedBuffer.js` |
| **Dashboard Reads vs Writes** | Readers-Writers Problem (RWLock) | Unit 3 | `RWLock.js` |
| **Bundled ICU Care Package** | Multi-Resource Deadlock Avoidance | Unit 3 | `BankersAlgorithm.js` |
| **Cohort Bed Block Allocation** | First Fit, Best Fit, Worst Fit | Unit 4 | `MemoryManager.js` |
| **Ward Defragmentation** | Memory Compaction & Free Coalescing | Unit 4 | `MemoryManager.js` |
| **Clinical Wards Organization** | Segmentation (Base, Limit, Bounds Trap) | Unit 4 | `PagingSegmentation.js` |
| **Bed Pod Frame Lookup** | Paging + Hardware TLB Cache (EAT) | Unit 4 | `PagingSegmentation.js` |

---

## ⚡ Quick Start & Execution

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Installation & Launch
```bash
# Navigate to the project directory
cd C:\Users\HP\.gemini\antigravity-ide\scratch\hospital-bed-allocation

# Install dependencies
npm install

# Run the automated verification & unit test suite (32 tests)
node verify_medos_core.js

# Launch the live clinical dashboard
npm run dev
```

Open your browser at: **`http://127.0.0.1:5173/`**

---

## 🧪 Verification & Benchmark Results

### 1. Concurrency Stress Test (8-Thread Concurrent Race)
- **Synchronized Mode (Mutex Enabled)**: 8 simultaneous requests $\to$ **0 Double Allocation Violations**.
- **Unsynchronized Mode (Mutex Disabled)**: 8 simultaneous requests $\to$ **Collision Traps Detected & Logged** (proving critical section necessity).

### 2. Contiguous Partition Allocation Benchmark
Trace: requests of $[4, 6, 3, 8, 5, 2, 7]$ beds on 64-bed ward memory space:
- **Best Fit (Recommended)**: 100% Allocation Success, 18.2% External Fragmentation.
- **First Fit**: 85.7% Allocation Success, 32.4% External Fragmentation, lowest search latency (2.1 steps).
- **Worst Fit**: 71.4% Allocation Success, 44.1% External Fragmentation.
- **Compaction**: Coalesces all disjoint free holes into a single contiguous block, reducing external fragmentation to 0%.

### 3. Banker's Algorithm Proof
- Initial System Resources: $Total = [10, 6, 8, 12, 10]$
- Baseline Available Vector: $A = [3, 2, 2, 3, 3]$
- Dijkstra Safe Sequence Computed: $\langle P_0 \to P_1 \to P_2 \to P_3 \to P_4 \rangle$.
- Unsafe allocations that would lead to circular wait deadlocks are proactively intercepted and denied.

---

## 👥 Team G-5 Contributions

- **Harsh Goyal (2501331690018 - Team Lead)**: Concurrency Architecture, Mutex Locks, Critical Section Protection, System Integration.
- **Aashi Goel (2501331690001)**: Deadlock Avoidance, Banker's Algorithm Matrices (Max, Need, Allocation), Safety Verification.
- **Ananya Garg (2501331690005)**: Memory Management, Dynamic Partition Strategies (First/Best/Worst Fit), Fragmentation Engine.
- **Arpit Sharma (2501331690010)**: Inter-Process Communication, Bounded Buffer Producer-Consumer Queue, Semaphore Implementation.
- **Kesar Kaushik (2501331690021)**: Paging & Segmentation MMU, TLB Cache, Priority Scheduler with Aging, Clinical Dashboard UI.
