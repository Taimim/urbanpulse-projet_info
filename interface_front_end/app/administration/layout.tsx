import Link from "next/link";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <section>
      <div className="card" style={{ marginBottom: "1rem" }}>
        <h3 style={{ marginBottom: "0.5rem" }}>Module Administration</h3>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <Link className="nav-link" href="/administration/utilisateurs">
            Utilisateurs
          </Link>
          <Link className="nav-link" href="/administration/validation">
            Validation
          </Link>
<Link className="nav-link" href="/administration/rapports">
            Rapports
          </Link>
        </div>
      </div>
      {children}
    </section>
  );
}
