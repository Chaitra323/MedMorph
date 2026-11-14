import React, { useRef, useState } from "react";
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
  Info,
  Lock,
  Trash2,
  FileCheck,
  Eye,
  Moon,
  Sun,
  ShieldAlert,
} from "lucide-react";

import Papa from "papaparse";
import * as XLSX from "xlsx";

import Classification from "./Classification";
import "./index.css";

// --------------------------------------------------
// Navigation items
// --------------------------------------------------

const navigationItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "upload", label: "Upload Dataset", icon: Upload },
  { id: "classification", label: "Data Classification", icon: Database },
  { id: "morphing", label: "Data Morphing", icon: ShieldCheck },
  { id: "reports", label: "Reports", icon: FileBarChart },
  { id: "settings", label: "Settings", icon: Settings },
];

// --------------------------------------------------
// Reusable statistic card
// --------------------------------------------------

function StatCard({ icon: Icon, title, value, description, color }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}>
        <Icon size={22} />
      </div>

      <div>
        <p>{title}</p>
        <h2>{value}</h2>
        <span>{description}</span>
      </div>
    </div>
  );
}

// --------------------------------------------------
// Main App
// --------------------------------------------------

export default function App() {
  const fileInputRef = useRef(null);

  // Navigation
  const [activePage, setActivePage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Theme
  const [darkMode, setDarkMode] = useState(true);

  // Dataset
  const [dataset, setDataset] = useState({
    headers: [],
    rows: [],
    fileName: "",
    file: null,
  });

  // Automatic classification results
  const [classificationResults, setClassificationResults] = useState([]);

  // Morphing settings
  const [morphLevel, setMorphLevel] = useState("medium");
  const [morphedRows, setMorphedRows] = useState([]);
  const [morphCompleted, setMorphCompleted] = useState(false);

  // Search and notifications
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  // --------------------------------------------------
  // Notification
  // --------------------------------------------------

  const showMessage = (text) => {
    setMessage(text);

    setTimeout(() => {
      setMessage("");
    }, 3000);
  };

  // --------------------------------------------------
  // Upload and parse CSV / Excel
  // --------------------------------------------------

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const extension = file.name.split(".").pop().toLowerCase();

    if (!["csv", "xlsx", "xls"].includes(extension)) {
      showMessage("Please upload a CSV or Excel file.");
      event.target.value = "";
      return;
    }

    const processData = (headers, rows) => {
      if (!headers.length || !rows.length) {
        showMessage("The uploaded file does not contain usable data.");
        return;
      }

      const cleanedHeaders = headers.map((header) => String(header).trim());

      const cleanedRows = rows.map((row) => {
        const cleanedRow = {};

        cleanedHeaders.forEach((header) => {
          cleanedRow[header] = row[header] ?? "";
        });

        return cleanedRow;
      });

      setDataset({
        headers: cleanedHeaders,
        rows: cleanedRows,
        fileName: file.name,
        file: file,
      });

      // Clear previous results when a new file is uploaded
      setClassificationResults([]);
      setMorphedRows([]);
      setMorphCompleted(false);

      setActivePage("classification");
      showMessage(
        "Dataset uploaded successfully. Automatic classification is ready."
      );
    };

    if (extension === "csv") {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,

        complete: (results) => {
          if (results.errors.length > 0) {
            showMessage(
              "Some rows could not be read. Please check your CSV file."
            );
            return;
          }

          const headers = results.meta.fields || [];
          processData(headers, results.data);
        },

        error: () => {
          showMessage("Unable to read the CSV file.");
        },
      });
    } else {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const workbook = XLSX.read(e.target.result, {
            type: "array",
          });

          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

          const rows = XLSX.utils.sheet_to_json(firstSheet, {
            defval: "",
            raw: false,
          });

          const headers = rows.length
            ? Object.keys(rows[0])
            : XLSX.utils.sheet_to_json(firstSheet, {
                header: 1,
              })[0] || [];

          processData(headers, rows);
        } catch {
          showMessage("Unable to read the Excel file.");
        }
      };

      reader.onerror = () => {
        showMessage("Unable to read the selected file.");
      };

      reader.readAsArrayBuffer(file);
    }

    event.target.value = "";
  };

  // --------------------------------------------------
  // Clear uploaded dataset
  // --------------------------------------------------

  const clearDataset = () => {
    setDataset({
      headers: [],
      rows: [],
      fileName: "",
      file: null,
    });

    setClassificationResults([]);
    setMorphedRows([]);
    setMorphCompleted(false);

    showMessage("Dataset removed successfully.");
  };

  // --------------------------------------------------
  // Automatic classification integration
  // --------------------------------------------------

  const renderClassification = () => (
    <Classification
      dataset={dataset}
      onClassificationChange={setClassificationResults}
    />
  );

  // --------------------------------------------------
  // Privacy-related field count
  // --------------------------------------------------

  const sensitiveFields = classificationResults.filter(
    (item) => item.category === "Sensitive"
  ).length;

  const reviewFields = classificationResults.filter(
    (item) => item.category === "Needs Review"
  ).length;

  const nonSensitiveFields = classificationResults.filter(
    (item) => item.category === "Non-sensitive"
  ).length;

  // --------------------------------------------------
  // Dashboard
  // --------------------------------------------------

  const renderDashboard = () => {
    const totalRecords = dataset.rows.length;
    const totalColumns = dataset.headers.length;

    const previewRows = dataset.rows.slice(0, 5);

    return (
      <>
        <div className="welcome-banner">
          <div>
            <span className="welcome-label">MEDMORPH DATA SECURITY</span>

            <h1>Welcome to MedMorph</h1>

            <p>
              Identify sensitive medical information and prepare
              protected datasets for software testing.
            </p>
          </div>

          <div className="welcome-icon">
            <ShieldCheck size={54} />
          </div>
        </div>

        <div className="stats-grid">
          <StatCard
            icon={Database}
            title="Total Records"
            value={totalRecords}
            description="Uploaded dataset records"
            color="blue"
          />

          <StatCard
            icon={ShieldCheck}
            title="Protected Records"
            value={morphCompleted ? morphedRows.length : "—"}
            description={
              morphCompleted ? "Morphing completed" : "Not processed yet"
            }
            color="green"
          />

          <StatCard
            icon={ShieldAlert}
            title="Sensitive Fields"
            value={
              classificationResults.length > 0
                ? sensitiveFields
                : "—"
            }
            description={
              classificationResults.length > 0
                ? "Automatically identified"
                : "Awaiting classification"
            }
            color="red"
          />

          <StatCard
            icon={FileSpreadsheet}
            title="Dataset Columns"
            value={totalColumns}
            description="Columns in uploaded dataset"
            color="orange"
          />
        </div>

        <div className="panel activity-panel">
          <div className="panel-header">
            <div>
              <h2>Recent Dataset Records</h2>
              <p>
                Preview of the currently uploaded dataset.
              </p>
            </div>

            {dataset.fileName && (
              <span className="file-label">
                <FileSpreadsheet size={15} />
                {dataset.fileName}
              </span>
            )}
          </div>

          {previewRows.length > 0 ? (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    {dataset.headers.map((header) => (
                      <th key={header}>{header}</th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {previewRows.map((row, index) => (
                    <tr key={index}>
                      {dataset.headers.map((header) => (
                        <td key={header}>
                          {String(row[header] ?? "")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <FileSpreadsheet size={42} />

              <h3>No dataset uploaded yet</h3>

              <p>
                Upload a CSV or Excel dataset to see its records and
                classification results here.
              </p>

              <button
                className="primary-btn"
                onClick={() => setActivePage("upload")}
              >
                <Upload size={16} />
                Upload Dataset
              </button>
            </div>
          )}
        </div>

        {classificationResults.length > 0 && (
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2>Classification Summary</h2>
                <p>Automatic analysis of your uploaded columns.</p>
              </div>

              <button
                className="secondary-btn"
                onClick={() => setActivePage("classification")}
              >
                View Results
                <ArrowUpRight size={16} />
              </button>
            </div>

            <div className="summary-grid">
              <div>
                <ShieldAlert size={20} />
                <strong>{sensitiveFields}</strong>
                <span>Sensitive</span>
              </div>

              <div>
                <ShieldCheck size={20} />
                <strong>{nonSensitiveFields}</strong>
                <span>Non-sensitive</span>
              </div>

              <div>
                <AlertTriangle size={20} />
                <strong>{reviewFields}</strong>
                <span>Needs Review</span>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  // --------------------------------------------------
  // Upload Dataset page
  // --------------------------------------------------

  const renderUpload = () => (
    <>
      <div className="page-heading">
        <div>
          <h1>Upload Dataset</h1>
          <p>
            Import your medical dataset for automatic privacy analysis.
          </p>
        </div>
      </div>

      <div className="panel upload-panel">
        <div className="upload-area">
          <div className="upload-icon">
            <Upload size={34} />
          </div>

          <h2>Upload your dataset</h2>

          <p>
            Select a CSV or Excel file from your computer.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileUpload}
            hidden
          />

          <button
            className="primary-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={17} />
            Browse Files
          </button>

          <span className="upload-supported">
            Supported formats: CSV, XLSX, XLS
          </span>
        </div>
      </div>

      {dataset.fileName && (
        <div className="panel uploaded-file-panel">
          <div className="panel-header">
            <div>
              <h2>Uploaded Dataset</h2>
              <p>Your currently loaded file.</p>
            </div>

            <button
              className="danger-btn"
              onClick={clearDataset}
            >
              <Trash2 size={16} />
              Remove Dataset
            </button>
          </div>

          <div className="uploaded-file-details">
            <div className="file-info-icon">
              <FileSpreadsheet size={25} />
            </div>

            <div className="uploaded-file-name">
              <strong>{dataset.fileName}</strong>
              <span>
                {dataset.rows.length} records · {dataset.headers.length} columns
              </span>
            </div>

            <span className="success-label">
              <CheckCircle size={16} />
              Uploaded
            </span>
          </div>

          <div className="upload-next-step">
            <Info size={18} />

            <p>
              Your dataset is loaded in the browser. Go to Data
              Classification to view the automatic identification results.
            </p>

            <button
              className="secondary-btn"
              onClick={() => setActivePage("classification")}
            >
              View Classification
              <ArrowUpRight size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="notice-card">
        <Lock size={19} />

        <div>
          <strong>Data privacy notice</strong>
          <p>
            This prototype reads the selected file in your browser.
            Do not upload real patient information during development.
          </p>
        </div>
      </div>
    </>
  );

  // --------------------------------------------------
  // Masking function for data morphing
  // --------------------------------------------------

  const maskSensitiveValue = (value, level) => {
    if (value === null || value === undefined || value === "") {
      return value;
    }

    const text = String(value);

    if (level === "high") {
      return "REDACTED";
    }

    if (text.length <= 2) {
      return "*".repeat(text.length);
    }

    if (level === "low") {
      return text.substring(0, 2) + "*".repeat(text.length - 2);
    }

    return text.substring(0, 1) + "*".repeat(text.length - 1);
  };

  // --------------------------------------------------
  // Run basic frontend morphing
  // --------------------------------------------------

  const handleMorph = () => {
    if (!dataset.rows.length) {
      showMessage("Please upload a dataset first.");
      return;
    }

    if (!classificationResults.length) {
      showMessage("Please classify the dataset first.");
      return;
    }

    const sensitiveColumns = classificationResults
      .filter((item) => item.category === "Sensitive")
      .map((item) => item.column);

    if (sensitiveColumns.length === 0) {
      showMessage("No automatically identified sensitive columns to mask.");
      return;
    }

    const transformedRows = dataset.rows.map((row) => {
      const transformedRow = { ...row };

      sensitiveColumns.forEach((column) => {
        transformedRow[column] = maskSensitiveValue(
          row[column],
          morphLevel
        );
      });

      return transformedRow;
    });

    setMorphedRows(transformedRows);
    setMorphCompleted(true);

    showMessage("Basic masking completed successfully.");
  };

  // --------------------------------------------------
  // Download CSV
  // --------------------------------------------------

  const downloadCSV = (rows, fileName) => {
    if (!rows || rows.length === 0) {
      showMessage("There is no data available to download.");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Dataset");

    XLSX.writeFile(workbook, fileName);
  };

  // --------------------------------------------------
  // Data Morphing page
  // --------------------------------------------------

  const renderMorphing = () => {
    const previewRows = morphedRows.slice(0, 5);

    return (
      <>
        <div className="page-heading">
          <div>
            <h1>Data Morphing</h1>
            <p>
              Transform sensitive values while retaining the dataset structure.
            </p>
          </div>
        </div>

        {!dataset.rows.length ? (
          <div className="empty-state">
            <ShieldCheck size={45} />
            <h3>No dataset available</h3>
            <p>Upload and classify a dataset before starting morphing.</p>

            <button
              className="primary-btn"
              onClick={() => setActivePage("upload")}
            >
              <Upload size={16} />
              Upload Dataset
            </button>
          </div>
        ) : (
          <>
            <div className="panel morphing-panel">
              <div className="panel-header">
                <div>
                  <h2>Morphing Configuration</h2>
                  <p>
                    Choose how strongly the sensitive values should be masked.
                  </p>
                </div>

                <ShieldCheck size={27} />
              </div>

              <div className="morphing-settings">
                <label htmlFor="morph-level">Masking Level</label>

                <select
                  id="morph-level"
                  value={morphLevel}
                  onChange={(e) => {
                    setMorphLevel(e.target.value);
                    setMorphCompleted(false);
                  }}
                >
                  <option value="low">Low - Partial masking</option>
                  <option value="medium">Medium - Standard masking</option>
                  <option value="high">High - Full redaction</option>
                </select>
              </div>

              <div className="morphing-info">
                <Info size={18} />

                <p>
                  Only columns automatically classified as Sensitive
                  will be masked in this prototype. Fields marked
                  Needs Review are not modified.
                </p>
              </div>

              <button
                className="primary-btn"
                onClick={handleMorph}
              >
                <RefreshCw size={17} />
                Start Data Morphing
              </button>
            </div>

            {morphCompleted && (
              <div className="panel">
                <div className="panel-header">
                  <div>
                    <h2>Morphing Results</h2>
                    <p>
                      Preview of the transformed dataset.
                    </p>
                  </div>

                  <span className="success-label">
                    <CheckCircle size={16} />
                    Completed
                  </span>
                </div>

                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        {dataset.headers.map((header) => (
                          <th key={header}>{header}</th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {previewRows.map((row, index) => (
                        <tr key={index}>
                          {dataset.headers.map((header) => (
                            <td key={header}>
                              {String(row[header] ?? "")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  className="primary-btn"
                  onClick={() =>
                    downloadCSV(morphedRows, "MedMorph_Protected_Dataset.xlsx")
                  }
                >
                  <Download size={17} />
                  Download Protected Dataset
                </button>
              </div>
            )}
          </>
        )}
      </>
    );
  };

  // --------------------------------------------------
  // Reports page
  // --------------------------------------------------

  const renderReports = () => (
    <>
      <div className="page-heading">
        <div>
          <h1>Reports</h1>
          <p>
            View dataset analysis and privacy classification summaries.
          </p>
        </div>
      </div>

      {!dataset.rows.length ? (
        <div className="empty-state">
          <FileBarChart size={45} />
          <h3>No report available</h3>
          <p>Upload a dataset to generate its classification report.</p>

          <button
            className="primary-btn"
            onClick={() => setActivePage("upload")}
          >
            <Upload size={16} />
            Upload Dataset
          </button>
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <StatCard
              icon={Database}
              title="Total Records"
              value={dataset.rows.length}
              description="Dataset records"
              color="blue"
            />

            <StatCard
              icon={ShieldAlert}
              title="Sensitive Fields"
              value={sensitiveFields}
              description="Automatically identified"
              color="red"
            />

            <StatCard
              icon={ShieldCheck}
              title="Non-sensitive Fields"
              value={nonSensitiveFields}
              description="No known indicators detected"
              color="green"
            />

            <StatCard
              icon={AlertTriangle}
              title="Needs Review"
              value={reviewFields}
              description="Uncertain fields"
              color="orange"
            />
          </div>

          <div className="panel report-panel">
            <div className="panel-header">
              <div>
                <h2>Dataset Report</h2>
                <p>{dataset.fileName}</p>
              </div>

              <FileCheck size={25} />
            </div>

            <div className="report-details">
              <div>
                <span>Dataset Records</span>
                <strong>{dataset.rows.length}</strong>
              </div>

              <div>
                <span>Total Columns</span>
                <strong>{dataset.headers.length}</strong>
              </div>

              <div>
                <span>Classification Status</span>
                <strong>
                  {classificationResults.length > 0
                    ? "Completed"
                    : "Pending"}
                </strong>
              </div>

              <div>
                <span>Morphing Status</span>
                <strong>
                  {morphCompleted ? "Completed" : "Pending"}
                </strong>
              </div>
            </div>

            <button
              className="primary-btn"
              onClick={() =>
                downloadCSV(
                  classificationResults.map((item) => ({
                    Column: item.column,
                    Classification: item.category,
                    Subtype: item.subtype,
                    Data_Type: item.dataType,
                    Confidence: `${item.confidence}%`,
                    Evidence: item.evidence,
                    Uniqueness: `${item.uniqueness}%`,
                    Missing_Values: `${item.missingPercentage}%`,
                  })),
                  "MedMorph_Classification_Report.xlsx"
                )
              }
              disabled={classificationResults.length === 0}
            >
              <Download size={17} />
              Download Classification Report
            </button>
          </div>
        </>
      )}
    </>
  );

  // --------------------------------------------------
  // Settings page
  // --------------------------------------------------

  const renderSettings = () => (
    <>
      <div className="page-heading">
        <div>
          <h1>Settings</h1>
          <p>Manage your MedMorph application preferences.</p>
        </div>
      </div>

      <div className="panel settings-panel">
        <div className="panel-header">
          <div>
            <h2>Appearance</h2>
            <p>Choose your preferred application theme.</p>
          </div>

          {darkMode ? <Moon size={23} /> : <Sun size={23} />}
        </div>

        <div className="setting-row">
          <div>
            <strong>Dark Mode</strong>
            <p>Use the dark navy interface.</p>
          </div>

          <label className="theme-toggle">
            <input
              type="checkbox"
              checked={darkMode}
              onChange={(e) => setDarkMode(e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>

      <div className="panel settings-panel">
        <div className="panel-header">
          <div>
            <h2>Data and Privacy</h2>
            <p>Information about how this prototype handles files.</p>
          </div>

          <Lock size={23} />
        </div>

        <div className="setting-row">
          <div>
            <strong>Current Dataset</strong>
            <p>
              {dataset.fileName || "No dataset uploaded"}
            </p>
          </div>

          <span className="setting-value">
            {dataset.rows.length} records
          </span>
        </div>

        <div className="setting-row">
          <div>
            <strong>Classification Engine</strong>
            <p>Python ML model with automatic column classification</p>
          </div>

          <span className="setting-value">Python ML Model</span>
        </div>

        <div className="setting-row">
          <div>
            <strong>Backend Connection</strong>
            <p>Python FastAPI classification service.</p>
          </div>

          <span className="setting-value">Connected</span>
        </div>

        <button
          className="danger-btn"
          onClick={clearDataset}
          disabled={!dataset.fileName}
        >
          <Trash2 size={16} />
          Clear Uploaded Dataset
        </button>
      </div>
    </>
  );

  // --------------------------------------------------
  // Page content
  // --------------------------------------------------

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return renderDashboard();

      case "upload":
        return renderUpload();

      case "classification":
        return renderClassification();

      case "morphing":
        return renderMorphing();

      case "reports":
        return renderReports();

      case "settings":
        return renderSettings();

      default:
        return renderDashboard();
    }
  };

  const activeNavigation = navigationItems.find(
    (item) => item.id === activePage
  );

  // --------------------------------------------------
  // Main layout
  // --------------------------------------------------

  return (
    <div className={`app-shell ${darkMode ? "dark" : "light"}`}>

      {/* Mobile overlay */}

      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}

      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>

        <div className="brand">
          <div className="brand-icon">
            <ShieldCheck size={25} />
          </div>

          <div>
            <h2>MedMorph</h2>
            <span>Medical Data Security</span>
          </div>

          <button
            className="sidebar-close"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-section-label">
          MAIN MENU
        </div>

        <nav className="sidebar-nav">
          {navigationItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                className={`nav-item ${
                  activePage === item.id ? "active" : ""
                }`}
                onClick={() => {
                  setActivePage(item.id);
                  setSidebarOpen(false);
                }}
              >
                <Icon size={19} />
                <span>{item.label}</span>

                {activePage === item.id && (
                  <span className="nav-active-indicator" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="security-card">
            <div className="security-card-icon">
              <Lock size={19} />
            </div>

            <strong>Privacy First</strong>

            <p>
              Protecting sensitive medical data for safer testing.
            </p>
          </div>

          <div className="profile-section">
            <div className="profile-avatar">
              <Users size={20} />
            </div>

            <div>
              <strong>MedMorph User</strong>
              <span>Administrator</span>
            </div>

            <Settings size={17} />
          </div>
        </div>
      </aside>

      {/* Main section */}

      <main className="main-content">

        {/* Topbar */}

        <header className="topbar">
          <div className="topbar-left">
            <button
              className="menu-button"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={22} />
            </button>

            <div>
              <span className="breadcrumb">MedMorph</span>
              <h2>
                {activeNavigation?.label || "Dashboard"}
              </h2>
            </div>
          </div>

          <div className="topbar-right">
            <div className="system-status">
              <span className="status-dot"></span>
              System Active
            </div>

            <button
              className="theme-button"
              onClick={() => setDarkMode((previous) => !previous)}
              title="Toggle theme"
            >
              {darkMode ? <Sun size={19} /> : <Moon size={19} />}
            </button>
          </div>
        </header>

        {/* Page content */}

        <div className="page-content">
          {renderPage()}
        </div>

        <footer className="app-footer">
          <span>MedMorph</span>
          <span>Medical Data Protection & Privacy</span>
        </footer>
      </main>

      {/* Toast notification */}

      {message && (
        <div className="toast-message">
          <CheckCircle size={18} />
          {message}
        </div>
      )}

    </div>
  );
}