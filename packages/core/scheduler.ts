import { Task, TimeBlockInstance, BlockType, WorkType } from "@operator-os/db";

export interface SchedulerContext {
    backlogTasks: Task[];
    availableBlocks: TimeBlockInstance[];
    timezone: string;
}

export interface ScheduledPlacement {
    taskId: string;
    timeBlockInstanceId: string;
    allocatedMinutes: number;
    orderIndex: number;
}

// Blocks that can NEVER receive task assignments
const PROTECTED_BLOCK_TYPES: BlockType[] = [BlockType.FAMILY, BlockType.IBM, BlockType.HEALTH];

export class Scheduler {
    // Mapping of WorkType to compatible BlockTypes
    static readonly COMPATIBILITY_MAP: Record<WorkType, BlockType[]> = {
        [WorkType.DEEP]: [BlockType.DEEP_WORK],
        [WorkType.EXECUTION]: [BlockType.EXECUTION, BlockType.BUILDER],
        [WorkType.ADMIN]: [BlockType.EXECUTION, BlockType.REVIEW, BlockType.BUILDER],
        [WorkType.SOCIAL]: [BlockType.EXECUTION, BlockType.BUILDER],
        [WorkType.RECOVERY]: [BlockType.HEALTH],
    };

    /**
     * Sorts tasks according to the rules:
     * 1. Deadlines
     * 2. Impact Score (Descending)
     */
    static rankTasks(tasks: Task[]): Task[] {
        return [...tasks].sort((a, b) => {
            if (a.deadline && !b.deadline) return -1;
            if (!a.deadline && b.deadline) return 1;
            if (a.deadline && b.deadline) {
                if (a.deadline.getTime() !== b.deadline.getTime()) {
                    return a.deadline.getTime() - b.deadline.getTime();
                }
            }
            return b.impactScore - a.impactScore;
        });
    }

    /**
     * Main Auto-Scheduling logic
     * Respects FAMILY and other protected blocks — never places tasks there.
     */
    static computeSchedule(context: SchedulerContext): ScheduledPlacement[] {
        const placements: ScheduledPlacement[] = [];
        const rankedTasks = this.rankTasks(context.backlogTasks);

        // Track remaining capacity in each block (exclude sacred blocks)
        // Subtract capacity already used by locked/existing scheduled tasks
        const blockCapacities = new Map<string, number>();
        for (const block of context.availableBlocks) {
            // FAMILY and Health blocks are sacred — never fill them with tasks
            if (PROTECTED_BLOCK_TYPES.includes(block.type)) continue;
            // Subtract existing scheduled task allocations (e.g. locked tasks)
            const existingAlloc = (block as any).scheduledTasks?.reduce(
                (sum: number, st: any) => sum + (st.allocatedMinutes ?? st.task?.effortMins ?? 0), 0
            ) ?? 0;
            blockCapacities.set(block.id, Math.max(0, block.durationMinutes - existingAlloc));
        }

        // Sort schedulable blocks by date and time
        const chronologicalBlocks = [...context.availableBlocks]
            .filter(b => !PROTECTED_BLOCK_TYPES.includes(b.type))
            .sort((a, b) => {
                if (a.date.getTime() !== b.date.getTime()) return a.date.getTime() - b.date.getTime();
                return a.startMinute - b.startMinute;
            });

        for (const task of rankedTasks) {
            let remainingEffort = task.effortMins;
            const compatibleTypes = this.COMPATIBILITY_MAP[task.workType] || [];

            for (const block of chronologicalBlocks) {
                if (remainingEffort <= 0) break;
                if (!compatibleTypes.includes(block.type)) continue;

                const currentCapacity = blockCapacities.get(block.id) || 0;
                if (currentCapacity <= 0) continue;

                const allocation = Math.min(remainingEffort, currentCapacity);
                const orderInBlock = placements.filter(p => p.timeBlockInstanceId === block.id).length;

                placements.push({
                    taskId: task.id,
                    timeBlockInstanceId: block.id,
                    allocatedMinutes: allocation,
                    orderIndex: orderInBlock,
                });

                remainingEffort -= allocation;
                blockCapacities.set(block.id, currentCapacity - allocation);
            }
        }

        return placements;
    }
}
