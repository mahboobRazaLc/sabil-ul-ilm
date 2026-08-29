"use client";

import { useRouter } from "next/navigation";
import { updateStudentProfile } from "@/app/actions";

interface ProfileEditFormProps {
  user: {
    name: string | null;
    email: string;
    classId: string | null;
  };
  classes: { id: string; name: string }[];
}

export function ProfileEditForm({ user, classes }: ProfileEditFormProps) {
  const router = useRouter();

  return (
    <form action={updateStudentProfile} className="profile-form">
      <div>
        <label className="profile-field-label">
          Full Name <span className="required">*</span>
        </label>
        <input
          name="name"
          defaultValue={user.name || ""}
          required
          minLength={2}
          maxLength={100}
          className="profile-field-input"
        />
      </div>

      <div>
        <label className="profile-field-label">
          Email Address <span className="profile-field-hint">(Primary Login)</span>
        </label>
        <input
          type="email"
          defaultValue={user.email}
          disabled
          className="profile-field-input"
        />
      </div>

      <div className="full">
        <label className="profile-field-label">
          Enrolled Class / Grade Level
        </label>
        <select name="classId" defaultValue={user.classId || ""} className="profile-field-select">
          <option value="">No specific class selected</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <hr className="profile-divider" />

      <h3 className="profile-section-label">Change Password (Optional)</h3>
      <p className="profile-section-desc">
        Leave blank if you don&apos;t wish to change your password.
      </p>

      <div>
        <label className="profile-field-label">
          Current Password
        </label>
        <input
          name="currentPassword"
          type="password"
          placeholder="Required only to set new password"
          autoComplete="current-password"
          className="profile-field-input"
        />
      </div>

      <div>
        <label className="profile-field-label">
          New Password <span className="profile-field-hint">(min 8 characters)</span>
        </label>
        <input
          name="newPassword"
          type="password"
          minLength={8}
          placeholder="New strong password"
          autoComplete="new-password"
          className="profile-field-input"
        />
      </div>

      <div className="profile-submit-wrap">
        <button className="profile-submit-btn" type="submit">
          Save Changes
        </button>
        <button
          type="button"
          className="profile-cancel-btn"
          onClick={() => router.push("/profile")}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
