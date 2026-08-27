import { db } from "@/lib/db";

/**
 * Notify all students enrolled in a class about new content.
 * Uses type + targetUrl for deduplication to prevent duplicate notifications.
 */
export async function notifyClassStudents({
  classId,
  message,
  targetUrl,
  excludeUserId,
}: {
  classId: string;
  message: string;
  targetUrl: string;
  excludeUserId?: string;
}) {
  const students = await db.user.findMany({
    where: { classId, role: "STUDENT" },
    select: { id: true },
  });

  for (const student of students) {
    if (excludeUserId && student.id === excludeUserId) continue;

    const existing = await db.notification.findFirst({
      where: { userId: student.id, type: "CLASS_CONTENT", targetUrl },
      select: { id: true },
    });

    if (!existing) {
      await db.notification.create({
        data: {
          userId: student.id,
          type: "CLASS_CONTENT",
          targetUrl,
          message,
        },
      });
    }
  }
}
