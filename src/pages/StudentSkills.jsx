
import { useEffect, useState } from "react";
import { apiRequest } from "../api";
import StudentSidebar from "../components/StudentSidebar";

export default function StudentSkills() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [skillName, setSkillName] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function fetchSkills() {
    try {
      setLoading(true);
      setError("");
      const data = await apiRequest("/users/skills");
      setSkills(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSkills();
  }, []);

  async function handleAddSkill(e) {
    e.preventDefault();

    if (!skillName.trim()) return;

    try {
      setSaving(true);
      setMessage("");
      setError("");

      const result = await apiRequest("/users/skills", {
        method: "POST",
        body: JSON.stringify({ skill_name: skillName.trim() })
      });

      setMessage(result.message || "Skill added successfully!");
      setSkillName("");
      setShowForm(false);
      await fetchSkills();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const verified = skills.filter(s => s.status === "verified").length;
  const pending = skills.filter(s => s.status === "pending").length;
  const rejected = skills.filter(s => s.status === "rejected").length;

  function statusClass(status) {
    if (status === "verified") return "bg-[#E7EDE7] text-[#244C3A]";
    if (status === "rejected") return "bg-[#FCEAE7] text-[#A34D43]";
    return "bg-[#F8F0DF] text-[#9A702D]";
  }

  const stats = [
    { label: "Total Skills", value: skills.length, color: "text-[#244C3A]" },
    { label: "Verified", value: verified, color: "text-[#315D48]" },
    { label: "Pending", value: pending, color: "text-[#A17A38]" },
    { label: "Rejected", value: rejected, color: "text-[#A34D43]" }
  ];

  return (
    <div className="min-h-screen bg-[#F7F5EF]">
      <StudentSidebar />

      <main className="ml-64 min-h-screen p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-[#78827B]">
              Student Workspace
            </p>
            <h1 className="mt-2 text-3xl font-bold text-[#303B36]">
              My Skills
            </h1>
            <p className="mt-2 text-[#78827B]">
              Add your skills and track faculty verification.
            </p>
          </div>

          <button
            onClick={() => {
              setShowForm(!showForm);
              setMessage("");
              setError("");
            }}
            className="rounded-lg bg-[#244C3A] px-5 py-3 font-semibold text-white transition hover:bg-[#193B2C]"
          >
            {showForm ? "Cancel" : "+ Add Skill"}
          </button>
        </div>

        {message && (
          <div className="mt-5 rounded-lg border border-[#D5E3D7] bg-[#E7EDE7] p-4 text-sm text-[#244C3A]">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-lg border border-[#F0D5D1] bg-[#FCEAE7] p-4 text-sm text-[#A34D43]">
            {error}
          </div>
        )}

        {showForm && (
          <form
            onSubmit={handleAddSkill}
            className="mt-8 rounded-xl border border-[#E5E7E1] bg-white p-6"
          >
            <h2 className="text-xl font-bold text-[#303B36]">
              Add a New Skill
            </h2>

            <p className="mt-2 text-sm text-[#78827B]">
              Enter a skill you have learned or demonstrated.
            </p>

            <div className="mt-5 max-w-xl">
              <label className="mb-2 block text-sm font-medium text-[#303B36]">
                Skill Name
              </label>

              <input
                type="text"
                value={skillName}
                onChange={e => setSkillName(e.target.value)}
                placeholder="e.g. Python, SQL, React, Selenium"
                maxLength={100}
                required
                className="w-full rounded-lg border border-[#D9DED8] bg-white px-4 py-3 text-[#303B36] outline-none transition focus:border-[#315D48] focus:ring-2 focus:ring-[#E7EDE7]"
              />
            </div>

            <button
              type="submit"
              disabled={saving || !skillName.trim()}
              className="mt-5 rounded-lg bg-[#244C3A] px-6 py-3 font-semibold text-white transition hover:bg-[#193B2C] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Adding..." : "Submit Skill"}
            </button>

            <p className="mt-3 text-xs text-[#78827B]">
              Newly added skills will have Pending status until faculty reviews them.
            </p>
          </form>
        )}

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(item => (
            <div
              key={item.label}
              className="rounded-xl border border-[#E5E7E1] bg-white p-6"
            >
              <p className="text-sm font-medium text-[#78827B]">
                {item.label}
              </p>
              <p className={`mt-3 text-3xl font-bold ${item.color}`}>
                {item.value}
              </p>
            </div>
          ))}
        </div>

        <section className="mt-8 rounded-xl border border-[#E5E7E1] bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-[#303B36]">
                Your Submitted Skills
              </h2>
              <p className="mt-1 text-sm text-[#78827B]">
                Faculty verification status of your skills.
              </p>
            </div>

            <button
              onClick={fetchSkills}
              disabled={loading}
              className="rounded-lg border border-[#D9DED8] px-4 py-2 text-sm font-medium text-[#244C3A] transition hover:bg-[#F1F4EF] disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {loading ? (
            <p className="py-10 text-center text-[#78827B]">
              Loading skills...
            </p>
          ) : skills.length === 0 ? (
            <p className="py-10 text-center text-[#78827B]">
              No skills added yet. Click Add Skill to get started.
            </p>
          ) : (
            <div className="mt-6 space-y-3">
              {skills.map(skill => (
                <div
                  key={skill.skill_id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-[#E5E7E1] p-5 transition hover:bg-[#FAFAF7]"
                >
                  <div>
                    <h3 className="font-semibold text-[#303B36]">
                      {skill.skill_name}
                    </h3>
                    <p className="mt-1 text-sm text-[#78827B]">
                      {skill.project_title
                        ? `Project: ${skill.project_title}`
                        : "Independently submitted skill"}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-4 py-2 text-xs font-semibold capitalize ${statusClass(skill.status)}`}
                  >
                    {skill.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
