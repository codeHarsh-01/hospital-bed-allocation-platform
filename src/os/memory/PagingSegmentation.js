/**
 * Operating System Memory Management: Paging & Segmentation Unit (MMU)
 * Maps to Unit 4: Paging and Segmentation for Hospital Spatial Organization
 * 
 * Implements two complementary architectural models:
 * 1. Segmentation: Hospital logical division into clinical Wards (Segments)
 *    with Base & Limit hardware bounds checking.
 * 2. Paging: Uniform physical bed clustering into fixed-size Pages (4 beds/pod)
 *    with Page Table translation, TLB cache, and Page Fault resolution.
 */

export class PagingSegmentationUnit {
  constructor() {
    // 1. Segmentation Table (Logical Hospital Wards)
    this.segmentTable = [
      { segId: 0, wardName: 'ICU (Intensive Care)', base: 0, limit: 16, access: 'R/W Critical' },
      { segId: 1, wardName: 'Emergency & Trauma Bay', base: 16, limit: 20, access: 'R/W Priority' },
      { segId: 2, wardName: 'Cardiology Care Wing', base: 36, limit: 24, access: 'R/W Standard' },
      { segId: 3, wardName: 'Pediatric Care Ward', base: 60, limit: 20, access: 'R/W Standard' },
      { segId: 4, wardName: 'General Surgery & Recovery', base: 80, limit: 32, access: 'R/W Standard' }
    ];

    // 2. Paging Parameters (Page Size = 4 Beds per Pod)
    this.pageSize = 4;
    this.numPages = 16;   // 16 Virtual Pages
    this.numFrames = 12;  // 12 Physical Frames in Main Hospital (4 swapped to auxiliary)

    // Page Table: Page# -> { frameNumber, isValid, isDirty, accessCount }
    this.pageTable = [
      { page: 0, frame: 3, valid: true, dirty: false },
      { page: 1, frame: 0, valid: true, dirty: true },
      { page: 2, frame: 5, valid: true, dirty: false },
      { page: 3, frame: 2, valid: true, dirty: true },
      { page: 4, frame: 7, valid: true, dirty: false },
      { page: 5, frame: 1, valid: true, dirty: false },
      { page: 6, frame: 4, valid: true, dirty: true },
      { page: 7, frame: 9, valid: true, dirty: false },
      { page: 8, frame: null, valid: false, dirty: false }, // Page fault candidate
      { page: 9, frame: 6, valid: true, dirty: false },
      { page: 10, frame: 8, valid: true, dirty: true },
      { page: 11, frame: null, valid: false, dirty: false }, // Page fault candidate
      { page: 12, frame: 10, valid: true, dirty: false },
      { page: 13, frame: 11, valid: true, dirty: false },
      { page: 14, frame: null, valid: false, dirty: false },
      { page: 15, frame: null, valid: false, dirty: false },
    ];

    // 3. TLB (Translation Lookaside Buffer) - 4 Entries (Fully Associative Cache)
    this.tlbCapacity = 4;
    this.tlb = [
      { page: 1, frame: 0, lru: 1 },
      { page: 3, frame: 2, lru: 2 },
      { page: 5, frame: 1, lru: 3 },
      { page: 0, frame: 3, lru: 4 }
    ];

    // Hardware Telemetry & EAT Timing
    this.telemetry = {
      tlbHits: 142,
      tlbMisses: 38,
      pageFaults: 6,
      segmentationFaults: 1,
      tlbAccessTimeNs: 2,      // 2 ns
      memoryAccessTimeNs: 100  // 100 ns
    };

    this.lookupHistory = [];
  }

  /**
   * Translate Logical Bed Address using Segmentation:
   * Logical Address = (Segment Number, Offset)
   */
  translateSegmentAddress(segId, offset) {
    const segment = this.segmentTable.find(s => s.segId === segId);
    if (!segment) {
      this.telemetry.segmentationFaults++;
      const faultResult = {
        success: false,
        error: 'INVALID_SEGMENT',
        detail: `Segment #${segId} does not exist in Segment Table!`,
        segId,
        offset
      };
      this.logLookup('SEGMENT_TRANSLATION', faultResult);
      return faultResult;
    }

    // Hardware Limit Check: offset < Limit
    if (offset >= segment.limit) {
      this.telemetry.segmentationFaults++;
      const faultResult = {
        success: false,
        error: 'SEGMENT_LIMIT_VIOLATION',
        detail: `TRAP: Bed Offset ${offset} exceeds Segment Limit ${segment.limit} for Ward "${segment.wardName}". Access Denied!`,
        segId,
        offset,
        limit: segment.limit
      };
      this.logLookup('SEGMENT_TRANSLATION', faultResult);
      return faultResult;
    }

    // Compute Physical Address = Base + Offset
    const physicalBedAddress = segment.base + offset;
    const successResult = {
      success: true,
      segId,
      wardName: segment.wardName,
      offset,
      base: segment.base,
      limit: segment.limit,
      physicalBedAddress,
      detail: `Valid Translation: Base (${segment.base}) + Offset (${offset}) = Physical Bed #${physicalBedAddress} in ${segment.wardName}`
    };
    this.logLookup('SEGMENT_TRANSLATION', successResult);
    return successResult;
  }

  /**
   * Translate Virtual Bed Page using Paging + TLB Lookup:
   * Virtual Address = (Page Number, Offset)
   */
  translatePagedAddress(virtualPage, offset) {
    if (offset < 0 || offset >= this.pageSize) {
      return {
        success: false,
        error: 'INVALID_PAGE_OFFSET',
        detail: `Offset ${offset} exceeds page size ${this.pageSize}`
      };
    }

    // 1. Check TLB first
    const tlbEntry = this.tlb.find(e => e.page === virtualPage);
    let isTlbHit = false;
    let resolvedFrame = null;

    if (tlbEntry) {
      // TLB HIT!
      isTlbHit = true;
      this.telemetry.tlbHits++;
      resolvedFrame = tlbEntry.frame;
      tlbEntry.lru = Date.now();
    } else {
      // TLB MISS! Must check Page Table in Main Memory
      this.telemetry.tlbMisses++;
      const ptEntry = this.pageTable.find(p => p.page === virtualPage);

      if (!ptEntry || !ptEntry.valid) {
        // PAGE FAULT! Page is on secondary disk / standby bay
        this.telemetry.pageFaults++;
        const pageFaultResult = {
          success: false,
          isPageFault: true,
          virtualPage,
          offset,
          detail: `PAGE FAULT! Virtual Bed Page #${virtualPage} is not present in Physical Memory Frame. OS page-in trap triggered.`
        };
        this.logLookup('PAGE_TRANSLATION', pageFaultResult);
        return pageFaultResult;
      }

      resolvedFrame = ptEntry.frame;
      // Update TLB with LRU replacement
      this.updateTLB(virtualPage, resolvedFrame);
    }

    // Physical Address = Frame Number * Page Size + Offset
    const physicalBedAddress = resolvedFrame * this.pageSize + offset;
    const result = {
      success: true,
      virtualPage,
      offset,
      frameNumber: resolvedFrame,
      physicalBedAddress,
      isTlbHit,
      detail: `${isTlbHit ? '⚡ TLB HIT' : '⚠️ TLB MISS (Page Table Hit)'}: Virtual Page #${virtualPage} mapped to Physical Frame #${resolvedFrame}, Slot #${offset} -> Bed #${physicalBedAddress}`
    };

    this.logLookup('PAGE_TRANSLATION', result);
    return result;
  }

  /**
   * Handle Page Fault: Page in the missing page into a free frame or replace via FIFO/LRU
   */
  handlePageFault(virtualPage) {
    const ptEntry = this.pageTable.find(p => p.page === virtualPage);
    if (!ptEntry) return { success: false, reason: 'Page does not exist' };
    if (ptEntry.valid) return { success: true, reason: 'Page already in memory' };

    // Find a free frame or steal frame 11
    let assignedFrame = 11;
    // Evict whatever was in frame 11
    const victim = this.pageTable.find(p => p.frame === assignedFrame && p.valid);
    if (victim) {
      victim.valid = false;
      victim.frame = null;
    }

    ptEntry.valid = true;
    ptEntry.frame = assignedFrame;
    this.updateTLB(virtualPage, assignedFrame);

    return {
      success: true,
      virtualPage,
      allocatedFrame: assignedFrame,
      evictedPage: victim ? victim.page : null,
      detail: `Page-In Complete: Swapped Virtual Page #${virtualPage} into Physical Frame #${assignedFrame} (Evicted Page #${victim ? victim.page : 'None'})`
    };
  }

  updateTLB(page, frame) {
    const existing = this.tlb.find(e => e.page === page);
    if (existing) {
      existing.frame = frame;
      existing.lru = Date.now();
      return;
    }

    if (this.tlb.length >= this.tlbCapacity) {
      // Find oldest LRU entry
      this.tlb.sort((a, b) => a.lru - b.lru);
      this.tlb.shift(); // Evict LRU
    }

    this.tlb.push({ page, frame, lru: Date.now() });
  }

  /**
   * Calculate Effective Access Time (EAT)
   */
  calculateEAT() {
    const totalLookups = this.telemetry.tlbHits + this.telemetry.tlbMisses;
    const hitRate = totalLookups > 0 ? this.telemetry.tlbHits / totalLookups : 0.8;
    const tlbTime = this.telemetry.tlbAccessTimeNs;
    const memTime = this.telemetry.memoryAccessTimeNs;

    // EAT = HitRate * (TLB + Mem) + (1 - HitRate) * (TLB + 2 * Mem)
    const eat = (hitRate * (tlbTime + memTime)) + ((1 - hitRate) * (tlbTime + 2 * memTime));

    return {
      hitRate: Number((hitRate * 100).toFixed(1)),
      tlbHits: this.telemetry.tlbHits,
      tlbMisses: this.telemetry.tlbMisses,
      pageFaults: this.telemetry.pageFaults,
      segmentationFaults: this.telemetry.segmentationFaults,
      eatNs: Number(eat.toFixed(2))
    };
  }

  logLookup(type, data) {
    this.lookupHistory.unshift({
      timestamp: Date.now(),
      type,
      ...data
    });
    if (this.lookupHistory.length > 20) this.lookupHistory.pop();
  }

  getSnapshot() {
    return {
      segmentTable: [...this.segmentTable],
      pageTable: [...this.pageTable],
      tlb: [...this.tlb],
      pageSize: this.pageSize,
      eatMetrics: this.calculateEAT(),
      lookupHistory: [...this.lookupHistory]
    };
  }
}
