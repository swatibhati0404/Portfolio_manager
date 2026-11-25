
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../api";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify(form),
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      navigate(data.user.role === "faculty" ? "/faculty" : "/student");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen grid lg:grid-cols-2 bg-[#F7F5EF]">

      {/* Left branding panel */}
      <section className="hidden lg:flex flex-col justify-between bg-[#244C3A] text-white p-12 xl:p-16">

        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-[#D6A75D] text-[#244C3A] flex items-center justify-center text-xl font-bold">
            S
          </div>
          <span className="text-2xl font-semibold tracking-tight">
            SkillBridge
          </span>
        </div>

        <div className="max-w-lg">
          <span className="text-[#D6A75D] text-sm font-semibold tracking-[0.2em] uppercase">
            Build. Verify. Grow.
          </span>

          <h1 className="text-5xl xl:text-6xl font-semibold leading-tight mt-5">
            Your skills deserve to be{" "}
            <span className="text-[#D6A75D]">seen.</span>
          </h1>

          <p className="text-[#D5DED7] text-lg mt-6 leading-8">
            A smarter way to showcase projects, validate your abilities,
            and build a portfolio that speaks for itself.
          </p>

          <div className="mt-12 grid grid-cols-2 gap-4">
            <div className="border border-white/15 bg-white/5 rounded-xl p-5">
              <p className="text-3xl font-semibold text-[#D6A75D]">01</p>
              <p className="text-[#D5DED7] text-sm mt-2">
                Showcase your work
              </p>
            </div>

            <div className="border border-white/15 bg-white/5 rounded-xl p-5">
              <p className="text-3xl font-semibold text-[#D6A75D]">02</p>
              <p className="text-[#D5DED7] text-sm mt-2">
                Get skills verified
              </p>
            </div>
          </div>
        </div>

        <p className="text-[#C5D5C9] text-sm">
          © 2026 SkillBridge. Empowering student potential.
        </p>
      </section>

      {/* Login form */}
      <section className="flex items-center justify-center px-6 py-12 bg-[#F7F5EF]">
        <div className="w-full max-w-md">

          <div className="lg:hidden flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-lg bg-[#244C3A] text-white flex items-center justify-center font-bold">
              S
            </div>
            <span className="text-2xl font-semibold text-[#244C3A]">
              SkillBridge
            </span>
          </div>

          <div className="mb-9">
            <p className="text-[#52725F] text-sm font-semibold tracking-wider mb-3">
              WELCOME BACK
            </p>

            <h2 className="text-4xl font-semibold text-[#303B36] tracking-tight">
              Sign in to your account
            </h2>

            <p className="text-[#78827B] mt-3">
              Continue building your professional journey.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="block text-sm font-semibold text-[#303B36] mb-2">
                Email address
              </label>

              <input
                type="email"
                required
                placeholder="you@example.com"
                value={form.email}
                onChange={e =>
                  setForm({ ...form, email: e.target.value })
                }
                className="w-full px-4 py-3.5 rounded-lg border border-[#DDE2DA] bg-white text-[#303B36] placeholder:text-[#A0A9A2] focus:outline-none focus:ring-2 focus:ring-[#C5D5C9] focus:border-[#244C3A] transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#303B36] mb-2">
                Password
              </label>

              <input
                type="password"
                required
                placeholder="Enter your password"
                value={form.password}
                onChange={e =>
                  setForm({ ...form, password: e.target.value })
                }
                className="w-full px-4 py-3.5 rounded-lg border border-[#DDE2DA] bg-white text-[#303B36] placeholder:text-[#A0A9A2] focus:outline-none focus:ring-2 focus:ring-[#C5D5C9] focus:border-[#244C3A] transition"
              />
            </div>

            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-sm font-semibold text-[#315D48] hover:text-[#193B2C] transition"
              >
                Forgot Password?
              </Link>
            </div>

            {error && (
              <div className="bg-[#FCEDEC] text-[#A33D36] border border-[#F2D4D1] rounded-lg p-3 text-sm">
                {error}
              </div>
            )}

            <button
              disabled={loading}
              className="w-full bg-[#244C3A] hover:bg-[#193B2C] text-white font-semibold py-4 rounded-lg transition disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in →"}
            </button>
          </form>

          <div className="flex items-center gap-4 my-8">
            <div className="h-px flex-1 bg-[#E1E4DC]" />
            <span className="text-xs text-[#89938B] tracking-wider">
              NEW TO SKILLBRIDGE?
            </span>
            <div className="h-px flex-1 bg-[#E1E4DC]" />
          </div>

          <Link
            to="/register"
            className="block text-center w-full py-3.5 rounded-lg border border-[#C8D2C9] bg-white hover:bg-[#E7EDE7] text-[#244C3A] font-semibold transition"
          >
            Create an account
          </Link>

          <p className="text-center text-xs text-[#89938B] mt-10">
            By continuing, you agree to use SkillBridge responsibly.
          </p>

        </div>
      </section>
    </main>
  );
}
