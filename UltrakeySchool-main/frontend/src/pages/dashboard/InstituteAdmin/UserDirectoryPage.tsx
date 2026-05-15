import { useState, useEffect, useCallback } from "react";
import institutionSetupService from "../../../services/institutionSetupService";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Member {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  department?: string;
  designation?: string;
  class?: string;
  section?: string;
  rollNumber?: string;
  admissionNumber?: string;
  employeeId?: string;
  status: string;
  avatar?: string;
  lastLogin?: string;
  createdAt: string;
  joiningDate?: string;
  gender?: string;
  bloodGroup?: string;
  institutionCode?: string;
}

interface MemberStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  teachers: number;
  students: number;
  parents: number;
  admins: number;
  staff: number;
}

interface ViewModalData {
  member: Member | null;
  open: boolean;
}

// ─── Role Config ──────────────────────────────────────────────────────────────
const ROLE_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; icon: string }
> = {
  institution_admin: {
    label: "Institution Admin",
    color: "#6366f1",
    bg: "#eef2ff",
    icon: "ti-crown",
  },
  principal: {
    label: "Principal",
    color: "#0891b2",
    bg: "#ecfeff",
    icon: "ti-medal",
  },
  admin: { label: "Admin", color: "#d97706", bg: "#fffbeb", icon: "ti-shield" },
  teacher: {
    label: "Teacher",
    color: "#059669",
    bg: "#ecfdf5",
    icon: "ti-chalkboard-user",
  },
  student: {
    label: "Student",
    color: "#2563eb",
    bg: "#eff6ff",
    icon: "ti-user-graduate",
  },
  parent: {
    label: "Parent",
    color: "#7c3aed",
    bg: "#f5f3ff",
    icon: "ti-users-group",
  },
  accountant: {
    label: "Accountant",
    color: "#0d9488",
    bg: "#f0fdfa",
    icon: "ti-calculator",
  },
  librarian: {
    label: "Librarian",
    color: "#b45309",
    bg: "#fffbeb",
    icon: "ti-books",
  },
  hr_manager: {
    label: "HR Manager",
    color: "#be185d",
    bg: "#fdf2f8",
    icon: "ti-briefcase",
  },
  hostel_warden: {
    label: "Hostel Warden",
    color: "#1d4ed8",
    bg: "#eff6ff",
    icon: "ti-building",
  },
  transport_manager: {
    label: "Transport Manager",
    color: "#b91c1c",
    bg: "#fef2f2",
    icon: "ti-bus",
  },
  staff_member: {
    label: "Staff",
    color: "#6b7280",
    bg: "#f3f4f6",
    icon: "ti-user",
  },
  agent: {
    label: "Agent",
    color: "#92400e",
    bg: "#fef3c7",
    icon: "ti-user-star",
  },
};

const getRoleInfo = (role: string) =>
  ROLE_CONFIG[role] ?? {
    label: role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    color: "#6b7280",
    bg: "#f3f4f6",
    icon: "ti-user",
  };

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const AVATAR_COLORS = [
  "#6366f1",
  "#0891b2",
  "#059669",
  "#d97706",
  "#be185d",
  "#7c3aed",
  "#b91c1c",
  "#0d9488",
];
const getAvatarColor = (name: string) =>
  AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

const formatDate = (d?: string) => {
  if (!d) return "Never";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const timeAgo = (d?: string) => {
  if (!d) return null;
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(d);
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({
  icon,
  label,
  value,
  color,
  bg,
}: {
  icon: string;
  label: string;
  value: number;
  color: string;
  bg: string;
}) => (
  <div className="col-lg-3 col-sm-6 mb-3">
    <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: 14 }}>
      <div className="card-body d-flex align-items-center gap-3 p-3">
        <div
          className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
          style={{ width: 52, height: 52, background: bg }}
        >
          <i className={`ti ${icon} fs-4`} style={{ color }} />
        </div>
        <div>
          <div className="text-muted small">{label}</div>
          <div className="fw-bold fs-4 lh-1 mt-1">{value.toLocaleString()}</div>
        </div>
      </div>
    </div>
  </div>
);

// ─── Role Summary Pills ───────────────────────────────────────────────────────
const RolePill = ({
  role,
  count,
  active,
  onClick,
}: {
  role: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) => {
  const info = getRoleInfo(role);
  return (
    <button
      onClick={onClick}
      className="border-0 rounded-pill px-3 py-1 me-2 mb-2 d-inline-flex align-items-center gap-1 small fw-medium"
      style={{
        background: active ? info.color : info.bg,
        color: active ? "#fff" : info.color,
        cursor: "pointer",
        transition: "all 0.18s",
        boxShadow: active ? `0 2px 8px ${info.color}55` : "none",
      }}
    >
      <i className={`ti ${info.icon}`} />
      {info.label}
      <span
        className="rounded-pill px-2 py-0"
        style={{
          background: active ? "rgba(255,255,255,0.25)" : info.color + "22",
          color: active ? "#fff" : info.color,
          fontSize: "0.7rem",
        }}
      >
        {count}
      </span>
    </button>
  );
};

// ─── View Member Modal ────────────────────────────────────────────────────────
const ViewMemberModal = ({
  data,
  onClose,
}: {
  data: ViewModalData;
  onClose: () => void;
}) => {
  const m = data.member;
  if (!m) return null;
  const info = getRoleInfo(m.role);
  return (
    <div
      className="modal show d-block"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div
          className="modal-content border-0 shadow-lg"
          style={{ borderRadius: 18 }}
        >
          {/* Header banner */}
          <div
            className="p-4 d-flex align-items-center gap-3"
            style={{
              background: `linear-gradient(135deg, ${info.color}22, ${info.bg})`,
              borderRadius: "18px 18px 0 0",
            }}
          >
            <div
              className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
              style={{
                width: 68,
                height: 68,
                background: getAvatarColor(m.name),
                color: "#fff",
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              {getInitials(m.name)}
            </div>
            <div className="flex-grow-1">
              <h5 className="mb-1 fw-bold">{m.name}</h5>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <span
                  className="badge rounded-pill px-3 py-1"
                  style={{
                    background: info.color,
                    color: "#fff",
                    fontSize: "0.78rem",
                  }}
                >
                  <i className={`ti ${info.icon} me-1`} />
                  {info.label}
                </span>
                <span
                  className={`badge rounded-pill px-3 py-1 ${m.status === "active" ? "bg-success" : "bg-secondary"}`}
                  style={{ fontSize: "0.78rem" }}
                >
                  {m.status}
                </span>
              </div>
            </div>
            <button className="btn-close" onClick={onClose} />
          </div>

          <div className="modal-body p-4">
            <div className="row g-3">
              {/* Contact */}
              <div className="col-md-6">
                <div
                  className="p-3 rounded-3 h-100"
                  style={{ background: "#f8faff", border: "1px solid #e5e7eb" }}
                >
                  <div className="fw-semibold mb-3 small text-uppercase text-muted">
                    Contact Information
                  </div>
                  <InfoRow icon="ti-mail" label="Email" value={m.email} />
                  <InfoRow
                    icon="ti-phone"
                    label="Phone"
                    value={m.phone || "—"}
                  />
                  <InfoRow
                    icon="ti-calendar-plus"
                    label="Joined"
                    value={formatDate(m.createdAt)}
                  />
                  <InfoRow
                    icon="ti-login"
                    label="Last Login"
                    value={
                      m.lastLogin ? (timeAgo(m.lastLogin) ?? "—") : "Never"
                    }
                  />
                </div>
              </div>

              {/* Role-specific details */}
              <div className="col-md-6">
                <div
                  className="p-3 rounded-3 h-100"
                  style={{ background: "#f8faff", border: "1px solid #e5e7eb" }}
                >
                  <div className="fw-semibold mb-3 small text-uppercase text-muted">
                    Details
                  </div>
                  {m.employeeId && (
                    <InfoRow
                      icon="ti-id-badge"
                      label="Employee ID"
                      value={m.employeeId}
                    />
                  )}
                  {m.department && (
                    <InfoRow
                      icon="ti-building"
                      label="Department"
                      value={m.department}
                    />
                  )}
                  {m.designation && (
                    <InfoRow
                      icon="ti-briefcase"
                      label="Designation"
                      value={m.designation}
                    />
                  )}
                  {m.admissionNumber && (
                    <InfoRow
                      icon="ti-file-description"
                      label="Admission No."
                      value={m.admissionNumber}
                    />
                  )}
                  {m.rollNumber && (
                    <InfoRow
                      icon="ti-list-numbers"
                      label="Roll No."
                      value={m.rollNumber}
                    />
                  )}
                  {m.class && (
                    <InfoRow
                      icon="ti-door"
                      label="Class"
                      value={`${m.class}${m.section ? " – " + m.section : ""}`}
                    />
                  )}
                  {m.gender && (
                    <InfoRow
                      icon="ti-gender-bigender"
                      label="Gender"
                      value={m.gender}
                    />
                  )}
                  {m.bloodGroup && (
                    <InfoRow
                      icon="ti-droplet"
                      label="Blood Group"
                      value={m.bloodGroup}
                    />
                  )}
                  {m.joiningDate && (
                    <InfoRow
                      icon="ti-calendar"
                      label="Joining Date"
                      value={formatDate(m.joiningDate)}
                    />
                  )}
                  {m.institutionCode && (
                    <InfoRow
                      icon="ti-building-arch"
                      label="Institution Code"
                      value={m.institutionCode}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer border-0 px-4 pb-4 pt-0">
            <button className="btn btn-light px-4" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoRow = ({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) => (
  <div className="d-flex align-items-start gap-2 mb-2">
    <i
      className={`ti ${icon} mt-1 flex-shrink-0`}
      style={{ color: "#6b7280", fontSize: "0.9rem" }}
    />
    <div>
      <div className="text-muted" style={{ fontSize: "0.72rem" }}>
        {label}
      </div>
      <div
        className="fw-medium"
        style={{ fontSize: "0.88rem", wordBreak: "break-all" }}
      >
        {value}
      </div>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export default function UserDirectoryPage() {
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [filtered, setFiltered] = useState<Member[]>([]);
  const [stats, setStats] = useState<MemberStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Pagination
  const [page, setPage] = useState(1);
  const perPage = 12;

  // View modal
  const [modal, setModal] = useState<ViewModalData>({
    member: null,
    open: false,
  });

  // Institution info from localStorage
  const [institutionInfo, setInstitutionInfo] = useState<{
    id: string;
    code: string;
    name: string;
  } | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Read logged-in institution admin's data from localStorage
      const raw = localStorage.getItem("user");
      if (!raw) throw new Error("Not logged in. Please log in again.");

      let userData: any;
      try {
        userData = JSON.parse(raw);
      } catch {
        throw new Error("Session data is corrupted. Please log in again.");
      }

      const institutionId = userData?.institutionId;
      const institutionCode = userData?.institutionCode;
      const institutionName =
        userData?.institution || userData?.institutionName || "";

      if (!institutionId) {
        throw new Error(
          "Institution ID not found in your session. Please contact your system administrator.",
        );
      }

      setInstitutionInfo({
        id: institutionId,
        code: institutionCode || "",
        name: institutionName,
      });

      // Call the institution-setup endpoint which queries by both institutionId AND institutionCode
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any =
        await institutionSetupService.getInstitutionUsers(institutionId);

      let members: Member[] = [];
      if (response?.success && response?.data) {
        const data = response.data;
        if (Array.isArray(data)) {
          members = data;
        } else if (Array.isArray(data.users)) {
          members = data.users;
        }
      }

      setAllMembers(members);

      // Compute stats
      const s: MemberStats = {
        totalUsers: members.length,
        activeUsers: members.filter((m) => m.status === "active").length,
        inactiveUsers: members.filter((m) => m.status !== "active").length,
        teachers: members.filter((m) => m.role === "teacher").length,
        students: members.filter((m) => m.role === "student").length,
        parents: members.filter((m) => m.role === "parent").length,
        admins: members.filter((m) =>
          ["institution_admin", "principal", "admin"].includes(m.role),
        ).length,
        staff: members.filter((m) =>
          [
            "accountant",
            "librarian",
            "hr_manager",
            "hostel_warden",
            "transport_manager",
            "staff_member",
          ].includes(m.role),
        ).length,
      };
      setStats(s);
    } catch (err: any) {
      setError(err?.message || "Failed to load members.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // ── Filter & paginate ──────────────────────────────────────────────────────
  useEffect(() => {
    let result = [...allMembers];
    if (roleFilter !== "all")
      result = result.filter((m) => m.role === roleFilter);
    if (statusFilter !== "all")
      result = result.filter((m) => m.status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          (m.phone || "").includes(q) ||
          (m.department || "").toLowerCase().includes(q) ||
          (m.class || "").toLowerCase().includes(q) ||
          (m.employeeId || "").toLowerCase().includes(q) ||
          (m.admissionNumber || "").toLowerCase().includes(q),
      );
    }
    setFiltered(result);
    setPage(1);
  }, [allMembers, search, roleFilter, statusFilter]);

  // Unique roles in the current dataset
  const uniqueRoles = [...new Set(allMembers.map((m) => m.role))].sort();
  const roleCounts = uniqueRoles.reduce<Record<string, number>>((acc, r) => {
    acc[r] = allMembers.filter((m) => m.role === r).length;
    return acc;
  }, {});

  // Pagination
  const totalPages = Math.ceil(filtered.length / perPage);
  const pageItems = filtered.slice((page - 1) * perPage, page * perPage);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        className="d-flex flex-column align-items-center justify-content-center"
        style={{ minHeight: 400 }}
      >
        <div
          className="spinner-border text-primary mb-3"
          style={{ width: 44, height: 44 }}
        />
        <div className="text-muted">Loading members list…</div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="container-fluid p-4">
        <div
          className="alert border-0 shadow-sm d-flex align-items-center gap-3"
          style={{ background: "#fff1f0", borderRadius: 14 }}
        >
          <i className="ti ti-alert-circle fs-4 text-danger" />
          <div className="flex-grow-1">
            <strong>Could not load members</strong>
            <div className="text-muted small mt-1">{error}</div>
          </div>
          <button className="btn btn-sm btn-danger" onClick={fetchMembers}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <>
      <div className="container-fluid p-4" style={{ maxWidth: 1400 }}>
        {/* ── Page Header ──────────────────────────────────────────────────── */}
        <div className="d-flex align-items-start justify-content-between mb-4 flex-wrap gap-3">
          <div>
            <h4 className="fw-bold mb-1 d-flex align-items-center gap-2">
              <i className="ti ti-users-group text-primary" />
              Members List
            </h4>
            <p className="text-muted mb-0 small">
              All users linked to your institution
              {institutionInfo?.code && (
                <span className="ms-2 badge rounded-pill bg-primary bg-opacity-10 text-primary">
                  <i className="ti ti-building-arch me-1" />
                  {institutionInfo.code}
                </span>
              )}
            </p>
          </div>
          <button
            className="btn btn-primary d-flex align-items-center gap-2"
            onClick={fetchMembers}
          >
            <i className="ti ti-refresh" /> Refresh
          </button>
        </div>

        {/* ── Stats ────────────────────────────────────────────────────────── */}
        {stats && (
          <div className="row mb-4">
            <StatCard
              icon="ti-users"
              label="Total Members"
              value={stats.totalUsers}
              color="#6366f1"
              bg="#eef2ff"
            />
            <StatCard
              icon="ti-user-check"
              label="Active"
              value={stats.activeUsers}
              color="#059669"
              bg="#ecfdf5"
            />
            <StatCard
              icon="ti-chalkboard-user"
              label="Teachers"
              value={stats.teachers}
              color="#0891b2"
              bg="#ecfeff"
            />
            <StatCard
              icon="ti-user-graduate"
              label="Students"
              value={stats.students}
              color="#2563eb"
              bg="#eff6ff"
            />
          </div>
        )}

        {/* ── Role filter pills ─────────────────────────────────────────────── */}
        {uniqueRoles.length > 0 && (
          <div className="mb-3">
            <RolePill
              role="all"
              count={allMembers.length}
              active={roleFilter === "all"}
              onClick={() => setRoleFilter("all")}
            />
            {uniqueRoles.map((r) => (
              <RolePill
                key={r}
                role={r}
                count={roleCounts[r]}
                active={roleFilter === r}
                onClick={() => setRoleFilter(r)}
              />
            ))}
          </div>
        )}

        {/* ── Search & Filters ──────────────────────────────────────────────── */}
        <div
          className="card border-0 shadow-sm mb-4"
          style={{ borderRadius: 14 }}
        >
          <div className="card-body p-3">
            <div className="row g-2 align-items-center">
              <div className="col-md-5">
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0">
                    <i className="ti ti-search text-muted" />
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0 ps-0"
                    placeholder="Search by name, email, phone, class, dept…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  {search && (
                    <button
                      className="btn btn-outline-secondary border-start-0"
                      onClick={() => setSearch("")}
                    >
                      <i className="ti ti-x" />
                    </button>
                  )}
                </div>
              </div>
              <div className="col-md-3">
                <select
                  className="form-select"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="all">All Roles</option>
                  {uniqueRoles.map((r) => (
                    <option key={r} value={r}>
                      {getRoleInfo(r).label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-2">
                <select
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div className="col-md-2 text-muted small text-end">
                <strong>{filtered.length}</strong> member
                {filtered.length !== 1 ? "s" : ""} found
              </div>
            </div>
          </div>
        </div>

        {/* ── Empty state ───────────────────────────────────────────────────── */}
        {filtered.length === 0 && (
          <div
            className="card border-0 shadow-sm text-center py-5"
            style={{ borderRadius: 14 }}
          >
            <i
              className="ti ti-user-off text-muted"
              style={{ fontSize: "3.5rem" }}
            />
            <h5 className="mt-3 text-muted">No Members Found</h5>
            <p className="text-muted small">
              {allMembers.length === 0
                ? "No users are linked to your institution yet."
                : "No members match your current filters."}
            </p>
            {allMembers.length === 0 && (
              <p className="text-muted small">
                Institution ID: <code>{institutionInfo?.id}</code>
                {institutionInfo?.code && (
                  <>
                    {" "}
                    | Code: <code>{institutionInfo.code}</code>
                  </>
                )}
              </p>
            )}
          </div>
        )}

        {/* ── Members Table ─────────────────────────────────────────────────── */}
        {filtered.length > 0 && (
          <div className="card border-0 shadow-sm" style={{ borderRadius: 14 }}>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table
                  className="table table-hover align-middle mb-0"
                  style={{ borderRadius: 14 }}
                >
                  <thead>
                    <tr style={{ background: "#f8faff" }}>
                      <th
                        className="ps-4 py-3"
                        style={{
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                          color: "#6b7280",
                          fontWeight: 600,
                          borderBottom: "2px solid #e5e7eb",
                        }}
                      >
                        Member
                      </th>
                      <th
                        className="py-3"
                        style={{
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                          color: "#6b7280",
                          fontWeight: 600,
                          borderBottom: "2px solid #e5e7eb",
                        }}
                      >
                        Role
                      </th>
                      <th
                        className="py-3"
                        style={{
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                          color: "#6b7280",
                          fontWeight: 600,
                          borderBottom: "2px solid #e5e7eb",
                        }}
                      >
                        Contact
                      </th>
                      <th
                        className="py-3"
                        style={{
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                          color: "#6b7280",
                          fontWeight: 600,
                          borderBottom: "2px solid #e5e7eb",
                        }}
                      >
                        Department / Class
                      </th>
                      <th
                        className="py-3"
                        style={{
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                          color: "#6b7280",
                          fontWeight: 600,
                          borderBottom: "2px solid #e5e7eb",
                        }}
                      >
                        Status
                      </th>
                      <th
                        className="py-3"
                        style={{
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                          color: "#6b7280",
                          fontWeight: 600,
                          borderBottom: "2px solid #e5e7eb",
                        }}
                      >
                        Last Login
                      </th>
                      <th
                        className="py-3 pe-4 text-center"
                        style={{
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                          color: "#6b7280",
                          fontWeight: 600,
                          borderBottom: "2px solid #e5e7eb",
                        }}
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((member) => {
                      const info = getRoleInfo(member.role);
                      const avatarColor = getAvatarColor(member.name);
                      return (
                        <tr
                          key={member._id}
                          style={{ transition: "background 0.15s" }}
                        >
                          {/* Member name + email */}
                          <td className="ps-4 py-3">
                            <div className="d-flex align-items-center gap-3">
                              <div
                                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 fw-bold"
                                style={{
                                  width: 40,
                                  height: 40,
                                  background: avatarColor,
                                  color: "#fff",
                                  fontSize: "0.85rem",
                                }}
                              >
                                {getInitials(member.name)}
                              </div>
                              <div>
                                <div
                                  className="fw-semibold"
                                  style={{ fontSize: "0.9rem" }}
                                >
                                  {member.name}
                                </div>
                                <div
                                  className="text-muted"
                                  style={{ fontSize: "0.78rem" }}
                                >
                                  {member.email}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Role badge */}
                          <td>
                            <span
                              className="badge rounded-pill px-3 py-1 d-inline-flex align-items-center gap-1"
                              style={{
                                background: info.bg,
                                color: info.color,
                                fontSize: "0.76rem",
                                fontWeight: 600,
                              }}
                            >
                              <i
                                className={`ti ${info.icon}`}
                                style={{ fontSize: "0.85rem" }}
                              />
                              {info.label}
                            </span>
                          </td>

                          {/* Contact */}
                          <td>
                            <div style={{ fontSize: "0.84rem" }}>
                              {member.phone || (
                                <span className="text-muted">—</span>
                              )}
                            </div>
                          </td>

                          {/* Dept / Class */}
                          <td>
                            <div style={{ fontSize: "0.84rem" }}>
                              {member.department && (
                                <div>{member.department}</div>
                              )}
                              {member.designation && !member.department && (
                                <div className="text-muted">
                                  {member.designation}
                                </div>
                              )}
                              {member.class && (
                                <div
                                  className="text-muted"
                                  style={{ fontSize: "0.78rem" }}
                                >
                                  {member.class}
                                  {member.section ? ` – ${member.section}` : ""}
                                  {member.rollNumber
                                    ? ` (${member.rollNumber})`
                                    : ""}
                                </div>
                              )}
                              {!member.department &&
                                !member.class &&
                                !member.designation && (
                                  <span className="text-muted">—</span>
                                )}
                            </div>
                          </td>

                          {/* Status */}
                          <td>
                            <span
                              className={`badge rounded-pill px-3 py-1`}
                              style={{
                                background:
                                  member.status === "active"
                                    ? "#ecfdf5"
                                    : member.status === "suspended"
                                      ? "#fff1f0"
                                      : "#f3f4f6",
                                color:
                                  member.status === "active"
                                    ? "#059669"
                                    : member.status === "suspended"
                                      ? "#dc2626"
                                      : "#6b7280",
                                fontSize: "0.76rem",
                                fontWeight: 600,
                              }}
                            >
                              <i
                                className={`ti ${member.status === "active" ? "ti-circle-check" : member.status === "suspended" ? "ti-circle-x" : "ti-circle"} me-1`}
                              />
                              {member.status.charAt(0).toUpperCase() +
                                member.status.slice(1)}
                            </span>
                          </td>

                          {/* Last Login */}
                          <td>
                            <div style={{ fontSize: "0.82rem" }}>
                              {member.lastLogin ? (
                                <span title={formatDate(member.lastLogin)}>
                                  {timeAgo(member.lastLogin)}
                                </span>
                              ) : (
                                <span className="text-muted">Never</span>
                              )}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="pe-4 text-center">
                            <button
                              className="btn btn-sm border-0 rounded-3 d-inline-flex align-items-center gap-1"
                              style={{
                                background: "#eff6ff",
                                color: "#2563eb",
                                fontSize: "0.8rem",
                              }}
                              onClick={() => setModal({ member, open: true })}
                              title="View Details"
                            >
                              <i className="ti ti-eye" /> View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ── Pagination ──────────────────────────────────────────────── */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center px-4 py-3 border-top">
                  <div className="text-muted small">
                    Showing {(page - 1) * perPage + 1}–
                    {Math.min(page * perPage, filtered.length)} of{" "}
                    {filtered.length} members
                  </div>
                  <nav>
                    <ul className="pagination pagination-sm mb-0">
                      <li
                        className={`page-item ${page === 1 ? "disabled" : ""}`}
                      >
                        <button
                          className="page-link"
                          onClick={() => setPage((p) => p - 1)}
                        >
                          <i className="ti ti-chevron-left" />
                        </button>
                      </li>
                      {Array.from({ length: totalPages }, (_, i) => {
                        const pg = i + 1;
                        if (
                          totalPages <= 7 ||
                          Math.abs(pg - page) <= 2 ||
                          pg === 1 ||
                          pg === totalPages
                        ) {
                          return (
                            <li
                              key={pg}
                              className={`page-item ${page === pg ? "active" : ""}`}
                            >
                              <button
                                className="page-link"
                                onClick={() => setPage(pg)}
                              >
                                {pg}
                              </button>
                            </li>
                          );
                        }
                        if (Math.abs(pg - page) === 3) {
                          return (
                            <li key={pg} className="page-item disabled">
                              <span className="page-link">…</span>
                            </li>
                          );
                        }
                        return null;
                      })}
                      <li
                        className={`page-item ${page === totalPages ? "disabled" : ""}`}
                      >
                        <button
                          className="page-link"
                          onClick={() => setPage((p) => p + 1)}
                        >
                          <i className="ti ti-chevron-right" />
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Role Breakdown Card ───────────────────────────────────────────── */}
        {stats && allMembers.length > 0 && (
          <div
            className="card border-0 shadow-sm mt-4"
            style={{ borderRadius: 14 }}
          >
            <div className="card-body p-4">
              <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                <i className="ti ti-chart-bar text-primary" /> Members by Role
              </h6>
              <div className="row g-3">
                {uniqueRoles.map((r) => {
                  const count = roleCounts[r];
                  const pct =
                    allMembers.length > 0
                      ? Math.round((count / allMembers.length) * 100)
                      : 0;
                  const info = getRoleInfo(r);
                  return (
                    <div key={r} className="col-md-6 col-lg-4">
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <i
                          className={`ti ${info.icon} small`}
                          style={{ color: info.color }}
                        />
                        <span className="small fw-medium">{info.label}</span>
                        <span className="ms-auto small fw-bold">{count}</span>
                      </div>
                      <div
                        className="progress"
                        style={{ height: 6, borderRadius: 9999 }}
                      >
                        <div
                          className="progress-bar"
                          style={{
                            width: `${pct}%`,
                            background: info.color,
                            borderRadius: 9999,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── View Member Modal ─────────────────────────────────────────────────── */}
      {modal.open && (
        <ViewMemberModal
          data={modal}
          onClose={() => setModal({ member: null, open: false })}
        />
      )}
    </>
  );
}
