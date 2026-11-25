
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../api";
import StudentSidebar from "../components/StudentSidebar";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const [artifacts, setArtifacts] = useState([]);
  const [profile, setProfile] = useState(user);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [projects, profileData] = await Promise.all([
          apiRequest("/artifacts"),
          apiRequest("/users/me"),
        ]);

        setArtifacts(projects);
        setProfile(profileData);
      } catch (error) {
        console.error("Dashboard loading error:", error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  const verified = artifacts.filter(
    (item) => item.status === "verified"
  ).length;

  const pending = artifacts.filter(
    (item) => item.status === "pending"
  ).length;

  const completedFields = [
    profile?.name,
    profile?.bio,
    profile?.degree,
    profile?.university,
    profile?.github_url,
    profile?.linkedin_url,
  ].filter(Boolean).length;

  const completion = Math.round((completedFields / 6) * 100);

  const stats = [
    { title: "Total Projects", value: artifacts.length, icon: "▤" },
    { title: "Verified Projects", value: verified, icon: "✓" },
    { title: "Pending Reviews", value: pending, icon: "◷" },
  ];

  return (
    <div className="flex min-h-screen bg-[#F7F5EF]">
      <StudentSidebar user={profile} onLogout={logout} />

      <main className="ml-64 min-w-0 flex-1 px-8 py-8 lg:px-12">

        <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold tracking-wider text-[#244C3A]">
              STUDENT WORKSPACE
            </p>

            <h2 className="mt-2 text-3xl font-bold text-[#303B36]">
              Welcome back, {profile?.name || "Student"}!
            </h2>

            <p className="mt-2 text-[#78827B]">
              Your skills. Your projects. Your professional identity.
            </p>
          </div>

          <button
            onClick={() => navigate("/student/profile")}
            className="rounded-lg bg-[#244C3A] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#193B2C]"
          >
            Edit Profile →
          </button>
        </header>

        {/* Portfolio banner */}
        <section className="mb-8 overflow-hidden rounded-xl bg-[#244C3A] p-7 text-white">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <p className="text-sm font-semibold tracking-wider text-[#D6A75D]">
                YOUR PORTFOLIO
              </p>

              <h3 className="mt-2 text-2xl font-bold">
                Build your professional identity
              </h3>

              <p className="mt-2 max-w-xl text-sm leading-6 text-[#DCE5DE]">
                Complete your profile, showcase your work and get your skills
                recognized by faculty.
              </p>

              <button
                onClick={() => navigate("/student/profile")}
                className="mt-5 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-[#244C3A] transition hover:bg-[#E7EDE7]"
              >
                Complete Profile
              </button>
            </div>

            <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-[#C5D5C9] bg-[#315D48]">
              <div className="text-center">
                <p className="text-3xl font-bold">{completion}%</p>
                <p className="text-xs text-[#DCE5DE]">Complete</p>
              </div>
            </div>
          </div>
        </section>

        {/* Statistics */}
        <section className="mb-8 grid gap-5 sm:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.title}
              className="rounded-xl border border-[#E5E7E1] bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-[#78827B]">{stat.title}</p>
                <span className="text-2xl font-semibold text-[#244C3A]">
                  {stat.icon}
                </span>
              </div>

              <p className="mt-4 text-3xl font-bold text-[#303B36]">
                {loading ? "..." : stat.value}
              </p>
            </div>
          ))}
        </section>

        {/* Profile strength */}
        <section className="mb-8 rounded-xl border border-[#E5E7E1] bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-[#303B36]">
              Profile Strength
            </h3>

            <span className="font-semibold text-[#244C3A]">
              {completion}%
            </span>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-[#E7EDE7]">
            <div
              className="h-full rounded-full bg-[#244C3A] transition-all"
              style={{ width: `${completion}%` }}
            />
          </div>

          <p className="mt-3 text-sm text-[#78827B]">
            Add your bio, academic information and social links to strengthen
            your portfolio.
          </p>
        </section>

        {/* Recent projects */}
        <section className="rounded-xl border border-[#E5E7E1] bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#303B36]">
              Recent Projects
            </h3>

            <button
              onClick={() => navigate("/student/projects")}
              className="text-sm font-semibold text-[#244C3A] hover:underline"
            >
              View all →
            </button>
          </div>

          {loading ? (
            <p className="text-[#78827B]">Loading projects...</p>
          ) : artifacts.length === 0 ? (
            <p className="rounded-lg bg-[#F7F5EF] p-6 text-center text-[#78827B]">
              No projects submitted yet. Start building your portfolio!
            </p>
          ) : (
            <div className="space-y-3">
              {artifacts.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#E5E7E1] p-4"
                >
                  <div>
                    <p className="font-semibold text-[#303B36]">
                      {item.title}
                    </p>

                    <p className="mt-1 text-xs text-[#78827B]">
                      {(item.skills || [])
                        .map((skill) => skill.skill_name)
                        .join(" · ")}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                      item.status === "verified"
                        ? "bg-[#E7EDE7] text-[#244C3A]"
                        : item.status === "rejected"
                          ? "bg-[#FCEDEA] text-[#A94438]"
                          : "bg-[#F8F0DF] text-[#946B27]"
                    }`}
                  >
                    {item.status}
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
