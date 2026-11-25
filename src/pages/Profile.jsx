
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../api";
import StudentSidebar from "../components/StudentSidebar";

export default function Profile() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    degree: "",
    cgpa: "",
    bio: "",
    university: "",
    github_url: "",
    linkedin_url: "",
    portfolio_url: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await apiRequest("/users/me");
        setProfile({
          name: data.name || "",
          email: data.email || "",
          degree: data.degree || "",
          cgpa: data.cgpa ?? "",
          bio: data.bio || "",
          university: data.university || "",
          github_url: data.github_url || "",
          linkedin_url: data.linkedin_url || "",
          portfolio_url: data.portfolio_url || "",
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  function handleChange(e) {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const result = await apiRequest("/users/me", {
        method: "PUT",
        body: JSON.stringify({
          ...profile,
          cgpa: profile.cgpa === "" ? null : Number(profile.cgpa),
        }),
      });

      setProfile({
        ...profile,
        ...result.user,
        cgpa: result.user.cgpa ?? "",
      });

      localStorage.setItem("user", JSON.stringify(result.user));
      setMessage("Your profile has been updated successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  const completionFields = [
    profile.name,
    profile.bio,
    profile.degree,
    profile.university,
    profile.github_url,
    profile.linkedin_url,
    profile.portfolio_url,
  ];

  const completion = Math.round(
    (completionFields.filter(Boolean).length / completionFields.length) * 100
  );

const inputClass =
  "w-full rounded-lg border border-[#E5E7E1] bg-white px-4 py-3 text-sm text-[#303B36] outline-none transition placeholder:text-[#A0A9A2] focus:border-[#244C3A] focus:bg-white focus:ring-2 focus:ring-[#E7EDE7]";

  if (loading) {
    return <div className="p-10 text-[#78827B]">Loading profile...</div>;
  }

  return (
    <div className="flex min-h-screen bg-[#F7F5EF]">
      <StudentSidebar
        user={profile}
        onLogout={logout}
      />

      <main className="ml-64 min-w-0 flex-1 px-6 py-10 lg:px-12">
        <div className="mb-8">
          <p className="text-sm font-semibold text-[#244C3A]">
            YOUR PROFESSIONAL IDENTITY
          </p>
          <h1 className="mt-2 text-3xl font-bold text-[#303B36]">
            My Profile
          </h1>
          <p className="mt-2 text-[#78827B]">
            Build a professional profile that represents your skills and work.
          </p>
        </div>

        <div className="mb-8 grid gap-6 lg:grid-cols-3">
          <section className="rounded-2xl border border-[#E5E7E1] bg-white p-6 shadow-sm lg:col-span-2">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E7EDE7] text-2xl font-bold text-[#244C3A]">
                {profile.name?.charAt(0)?.toUpperCase() || "S"}
              </div>

              <div>
                <h2 className="text-xl font-bold text-[#303B36]">
                  {profile.name || "Your Name"}
                </h2>
                <p className="text-sm text-[#78827B]">{profile.email}</p>
                <p className="mt-1 text-xs font-medium text-[#244C3A]">
                  STUDENT PROFILE
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[#E5E7E1] bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-[#78827B]">
              Profile completion
            </p>
            <p className="mt-2 text-3xl font-bold text-[#244C3A]">
              {completion}%
            </p>
            <div className="mt-4 h-2.5 rounded-full bg-[#F7F5EF]">
              <div
                className="h-2.5 rounded-full bg-[#244C3A] transition-all"
                style={{ width: `${completion}%` }}
              />
            </div>
            <p className="mt-3 text-xs text-[#78827B]">
              Complete all profile fields to improve your portfolio.
            </p>
          </section>
        </div>

        <form onSubmit={handleSave} className="space-y-7">
          <section className="rounded-2xl border border-[#E5E7E1] bg-white p-7 shadow-sm">
            <h2 className="mb-6 text-lg font-bold text-[#303B36]">
              Personal Information
            </h2>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#46534B]">
                  Full Name
                </label>
                <input
                  name="name"
                  required
                  value={profile.name}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#46534B]">
                  Email Address
                </label>
                <input
                  value={profile.email}
                  disabled
                  className={`${inputClass} cursor-not-allowed opacity-60`}
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-[#46534B]">
                  Professional Bio
                </label>
                <textarea
                  name="bio"
                  rows="4"
                  maxLength="1000"
                  placeholder="Tell us about yourself, your interests and what you are passionate about..."
                  value={profile.bio}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[#E5E7E1] bg-white p-7 shadow-sm">
            <h2 className="mb-6 text-lg font-bold text-[#303B36]">
              Academic Information
            </h2>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#46534B]">
                  University / College
                </label>
                <input
                  name="university"
                  placeholder="Enter your university"
                  value={profile.university}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#46534B]">
                  Degree / Specialization
                </label>
                <input
                  name="degree"
                  placeholder="e.g. B.Tech Computer Science"
                  value={profile.degree}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#46534B]">
                  CGPA (out of 10)
                </label>
                <input
                  name="cgpa"
                  type="number"
                  min="0"
                  max="10"
                  step="0.01"
                  placeholder="e.g. 8.5"
                  value={profile.cgpa}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[#E5E7E1] bg-white p-7 shadow-sm">
            <h2 className="mb-2 text-lg font-bold text-[#303B36]">
              Professional Links
            </h2>
            <p className="mb-6 text-sm text-[#78827B]">
              Connect your professional profiles and portfolio.
            </p>

            <div className="space-y-5">
              {[
                ["github_url", "GitHub Profile", "https://github.com/username"],
                ["linkedin_url", "LinkedIn Profile", "https://linkedin.com/in/username"],
                ["portfolio_url", "Personal Website", "https://yourwebsite.com"],
              ].map(([name, label, placeholder]) => (
                <div key={name}>
                  <label className="mb-2 block text-sm font-medium text-[#46534B]">
                    {label}
                  </label>
                  <input
                    type="url"
                    name={name}
                    placeholder={placeholder}
                    value={profile[name]}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
          </section>

          {message && (
            <p className="rounded-xl bg-green-50 p-4 text-sm text-green-700">
              {message}
            </p>
          )}

          {error && (
            <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#244C3A] px-8 py-3 font-semibold text-white shadow-lg shadow-indigo-200 hover:bg-[#193B2C] disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Profile Changes"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
