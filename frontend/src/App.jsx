
import React, { useState } from "react";
import {
  LayoutDashboard,
  Upload,
  Database,
  ShieldCheck,
  FileBarChart,
  Settings,
  Menu,
  X,
  Activity,
  Users,
  FileSpreadsheet,
  ArrowUpRight,
  Search,
  Download,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Lock,
  Trash2,
} from "lucide-react";
import "./index.css";
import Classification from "./Classification";

const demoRecords = [
  { id: "P001", age: 34, gender: "Female", diagnosis: "Diabetes", risk: "High", category: "Sensitive" },
  { id: "P002", age: 45, gender: "Male", diagnosis: "Hypertension", risk: "Medium", category: "Sensitive" },
  { id: "P003", age: 29, gender: "Female", diagnosis: "Asthma", risk: "Low", category: "Non-sensitive" },
  { id: "P004", age: 61, gender: "Male", diagnosis: "Heart Disease", risk: "High", category: "Sensitive" },
  { id: "P005", age: 38, gender: "Female", diagnosis: "Migraine", risk: "Low", category: "Non-sensitive" },
];

const navigation = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Upload Dataset", icon: Upload },
  { name: "Data Classification", icon: Database },
  { name: "Data Morphing", icon: ShieldCheck },
  { name: "Reports", icon: FileBarChart },
  { name: "Settings", icon: Settings },
];

function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [records, setRecords] = useState(demoRecords);
  const [fileName, setFileName] = useState("");
  const [search, setSearch] = useState("");
  const [morphLevel, setMorphLevel] = useState("Medium");
  const [message, setMessage] = useState("");
  const [darkMode, setDarkMode] = useState(true);

  const showMessage = (text) => {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 3000);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const extension = file.name.split(".").pop().toLowerCase();
    if (!["csv", "xlsx", "xls"].includes(extension)) {
      showMessage("Please upload a CSV or Excel file.");
      return;
    }

    setFileName(file.name);
    showMessage(`${file.name} selected successfully. Demo classification is still active.`);
  };

  const updateCategory = (id, category) => {
    setRecords((current) =>
      current.map((record) =>
        record.id === id ? { ...record, category } : record
      )
    );
  };

  const handleDownload = () => {
    const header = ["ID", "Age", "Gender", "Diagnosis", "Risk", "Category"];
    const rows = records.map((record) => [
      record.id,
      record.age,
      record.gender,
      record.diagnosis,
      record.risk,
      record.category,
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "medical-data-demo-report.csv";
    link.click();
    URL.revokeObjectURL(url);
    showMessage("Demo report downloaded.");
  };

  const filteredRecords = records.filter((record) =>
    Object.values(record).some((value) =>
      String(value).toLowerCase().includes(search.toLowerCase())
    )
  );

  const renderDashboard = () => (
    <>
      <div className="welcome-banner">
        <div>
          <span className="eyebrow">MEDICAL DATA SECURITY PLATFORM</span>
          <h2>Welcome to Medical Data Morphing</h2>
          <p>Classify, protect and prepare medical datasets for safer data sharing.</p>
        </div>
        <div className="banner-icon"><Activity size={42} /></div>
      </div>

      <div className="stats-grid">
        <StatCard icon={Database} label="Total Records" value="1,250" note="Illustrative demo metric" />
        <StatCard icon={ShieldCheck} label="Protected Records" value="980" note="Illustrative demo metric" />
        <StatCard icon={AlertTriangle} label="Sensitive Fields" value="12" note="Illustrative demo metric" />
        <StatCard icon={Users} label="Dataset Files" value="08" note="Illustrative demo metric" />
      </div>

      <div className="content-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h3>Recent Dataset Records</h3>
              <p>Sample records for frontend demonstration</p>
            </div>
            <button className="text-button" onClick={() => setActivePage("Data Classification")}>
              View all <ArrowUpRight size={15} />
            </button>
          </div>
          <RecordTable records={records.slice(0, 4)} updateCategory={updateCategory} />
        </section>

        <section className="panel activity-panel">
          <h3>Project Workflow</h3>
          <p className="muted">Your medical data processing pipeline</p>
          {[
            ["01", "Upload dataset", "Import CSV or Excel data", Upload],
            ["02", "Classify data", "Identify sensitive fields", Database],
            ["03", "Morph data", "Prepare privacy transformations", ShieldCheck],
            ["04", "Generate report", "Review the output summary", FileBarChart],
          ].map(([number, title, description, Icon]) => (
            <div className="workflow-item" key={number}>
              <span className="workflow-number">{number}</span>
              <span className="workflow-icon"><Icon size={18} /></span>
              <div><strong>{title}</strong><small>{description}</small></div>
            </div>
          ))}
        </section>
      </div>
    </>
  );

  const renderUpload = () => (
    <section className="panel page-panel">
      <PageHeading title="Upload Medical Dataset" subtitle="Select a medical dataset in CSV or Excel format." />
      <div className="upload-area">
        <div className="upload-icon"><Upload size={34} /></div>
        <h3>Upload your dataset</h3>
        <p>Supported formats: CSV, XLSX and XLS</p>
        <label className="primary-button upload-label">
          <Upload size={17} /> Choose File
          <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} hidden />
        </label>
        {fileName && <p className="success-text"><CheckCircle size={16} /> Selected: {fileName}</p>}
      </div>
      <div className="notice"><AlertTriangle size={19} /><span>This frontend currently demonstrates file selection only. Actual file parsing and Python processing have not yet been connected.</span></div>
    </section>
  );

const renderClassification = () => <Classification />;

  const renderMorphing = () => (
    <section className="panel page-panel">
      <PageHeading title="Data Morphing" subtitle="Configure a demonstration privacy transformation plan." />
      <div className="morph-card">
        <div className="morph-symbol"><ShieldCheck size={38} /></div>
        <h3>Privacy Transformation Settings</h3>
        <p>Choose a demonstration protection level for your dataset.</p>
        <label className="field-label" htmlFor="morph-level">Protection level</label>
        <select id="morph-level" value={morphLevel} onChange={(e) => setMorphLevel(e.target.value)}>
          <option>Low</option><option>Medium</option><option>High</option>
        </select>
        <div className="protection-info">
          <Lock size={18} />
          <span>
            {morphLevel === "Low" && "Low: Basic masking plan."}
            {morphLevel === "Medium" && "Medium: Masking and generalization plan."}
            {morphLevel === "High" && "High: Stronger masking and generalization plan."}
          </span>
        </div>
        <button className="primary-button" onClick={() => showMessage("Demo plan prepared. No records have been transformed.")}>
          <RefreshCw size={17} /> Prepare Morphing Plan
        </button>
      </div>
      <div className="notice"><AlertTriangle size={19} /><span>This page does not yet modify records. The actual morphing engine will be connected to the Python backend later.</span></div>
    </section>
  );

  const renderReports = () => (
    <section className="panel page-panel">
      <PageHeading title="Reports & Export" subtitle="Download a CSV containing the sample records and their current labels." />
      <div className="report-card">
        <div className="report-icon"><FileSpreadsheet size={30} /></div>
        <div className="report-details">
          <h3>Medical Data Demo Report</h3>
          <p>{records.length} sample records · CSV format</p>
          <span className="demo-tag">DEMO DATA</span>
        </div>
        <button className="primary-button" onClick={handleDownload}><Download size={17} /> Export CSV</button>
      </div>
      <div className="notice"><AlertTriangle size={19} /><span>This export contains the built-in fictional demo records, not an uploaded dataset.</span></div>
    </section>
  );

  const renderSettings = () => (
    <section className="panel page-panel">
      <PageHeading title="Settings" subtitle="Configure the frontend demonstration." />
      <div className="setting-row">
        <div><strong>Dark appearance</strong><p>Switch between dark and light page themes.</p></div>
        <button className={`toggle ${darkMode ? "on" : ""}`} onClick={() => setDarkMode(!darkMode)} aria-label="Toggle dark appearance"><span /></button>
      </div>
      <div className="setting-row">
        <div><strong>Application</strong><p>Medical Data Morphing · Frontend prototype</p></div>
        <span className="status-pill">Prototype</span>
      </div>
      <div className="setting-row">
        <div><strong>Dataset handling</strong><p>Only fictional sample records are included.</p></div>
        <Lock size={20} className="muted-icon" />
      </div>
    </section>
  );

  const pageContent = {
    Dashboard: renderDashboard,
    "Upload Dataset": renderUpload,
    "Data Classification": renderClassification,
    "Data Morphing": renderMorphing,
    Reports: renderReports,
    Settings: renderSettings,
  };

  return (
    <div className={`app-shell ${darkMode ? "dark-theme" : "light-theme"}`}>
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><Activity size={23} /></div>
          <div><strong>MedMorph</strong><small>DATA PRIVACY PLATFORM</small></div>
          <button className="mobile-close" onClick={() => setSidebarOpen(false)}><X /></button>
        </div>

        <div className="nav-label">WORKSPACE</div>
        <nav>
          {navigation.map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={`nav-item ${activePage === name ? "active" : ""}`}
              onClick={() => { setActivePage(name); setSidebarOpen(false); setSearch(""); }}
            >
              <Icon size={19} /><span>{name}</span>
              {activePage === name && <span className="active-dot" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="security-card"><Lock size={19} /><strong>Privacy First</strong><p>Prototype interface for medical data protection.</p></div>
          <div className="profile"><div className="avatar">MD</div><div><strong>Project Workspace</strong><small>Student Prototype</small></div></div>
        </div>
      </aside>

      {sidebarOpen && <button className="sidebar-overlay" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" />}

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button className="mobile-menu" onClick={() => setSidebarOpen(true)}><Menu /></button>
            <div><span className="breadcrumb">Workspace /</span><strong>{activePage}</strong></div>
          </div>
          <div className="topbar-right"><span className="online-dot" /> System Ready <div className="top-avatar">MD</div></div>
        </header>

        <div className="page-content">
          {pageContent[activePage]()}
          <footer>© 2026 Medical Data Morphing · Academic Project Prototype</footer>
        </div>
      </main>

      {message && <div className="toast"><CheckCircle size={18} />{message}</div>}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, note }) {
  return (
    <div className="stat-card">
      <div className="stat-top"><span>{label}</span><span className="stat-icon"><Icon size={20} /></span></div>
      <h2>{value}</h2><small>{note}</small>
    </div>
  );
}

function PageHeading({ title, subtitle }) {
  return <div className="page-heading"><h2>{title}</h2><p>{subtitle}</p></div>;
}

function RecordTable({ records, updateCategory }) {
  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>Patient ID</th><th>Age</th><th>Gender</th><th>Diagnosis</th><th>Risk</th><th>Category</th></tr></thead>
        <tbody>
          {records.length === 0 ? (
            <tr><td colSpan="6" className="empty-state">No matching records found.</td></tr>
          ) : records.map((record) => (
            <tr key={record.id}>
              <td className="patient-id">{record.id}</td>
              <td>{record.age}</td><td>{record.gender}</td><td>{record.diagnosis}</td>
              <td><span className={`risk-badge ${record.risk.toLowerCase()}`}>{record.risk}</span></td>
              <td>
                <select className="category-select" value={record.category} onChange={(e) => updateCategory(record.id, e.target.value)}>
                  <option>Sensitive</option><option>Non-sensitive</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
