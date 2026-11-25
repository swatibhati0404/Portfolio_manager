
import { NavLink } from "react-router-dom";

const links = [
  { name: "Overview", path: "/student" },
  { name: "My Profile", path: "/student/profile" },
  { name: "My Projects", path: "/student/projects" },
  { name: "My Resume", path: "/student/resume" },
  { name: "My Skills", path: "/student/skills" },
];

export default function StudentSidebar() {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  }

  return (
    <aside className="fixed left-0 top-0 flex h-screen w-64 flex-col bg-[#244C3A] px-5 py-7 text-white">
      <div className="mb-10 px-3">
        <h1 className="text-2xl font-bold">
          Skill<span className="text-[#D6A75D]">Bridge</span>
        </h1>
        <p className="mt-2 text-xs text-[#C5D5C9]">
          Student Workspace
        </p>
      </div>

      <p className="mb-4 px-3 text-xs uppercase tracking-widest text-[#A9C0AF]">
        Workspace
      </p>

      <nav className="flex-1 space-y-2">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            end={link.path === "/student"}
            className={({ isActive }) =>
              `block rounded-lg px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? "bg-[#E7EDE7] text-[#244C3A]"
                  : "text-[#E0E9E2] hover:bg-[#315D48] hover:text-white"
              }`
            }
          >
            {link.name}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-[#52725F] pt-5">
        <p className="px-3 font-semibold">{user?.name || "Student"}</p>
        <p className="break-all px-3 py-1 text-xs text-[#C5D5C9]">
          {user?.email || ""}
        </p>

        <button
          onClick={handleLogout}
          className="mt-3 w-full rounded-lg px-4 py-3 text-left text-sm text-[#F2D5CE] transition hover:bg-[#754C43]"
        >
          ↪ Sign out
        </button>
      </div>
    </aside>
  );
}
