const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Create default admin & editor users
  const adminPassword = await bcrypt.hash("AdminPass123!", 10);
  const editorPassword = await bcrypt.hash("EditorPass123!", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@learnspace.io" },
    update: {},
    create: {
      name: "Lead Administrator",
      email: "admin@learnspace.io",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });

  const editor = await prisma.user.upsert({
    where: { email: "editor@learnspace.io" },
    update: {},
    create: {
      name: "Curriculum Editor",
      email: "editor@learnspace.io",
      passwordHash: editorPassword,
      role: "EDITOR",
    },
  });

  console.log(`Created admin: ${admin.email} and editor: ${editor.email}`);

  // 2. Create Classes
  const grade10 = await prisma.class.upsert({
    where: { slug: "grade-10" },
    update: {},
    create: {
      name: "Grade 10",
      slug: "grade-10",
      description: "Standard high school sophomore level curriculum covering STEM and Humanities.",
      status: "PUBLISHED",
    },
  });

  const grade11 = await prisma.class.upsert({
    where: { slug: "grade-11" },
    update: {},
    create: {
      name: "Grade 11",
      slug: "grade-11",
      description: "Advanced junior level preparatory courses and subject specializations.",
      status: "PUBLISHED",
    },
  });

  const grade12 = await prisma.class.upsert({
    where: { slug: "grade-12" },
    update: {},
    create: {
      name: "Grade 12",
      slug: "grade-12",
      description: "Senior secondary graduation curriculum and college entrance readiness.",
      status: "PUBLISHED",
    },
  });

  // 3. Create Subjects
  const mathG10 = await prisma.subject.upsert({
    where: { classId_slug: { classId: grade10.id, slug: "mathematics" } },
    update: {},
    create: {
      name: "Mathematics",
      slug: "mathematics",
      classId: grade10.id,
    },
  });

  const physicsG10 = await prisma.subject.upsert({
    where: { classId_slug: { classId: grade10.id, slug: "physics" } },
    update: {},
    create: {
      name: "Physics",
      slug: "physics",
      classId: grade10.id,
    },
  });

  const chemG11 = await prisma.subject.upsert({
    where: { classId_slug: { classId: grade11.id, slug: "chemistry" } },
    update: {},
    create: {
      name: "Chemistry",
      slug: "chemistry",
      classId: grade11.id,
    },
  });

  const bioG12 = await prisma.subject.upsert({
    where: { classId_slug: { classId: grade12.id, slug: "biology" } },
    update: {},
    create: {
      name: "Biology",
      slug: "biology",
      classId: grade12.id,
    },
  });

  // 4. Create Starter Books
  const algebraBook = await prisma.book.upsert({
    where: { slug: "foundations-of-algebra-and-geometry" },
    update: {},
    create: {
      title: "Foundations of Algebra and Geometry",
      slug: "foundations-of-algebra-and-geometry",
      description: "Comprehensive textbook introducing polynomial functions, coordinate geometry, and quadratic equations with worked examples.",
      status: "PUBLISHED",
      classId: grade10.id,
      subjectId: mathG10.id,
    },
  });

  const mechanicsBook = await prisma.book.upsert({
    where: { slug: "principles-of-classical-mechanics" },
    update: {},
    create: {
      title: "Principles of Classical Mechanics",
      slug: "principles-of-classical-mechanics",
      description: "In-depth study of Newton's laws of motion, gravitation, kinetic energy, and momentum with practice problem sets.",
      status: "PUBLISHED",
      classId: grade10.id,
      subjectId: physicsG10.id,
    },
  });

  const organicChemBook = await prisma.book.upsert({
    where: { slug: "introduction-to-organic-chemistry" },
    update: {},
    create: {
      title: "Introduction to Organic Chemistry",
      slug: "introduction-to-organic-chemistry",
      description: "Explore molecular structures, hydrocarbon reactions, functional groups, and laboratory safety techniques.",
      status: "PUBLISHED",
      classId: grade11.id,
      subjectId: chemG11.id,
    },
  });

  // 5. Create Starter Videos
  await prisma.video.upsert({
    where: { id: "seed-video-1" },
    update: {},
    create: {
      id: "seed-video-1",
      title: "Understanding Quadratic Equations Visually",
      description: "Step-by-step visual explanation of factoring quadratics and finding parabola vertex coordinates.",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      status: "PUBLISHED",
      bookId: algebraBook.id,
    },
  });

  await prisma.video.upsert({
    where: { id: "seed-video-2" },
    update: {},
    create: {
      id: "seed-video-2",
      title: "Newton's Three Laws of Motion with Experiments",
      description: "Practical physics demonstrations explaining inertia, acceleration (F=ma), and action-reaction pairs.",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      status: "PUBLISHED",
      bookId: mechanicsBook.id,
    },
  });

  // 6. Create sample Student users
  const studentPassword = await bcrypt.hash("StudentPass123!", 10);
  const student1 = await prisma.user.upsert({
    where: { email: "student@learnspace.io" },
    update: {},
    create: {
      name: "Samira Khan",
      email: "student@learnspace.io",
      passwordHash: studentPassword,
      role: "STUDENT",
      classId: grade10.id,
    },
  });

  const student2 = await prisma.user.upsert({
    where: { email: "student2@learnspace.io" },
    update: {},
    create: {
      name: "David Chen",
      email: "student2@learnspace.io",
      passwordHash: studentPassword,
      role: "STUDENT",
      classId: grade11.id,
    },
  });

  console.log(`Created students: ${student1.email} (Grade 10), ${student2.email} (Grade 11)`);

  // 7. Create Learning Progress for Student
  await prisma.learningProgress.upsert({
    where: { userId_bookId: { userId: student1.id, bookId: algebraBook.id } },
    update: {},
    create: {
      userId: student1.id,
      bookId: algebraBook.id,
      status: "IN_PROGRESS",
      lastAccessedAt: new Date(),
    },
  });

  await prisma.learningProgress.upsert({
    where: { userId_bookId: { userId: student1.id, bookId: mechanicsBook.id } },
    update: {},
    create: {
      userId: student1.id,
      bookId: mechanicsBook.id,
      status: "COMPLETED",
      lastAccessedAt: new Date(Date.now() - 3600 * 1000 * 24),
    },
  });

  await prisma.learningProgress.upsert({
    where: { userId_videoId: { userId: student1.id, videoId: "seed-video-1" } },
    update: {},
    create: {
      userId: student1.id,
      videoId: "seed-video-1",
      status: "IN_PROGRESS",
      lastAccessedAt: new Date(),
    },
  });

  // 8. Create Sample Student Questions
  const existingQuestions = await prisma.studentQuestion.count();
  if (existingQuestions === 0) {
    await prisma.studentQuestion.createMany({
      data: [
        {
          name: "Samira Khan",
          email: "student@learnspace.io",
          authorId: student1.id,
          bookId: algebraBook.id,
          question: "How do I determine when to use the quadratic formula versus factoring by grouping?",
          answer: "Factoring by grouping is quickest when the coefficients multiply to easy factors. If the roots are irrational or fractions, the quadratic formula is always the reliable and definitive method.",
          status: "ANSWERED",
          answererId: admin.id,
        },
        {
          name: "Samira Khan",
          email: "student@learnspace.io",
          authorId: student1.id,
          bookId: mechanicsBook.id,
          question: "Does normal force always equal mg on an inclined plane?",
          answer: "No, on an inclined plane with angle θ to the horizontal, the normal force is N = mg * cos(θ), because only the perpendicular component of gravity presses against the surface.",
          status: "ANSWERED",
          answererId: admin.id,
        },
        {
          name: "Samira Khan",
          email: "student@learnspace.io",
          authorId: student1.id,
          bookId: algebraBook.id,
          question: "Can we review the vertex form y = a(x - h)^2 + k transformations in more detail?",
          status: "OPEN",
        },
        {
          name: "Rohan Gupta",
          email: "rohan@example.com",
          question: "Could someone provide additional practice problems on alkane combustion reactions?",
          status: "OPEN",
        },
      ],
    });
  }

  console.log("Seeding finished successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
