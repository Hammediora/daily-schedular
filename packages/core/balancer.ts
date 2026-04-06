import { Task, WeeklyConstraint, Lane } from "@operator-os/db";

export interface BalancerState {
    constraints: WeeklyConstraint[];
    completedTasksThisWeek: Task[];
    scheduledTasksThisWeek: Task[];
}

export interface DeficitReport {
    lane: Lane;
    targetMins: number;
    completedMins: number;
    scheduledMins: number;
    deficit: number;
}

export class Balancer {
    static calculateDeficits(state: BalancerState): DeficitReport[] {
        const reports: DeficitReport[] = [];

        for (const constraint of state.constraints) {
            const completedInLane = state.completedTasksThisWeek
                .filter((t) => t.lane === constraint.lane)
                .reduce((sum, t) => sum + t.effortMins, 0);

            const scheduledInLane = state.scheduledTasksThisWeek
                .filter((t) => t.lane === constraint.lane)
                .reduce((sum, t) => sum + t.effortMins, 0);

            const totalAccounted = completedInLane + scheduledInLane;
            const deficit = Math.max(0, constraint.minimumMinutes - totalAccounted);

            reports.push({
                lane: constraint.lane,
                targetMins: constraint.minimumMinutes,
                completedMins: completedInLane,
                scheduledMins: scheduledInLane,
                deficit,
            });
        }

        return reports.sort((a, b) => b.deficit - a.deficit); // Highest deficit first
    }
}
