/**
 * Operating System Memory Management: Contiguous Allocation & Fragmentation
 * Maps to Unit 4: First Fit, Best Fit, Worst Fit & Fragmentation Analysis
 * 
 * Maps physical hospital ward layouts (contiguous bed arrays) to variable-partition
 * memory management. When groups of patients (e.g. disaster trauma cohort, family group,
 * infectious quarantine cluster) arrive, they request contiguous bed blocks of size K.
 */

export class MemoryManager {
  constructor(totalBeds = 64) {
    this.totalBeds = totalBeds;
    // Initial ward partitioning into blocks
    // Block: { id, startBed, size, isAllocated, patientGroup: null, tag: 'Free' }
    this.blocks = this.createInitialLayout(totalBeds);
    this.history = [];
    this.metrics = {
      firstFitStats: { allocations: 0, failures: 0, totalSearchSteps: 0 },
      bestFitStats: { allocations: 0, failures: 0, totalSearchSteps: 0 },
      worstFitStats: { allocations: 0, failures: 0, totalSearchSteps: 0 },
    };
  }

  createInitialLayout(totalBeds) {
    // Initial realistic ward structure with some occupied and free blocks
    const layout = [
      { id: 'BLK-01', start: 0, size: 8, isAllocated: true, patientGroup: { name: 'Cardiology Cohort A', size: 8, reqSize: 8, color: '#3b82f6' } },
      { id: 'BLK-02', start: 8, size: 4, isAllocated: false, patientGroup: null },
      { id: 'BLK-03', start: 12, size: 12, isAllocated: true, patientGroup: { name: 'Post-Op Surgical Ward', size: 12, reqSize: 10, color: '#10b981' } },
      { id: 'BLK-04', start: 24, size: 6, isAllocated: false, patientGroup: null },
      { id: 'BLK-05', start: 30, size: 10, isAllocated: true, patientGroup: { name: 'Pediatric Care Unit', size: 10, reqSize: 9, color: '#f59e0b' } },
      { id: 'BLK-06', start: 40, size: 8, isAllocated: false, patientGroup: null },
      { id: 'BLK-07', start: 48, size: 6, isAllocated: true, patientGroup: { name: 'Maternity Bay', size: 6, reqSize: 6, color: '#ec4899' } },
      { id: 'BLK-08', start: 54, size: 10, isAllocated: false, patientGroup: null },
    ];
    return layout;
  }

  /**
   * Clone blocks for isolated algorithmic simulation
   */
  cloneBlocks(blocks) {
    return blocks.map(b => ({
      ...b,
      patientGroup: b.patientGroup ? { ...b.patientGroup } : null
    }));
  }

  /**
   * First Fit Allocation:
   * Allocate the FIRST hole that is big enough.
   */
  allocateFirstFit(reqSize, groupName = 'Cohort Request', customBlocks = null) {
    const blocks = customBlocks || this.blocks;
    let searchSteps = 0;
    let allocated = false;
    let allocatedBlockId = null;

    for (let i = 0; i < blocks.length; i++) {
      searchSteps++;
      const block = blocks[i];
      if (!block.isAllocated && block.size >= reqSize) {
        // Found hole! Split block if size > reqSize
        this.splitAndAssign(blocks, i, reqSize, groupName);
        allocated = true;
        allocatedBlockId = blocks[i].id;
        break;
      }
    }

    if (customBlocks === null) {
      if (allocated) {
        this.metrics.firstFitStats.allocations++;
      } else {
        this.metrics.firstFitStats.failures++;
      }
      this.metrics.firstFitStats.totalSearchSteps += searchSteps;
      this.log('FIRST_FIT', allocated, reqSize, groupName, searchSteps, allocatedBlockId);
    }

    return { success: allocated, searchSteps, blockId: allocatedBlockId, blocks };
  }

  /**
   * Best Fit Allocation:
   * Allocate the SMALLEST hole that is big enough (minimizes leftover hole).
   */
  allocateBestFit(reqSize, groupName = 'Cohort Request', customBlocks = null) {
    const blocks = customBlocks || this.blocks;
    let searchSteps = 0;
    let bestIdx = -1;
    let minHoleSize = Infinity;

    for (let i = 0; i < blocks.length; i++) {
      searchSteps++;
      const block = blocks[i];
      if (!block.isAllocated && block.size >= reqSize) {
        if (block.size < minHoleSize) {
          minHoleSize = block.size;
          bestIdx = i;
        }
      }
    }

    let allocated = false;
    let allocatedBlockId = null;

    if (bestIdx !== -1) {
      this.splitAndAssign(blocks, bestIdx, reqSize, groupName);
      allocated = true;
      allocatedBlockId = blocks[bestIdx].id;
    }

    if (customBlocks === null) {
      if (allocated) {
        this.metrics.bestFitStats.allocations++;
      } else {
        this.metrics.bestFitStats.failures++;
      }
      this.metrics.bestFitStats.totalSearchSteps += searchSteps;
      this.log('BEST_FIT', allocated, reqSize, groupName, searchSteps, allocatedBlockId);
    }

    return { success: allocated, searchSteps, blockId: allocatedBlockId, blocks };
  }

  /**
   * Worst Fit Allocation:
   * Allocate the LARGEST hole available (leaves largest remaining leftover).
   */
  allocateWorstFit(reqSize, groupName = 'Cohort Request', customBlocks = null) {
    const blocks = customBlocks || this.blocks;
    let searchSteps = 0;
    let worstIdx = -1;
    let maxHoleSize = -1;

    for (let i = 0; i < blocks.length; i++) {
      searchSteps++;
      const block = blocks[i];
      if (!block.isAllocated && block.size >= reqSize) {
        if (block.size > maxHoleSize) {
          maxHoleSize = block.size;
          worstIdx = i;
        }
      }
    }

    let allocated = false;
    let allocatedBlockId = null;

    if (worstIdx !== -1) {
      this.splitAndAssign(blocks, worstIdx, reqSize, groupName);
      allocated = true;
      allocatedBlockId = blocks[worstIdx].id;
    }

    if (customBlocks === null) {
      if (allocated) {
        this.metrics.worstFitStats.allocations++;
      } else {
        this.metrics.worstFitStats.failures++;
      }
      this.metrics.worstFitStats.totalSearchSteps += searchSteps;
      this.log('WORST_FIT', allocated, reqSize, groupName, searchSteps, allocatedBlockId);
    }

    return { success: allocated, searchSteps, blockId: allocatedBlockId, blocks };
  }

  /**
   * Split a larger free hole into an allocated block and a smaller free hole
   */
  splitAndAssign(blocks, index, reqSize, groupName) {
    const block = blocks[index];
    const originalSize = block.size;
    const colors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
    const chosenColor = colors[Math.floor(Math.random() * colors.length)];

    block.isAllocated = true;
    block.size = reqSize;
    block.patientGroup = {
      name: groupName,
      size: reqSize,
      reqSize: reqSize,
      allocatedAt: Date.now(),
      color: chosenColor
    };

    const remaining = originalSize - reqSize;
    if (remaining > 0) {
      const newFreeBlock = {
        id: `BLK-${Date.now().toString().slice(-4)}`,
        start: block.start + reqSize,
        size: remaining,
        isAllocated: false,
        patientGroup: null
      };
      blocks.splice(index + 1, 0, newFreeBlock);
    }
  }

  /**
   * Free / Discharge a block of beds
   */
  freeBlock(blockId) {
    const block = this.blocks.find(b => b.id === blockId);
    if (!block || !block.isAllocated) return false;

    const patientName = block.patientGroup?.name;
    block.isAllocated = false;
    block.patientGroup = null;

    // Coalesce adjacent free blocks
    this.coalesceAdjacentHoles(this.blocks);
    this.log('FREE_AND_COALESCE', true, block.size, `Discharged: ${patientName}`, 0, blockId);
    return true;
  }

  /**
   * Coalesce adjacent free blocks into unified contiguous holes
   */
  coalesceAdjacentHoles(blocks) {
    let i = 0;
    while (i < blocks.length - 1) {
      if (!blocks[i].isAllocated && !blocks[i + 1].isAllocated) {
        blocks[i].size += blocks[i + 1].size;
        blocks.splice(i + 1, 1);
      } else {
        i++;
      }
    }
  }

  /**
   * Memory Compaction (Defragmentation)
   * Shifts all allocated blocks to the start of the ward,
   * creating one large contiguous free block at the end.
   */
  compactMemory() {
    const allocatedBlocks = this.blocks.filter(b => b.isAllocated);
    const totalAllocatedBeds = allocatedBlocks.reduce((sum, b) => sum + b.size, 0);
    const totalFreeBeds = this.totalBeds - totalAllocatedBeds;

    let currentStart = 0;
    const newBlocks = [];

    // Reposition all allocated blocks contiguously
    for (const b of allocatedBlocks) {
      newBlocks.push({
        ...b,
        start: currentStart
      });
      currentStart += b.size;
    }

    // Add one giant consolidated free hole
    if (totalFreeBeds > 0) {
      newBlocks.push({
        id: `BLK-COMPACTED`,
        start: currentStart,
        size: totalFreeBeds,
        isAllocated: false,
        patientGroup: null
      });
    }

    const previousBlocksCount = this.blocks.length;
    this.blocks = newBlocks;

    this.log('COMPACTION', true, totalFreeBeds, `Compacted ${previousBlocksCount} blocks into single contiguous free hole`, 0, 'BLK-COMPACTED');
    return {
      success: true,
      totalFreeBeds,
      freedContinuousBlockSize: totalFreeBeds,
      consolidatedHoles: previousBlocksCount - newBlocks.length
    };
  }

  /**
   * Calculate Fragmentation Metrics
   */
  getFragmentationMetrics(customBlocks = null) {
    const blocks = customBlocks || this.blocks;
    const totalBeds = this.totalBeds;
    let allocatedBeds = 0;
    let internalWastedBeds = 0;
    let freeBeds = 0;
    let maxFreeHole = 0;
    let freeHolesCount = 0;

    for (const b of blocks) {
      if (b.isAllocated) {
        allocatedBeds += b.size;
        if (b.patientGroup && b.patientGroup.reqSize < b.size) {
          internalWastedBeds += (b.size - b.patientGroup.reqSize);
        }
      } else {
        freeBeds += b.size;
        freeHolesCount++;
        if (b.size > maxFreeHole) maxFreeHole = b.size;
      }
    }

    // External fragmentation exists if free beds > 0 and max hole < free beds
    let externalFragPercent = 0;
    if (freeBeds > 0) {
      externalFragPercent = Number(((1 - (maxFreeHole / freeBeds)) * 100).toFixed(1));
    }

    const occupancyRate = Number(((allocatedBeds / totalBeds) * 100).toFixed(1));

    return {
      totalBeds,
      allocatedBeds,
      freeBeds,
      freeHolesCount,
      maxFreeHole,
      externalFragPercent,
      internalWastedBeds,
      occupancyRate
    };
  }

  /**
   * Run benchmark comparing First Fit, Best Fit, Worst Fit on identical request trace
   */
  runComparisonBenchmark(requests = [5, 3, 7, 4, 6, 2, 8]) {
    const baseBlocks = this.cloneBlocks(this.blocks);

    // 1. First Fit Run
    const ffBlocks = this.cloneBlocks(baseBlocks);
    let ffSuccess = 0;
    let ffSteps = 0;
    for (const r of requests) {
      const res = this.allocateFirstFit(r, `Cohort (${r} beds)`, ffBlocks);
      if (res.success) ffSuccess++;
      ffSteps += res.searchSteps;
    }
    const ffFrag = this.getFragmentationMetrics(ffBlocks);

    // 2. Best Fit Run
    const bfBlocks = this.cloneBlocks(baseBlocks);
    let bfSuccess = 0;
    let bfSteps = 0;
    for (const r of requests) {
      const res = this.allocateBestFit(r, `Cohort (${r} beds)`, bfBlocks);
      if (res.success) bfSuccess++;
      bfSteps += res.searchSteps;
    }
    const bfFrag = this.getFragmentationMetrics(bfBlocks);

    // 3. Worst Fit Run
    const wfBlocks = this.cloneBlocks(baseBlocks);
    let wfSuccess = 0;
    let wfSteps = 0;
    for (const r of requests) {
      const res = this.allocateWorstFit(r, `Cohort (${r} beds)`, wfBlocks);
      if (res.success) wfSuccess++;
      wfSteps += res.searchSteps;
    }
    const wfFrag = this.getFragmentationMetrics(wfBlocks);

    return {
      testRequests: requests,
      firstFit: {
        successCount: ffSuccess,
        totalRequests: requests.length,
        successRate: Number(((ffSuccess / requests.length) * 100).toFixed(1)),
        avgSearchSteps: Number((ffSteps / requests.length).toFixed(2)),
        externalFragPercent: ffFrag.externalFragPercent,
        maxHole: ffFrag.maxFreeHole
      },
      bestFit: {
        successCount: bfSuccess,
        totalRequests: requests.length,
        successRate: Number(((bfSuccess / requests.length) * 100).toFixed(1)),
        avgSearchSteps: Number((bfSteps / requests.length).toFixed(2)),
        externalFragPercent: bfFrag.externalFragPercent,
        maxHole: bfFrag.maxFreeHole
      },
      worstFit: {
        successCount: wfSuccess,
        totalRequests: requests.length,
        successRate: Number(((wfSuccess / requests.length) * 100).toFixed(1)),
        avgSearchSteps: Number((wfSteps / requests.length).toFixed(2)),
        externalFragPercent: wfFrag.externalFragPercent,
        maxHole: wfFrag.maxFreeHole
      }
    };
  }

  log(strategy, success, size, group, steps, blockId) {
    this.history.unshift({
      timestamp: Date.now(),
      strategy,
      success,
      size,
      group,
      steps,
      blockId
    });
    if (this.history.length > 25) this.history.pop();
  }

  getSnapshot() {
    return {
      totalBeds: this.totalBeds,
      blocks: this.blocks.map(b => ({ ...b })),
      metrics: this.getFragmentationMetrics(),
      history: [...this.history]
    };
  }
}
