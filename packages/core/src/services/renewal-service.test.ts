import { beforeEach, describe, expect, it } from "vitest";
import type { HabitMark, Prisma, RenewalActivity } from "@prisma/client";
import type {
  HabitRepository,
  HabitWithMarks,
} from "../repositories/habit-repository.js";
import { RenewalService } from "./renewal-service.js";

class FakeHabitRepository implements HabitRepository {
  habits = new Map<string, HabitWithMarks>();
  activities: RenewalActivity[] = [];
  private seq = 0;

  async create(data: Prisma.HabitCreateInput): Promise<HabitWithMarks> {
    const id = `habit_${++this.seq}`;
    const now = new Date();
    const habit: HabitWithMarks = {
      id,
      name: data.name,
      dimension: (data.dimension as HabitWithMarks["dimension"]) ?? null,
      goalId: data.goal?.connect?.id ?? null,
      targetPerWeek: (data.targetPerWeek as number | undefined) ?? 7,
      archived: false,
      createdAt: now,
      updatedAt: now,
      marks: [],
      goal: data.goal?.connect?.id ? { title: `Goal ${data.goal.connect.id}` } : null,
    };
    this.habits.set(id, habit);
    return habit;
  }

  async findById(id: string): Promise<HabitWithMarks | null> {
    return this.habits.get(id) ?? null;
  }

  async findMany(): Promise<HabitWithMarks[]> {
    return [...this.habits.values()].filter((h) => !h.archived);
  }

  async update(id: string, data: Prisma.HabitUpdateInput): Promise<HabitWithMarks> {
    const existing = this.habits.get(id);
    if (!existing) throw new Error("not found");
    const { goal, ...rest } = data;
    const updated = { ...existing, ...rest } as HabitWithMarks;
    if (goal) {
      const connectId = "connect" in goal && goal.connect ? goal.connect.id : null;
      updated.goalId = connectId ?? null;
      updated.goal = connectId ? { title: `Goal ${connectId}` } : null;
    }
    this.habits.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.habits.delete(id);
  }

  async findMark(habitId: string, day: Date): Promise<HabitMark | null> {
    const habit = this.habits.get(habitId);
    const mark = habit?.marks.find((m) => m.day.getTime() === day.getTime());
    return mark
      ? ({ id: `${habitId}|${day.toISOString()}`, habitId, day: mark.day, createdAt: day } as HabitMark)
      : null;
  }

  async createMark(habitId: string, day: Date): Promise<void> {
    this.habits.get(habitId)?.marks.push({ day });
  }

  async deleteMark(id: string): Promise<void> {
    const [habitId, iso] = id.split("|") as [string, string];
    const habit = this.habits.get(habitId);
    if (habit) habit.marks = habit.marks.filter((m) => m.day.toISOString() !== iso);
  }

  async createActivity(data: Prisma.RenewalActivityCreateInput): Promise<RenewalActivity> {
    const activity: RenewalActivity = {
      id: `activity_${++this.seq}`,
      dimension: data.dimension,
      title: data.title,
      note: (data.note as string | null) ?? null,
      occurredAt: (data.occurredAt as Date | undefined) ?? new Date(),
      createdAt: new Date(),
    };
    this.activities.push(activity);
    return activity;
  }

  async findActivities(since: Date): Promise<RenewalActivity[]> {
    return this.activities.filter((a) => a.occurredAt >= since);
  }

  async deleteActivity(id: string): Promise<void> {
    this.activities = this.activities.filter((a) => a.id !== id);
  }
}

// 2026-06-10 is a Wednesday (ISO week Mon Jun 8 – Sun Jun 14).
const now = new Date("2026-06-10T12:00:00");

describe("RenewalService", () => {
  let repo: FakeHabitRepository;
  let service: RenewalService;

  beforeEach(() => {
    repo = new FakeHabitRepository();
    service = new RenewalService(repo);
  });

  it("toggles a mark on and off, and rejects future days", async () => {
    const habit = await service.createHabit({ name: "Morning run", targetPerWeek: 4 });
    const marked = await service.toggleMark(habit.id, now, now);
    expect(marked.markedToday).toBe(true);
    expect(marked.doneThisWeek).toBe(1);

    const unmarked = await service.toggleMark(habit.id, now, now);
    expect(unmarked.markedToday).toBe(false);

    await expect(
      service.toggleMark(habit.id, new Date("2026-06-12T00:00:00"), now),
    ).rejects.toThrow(/future/i);
  });

  it("counts BOTH habit marks and one-off activities toward a dimension", async () => {
    const habit = await service.createHabit({
      name: "Run",
      dimension: "PHYSICAL",
      targetPerWeek: 3,
    });
    await service.toggleMark(habit.id, new Date("2026-06-09T00:00:00"), now);
    await service.logActivity({
      dimension: "PHYSICAL",
      title: "Long hike",
      occurredAt: new Date("2026-06-08T10:00:00"),
    });

    const summary = await service.summary(now);
    const physical = summary.find((s) => s.dimension === "PHYSICAL")!;
    expect(physical.habitsDone).toBe(1);
    expect(physical.habitsTarget).toBe(3);
    expect(physical.oneOffs).toBe(1);
    expect(physical.total).toBe(2);
  });

  it("derives goal momentum from linked habits over 30 days", async () => {
    const habit = await service.createHabit({
      name: "Spanish lesson",
      goalId: "goal_es",
      targetPerWeek: 7,
    });
    // 15 marks in the last 30 days against a possible 30.
    for (let i = 0; i < 15; i++) {
      const day = new Date("2026-06-10T00:00:00");
      day.setDate(day.getDate() - i);
      await service.toggleMark(habit.id, day, now);
    }
    const trends = await service.trends(now);
    expect(trends.goalMomentum).toHaveLength(1);
    expect(trends.goalMomentum[0]!.pct).toBe(50);
    expect(trends.longestStreak.habitName).toBe("Spanish lesson");
  });

  it("compares this week to last across habits and one-offs", async () => {
    const habit = await service.createHabit({ name: "Pages", targetPerWeek: 3 });
    await service.toggleMark(habit.id, new Date("2026-06-09T00:00:00"), now); // this week
    await service.toggleMark(habit.id, new Date("2026-06-03T00:00:00"), now); // last week
    await service.logActivity({
      dimension: "SPIRITUAL",
      title: "Retreat",
      occurredAt: new Date("2026-06-06T09:00:00"), // last week
    });
    const trends = await service.trends(now);
    expect(trends.thisWeek).toBe(1);
    expect(trends.lastWeek).toBe(2);
    expect(trends.heatmap).toHaveLength(12);
    expect(trends.heatmap[11]).toHaveLength(7);
  });
});
