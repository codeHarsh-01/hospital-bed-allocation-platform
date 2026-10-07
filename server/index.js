/**
 * MedOS Industrial Backend API Server
 * Node.js + Express REST API executing Operating System Concurrency,
 * Deadlock Avoidance, and Memory Management algorithms.
 */

import express from 'express';
import cors from 'cors';
import { HospitalSimulationEngine } from '../src/os/simulation/HospitalSimulationEngine.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize Server-side OS Simulation Engine
const engine = new HospitalSimulationEngine();
engine.start();

console.log('Hospital Simulation Engine started on backend.');

// 1. Health & Status
app.get('/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'MedOS Hospital Bed Allocation API Core',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    activeThreads: engine.workerThreads.length
  });
});

app.get('/api/status', (req, res) => {
  res.json(engine.getComprehensiveSnapshot());
});

// 2. Bed Inventory & Readers-Writers Lock Read
app.get('/api/beds', async (req, res) => {
  const readerId = req.query.readerId || `HTTP-Reader-${Date.now()}`;
  const beds = await engine.queryBedStatus(readerId);
  res.json({
    readerId,
    timestamp: Date.now(),
    totalBeds: beds.length,
    rwLockState: engine.rwLock.getSnapshot(),
    beds
  });
});

// 3. Producer-Consumer Ingress
app.post('/api/triage/produce', async (req, res) => {
  try {
    const patientData = req.body;
    const patient = await engine.producePatientArrival(patientData);
    res.status(201).json({
      success: true,
      message: `Patient ${patient.id} queued in Bounded Buffer.`,
      patient,
      boundedBufferSnapshot: engine.boundedBuffer.getSnapshot()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/admissions/consume', async (req, res) => {
  try {
    const workerId = req.body.workerId || 'TH-01';
    const result = await engine.processNextAdmission(workerId);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Bounded buffer is currently empty.' });
    }
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Discharge Bed
app.post('/api/beds/:id/discharge', async (req, res) => {
  const bedId = parseInt(req.params.id, 10);
  const success = await engine.dischargeBed(bedId);
  if (!success) {
    return res.status(400).json({ success: false, message: `Bed #${bedId} is not currently occupied.` });
  }
  res.json({ success: true, message: `Bed #${bedId} patient discharged and bed marked for sanitization.` });
});

// 5. Concurrency & Race Condition Laboratory
app.post('/api/concurrency/toggle-sync', (req, res) => {
  engine.synchronizationEnabled = !engine.synchronizationEnabled;
  res.json({
    synchronizationEnabled: engine.synchronizationEnabled,
    message: `Mutex protection is now ${engine.synchronizationEnabled ? 'ENABLED' : 'DISABLED'}`
  });
});

app.post('/api/concurrency/stress-test', async (req, res) => {
  const count = parseInt(req.body.count || 8, 10);
  await engine.triggerConcurrentStressTest(count);
  res.json({
    success: true,
    requestsFired: count,
    synchronizationEnabled: engine.synchronizationEnabled,
    doubleAllocationViolations: engine.doubleAllocationViolations,
    incidents: engine.raceConditionIncidents
  });
});

// 6. Banker's Algorithm (Deadlock Avoidance)
app.get('/api/bankers', (req, res) => {
  res.json(engine.bankers.getSnapshot());
});

app.post('/api/bankers/evaluate', (req, res) => {
  const { patientIndex, requestVector } = req.body;
  if (patientIndex === undefined || !Array.isArray(requestVector)) {
    return res.status(400).json({ error: 'patientIndex and requestVector array required' });
  }
  const result = engine.bankers.requestResources(patientIndex, requestVector);
  res.json(result);
});

// 7. Memory Management & Partition Allocation
app.get('/api/memory', (req, res) => {
  res.json(engine.memoryManager.getSnapshot());
});

app.post('/api/memory/allocate', (req, res) => {
  const { strategy, size, groupName } = req.body;
  let result;
  if (strategy === 'FIRST_FIT') {
    result = engine.memoryManager.allocateFirstFit(size, groupName);
  } else if (strategy === 'WORST_FIT') {
    result = engine.memoryManager.allocateWorstFit(size, groupName);
  } else {
    result = engine.memoryManager.allocateBestFit(size, groupName);
  }
  res.json(result);
});

app.post('/api/memory/compact', (req, res) => {
  const result = engine.memoryManager.compactMemory();
  res.json(result);
});

// 8. Paging & Segmentation Unit (MMU)
app.post('/api/mmu/translate-segment', (req, res) => {
  const { segId, offset } = req.body;
  const result = engine.mmu.translateSegmentAddress(Number(segId), Number(offset));
  res.json(result);
});

app.post('/api/mmu/translate-page', (req, res) => {
  const { virtualPage, offset } = req.body;
  const result = engine.mmu.translatePagedAddress(Number(virtualPage), Number(offset));
  res.json(result);
});

// 9. Presets & Controls
app.post('/api/simulation/preset', (req, res) => {
  const { preset } = req.body;
  engine.applyScenarioPreset(preset);
  res.json({ success: true, activePreset: preset });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` MedOS Industrial Backend API Server Ready`);
  console.log(` Port:    ${PORT}`);
  console.log(` Health:  http://localhost:${PORT}/health`);
  console.log(` Status:  http://localhost:${PORT}/api/status`);
  console.log(` Beds:    http://localhost:${PORT}/api/beds`);
  console.log(`====================================================`);
});
