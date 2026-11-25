
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../api";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    degree: "",
    cgpa: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          cgpa: form.cgpa || null,
        }),
      });

      alert("Account created successfully! Please log in.");
      navigate("/login");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const inputStyle =
    "w-full px-4 py-3 rounded-lg border border-[#E5E7E1] bg-white text-[#303B36] placeholder:text-[#A0A9A2] outline-none focus:border-[#244C3A] focus:ring-2 focus:ring-[#E7EDE7] transition";

  const labelStyle = "block text-sm font-semibold text-[#46534B] mb-2";

  return (
    <main className="min-h-screen grid lg:grid-cols-2 bg-[#F7F5EF]">

      <section className="hidden lg:flex flex-col justify-between bg-[#244C3A] text-white p-14">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-white text-[#244C3A] rounded-xl flex items-center justify-center text-xl font-bold">
            S
          </div>
          <span className="text-2xl font-bold tracking-tight">
            SkillBridge
          </span>
        </div>

        <div className="max-w-lg">
          <p className="text-[#D6A75D] uppercase tracking-widest text-sm font-semibold">
            Start your journey
          </p>

          <h1 className="text-5xl font-bold leading-tight mt-5">
            Turn your learning into{" "}
            <span className="text-[#D6A75D]">opportunity.</span>
          </h1>

          <p className="text-[#DCE5DE] text-lg mt-6 leading-8">
            Create your portfolio, submit projects, and get your skills
            verified by faculty. Build a record of what you can do.
          </p>

          <div className="mt-10 border-l-2 border-[#D6A75D] pl-5">
            <p className="text-white font-medium">
              Learn. Build. Showcase.
            </p>
            <p className="text-[#C5D5C9] text-sm mt-1">
              Your academic journey, organised in one place.
            </p>
          </div>
        </div>

        <p className="text-[#C5D5C9] text-sm">
          © 2026 SkillBridge
        </p>
      </section>

      <section className="flex items-center justify-center px-6 py-12 bg-[#F7F5EF]">
        <div className="w-full max-w-md">

          <div className="mb-8">
            <p className="text-[#244C3A] text-sm font-semibold tracking-wider mb-3">
              CREATE YOUR ACCOUNT
            </p>

            <h2 className="text-4xl font-bold text-[#303B36]">
              Join SkillBridge
            </h2>

            <p className="text-[#78827B] mt-3">
              Set up your profile and start showcasing your abilities.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className={labelStyle}>Full name</label>
              <input
                name="name"
                required
                placeholder="Your full name"
                className={inputStyle}
                value={form.name}
                onChange={update}
              />
            </div>

            <div>
              <label className={labelStyle}>Email address</label>
              <input
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                className={inputStyle}
                value={form.email}
                onChange={update}
              />
            </div>

            <div>
              <label className={labelStyle}>Password</label>
              <input
                name="password"
                type="password"
                minLength={6}
                required
                placeholder="At least 6 characters"
                className={inputStyle}
                value={form.password}
                onChange={update}
              />
            </div>

            <div>
              <label className={labelStyle}>Register as</label>
              <select
                name="role"
                className={inputStyle}
                value={form.role}
                onChange={update}
              >
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
              </select>
            </div>

            {form.role === "student" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelStyle}>Degree</label>
                  <input
                    name="degree"
                    placeholder="B.Tech CSE"
                    className={inputStyle}
                    value={form.degree}
                    onChange={update}
                  />
                </div>

                <div>
                  <label className={labelStyle}>CGPA</label>
                  <input
                    name="cgpa"
                    type="number"
                    min="0"
                    max="10"
                    step="0.01"
                    placeholder="8.50"
                    className={inputStyle}
                    value={form.cgpa}
                    onChange={update}
                  />
                </div>
              </div>
            )}

            {error && (
              <p className="bg-[#FCEDEA] text-[#A94438] border border-[#F2D5D0] p-3 rounded-lg text-sm">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#244C3A] hover:bg-[#193B2C] text-white font-semibold py-4 rounded-lg transition disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create Account →"}
            </button>
          </form>

          <p className="text-center text-sm text-[#78827B] mt-7">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-[#244C3A] font-semibold hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
