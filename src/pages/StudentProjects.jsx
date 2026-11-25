
import { useEffect, useState } from "react";
import StudentSidebar from "../components/StudentSidebar";
import { apiRequest } from "../api";

export default function StudentProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    project_link: "",
    skills: "",
    projectFile: null,
  });

  async function loadProjects() {
    try {
      const data = await apiRequest("/artifacts");
      setProjects(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  function handleChange(e) {
    const { name, value, files } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const skills = form.skills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);

    if (!form.title.trim() || skills.length === 0) {
      setError("Project title and at least one skill are required.");
      return;
    }

    const formData = new FormData();
    formData.append("title", form.title);
    formData.append("description", form.description);
    formData.append("project_link", form.project_link);
    formData.append("skills", JSON.stringify(skills));

    if (form.projectFile) {
      formData.append("projectFile", form.projectFile);
    }

    try {
      setUploading(true);

      await apiRequest("/artifacts/upload", {
        method: "POST",
        body: formData,
      });

      setSuccess("Your project has been submitted successfully!");

      setForm({
        title: "",
        description: "",
        project_link: "",
        skills: "",
        projectFile: null,
      });

      document.getElementById("project-file").value = "";

      await loadProjects();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function downloadFile(projectId, filename) {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5000/api/artifacts/${projectId}/file`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Unable to download attachment.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = filename || "project-file";
      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    }
  }

  function statusStyle(status) {
    if (status === "verified") {
      return "bg-[#E7EDE7] text-[#244C3A]";
    }

    if (status === "rejected") {
      return "bg-[#FCEDEA] text-[#A94438]";
    }

    return "bg-[#F8F0DF] text-[#946B27]";
  }

  const inputStyle =
    "w-full rounded-lg border border-[#E5E7E1] bg-white px-4 py-3 text-sm text-[#303B36] outline-none transition placeholder:text-[#A0A9A2] focus:border-[#244C3A] focus:ring-2 focus:ring-[#E7EDE7]";

  const labelStyle =
    "mb-2 block text-sm font-semibold text-[#46534B]";

  return (
    <div className="min-h-screen bg-[#F7F5EF] md:flex">
      <StudentSidebar />

      <main className="ml-64 min-w-0 flex-1 p-5 md:p-8 lg:p-10">
        <div className="mx-auto max-w-6xl">

          <div className="mb-8">
            <p className="text-sm font-semibold tracking-wider text-[#244C3A]">
              YOUR PORTFOLIO
            </p>

            <h1 className="mt-2 text-3xl font-bold text-[#303B36]">
              My Projects
            </h1>

            <p className="mt-2 text-[#78827B]">
              Showcase your work, demonstrate your skills and get your
              projects verified by faculty.
            </p>
          </div>

          {/* Project statistics */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-[#E5E7E1] bg-white p-5 shadow-sm">
              <p className="text-sm text-[#78827B]">Total Projects</p>
              <h2 className="mt-2 text-3xl font-bold text-[#303B36]">
                {projects.length}
              </h2>
            </div>

            <div className="rounded-xl border border-[#E5E7E1] bg-white p-5 shadow-sm">
              <p className="text-sm text-[#78827B]">Verified</p>
              <h2 className="mt-2 text-3xl font-bold text-[#244C3A]">
                {projects.filter((p) => p.status === "verified").length}
              </h2>
            </div>

            <div className="rounded-xl border border-[#E5E7E1] bg-white p-5 shadow-sm">
              <p className="text-sm text-[#78827B]">Pending Review</p>
              <h2 className="mt-2 text-3xl font-bold text-[#946B27]">
                {projects.filter((p) => p.status === "pending").length}
              </h2>
            </div>
          </div>

          {/* Upload project form */}
          <section className="mb-10 rounded-xl border border-[#E5E7E1] bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-[#303B36]">
                Add a New Project
              </h2>

              <p className="mt-1 text-sm text-[#78827B]">
                Add your project details and attach supporting files.
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-[#F2D5D0] bg-[#FCEDEA] p-3 text-sm text-[#A94438]">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 rounded-lg border border-[#D5E5D8] bg-[#E7EDE7] p-3 text-sm text-[#244C3A]">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className={labelStyle}>
                  Project Title *
                </label>

                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. Student Portfolio Website"
                  className={inputStyle}
                  required
                />
              </div>

              <div>
                <label className={labelStyle}>
                  Project Description
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Explain what your project does, the problem it solves and how you built it..."
                  className={inputStyle}
                />
              </div>

              <div>
                <label className={labelStyle}>
                  GitHub / Live Project Link
                </label>

                <input
                  name="project_link"
                  type="url"
                  value={form.project_link}
                  onChange={handleChange}
                  placeholder="https://github.com/username/project"
                  className={inputStyle}
                />
              </div>

              <div>
                <label className={labelStyle}>
                  Skills Used *
                </label>

                <input
                  name="skills"
                  value={form.skills}
                  onChange={handleChange}
                  placeholder="React, JavaScript, Node.js, MySQL"
                  className={inputStyle}
                  required
                />

                <p className="mt-1 text-xs text-[#9AA39C]">
                  Separate skills using commas.
                </p>
              </div>

              <div>
                <label className={labelStyle}>
                  Project Attachment
                </label>

                <label
                  htmlFor="project-file"
                  className="flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-[#C8D2C9] bg-[#F7F5EF] p-8 text-center transition hover:border-[#244C3A] hover:bg-[#E7EDE7]"
                >
                  <span className="mb-3 text-3xl">📁</span>

                  <span className="font-semibold text-[#303B36]">
                    Click to select a project file
                  </span>

                  <span className="mt-1 text-xs text-[#78827B]">
                    PDF, ZIP, DOC, DOCX, PNG or JPG · Maximum 15 MB
                  </span>

                  {form.projectFile && (
                    <span className="mt-3 break-all text-sm font-semibold text-[#244C3A]">
                      Selected: {form.projectFile.name}
                    </span>
                  )}
                </label>

                <input
                  id="project-file"
                  type="file"
                  name="projectFile"
                  accept=".pdf,.zip,.png,.jpg,.jpeg,.doc,.docx"
                  onChange={handleChange}
                  className="hidden"
                />
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full rounded-lg bg-[#244C3A] px-6 py-3 font-semibold text-white transition hover:bg-[#193B2C] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {uploading ? "Submitting..." : "Submit Project"}
              </button>
            </form>
          </section>

          {/* Submitted projects */}
          <section>
            <div className="mb-5">
              <h2 className="text-xl font-bold text-[#303B36]">
                Your Submissions
              </h2>

              <p className="mt-1 text-sm text-[#78827B]">
                Track your project verification status.
              </p>
            </div>

            {loading ? (
              <p className="py-10 text-center text-[#78827B]">
                Loading projects...
              </p>
            ) : projects.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#C8D2C9] bg-white p-12 text-center">
                <div className="text-4xl">🚀</div>

                <h3 className="mt-4 font-semibold text-[#303B36]">
                  No projects submitted yet
                </h3>

                <p className="mt-2 text-sm text-[#78827B]">
                  Your projects will appear here after submission.
                </p>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="rounded-xl border border-[#E5E7E1] bg-white p-6 shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-bold text-[#303B36]">
                        {project.title}
                      </h3>

                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyle(project.status)}`}
                      >
                        {project.status}
                      </span>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-[#66736A]">
                      {project.description || "No description provided."}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {project.skills?.map((skill) => (
                        <span
                          key={skill.id}
                          className="rounded-lg bg-[#E7EDE7] px-3 py-1 text-xs font-medium text-[#244C3A]"
                        >
                          {skill.skill_name}
                        </span>
                      ))}
                    </div>

                    <div className="mt-5 flex flex-wrap gap-4 border-t border-[#E5E7E1] pt-4">
                      {project.project_link && (
                        <a
                          href={project.project_link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-semibold text-[#244C3A] hover:underline"
                        >
                          View Project ↗
                        </a>
                      )}

                      {project.file_path && (
                        <button
                          type="button"
                          onClick={() =>
                            downloadFile(
                              project.id,
                              project.original_file_name
                            )
                          }
                          className="text-sm font-semibold text-[#244C3A] hover:underline"
                        >
                          Download Attachment ↓
                        </button>
                      )}
                    </div>

                    <p className="mt-4 text-xs text-[#9AA39C]">
                      Submitted:{" "}
                      {new Date(project.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      </main>
    </div>
  );
}
