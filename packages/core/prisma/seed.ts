import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Minimal seed: a mission statement, one goal, and a couple of tasks so the app
 * has something to render on first run. Safe to run repeatedly (idempotent-ish).
 */
async function main() {
  const existingMission = await prisma.missionStatement.findFirst({
    where: { isActive: true },
  });
  if (!existingMission) {
    await prisma.missionStatement.create({
      data: {
        content:
          "Put first things first: invest in the important-but-not-urgent before it becomes urgent.",
      },
    });
  }

  const goal = await prisma.goal.create({
    data: {
      title: "Ship Clock & Compass v1",
      description: "A working quadrant matrix and weekly planning view.",
    },
  });

  await prisma.task.createMany({
    data: [
      { title: "Plan the week's big rocks", important: true, urgent: false },
      { title: "Reply to overdue email", important: false, urgent: true },
    ],
  });

  // Link the first task to the goal as an example.
  const firstTask = await prisma.task.findFirst({
    where: { title: "Plan the week's big rocks" },
  });
  if (firstTask) {
    await prisma.task.update({
      where: { id: firstTask.id },
      data: { goalId: goal.id },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
