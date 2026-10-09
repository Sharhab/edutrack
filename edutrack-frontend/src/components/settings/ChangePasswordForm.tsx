
"use client";

import { useState, type FormEvent } from "react";
import axios from "axios";
import api from "../../lib/axios";

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setError(false);

    if (newPassword.length < 8) {
      setError(true);
      setMessage("Your new password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(true);
      setMessage("The new passwords do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setError(true);
      setMessage("Choose a password different from your current password.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setMessage(
        response.data?.message ||
          "Password changed successfully. Please log in again."
      );

      // The backend requires a fresh login after changing the password.
      localStorage.removeItem("token");

      window.setTimeout(() => {
        window.location.assign("/login");
      }, 1200);
    } catch (err: unknown) {
      setError(true);

      if (axios.isAxiosError(err)) {
        setMessage(
          err.response?.data?.message ||
            "Unable to change your password. Please try again."
        );
      } else {
        setMessage("Unable to change your password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-5">
      <p className="text-sm text-slate-400">
        Change the password for your own EduTrack account. Your current
        password is required to protect your account.
      </p>

      {message && (
        <div
          role="status"
          aria-live="polite"
          className={`rounded-xl border px-4 py-3 text-sm ${
            error
              ? "border-red-500/30 bg-red-500/10 text-red-300"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
          }`}
        >
          {message}
        </div>
      )}

      <div>
        <label
          htmlFor="current-password"
          className="mb-2 block text-sm font-medium text-slate-200"
        >
          Current password
        </label>
        <input
          id="current-password"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          required
          disabled={loading}
          className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500 disabled:opacity-50"
          placeholder="Enter current password"
        />
      </div>

      <div>
        <label
          htmlFor="new-password"
          className="mb-2 block text-sm font-medium text-slate-200"
        >
          New password
        </label>
        <input
          id="new-password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={128}
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          required
          disabled={loading}
          className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500 disabled:opacity-50"
          placeholder="At least 8 characters"
        />
      </div>

      <div>
        <label
          htmlFor="confirm-password"
          className="mb-2 block text-sm font-medium text-slate-200"
        >
          Confirm new password
        </label>
        <input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={128}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
          disabled={loading}
          className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500 disabled:opacity-50"
          placeholder="Enter the new password again"
        />
      </div>

      <button
        type="submit"
        disabled={
          loading ||
          !currentPassword ||
          !newPassword ||
          !confirmPassword
        }
        className="rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Changing password..." : "Change password"}
      </button>
    </form>
  );
}
