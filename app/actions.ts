"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getOptionalUser, requireAdminUser, requireUser } from "@/lib/auth/authorization";
import bcrypt from "bcryptjs";
import {
  answerSchema,
  bookSchema,
  classSchema,
  noteSchema,
  optional,
  profileSchema,
  progressSchema,
  questionSchema,
  registerSchema,
  slugify,
  subjectSchema,
  videoSchema,
} from "@/lib/validation";
import { removeUpload, saveUpload } from "@/lib/storage";
import { notifyClassStudents } from "@/lib/notify";

function message(path: string, text: string) {
  redirect(`${path}?notice=${encodeURIComponent(text)}`);
}

async function audit(action: string, entity: string, entityId: string, metadata?: Record<string, unknown>) {
  const session = await requireAdminUser();
  const user = await db.user.findUnique({
    where: { email: session.user!.email! },
    select: { id: true },
  });
  await db.auditLog.create({
    data: {
      action,
      entity,
      entityId,
      userId: user?.id,
      metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
    },
  });
}

async function uniqueSlug(model: "class" | "book", value: string, excludedId?: string) {
  const base = slugify(value) || "item";
  for (let index = 0; index < 100; index++) {
    const slug = index ? `${base}-${index + 1}` : base;
    const item =
      model === "class"
        ? await db.class.findUnique({ where: { slug }, select: { id: true } })
        : await db.book.findUnique({ where: { slug }, select: { id: true } });
    if (!item || item.id === excludedId) return slug;
  }
  return `${base}-${Date.now()}`;
}

async function uniqueSubjectSlug(classId: string, value: string, excludedId?: string) {
  const base = slugify(value) || "subject";
  for (let index = 0; index < 100; index++) {
    const slug = index ? `${base}-${index + 1}` : base;
    const item = await db.subject.findUnique({
      where: { classId_slug: { classId, slug } },
      select: { id: true },
    });
    if (!item || item.id === excludedId) return slug;
  }
  return `${base}-${Date.now()}`;
}

export async function saveClass(form: FormData) {
  await requireAdminUser();
  const id = optional(form.get("id"));
  const data = classSchema.safeParse({
    name: form.get("name"),
    description: optional(form.get("description")),
    status: form.get("status"),
  });
  if (!data.success) return message("/admin/classes", data.error.issues[0]?.message ?? "Invalid class details.");
  const slug = await uniqueSlug("class", data.data.name, id);
  const saved = id
    ? await db.class.update({ where: { id }, data: { ...data.data, slug } })
    : await db.class.create({ data: { ...data.data, slug } });
  await audit(id ? "UPDATE" : "CREATE", "Class", saved.id);
  revalidatePath("/");
  revalidatePath("/library");
  message("/admin/classes", "Class saved successfully.");
}

export async function deleteClass(form: FormData) {
  await requireAdminUser();
  const id = String(form.get("id"));
  const books = await db.book.findMany({
    where: { classId: id },
    include: { assets: true },
  });
  for (const book of books) {
    if (book.coverUrl) await removeUpload(book.coverUrl);
    for (const asset of book.assets) {
      await removeUpload(asset.storageKey);
    }
  }
  await db.class.delete({ where: { id } });
  await audit("DELETE", "Class", id);
  revalidatePath("/");
  revalidatePath("/library");
  message("/admin/classes", "Class deleted.");
}

export async function saveSubject(form: FormData) {
  await requireAdminUser();
  const id = optional(form.get("id"));
  const data = subjectSchema.safeParse({
    name: form.get("name"),
    classId: form.get("classId"),
  });
  if (!data.success) return message("/admin/subjects", data.error.issues[0]?.message ?? "Invalid subject details.");
  const slug = await uniqueSubjectSlug(data.data.classId, data.data.name, id);
  const saved = id
    ? await db.subject.update({ where: { id }, data: { ...data.data, slug } })
    : await db.subject.create({ data: { ...data.data, slug } });
  await audit(id ? "UPDATE" : "CREATE", "Subject", saved.id);

  if (!id) {
    const cls = await db.class.findUnique({ where: { id: data.data.classId }, select: { name: true, slug: true } });
    if (cls) {
      await notifyClassStudents({
        classId: data.data.classId,
        message: `New subject added to ${cls.name}: ${data.data.name}`,
        targetUrl: `/classes/${cls.slug}`,
      });
    }
  }

  revalidatePath("/");
  revalidatePath("/library");
  revalidatePath("/notifications");
  message("/admin/subjects", "Subject saved successfully.");
}

export async function deleteSubject(form: FormData) {
  await requireAdminUser();
  const id = String(form.get("id"));
  await db.subject.delete({ where: { id } });
  await audit("DELETE", "Subject", id);
  revalidatePath("/");
  revalidatePath("/library");
  message("/admin/subjects", "Subject deleted.");
}

export async function saveBook(form: FormData) {
  await requireAdminUser();
  const id = optional(form.get("id"));
  const data = bookSchema.safeParse({
    title: form.get("title"),
    description: optional(form.get("description")),
    classId: form.get("classId"),
    subjectId: optional(form.get("subjectId")),
    status: form.get("status"),
  });
  if (!data.success) return message("/admin/books", data.error.issues[0]?.message ?? "Invalid lesson details.");
  if (data.data.subjectId) {
    const subject = await db.subject.findFirst({
      where: { id: data.data.subjectId, classId: data.data.classId },
      select: { id: true },
    });
    if (!subject) return message("/admin/books", "Choose a subject that belongs to the selected class.");
  }

  const pdfFile = form.get("pdf");
  let pdfAsset = null;
  try {
    if (pdfFile instanceof File && pdfFile.size) {
      pdfAsset = await saveUpload(pdfFile, "pdf");
    }
  } catch (error) {
    return message("/admin/books", error instanceof Error ? error.message : "PDF upload failed.");
  }

  const coverFile = form.get("cover");
  let coverAsset = null;
  try {
    if (coverFile instanceof File && coverFile.size) {
      coverAsset = await saveUpload(coverFile, "image");
    }
  } catch (error) {
    return message("/admin/books", error instanceof Error ? error.message : "Cover upload failed.");
  }

  // Handle video URL and file upload
  const videoUrl = optional(form.get("videoUrl"));
  const videoFile = form.get("videoFile");
  let videoUpload = null;
  try {
    if (videoFile instanceof File && videoFile.size) {
      videoUpload = await saveUpload(videoFile, "video");
    }
  } catch (error) {
    return message("/admin/books", error instanceof Error ? error.message : "Video upload failed.");
  }

  const slug = await uniqueSlug("book", data.data.title, id);

  const existing = id
    ? await db.book.findUnique({
        where: { id },
        include: { assets: { where: { type: "PDF" } }, videos: true },
      })
    : null;

  let coverUrl = existing?.coverUrl;
  if (coverAsset) {
    if (existing?.coverUrl) await removeUpload(existing.coverUrl);
    coverUrl = coverAsset.storageKey;
  }

  const book = id
    ? await db.book.update({
        where: { id },
        data: {
          ...data.data,
          subjectId: data.data.subjectId || null,
          slug,
          coverUrl,
        },
      })
    : await db.book.create({
        data: {
          ...data.data,
          subjectId: data.data.subjectId || null,
          slug,
          coverUrl: coverAsset?.storageKey ?? null,
        },
      });

  if (pdfAsset) {
    if (existing?.assets) {
      for (const oldAsset of existing.assets) {
        await removeUpload(oldAsset.storageKey);
        await db.mediaAsset.delete({ where: { id: oldAsset.id } });
      }
    }
    await db.mediaAsset.create({
      data: {
        ...pdfAsset,
        type: "PDF",
        bookId: book.id,
      },
    });
  }

  // Handle video: create or update the linked video record
  if (videoUpload || videoUrl) {
    const existingVideo = existing?.videos?.[0];
    let finalUrl = existingVideo?.url ?? "";
    if (videoUpload) {
      if (existingVideo?.storageKey) await removeUpload(existingVideo.storageKey);
      finalUrl = videoUpload.storageKey;
    } else if (videoUrl) {
      finalUrl = videoUrl;
    }

    const videoData = {
      title: data.data.title,
      description: data.data.description,
      bookId: book.id,
      status: data.data.status,
      url: finalUrl,
      ...(videoUpload
        ? {
            fileName: videoUpload.fileName,
            storageKey: videoUpload.storageKey,
            mimeType: videoUpload.mimeType,
            sizeBytes: videoUpload.sizeBytes,
          }
        : {}),
    };

    if (existingVideo) {
      await db.video.update({ where: { id: existingVideo.id }, data: videoData });
    } else {
      await db.video.create({ data: videoData });
    }
  }

  const classRec = await db.class.findUnique({ where: { id: data.data.classId }, select: { name: true, slug: true } });
  if (classRec) {
    if (!id) {
      await notifyClassStudents({
        classId: data.data.classId,
        message: `New lesson added to ${classRec.name}: ${data.data.title}`,
        targetUrl: `/library/${book.slug}`,
      });
    } else if (pdfAsset && existing && existing.assets.length === 0) {
      await notifyClassStudents({
        classId: data.data.classId,
        message: `New PDF added to ${classRec.name}: ${data.data.title}`,
        targetUrl: `/library/${book.slug}`,
      });
    } else if ((videoUpload || videoUrl) && existing && (!existing.videos || existing.videos.length === 0)) {
      await notifyClassStudents({
        classId: data.data.classId,
        message: `New video added to ${classRec.name}: ${data.data.title}`,
        targetUrl: `/library/${book.slug}`,
      });
    }
  }

  await audit(id ? "UPDATE" : "CREATE", "Book", book.id);
  revalidatePath("/");
  revalidatePath("/library");
  revalidatePath("/classes");
  revalidatePath(`/library/${book.slug}`);
  revalidatePath("/notifications");
  message("/admin/books", "Lesson saved successfully.");
}

export async function deleteBook(form: FormData) {
  await requireAdminUser();
  const id = String(form.get("id"));
  const book = await db.book.findUnique({
    where: { id },
    include: { assets: true },
  });
  if (book) {
    if (book.coverUrl) await removeUpload(book.coverUrl);
    for (const asset of book.assets) {
      await removeUpload(asset.storageKey);
    }
    await db.book.delete({ where: { id } });
    await audit("DELETE", "Book", id);
  }
  revalidatePath("/");
  revalidatePath("/library");
  message("/admin/books", "Book deleted.");
}

export async function saveVideo(form: FormData) {
  await requireAdminUser();
  const id = optional(form.get("id"));
  const parsed = videoSchema.safeParse({
    title: form.get("title"),
    description: optional(form.get("description")),
    bookId: optional(form.get("bookId")),
    url: optional(form.get("url")),
    status: form.get("status"),
  });
  if (!parsed.success) return message("/admin/videos", parsed.error.issues[0]?.message ?? "Invalid video details.");

  const videoFile = form.get("video");
  let videoUpload = null;
  try {
    if (videoFile instanceof File && videoFile.size) {
      videoUpload = await saveUpload(videoFile, "video");
    }
  } catch (error) {
    return message("/admin/videos", error instanceof Error ? error.message : "Video upload failed.");
  }

  const thumbFile = form.get("thumbnail");
  let thumbUpload = null;
  try {
    if (thumbFile instanceof File && thumbFile.size) {
      thumbUpload = await saveUpload(thumbFile, "image");
    }
  } catch (error) {
    return message("/admin/videos", error instanceof Error ? error.message : "Thumbnail upload failed.");
  }

  const existing = id ? await db.video.findUnique({ where: { id } }) : null;

  if (!parsed.data.url && !videoUpload && !existing?.url) {
    return message("/admin/videos", "Provide a video URL or upload a video file.");
  }

  let finalUrl = existing?.url ?? "";
  if (videoUpload) {
    if (existing?.storageKey) await removeUpload(existing.storageKey);
    finalUrl = videoUpload.storageKey;
  } else if (parsed.data.url) {
    finalUrl = parsed.data.url;
  }

  let finalThumbnail = existing?.thumbnail ?? null;
  if (thumbUpload) {
    if (existing?.thumbnail) await removeUpload(existing.thumbnail);
    finalThumbnail = thumbUpload.storageKey;
  }

  const data = {
    title: parsed.data.title,
    description: parsed.data.description,
    bookId: parsed.data.bookId || null,
    status: parsed.data.status,
    url: finalUrl,
    thumbnail: finalThumbnail,
    ...(videoUpload
      ? {
          fileName: videoUpload.fileName,
          storageKey: videoUpload.storageKey,
          mimeType: videoUpload.mimeType,
          sizeBytes: videoUpload.sizeBytes,
        }
      : {}),
  };

  const video = id
    ? await db.video.update({ where: { id }, data })
    : await db.video.create({ data });

  if (!id && parsed.data.bookId) {
    const book = await db.book.findUnique({
      where: { id: parsed.data.bookId },
      select: { title: true, slug: true, classId: true, class: { select: { name: true, slug: true } } },
    });
    if (book?.class) {
      await notifyClassStudents({
        classId: book.classId,
        message: `New video added to ${book.class.name}: ${book.title}`,
        targetUrl: `/library/${book.slug}`,
      });
    }
  }

  await audit(id ? "UPDATE" : "CREATE", "Video", video.id);
  revalidatePath("/");
  revalidatePath("/videos");
  revalidatePath(`/videos/${video.id}`);
  revalidatePath("/notifications");
  message("/admin/videos", "Video saved successfully.");
}

export async function deleteVideo(form: FormData) {
  await requireAdminUser();
  const id = String(form.get("id"));
  const video = await db.video.findUnique({ where: { id } });
  if (video) {
    if (video.storageKey) await removeUpload(video.storageKey);
    if (video.thumbnail) await removeUpload(video.thumbnail);
    await db.video.delete({ where: { id } });
    await audit("DELETE", "Video", id);
  }
  revalidatePath("/");
  revalidatePath("/videos");
  message("/admin/videos", "Video deleted.");
}

export async function answerQuestion(form: FormData) {
  await requireAdminUser();
  const id = String(form.get("id"));
  const data = answerSchema.safeParse({
    answer: form.get("answer"),
    status: form.get("status"),
  });
  if (!data.success) return message("/admin/questions", data.error.issues[0]?.message ?? "Invalid answer.");
  const session = await requireAdminUser();
  const user = await db.user.findUnique({
    where: { email: session.user!.email! },
    select: { id: true },
  });
  const question = await db.studentQuestion.update({
    where: { id },
    data: { ...data.data, answererId: user?.id },
    select: { authorId: true },
  });
  if (question.authorId && data.data.status === "ANSWERED") {
    const existing = await db.notification.findFirst({
      where: { userId: question.authorId, questionId: id },
      select: { id: true },
    });
    if (existing) {
      await db.notification.update({
        where: { id: existing.id },
        data: { message: "Your teacher has answered your question.", read: false },
      });
    } else {
      await db.notification.create({
        data: { userId: question.authorId, questionId: id, message: "Your teacher has answered your question." },
      });
    }
  }
  await audit("ANSWER", "StudentQuestion", id);
  revalidatePath("/");
  revalidatePath("/questions");
  revalidatePath("/admin/questions");
  revalidatePath("/dashboard");
  revalidatePath("/notifications");
  message("/admin/questions", "Question updated.");
}

export async function archiveQuestion(form: FormData) {
  await requireAdminUser();
  const id = String(form.get("id"));
  await db.studentQuestion.update({ where: { id }, data: { status: "ARCHIVED" } });
  await audit("ARCHIVE", "StudentQuestion", id);
  revalidatePath("/");
  revalidatePath("/questions");
  revalidatePath("/admin/questions");
  revalidatePath("/dashboard");
  message("/admin/questions", "Question archived.");
}

export async function submitQuestion(form: FormData) {
  const sessionUser = await getOptionalUser();
  const data = questionSchema.safeParse({
    question: form.get("question"),
    name: optional(form.get("name")),
    email: optional(form.get("email")),
    bookId: optional(form.get("bookId")),
  });
  if (!data.success) return message("/questions", data.error.issues[0]?.message ?? "Please review your question.");

  let authorId: string | null = null;
  let authorName: string | null = null;
  let authorEmail: string | null = null;

  if (sessionUser?.id) {
    const dbUser = await db.user.findUnique({
      where: { id: sessionUser.id },
      select: { id: true, name: true, email: true },
    });
    if (dbUser) {
      authorId = dbUser.id;
      authorName = dbUser.name;
      authorEmail = dbUser.email;
    }
  }

  const question = await db.studentQuestion.create({
    data: {
      question: data.data.question,
      name: authorName || sessionUser?.name || data.data.name || null,
      email: authorEmail || sessionUser?.email || data.data.email || null,
      authorId,
      bookId: data.data.bookId || null,
    },
  });

  revalidatePath("/questions");
  revalidatePath("/admin/questions");
  revalidatePath("/dashboard");
  if (data.data.bookId) {
    const book = await db.book.findUnique({ where: { id: data.data.bookId }, select: { slug: true } });
    if (book) revalidatePath(`/library/${book.slug}`);
  }

  const returnUrl = optional(form.get("returnUrl")) || "/questions";
  message(returnUrl, "Your question was received. An educator will respond soon.");
}

// ----------------------------------------------------
// STUDENT AUTHENTICATION & DASHBOARD ACTIONS
// ----------------------------------------------------

export async function registerStudent(form: FormData) {
  const data = registerSchema.safeParse({
    name: form.get("name"),
    email: form.get("email"),
    password: form.get("password"),
    classId: optional(form.get("classId")),
  });

  if (!data.success) {
    return message("/register", data.error.issues[0]?.message ?? "Invalid registration details.");
  }

  const normalizedEmail = data.data.email.toLowerCase();
  const existing = await db.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return message("/register", "An account with this email address already exists. Please log in.");
  }

  const passwordHash = await bcrypt.hash(data.data.password, 10);
  await db.user.create({
    data: {
      name: data.data.name,
      email: normalizedEmail,
      passwordHash,
      role: "STUDENT",
      classId: data.data.classId || null,
    },
  });

  message("/login", "Registration successful! You can now sign in with your email and password.");
}

export async function updateStudentProfile(form: FormData) {
  const session = await requireUser();
  const userId = session.user!.id!;

  const data = profileSchema.safeParse({
    name: form.get("name"),
    classId: optional(form.get("classId")),
    currentPassword: optional(form.get("currentPassword")),
    newPassword: optional(form.get("newPassword")),
  });

  if (!data.success) {
    return message("/profile", data.error.issues[0]?.message ?? "Invalid profile updates.");
  }

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return message("/login", "User account not found.");

  let passwordHash = user.passwordHash;
  if (data.data.newPassword) {
    if (!data.data.currentPassword) {
      return message("/profile", "Please enter your current password to set a new password.");
    }
    const isValid = await bcrypt.compare(data.data.currentPassword, user.passwordHash);
    if (!isValid) {
      return message("/profile", "Your current password does not match.");
    }
    passwordHash = await bcrypt.hash(data.data.newPassword, 10);
  }

  await db.user.update({
    where: { id: userId },
    data: {
      name: data.data.name,
      classId: data.data.classId || null,
      passwordHash,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/profile");
  message("/profile", "Profile details updated successfully.");
}

export async function trackLearningProgress(form: FormData) {
  const session = await requireUser();
  const userId = session.user!.id!;

  const bookId = optional(form.get("bookId"));
  const videoId = optional(form.get("videoId"));
  const status = (optional(form.get("status")) as "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED") || "IN_PROGRESS";

  if (bookId) {
    await db.learningProgress.upsert({
      where: { userId_bookId: { userId, bookId } },
      update: { status, lastAccessedAt: new Date() },
      create: { userId, bookId, status, lastAccessedAt: new Date() },
    });
  } else if (videoId) {
    await db.learningProgress.upsert({
      where: { userId_videoId: { userId, videoId } },
      update: { status, lastAccessedAt: new Date() },
      create: { userId, videoId, status, lastAccessedAt: new Date() },
    });
  }

  revalidatePath("/dashboard");
  const returnUrl = optional(form.get("returnUrl"));
  if (returnUrl) redirect(returnUrl);
}

export async function toggleProgressCompleted(form: FormData) {
  const session = await requireUser();
  const userId = session.user!.id!;

  const bookId = optional(form.get("bookId"));
  const videoId = optional(form.get("videoId"));
  const currentStatus = optional(form.get("currentStatus"));
  const nextStatus = currentStatus === "COMPLETED" ? "IN_PROGRESS" : "COMPLETED";

  if (bookId) {
    await db.learningProgress.upsert({
      where: { userId_bookId: { userId, bookId } },
      update: { status: nextStatus, lastAccessedAt: new Date() },
      create: { userId, bookId, status: nextStatus, lastAccessedAt: new Date() },
    });
    const book = await db.book.findUnique({ where: { id: bookId }, select: { slug: true } });
    if (book) revalidatePath(`/library/${book.slug}`);
  } else if (videoId) {
    await db.learningProgress.upsert({
      where: { userId_videoId: { userId, videoId } },
      update: { status: nextStatus, lastAccessedAt: new Date() },
      create: { userId, videoId, status: nextStatus, lastAccessedAt: new Date() },
    });
    revalidatePath(`/videos/${videoId}`);
  }

  revalidatePath("/dashboard");
  const returnUrl = optional(form.get("returnUrl"));
  if (returnUrl) {
    message(returnUrl, nextStatus === "COMPLETED" ? "Marked as Completed! 🎉" : "Marked as In Progress.");
  }
}

// ----------------------------------------------------
// NOTIFICATION ACTIONS
// ----------------------------------------------------

export async function markNotificationRead(form: FormData) {
  const session = await requireUser();
  const userId = session.user!.id!;
  const notificationId = String(form.get("notificationId"));
  await db.notification.updateMany({
    where: { id: notificationId, userId },
    data: { read: true },
  });
  revalidatePath("/notifications");
  revalidatePath("/dashboard");
  const returnUrl = optional(form.get("returnUrl"));
  if (returnUrl) redirect(returnUrl);
}

export async function markAllNotificationsRead() {
  const session = await requireUser();
  const userId = session.user!.id!;
  await db.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
  revalidatePath("/notifications");
  revalidatePath("/dashboard");
}

// ----------------------------------------------------
// NOTES ACTIONS
// ----------------------------------------------------

async function uniqueNoteSlug(value: string, excludedId?: string) {
  const base = slugify(value) || "note";
  for (let index = 0; index < 100; index++) {
    const slug = index ? `${base}-${index + 1}` : base;
    const item = await db.note.findUnique({ where: { slug }, select: { id: true } });
    if (!item || item.id === excludedId) return slug;
  }
  return `${base}-${Date.now()}`;
}

export async function createNote(form: FormData) {
  await requireAdminUser();
  const data = noteSchema.safeParse({
    title: form.get("title"),
    description: form.get("description"),
  });
  if (!data.success) return message("/admin/notes", data.error.issues[0]?.message ?? "Invalid note data.");

  const pdfFile = form.get("pdf") as File;
  if (!pdfFile || !pdfFile.size) return message("/admin/notes", "Please upload a PDF file.");

  const saved = await saveUpload(pdfFile, "pdf");
  if (!saved) return message("/admin/notes", "PDF upload failed.");

  const slug = await uniqueNoteSlug(data.data.title);
  await db.note.create({
    data: {
      title: data.data.title,
      slug,
      pdfUrl: saved.storageKey,
      pdfFileName: saved.fileName,
      description: data.data.description || null,
    },
  });

  await audit("CREATE", "Note", slug);
  revalidatePath("/notes");
  revalidatePath("/admin/notes");
  message("/admin/notes", "Note created.");
}

export async function updateNote(form: FormData) {
  await requireAdminUser();
  const id = String(form.get("id"));
  const data = noteSchema.safeParse({
    title: form.get("title"),
    description: form.get("description"),
  });
  if (!data.success) return message("/admin/notes", data.error.issues[0]?.message ?? "Invalid note data.");

  const existing = await db.note.findUnique({ where: { id }, select: { id: true, slug: true, pdfUrl: true } });
  if (!existing) return message("/admin/notes", "Note not found.");

  const slug = await uniqueNoteSlug(data.data.title, id);

  let pdfUrl = existing.pdfUrl;
  let pdfFileName = undefined;
  const pdfFile = form.get("pdf") as File;
  if (pdfFile && pdfFile.size) {
    const saved = await saveUpload(pdfFile, "pdf");
    if (saved) {
      await removeUpload(existing.pdfUrl);
      pdfUrl = saved.storageKey;
      pdfFileName = saved.fileName;
    }
  }

  await db.note.update({
    where: { id },
    data: {
      title: data.data.title,
      slug,
      description: data.data.description || null,
      pdfUrl,
      ...(pdfFileName !== undefined ? { pdfFileName } : {}),
    },
  });

  await audit("UPDATE", "Note", id);
  revalidatePath("/notes");
  revalidatePath(`/notes/${slug}`);
  revalidatePath("/admin/notes");
  message("/admin/notes", "Note updated.");
}

export async function deleteNote(form: FormData) {
  await requireAdminUser();
  const id = String(form.get("id"));
  const note = await db.note.findUnique({ where: { id }, select: { id: true, pdfUrl: true } });
  if (note) {
    await removeUpload(note.pdfUrl);
    await db.note.delete({ where: { id } });
    await audit("DELETE", "Note", id);
  }
  revalidatePath("/notes");
  revalidatePath("/admin/notes");
  message("/admin/notes", "Note deleted.");
}
