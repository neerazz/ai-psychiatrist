// src/session/crdt.ts
// CRDT-based transcript merging
// Reference: Requirements R24 (Conflict-free Replicated Data Types)
// Implements: AGENTS.md Article VI (Determinism - data structures are code, not AI)

import { v4 as uuidv4 } from 'uuid';

/**
 * Transcript entry with unique ID for CRDT
 * Using hybrid logical clock approach for ordering
 */
export interface CRDTTranscriptEntry {
    id: string;           // Unique ID: {timestamp}-{source}-{random}
    speaker: 'patient' | 'dr_sterling' | 'system';
    content: string;
    timestamp: number;    // Unix timestamp in ms
    source: 'local' | 'cloud';
    deleted: boolean;     // Tombstone for deletions
    version: number;      // For Last-Writer-Wins
}

/**
 * CRDT Transcript Manager
 * Implements a G-Set with LWW (Last-Writer-Wins) for updates
 * and tombstones for deletions (OR-Set semantics)
 */
export class TranscriptCRDT {
    private entries: Map<string, CRDTTranscriptEntry> = new Map();
    private nodeId: string;

    constructor(nodeId?: string) {
        this.nodeId = nodeId || uuidv4().slice(0, 8);
    }

    /**
     * Add a new entry to the transcript
     * @returns The entry ID
     */
    public add(
        speaker: CRDTTranscriptEntry['speaker'],
        content: string,
        source: 'local' | 'cloud' = 'local'
    ): string {
        const timestamp = Date.now();
        const id = `${timestamp}-${this.nodeId}-${Math.random().toString(36).substr(2, 9)}`;

        const entry: CRDTTranscriptEntry = {
            id,
            speaker,
            content,
            timestamp,
            source,
            deleted: false,
            version: 1
        };

        this.entries.set(id, entry);
        return id;
    }

    /**
     * Update an existing entry
     * Uses LWW semantics - newer version wins
     */
    public update(id: string, content: string): boolean {
        const existing = this.entries.get(id);
        if (!existing || existing.deleted) {
            return false;
        }

        this.entries.set(id, {
            ...existing,
            content,
            timestamp: Date.now(),
            version: existing.version + 1
        });

        return true;
    }

    /**
     * Mark an entry as deleted (tombstone)
     * Entry is not actually removed to maintain CRDT semantics
     */
    public delete(id: string): boolean {
        const existing = this.entries.get(id);
        if (!existing) {
            return false;
        }

        this.entries.set(id, {
            ...existing,
            deleted: true,
            timestamp: Date.now(),
            version: existing.version + 1
        });

        return true;
    }

    /**
     * Merge another CRDT transcript into this one
     * Uses Last-Writer-Wins for conflicts based on timestamp and version
     */
    public merge(other: TranscriptCRDT): void {
        for (const [id, entry] of other.entries) {
            const existing = this.entries.get(id);

            if (!existing) {
                // New entry - add it
                this.entries.set(id, { ...entry });
            } else {
                // Existing entry - use LWW based on version and timestamp
                if (entry.version > existing.version ||
                    (entry.version === existing.version && entry.timestamp > existing.timestamp)) {
                    this.entries.set(id, { ...entry });
                }
            }
        }
    }

    /**
     * Get all entries in chronological order (excluding deleted)
     */
    public getEntries(): CRDTTranscriptEntry[] {
        return Array.from(this.entries.values())
            .filter(e => !e.deleted)
            .sort((a, b) => a.timestamp - b.timestamp);
    }

    /**
     * Get entry by ID
     */
    public getEntry(id: string): CRDTTranscriptEntry | null {
        const entry = this.entries.get(id);
        return entry && !entry.deleted ? { ...entry } : null;
    }

    /**
     * Get entries by speaker
     */
    public getEntriesBySpeaker(speaker: CRDTTranscriptEntry['speaker']): CRDTTranscriptEntry[] {
        return this.getEntries().filter(e => e.speaker === speaker);
    }

    /**
     * Get last N entries
     */
    public getLastN(n: number): CRDTTranscriptEntry[] {
        const entries = this.getEntries();
        return entries.slice(-n);
    }

    /**
     * Get entries after a specific timestamp
     */
    public getEntriesAfter(timestamp: number): CRDTTranscriptEntry[] {
        return this.getEntries().filter(e => e.timestamp > timestamp);
    }

    /**
     * Export as plain array for persistence (includes deleted for full CRDT state)
     */
    public toArray(): CRDTTranscriptEntry[] {
        return Array.from(this.entries.values());
    }

    /**
     * Export as array for display (excludes deleted)
     */
    public toDisplayArray(): Array<{ speaker: string; content: string; timestamp: string }> {
        return this.getEntries().map(e => ({
            speaker: e.speaker,
            content: e.content,
            timestamp: new Date(e.timestamp).toISOString()
        }));
    }

    /**
     * Import from array (for loading persisted state)
     */
    public static fromArray(entries: CRDTTranscriptEntry[], nodeId?: string): TranscriptCRDT {
        const crdt = new TranscriptCRDT(nodeId);
        for (const entry of entries) {
            crdt.entries.set(entry.id, { ...entry });
        }
        return crdt;
    }

    /**
     * Get entry count (excluding deleted)
     */
    public size(): number {
        return this.getEntries().length;
    }

    /**
     * Get total entry count (including deleted)
     */
    public totalSize(): number {
        return this.entries.size;
    }

    /**
     * Clear all entries
     */
    public clear(): void {
        this.entries.clear();
    }

    /**
     * Get node ID
     */
    public getNodeId(): string {
        return this.nodeId;
    }

    /**
     * Calculate data integrity (percentage of non-deleted entries)
     */
    public getIntegrity(): number {
        if (this.entries.size === 0) return 100;
        const alive = this.getEntries().length;
        return (alive / this.entries.size) * 100;
    }
}
