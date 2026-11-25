
import { useNavigate } from "react-router-dom";

const menuItems = [
  { id: "overview", label: "Overview", icon: "⌂" },
  { id: "students", label: "My Students", icon: "♙" },
  { id: "assign", label: "Assign Students", icon: "＋" },
  { id: "projects", label: "Projects Review", icon: "▣" },
  { id: "skills", label: "Skill Verification", icon: "✓" },
];

export default function FacultySidebar({ activeTab, onTabChange }) {
  const navigate = useNavigate();

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-[#315D48] bg-[#244C3A] px-5 py-7 text-white md:flex">
        <div className="mb-12 px-3">
          <h1 className="text-2xl font-bold tracking-tight">
            Skill<span className="text-[#D6A75D]">Bridge</span>
          </h1>
          <p className="mt-2 text-xs tracking-wide text-[#C5D5C9]">
            FACULTY WORKSPACE
          </p>
        </div>

        <p className="mb-4 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#A9C0AF]">
          Workspace
        </p>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => {
            const active = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                aria-current={active ? "page" : undefined}
                className={`group flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm font-medium transition-all duration-200 ${
                  active
                    ? "border-[#DCE8DF] bg-[#E7EDE7] text-[#244C3A]"
                    : "border-transparent text-[#E0E9E2] hover:border-[#52725F] hover:bg-[#315D48] hover:text-white"
                }`}
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-md text-lg ${
                    active
                      ? "bg-white text-[#244C3A]"
                      : "text-[#C5D5C9] group-hover:text-white"
                  }`}
                >
                  {item.icon}
                </span>
                {item.label}
                {active && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#D6A75D]" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-[#52725F] pt-5">
          <div className="mb-4 rounded-lg border border-[#52725F] bg-[#315D48] p-4">
            <p className="text-sm font-semibold">Faculty Account</p>
            <p className="mt-1 text-xs leading-relaxed text-[#C5D5C9]">
              Manage student progress and academic submissions.
            </p>
          </div>

          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-[#F2D5CE] transition hover:bg-[#754C43] hover:text-white"
          >
            <span className="text-lg">↪</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#E5E7E1] bg-white px-2 py-2 shadow-lg md:hidden">
        <nav className="flex items-center justify-around gap-1">
          {menuItems.map((item) => {
            const active = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg px-1 py-2 text-[10px] font-medium ${
                  active
                    ? "bg-[#E7EDE7] text-[#244C3A]"
                    : "text-[#78827B] hover:bg-[#F7F5EF]"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}

          <button
            onClick={logout}
            className="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg px-1 py-2 text-[10px] font-medium text-[#A34D43]"
          >
            <span className="text-lg">↪</span>
            Logout
          </button>
        </nav>
      </div>
    </>
  );
}
