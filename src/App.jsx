import React, { useState, useEffect, useCallback } from 'react';
import { hospitalEngine } from './os/simulation/HospitalSimulationEngine.js';
import { Header } from './components/Header.jsx';
import { WardFloorplan } from './components/WardFloorplan.jsx';
import { CriticalSectionPanel } from './components/CriticalSectionPanel.jsx';
import { ProducerConsumerPanel } from './components/ProducerConsumerPanel.jsx';
import { BankersDeadlockPanel } from './components/BankersDeadlockPanel.jsx';
import { MemoryAllocationPanel } from './components/MemoryAllocationPanel.jsx';
import { PagingSegmentationPanel } from './components/PagingSegmentationPanel.jsx';
import { AcademicReportModal } from './components/AcademicReportModal.jsx';
import './App.css';

export function App() {
  const [snapshot, setSnapshot] = useState(() => hospitalEngine.getComprehensiveSnapshot());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Sync state from engine at 60Hz or periodic interval for smooth animations
  const refreshSnapshot = useCallback(() => {
    setSnapshot(hospitalEngine.getComprehensiveSnapshot());
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshSnapshot();
    }, 400);
    return () => clearInterval(interval);
  }, [refreshSnapshot]);

  // Master Engine Playback Controls
  const handleTogglePlay = () => {
    if (hospitalEngine.isRunning) {
      hospitalEngine.stop();
    } else {
      hospitalEngine.start();
    }
    refreshSnapshot();
  };

  const handleStep = async () => {
    await hospitalEngine.simulationTick();
    refreshSnapshot();
  };

  const handleSetSpeed = (speed) => {
    hospitalEngine.setSpeed(speed);
    refreshSnapshot();
  };

  const handleApplyPreset = (presetName) => {
    hospitalEngine.applyScenarioPreset(presetName);
    refreshSnapshot();
  };

  // Triage & Bed Actions
  const handleAdmitPatient = async (patientData) => {
    await hospitalEngine.producePatientArrival(patientData);
    refreshSnapshot();
  };

  const handleDischargeBed = async (bedId) => {
    await hospitalEngine.dischargeBed(bedId);
    refreshSnapshot();
  };

  // Concurrency & Mutex Actions
  const handleToggleSync = () => {
    hospitalEngine.synchronizationEnabled = !hospitalEngine.synchronizationEnabled;
    hospitalEngine.logEvent(
      'SYNC_MODE_TOGGLED', 
      `Operating System Synchronization is now ${hospitalEngine.synchronizationEnabled ? 'ENABLED (Safe)' : 'DISABLED (Race Hazard)'}`
    );
    refreshSnapshot();
  };

  const handleRunStressTest = async (count) => {
    await hospitalEngine.triggerConcurrentStressTest(count);
    refreshSnapshot();
  };

  // Producer-Consumer Manual Actions
  const handleProduceOne = async () => {
    await hospitalEngine.producePatientArrival();
    refreshSnapshot();
  };

  const handleConsumeOne = async () => {
    await hospitalEngine.processNextAdmission();
    refreshSnapshot();
  };

  return (
    <div className="medos-root">
      {/* Top Universal OS Header */}
      <Header 
        snapshot={snapshot}
        onTogglePlay={handleTogglePlay}
        onStep={handleStep}
        onSetSpeed={handleSetSpeed}
        onApplyPreset={handleApplyPreset}
        onOpenReport={() => setIsReportOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Tabbed Views */}
      <main className="medos-main-body">
        {activeTab === 'dashboard' && (
          <WardFloorplan 
            snapshot={snapshot}
            onDischargeBed={handleDischargeBed}
            onAdmitPatient={handleAdmitPatient}
          />
        )}

        {activeTab === 'concurrency' && (
          <CriticalSectionPanel 
            snapshot={snapshot}
            onToggleSync={handleToggleSync}
            onRunStressTest={handleRunStressTest}
          />
        )}

        {activeTab === 'producer-consumer' && (
          <ProducerConsumerPanel 
            snapshot={snapshot}
            onProduceOne={handleProduceOne}
            onConsumeOne={handleConsumeOne}
          />
        )}

        {activeTab === 'bankers' && (
          <BankersDeadlockPanel 
            bankersInstance={hospitalEngine.bankers}
            onRefresh={refreshSnapshot}
          />
        )}

        {activeTab === 'memory' && (
          <MemoryAllocationPanel 
            memoryInstance={hospitalEngine.memoryManager}
            onRefresh={refreshSnapshot}
          />
        )}

        {activeTab === 'paging' && (
          <PagingSegmentationPanel 
            mmuInstance={hospitalEngine.mmu}
            onRefresh={refreshSnapshot}
          />
        )}
      </main>

      {/* Persistent Status Bar at Bottom */}
      <footer className="medos-footer-status">
        <div className="footer-left">
          <span className="footer-pill">
            <span className={`pulse-dot ${snapshot.isRunning ? 'pulse-dot-green' : 'pulse-dot-red'}`}></span>
            Core Daemon: <strong>{snapshot.isRunning ? 'ACTIVE (Simulation Running)' : 'PAUSED (Step Mode)'}</strong>
          </span>
          <span className="footer-pill">
            Mutex: <strong style={{ color: snapshot.synchronizationEnabled ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
              {snapshot.synchronizationEnabled ? 'PROTECTED' : 'DISABLED (HAZARD)'}
            </strong>
          </span>
          <span className="footer-pill">
            Double Allocations: <strong>{snapshot.doubleAllocationViolations}</strong>
          </span>
        </div>

        <div className="footer-center">
          <span className="footer-audit-preview mono-data">
            Latest OS Event: {snapshot.eventAuditLog[0]?.message || 'System initialized.'}
          </span>
        </div>

        <div className="footer-right">
          <span>CCSEH0303A • Group G-5 • Rashmi Bhardwaj</span>
        </div>
      </footer>

      {/* Academic PBL Documentation & Viva Defense Modal */}
      <AcademicReportModal 
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />
    </div>
  );
}

export default App;
