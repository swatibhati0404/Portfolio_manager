
import { useEffect, useState } from "react";
import StudentSidebar from "../components/StudentSidebar";
import { apiRequest } from "../api";

export default function Resume() {
  const [resume, setResume] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadResume() {
    try {
      const data = await apiRequest("/users/resume/info");
      setResume(data.resume);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadResume();
  }, []);

  async function handleUpload(e) {
    e.preventDefault();

    if (!file) {
      setError("Please select a resume first.");
      return;
    }

    setError("");
    setSuccess("");

    const formData = new FormData();
    formData.append("resume", file);

    try {
      setUploading(true);

      await apiRequest("/users/resume", {
        method: "POST",
        body: formData,
      });

      setSuccess("Your resume has been uploaded successfully!");
      setFile(null);

      document.getElementById("resume-file").value = "";

      await loadResume();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload() {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "https://portfoliomanager-production-4e0af0e3.up.railway.app/api/users/resume",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Unable to download resume.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = resume?.name || "resume";
      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F5EF] md:flex">
      <StudentSidebar />

      <main className="ml-64 min-w-0 flex-1 p-5 md:p-8 lg:p-10">
        <div className="mx-auto max-w-5xl">

          <div className="mb-8">
            <p className="text-sm font-semibold tracking-wider text-[#244C3A]">
              YOUR CAREER DOCUMENTS
            </p>

            <h1 className="mt-2 text-3xl font-bold text-[#303B36]">
              My Resume
            </h1>

            <p className="mt-2 text-[#78827B]">
              Keep your latest resume uploaded and ready to share.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-[#F2D5D0] bg-[#FCEDEA] p-4 text-sm text-[#A94438]">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-5 rounded-xl border border-[#D5E5D8] bg-[#E7EDE7] p-4 text-sm text-[#244C3A]">
              {success}
            </div>
          )}

          {/* Current resume */}
          <section className="mb-7 rounded-xl border border-[#E5E7E1] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#303B36]">
              Current Resume
            </h2>

            {loading ? (
              <p className="mt-5 text-sm text-[#78827B]">
                Loading resume details...
              </p>
            ) : resume ? (
              <div className="mt-5 flex flex-col justify-between gap-5 rounded-xl border border-[#E5E7E1] bg-[#F7F5EF] p-5 sm:flex-row sm:items-center">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#E7EDE7] text-2xl">
                    📄
                  </div>

                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-[#303B36]">
                      {resume.name}
                    </h3>

                    <p className="mt-1 text-xs text-[#78827B]">
                      Uploaded{" "}
                      {new Date(resume.uploadedAt).toLocaleDateString()}
                    </p>

                    <span className="mt-2 inline-block rounded-full bg-[#E7EDE7] px-3 py-1 text-xs font-semibold text-[#244C3A]">
                      Resume uploaded
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleDownload}
                  className="shrink-0 rounded-lg bg-[#244C3A] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#193B2C]"
                >
                  Download Resume ↓
                </button>
              </div>
            ) : (
              <div className="mt-5 rounded-xl border border-dashed border-[#C8D2C9] p-8 text-center">
                <div className="text-4xl">📄</div>
                <h3 className="mt-3 font-semibold text-[#303B36]">
                  No resume uploaded
                </h3>
                <p className="mt-1 text-sm text-[#78827B]">
                  Upload your latest resume to keep it in your portfolio.
                </p>
              </div>
            )}
          </section>

          {/* Upload / replace */}
          <section className="rounded-xl border border-[#E5E7E1] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#303B36]">
              {resume ? "Replace Resume" : "Upload Resume"}
            </h2>

            <p className="mt-1 text-sm text-[#78827B]">
              Upload your latest version. Your previous resume will be
              replaced automatically.
            </p>

            <form onSubmit={handleUpload} className="mt-6 space-y-5">

              <label
                htmlFor="resume-file"
                className="flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-[#C8D2C9] bg-[#F7F5EF] p-10 text-center transition hover:border-[#244C3A] hover:bg-[#E7EDE7]"
              >
                <span className="text-4xl">☁️</span>

                <span className="mt-3 font-semibold text-[#303B36]">
                  Choose your resume
                </span>

                <span className="mt-1 text-xs text-[#78827B]">
                  PDF, DOC or DOCX · Maximum size 5 MB
                </span>

                {file && (
                  <span className="mt-3 break-all text-sm font-semibold text-[#244C3A]">
                    Selected: {file.name}
                  </span>
                )}
              </label>

              <input
                id="resume-file"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setFile(e.target.files[0] || null)}
                className="hidden"
              />

              <button
                type="submit"
                disabled={uploading || !file}
                className="w-full rounded-lg bg-[#244C3A] px-6 py-3 font-semibold text-white transition hover:bg-[#193B2C] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {uploading
                  ? "Uploading..."
                  : resume
                    ? "Replace Resume"
                    : "Upload Resume"}
              </button>
            </form>
          </section>

        </div>
      </main>
    </div>
  );
}
