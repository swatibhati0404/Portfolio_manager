
import { useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../api";

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function clearMessages() {
    setMessage("");
    setError("");
  }

  async function sendOTP(e) {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    try {
      const data = await apiRequest("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      setMessage(data.message || "If this email is registered, an OTP will be sent.");
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function verifyOTP(e) {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    try {
      const data = await apiRequest("/auth/verify-reset-otp", {
        method: "POST",
        body: JSON.stringify({ email, otp }),
      });

      setResetToken(data.resetToken);
      setMessage("OTP verified successfully. Set your new password.");
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function resendOTP() {
    clearMessages();
    setLoading(true);

    try {
      const data = await apiRequest("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      setMessage(data.message || "If this email is registered, an OTP will be sent.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(e) {
    e.preventDefault();
    clearMessages();

    if (newPassword.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const data = await apiRequest("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ resetToken, newPassword }),
      });

      setMessage(data.message || "Password reset successfully.");
      setStep(4);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

  const buttonClass =
    "w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl shadow-indigo-100/60">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-indigo-700">SkillBridge</h1>
          <p className="mt-2 text-sm text-gray-500">
            Reset your account password
          </p>
        </div>

        <div className="mb-6 flex items-center justify-center gap-2">
          {[1, 2, 3].map((number) => (
            <div
              key={number}
              className={`h-2 w-12 rounded-full ${
                step >= number ? "bg-indigo-600" : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        {step === 1 && (
          <>
            <h2 className="mb-2 text-xl font-bold text-gray-800">
              Forgot password?
            </h2>
            <p className="mb-6 text-sm text-gray-500">
              Enter your registered email address. We'll send you a one-time password.
            </p>

            <form onSubmit={sendOTP} className="space-y-4">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your registered email"
                className={inputClass}
              />
              <button disabled={loading} className={buttonClass}>
                {loading ? "Sending..." : "Send OTP"}
              </button>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="mb-2 text-xl font-bold text-gray-800">
              Verify OTP
            </h2>
            <p className="mb-6 text-sm text-gray-500">
              Enter the 6-digit OTP sent to <strong>{email}</strong>.
            </p>

            <form onSubmit={verifyOTP} className="space-y-4">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter 6-digit OTP"
                className={`${inputClass} text-center text-xl tracking-[0.5em]`}
              />
              <button disabled={loading || otp.length !== 6} className={buttonClass}>
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
            </form>

            <button
              type="button"
              onClick={resendOTP}
              disabled={loading}
              className="mt-4 w-full text-sm font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
            >
              Resend OTP
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="mb-2 text-xl font-bold text-gray-800">
              Create new password
            </h2>
            <p className="mb-6 text-sm text-gray-500">
              Choose a new password for your SkillBridge account.
            </p>

            <form onSubmit={resetPassword} className="space-y-4">
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                className={inputClass}
              />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className={inputClass}
              />
              <button disabled={loading} className={buttonClass}>
                {loading ? "Updating..." : "Reset Password"}
              </button>
            </form>
          </>
        )}

        {step === 4 && (
          <div className="py-4 text-center">
            <div className="mb-4 text-5xl text-green-500">✓</div>
            <h2 className="text-xl font-bold text-gray-800">
              Password reset successful!
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              You can now log in using your new password.
            </p>
            <Link to="/login" className={`${buttonClass} mt-6 block`}>
              Back to Login
            </Link>
          </div>
        )}

        {message && step !== 4 && (
          <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
            {message}
          </p>
        )}

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </p>
        )}

        {step !== 4 && (
          <p className="mt-6 text-center text-sm text-gray-500">
            Remember your password?{" "}
            <Link to="/login" className="font-semibold text-indigo-600 hover:underline">
              Back to Login
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
