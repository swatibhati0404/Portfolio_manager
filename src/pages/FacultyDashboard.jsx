
import { useEffect, useState } from "react";
import { apiRequest } from "../api";
import FacultySidebar from "../components/FacultySidebar";

export default function FacultyDashboard() {
  const [students, setStudents] = useState([]);
  const [unassigned, setUnassigned] = useState([]);
  const [projects, setProjects] = useState([]);
  const [skills, setSkills] = useState([]);
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "null");

  async function loadData() {
    try {
      setLoading(true);

      const [studentData, availableData] = await Promise.all([
        apiRequest("/faculty/students"),
        apiRequest("/faculty/unassigned-students"),
      ]);

      setStudents(studentData);
      setUnassigned(availableData);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadProjects(student) {
    setSelected(student);
    setTab("projects");
    setProjects([]);

    try {
      const data = await apiRequest(`/artifacts?student_id=${student.id}`);
      setProjects(data);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function loadSkills(student) {
    setSelected(student);
    setTab("skills");
    setSkills([]);

    try {
      const data = await apiRequest(
        `/faculty/students/${student.id}/skills`
      );
      setSkills(data);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function assignStudent(studentId) {
    try {
      await apiRequest(`/faculty/assign/${studentId}`, {
        method: "POST",
      });

      setMessage("Student assigned successfully.");
      await loadData();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function updateStatus(projectId, status) {
    try {
      await apiRequest(`/artifacts/${projectId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });

      if (selected) {
        const data = await apiRequest(
          `/artifacts?student_id=${selected.id}`
        );
        setProjects(data);
      }

      setMessage(`Project ${status} successfully.`);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function updateSkillStatus(skillId, status) {
    try {
      await apiRequest(`/skills/${skillId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });

      if (selected) {
        const data = await apiRequest(
          `/faculty/students/${selected.id}/skills`
        );
        setSkills(data);
      }

      setMessage(`Skill ${status} successfully.`);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function downloadFile(url, filename) {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5000/api${url}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Download failed");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const pendingProjects = projects.filter(
    (project) => project.status === "pending"
  ).length;

  const pendingSkills = skills.filter(
    (skill) => skill.status === "pending"
  ).length;

  const verifiedSkills = skills.filter(
    (skill) => skill.status === "verified"
  ).length;

  function statusStyle(status) {
    if (status === "verified") {
      return "bg-[#E7EDE7] text-[#244C3A]";
    }

    if (status === "rejected") {
      return "bg-[#FCEAE7] text-[#A34D43]";
    }

    return "bg-[#F8F0DF] text-[#9A702D]";
  }

  function StatCard({ title, value, description, icon }) {
    return (
      <div className="rounded-xl border border-[#E5E7E1] bg-white p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-[#78827B]">{title}</p>
            <p className="mt-3 text-3xl font-bold text-[#244C3A]">
              {value}
            </p>
            <p className="mt-2 text-xs text-[#78827B]">{description}</p>
          </div>

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E7EDE7] text-xl text-[#244C3A]">
            {icon}
          </div>
        </div>
      </div>
    );
  }

  function StudentSelector({ action }) {
    return (
      <section className="rounded-xl border border-[#E5E7E1] bg-white p-6">
        <h3 className="text-xl font-bold text-[#303B36]">
          Select a student
        </h3>

        <p className="mt-1 text-sm text-[#78827B]">
          Choose an assigned student to {action}.
        </p>

        {students.length === 0 ? (
          <p className="py-10 text-center text-[#78827B]">
            You don't have any assigned students yet.
          </p>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {students.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-[#E5E7E1] p-4"
              >
                <div>
                  <p className="font-semibold text-[#303B36]">
                    {student.name}
                  </p>
                  <p className="text-sm text-[#78827B]">
                    {student.email}
                  </p>
                </div>

                <button
                  onClick={() =>
                    action === "review projects"
                      ? loadProjects(student)
                      : loadSkills(student)
                  }
                  className="rounded-lg bg-[#244C3A] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#193B2C]"
                >
                  Select
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    );
  }

  const heading = {
    overview: {
      label: "FACULTY DASHBOARD",
      title: `Welcome back, ${user?.name || "Faculty"}`,
      description:
        "Manage your students, review their work and track their skills.",
    },
    students: {
      label: "STUDENT MANAGEMENT",
      title: "My Students",
      description: "View and manage students assigned to you.",
    },
    assign: {
      label: "ASSIGNMENT",
      title: "Assign Students",
      description: "Assign available students to your faculty account.",
    },
    projects: {
      label: "PROJECT REVIEW",
      title: "Projects Review",
      description:
        "Review student projects and approve or reject submissions.",
    },
    skills: {
      label: "SKILL VERIFICATION",
      title: "Skill Verification",
      description: "Verify the skills demonstrated through student projects.",
    },
  };

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#303B36]">
      <FacultySidebar
        activeTab={tab}
        onTabChange={(nextTab) => {
          setTab(nextTab);
          setMessage("");
          setSelected(null);
        }}
      />

      <main className="ml-64 min-h-screen">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5E7E1] bg-white px-8 py-5">
          <div>
            <h1 className="text-xl font-bold text-[#303B36]">
              Faculty Workspace
            </h1>
            <p className="mt-1 text-sm text-[#78827B]">
              Student Skill and Portfolio Management
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E7EDE7] font-bold text-[#244C3A]">
              {user?.name?.charAt(0)?.toUpperCase() || "F"}
            </div>

            <div>
              <p className="text-sm font-semibold text-[#303B36]">
                {user?.name || "Faculty"}
              </p>
              <p className="text-xs text-[#78827B]">Faculty Account</p>
            </div>
          </div>
        </header>

        <div className="p-6 md:p-8">
          <div className="mb-8">
            <p className="text-sm font-semibold tracking-wider text-[#78827B]">
              {heading[tab]?.label}
            </p>

            <h2 className="mt-2 text-3xl font-bold text-[#303B36]">
              {heading[tab]?.title}
            </h2>

            <p className="mt-2 text-[#78827B]">
              {heading[tab]?.description}
            </p>
          </div>

          {message && (
            <div className="mb-6 flex items-center justify-between rounded-lg border border-[#D5E3D7] bg-[#E7EDE7] p-4 text-sm text-[#244C3A]">
              <span>{message}</span>
              <button
                onClick={() => setMessage("")}
                className="ml-4 text-lg font-bold"
              >
                ×
              </button>
            </div>
          )}

          {loading ? (
            <div className="rounded-xl border border-[#E5E7E1] bg-white py-16 text-center text-[#78827B]">
              Loading faculty workspace...
            </div>
          ) : (
            <>
              {tab === "overview" && (
                <>
                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    <StatCard
                      title="Assigned Students"
                      value={students.length}
                      description="Students under your guidance"
                      icon="♙"
                    />

                    <StatCard
                      title="Available Students"
                      value={unassigned.length}
                      description="Students waiting to be assigned"
                      icon="＋"
                    />

                    <StatCard
                      title="Pending Project Reviews"
                      value="—"
                      description="Select a student to view pending projects"
                      icon="▣"
                    />
                  </div>

                  <div className="mt-8 grid gap-6 xl:grid-cols-2">
                    <section className="rounded-xl border border-[#E5E7E1] bg-white p-6">
                      <h3 className="text-lg font-bold text-[#303B36]">
                        Quick Actions
                      </h3>

                      <p className="mt-1 text-sm text-[#78827B]">
                        Jump directly to your workspace tasks.
                      </p>

                      <div className="mt-6 space-y-3">
                        {[
                          ["View My Students", "students"],
                          ["Assign New Students", "assign"],
                          ["Review Projects", "projects"],
                          ["Verify Student Skills", "skills"],
                        ].map(([label, nextTab]) => (
                          <button
                            key={nextTab}
                            onClick={() => {
                              setTab(nextTab);
                              setSelected(null);
                            }}
                            className="flex w-full items-center justify-between rounded-lg border border-[#E5E7E1] p-4 text-left transition hover:border-[#B8C9BC] hover:bg-[#F1F4EF]"
                          >
                            <span className="font-medium text-[#303B36]">
                              {label}
                            </span>
                            <span className="text-[#244C3A]">→</span>
                          </button>
                        ))}
                      </div>
                    </section>

                    <section className="rounded-xl border border-[#E5E7E1] bg-white p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-[#303B36]">
                            Recently Assigned Students
                          </h3>
                          <p className="mt-1 text-sm text-[#78827B]">
                            Your student list
                          </p>
                        </div>

                        <button
                          onClick={() => setTab("students")}
                          className="text-sm font-semibold text-[#244C3A] hover:underline"
                        >
                          View all
                        </button>
                      </div>

                      {students.length === 0 ? (
                        <p className="py-10 text-center text-sm text-[#78827B]">
                          No students assigned yet.
                        </p>
                      ) : (
                        <div className="mt-5 space-y-4">
                          {students.slice(0, 5).map((student) => (
                            <div
                              key={student.id}
                              className="flex items-center justify-between gap-3 border-b border-[#E5E7E1] pb-3 last:border-0"
                            >
                              <div>
                                <p className="font-semibold text-[#303B36]">
                                  {student.name}
                                </p>
                                <p className="text-xs text-[#78827B]">
                                  {student.email}
                                </p>
                              </div>

                              <button
                                onClick={() => loadProjects(student)}
                                className="rounded-lg bg-[#E7EDE7] px-3 py-2 text-xs font-semibold text-[#244C3A] hover:bg-[#DCE7DE]"
                              >
                                Projects
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  </div>
                </>
              )}

              {tab === "students" && (
                <section className="rounded-xl border border-[#E5E7E1] bg-white p-6">
                  <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-bold text-[#303B36]">
                        My Assigned Students
                      </h3>
                      <p className="mt-1 text-sm text-[#78827B]">
                        {students.length} students assigned to you
                      </p>
                    </div>

                    <button
                      onClick={() => setTab("assign")}
                      className="rounded-lg bg-[#244C3A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#193B2C]"
                    >
                      + Assign Student
                    </button>
                  </div>

                  {students.length === 0 ? (
                    <p className="py-10 text-center text-[#78827B]">
                      No students assigned yet. Use Assign Students to get started.
                    </p>
                  ) : (
                    <div className="grid gap-5 md:grid-cols-2">
                      {students.map((student) => (
                        <div
                          key={student.id}
                          className="rounded-lg border border-[#E5E7E1] p-5 transition hover:border-[#C5D5C9]"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-bold text-[#303B36]">
                                {student.name}
                              </h4>
                              <p className="text-sm text-[#78827B]">
                                {student.email}
                              </p>
                            </div>

                            <span className="rounded-full bg-[#E7EDE7] px-3 py-1 text-xs font-semibold text-[#244C3A]">
                              Assigned
                            </span>
                          </div>

                          <div className="mt-4 space-y-1 text-sm text-[#59645D]">
                            <p>{student.degree || "Degree not added"}</p>
                            <p>{student.university || "University not added"}</p>
                            <p>CGPA: {student.cgpa ?? "Not added"}</p>
                            <p>Projects: {student.total_projects}</p>
                          </div>

                          <div className="mt-5 flex flex-wrap gap-2">
                            <button
                              onClick={() => loadProjects(student)}
                              className="rounded-lg bg-[#244C3A] px-3 py-2 text-sm text-white hover:bg-[#193B2C]"
                            >
                              View Projects
                            </button>

                            <button
                              onClick={() => loadSkills(student)}
                              className="rounded-lg border border-[#C5D5C9] px-3 py-2 text-sm text-[#244C3A] hover:bg-[#E7EDE7]"
                            >
                              View Skills
                            </button>

                            {student.resume_original_name ? (
                              <button
                                onClick={() =>
                                  downloadFile(
                                    `/faculty/students/${student.id}/resume`,
                                    student.resume_original_name
                                  )
                                }
                                className="rounded-lg border border-[#D9DED8] px-3 py-2 text-sm text-[#59645D] hover:bg-[#F7F5EF]"
                              >
                                Download Resume
                              </button>
                            ) : (
                              <span className="rounded-lg bg-[#F1F2EF] px-3 py-2 text-xs text-[#78827B]">
                                No resume uploaded
                              </span>
                            )}
                          </div>

                          <div className="mt-4 border-t border-[#E5E7E1] pt-3 text-sm">
                            <p className="font-medium text-[#303B36]">
                              Profile links
                            </p>

                            <div className="mt-2 flex flex-wrap gap-3">
                              {student.github_url && (
                                <a
                                  className="text-[#315D48] hover:underline"
                                  href={student.github_url}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  GitHub
                                </a>
                              )}

                              {student.linkedin_url && (
                                <a
                                  className="text-[#315D48] hover:underline"
                                  href={student.linkedin_url}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  LinkedIn
                                </a>
                              )}

                              {student.portfolio_url && (
                                <a
                                  className="text-[#315D48] hover:underline"
                                  href={student.portfolio_url}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  Portfolio
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {tab === "assign" && (
                <section className="rounded-xl border border-[#E5E7E1] bg-white p-6">
                  <h3 className="text-xl font-bold text-[#303B36]">
                    Unassigned Students
                  </h3>

                  <p className="mt-1 text-sm text-[#78827B]">
                    Select students to add them to your assigned list.
                  </p>

                  {unassigned.length === 0 ? (
                    <p className="py-10 text-center text-[#78827B]">
                      All registered students are currently assigned.
                    </p>
                  ) : (
                    <div className="mt-5 divide-y divide-[#E5E7E1]">
                      {unassigned.map((student) => (
                        <div
                          key={student.id}
                          className="flex flex-wrap items-center justify-between gap-4 py-4"
                        >
                          <div>
                            <p className="font-semibold text-[#303B36]">
                              {student.name}
                            </p>
                            <p className="text-sm text-[#78827B]">
                              {student.email}
                            </p>
                            <p className="text-xs text-[#78827B]">
                              {student.degree || "Degree not added"}
                            </p>
                          </div>

                          <button
                            onClick={() => assignStudent(student.id)}
                            className="rounded-lg bg-[#244C3A] px-4 py-2 text-sm text-white hover:bg-[#193B2C]"
                          >
                            Assign to me
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {tab === "projects" && (
                selected ? (
                  <section className="rounded-xl border border-[#E5E7E1] bg-white p-6">
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-bold text-[#303B36]">
                          Projects — {selected.name}
                        </h3>
                        <p className="mt-1 text-sm text-[#78827B]">
                          {pendingProjects} projects waiting for review
                        </p>
                      </div>

                      <button
                        onClick={() => setSelected(null)}
                        className="rounded-lg border border-[#D9DED8] px-4 py-2 text-sm text-[#59645D] hover:bg-[#F7F5EF]"
                      >
                        Choose another student
                      </button>
                    </div>

                    {projects.length === 0 ? (
                      <p className="py-10 text-center text-[#78827B]">
                        This student has not submitted any projects yet.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {projects.map((project) => (
                          <article
                            key={project.id}
                            className="rounded-lg border border-[#E5E7E1] p-5"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <h4 className="text-lg font-bold text-[#303B36]">
                                  {project.title}
                                </h4>
                                <p className="mt-1 text-sm text-[#59645D]">
                                  {project.description}
                                </p>
                              </div>

                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyle(project.status)}`}
                              >
                                {project.status}
                              </span>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                              {(project.skills || []).map((skill) => (
                                <span
                                  key={skill.id}
                                  className="rounded-full bg-[#E7EDE7] px-3 py-1 text-xs text-[#244C3A]"
                                >
                                  {skill.skill_name} · {skill.status}
                                </span>
                              ))}
                            </div>

                            <div className="mt-4 flex flex-wrap gap-3 text-sm">
                              {project.project_link && (
                                <a
                                  href={project.project_link}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="font-medium text-[#315D48] hover:underline"
                                >
                                  Open Project Link
                                </a>
                              )}

                              {project.original_file_name && (
                                <button
                                  onClick={() =>
                                    downloadFile(
                                      `/artifacts/${project.id}/file`,
                                      project.original_file_name
                                    )
                                  }
                                  className="font-medium text-[#315D48] hover:underline"
                                >
                                  Download Attachment
                                </button>
                              )}
                            </div>

                            {project.status === "pending" && (
                              <div className="mt-5 flex gap-3 border-t border-[#E5E7E1] pt-4">
                                <button
                                  onClick={() =>
                                    updateStatus(project.id, "verified")
                                  }
                                  className="rounded-lg bg-[#315D48] px-4 py-2 text-sm text-white hover:bg-[#244C3A]"
                                >
                                  Approve
                                </button>

                                <button
                                  onClick={() =>
                                    updateStatus(project.id, "rejected")
                                  }
                                  className="rounded-lg bg-[#FCEAE7] px-4 py-2 text-sm text-[#A34D43] hover:bg-[#F6DEDA]"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </article>
                        ))}
                      </div>
                    )}
                  </section>
                ) : (
                  <StudentSelector action="review projects" />
                )
              )}

              {tab === "skills" && (
                selected ? (
                  <section className="rounded-xl border border-[#E5E7E1] bg-white p-6">
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-bold text-[#303B36]">
                          Skill Verification — {selected.name}
                        </h3>
                        <p className="mt-1 text-sm text-[#78827B]">
                          Review skills demonstrated through student projects.
                        </p>
                      </div>

                      <button
                        onClick={() => setSelected(null)}
                        className="rounded-lg border border-[#D9DED8] px-4 py-2 text-sm text-[#59645D] hover:bg-[#F7F5EF]"
                      >
                        Choose another student
                      </button>
                    </div>

                    <div className="mb-6 grid gap-4 sm:grid-cols-3">
                      <div className="rounded-lg bg-[#F8F0DF] p-4">
                        <p className="text-sm text-[#9A702D]">Pending</p>
                        <p className="mt-2 text-2xl font-bold text-[#303B36]">
                          {pendingSkills}
                        </p>
                      </div>

                      <div className="rounded-lg bg-[#E7EDE7] p-4">
                        <p className="text-sm text-[#315D48]">Verified</p>
                        <p className="mt-2 text-2xl font-bold text-[#303B36]">
                          {verifiedSkills}
                        </p>
                      </div>

                      <div className="rounded-lg bg-[#F1F2EF] p-4">
                        <p className="text-sm text-[#78827B]">Total Skills</p>
                        <p className="mt-2 text-2xl font-bold text-[#303B36]">
                          {skills.length}
                        </p>
                      </div>
                    </div>

                    {skills.length === 0 ? (
                      <p className="py-10 text-center text-[#78827B]">
                        This student has not submitted any skills yet.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {skills.map((skill) => (
                          <article
                            key={skill.skill_id}
                            className="rounded-lg border border-[#E5E7E1] p-5"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <h4 className="text-lg font-bold text-[#303B36]">
                                  {skill.skill_name}
                                </h4>
                                <p className="mt-1 text-sm text-[#78827B]">
                                  {skill.project_title
                                    ? `Demonstrated in: ${skill.project_title}`
                                    : "Independently added skill"}
                                </p>
                              </div>

                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyle(skill.status)}`}
                              >
                                {skill.status}
                              </span>
                            </div>

                            {skill.status === "pending" && (
                              <div className="mt-5 flex gap-3 border-t border-[#E5E7E1] pt-4">
                                <button
                                  onClick={() =>
                                    updateSkillStatus(
                                      skill.skill_id,
                                      "verified"
                                    )
                                  }
                                  className="rounded-lg bg-[#315D48] px-4 py-2 text-sm text-white hover:bg-[#244C3A]"
                                >
                                  Verify Skill
                                </button>

                                <button
                                  onClick={() =>
                                    updateSkillStatus(
                                      skill.skill_id,
                                      "rejected"
                                    )
                                  }
                                  className="rounded-lg bg-[#FCEAE7] px-4 py-2 text-sm text-[#A34D43] hover:bg-[#F6DEDA]"
                                >
                                  Reject Skill
                                </button>
                              </div>
                            )}
                          </article>
                        ))}
                      </div>
                    )}
                  </section>
                ) : (
                  <StudentSelector action="verify skills" />
                )
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
