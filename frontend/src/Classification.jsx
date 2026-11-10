
import React, { useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import {
  Upload,
  Search,
  Database,
  ShieldCheck,
  AlertTriangle,
  FileSpreadsheet,
} from "lucide-react";

const categories = [
  "Direct Identifier",
  "Quasi Identifier",
  "Sensitive Attribute",
  "Non-Sensitive Attribute",
];

function identifyColumn(columnName, values) {
  const name = columnName.toLowerCase().replace(/[_-]/g, " ");
  const samples = values
    .filter((value) => value !== null && value !== undefined && value !== "")
    .slice(0, 30)
    .map(String);

  // Identify direct identifiers
  if (
    /\b(patient id|patientid|record id|id|name|full name|first name|last name|email|phone|mobile|telephone|address|passport|ssn|aadhaar)\b/i.test(name)
  ) {
    return {
      category: "Direct Identifier",
      dataType: "Identifier",
    };
  }

  // Identify sensitive medical attributes
  if (
    /\b(diagnosis|disease|medical condition|health condition|medication|medicine|drug|treatment|symptom|medical history|blood group|genetic|disability|mental health|lab result|test result|hiv)\b/i.test(name)
  ) {
    return {
      category: "Sensitive Attribute",
      dataType: "Medical / Sensitive",
    };
  }

  // Identify quasi-identifiers
  if (
    /\b(age|date of birth|dob|birth date|gender|sex|zip|postal code|pincode|city|district|state|occupation|marital status)\b/i.test(name)
  ) {
    return {
      category: "Quasi Identifier",
      dataType: "Demographic",
    };
  }

  // Identify based on values if column name is unclear
  const joined = samples.join(" ");

  if (samples.length > 0) {
    const looksLikeEmail = samples.some((v) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
    );

    const looksLikePhone = samples.some((v) =>
      /^\+?[\d\s()-]{10,}$/.test(v)
    );

    const looksLikeDate = samples.some((v) =>
      /^\d{4}-\d{1,2}-\d{1,2}$/.test(v) ||
      /^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/.test(v)
    );

    if (looksLikeEmail || looksLikePhone) {
      return {
        category: "Direct Identifier",
        dataType: looksLikeEmail ? "Email" : "Phone Number",
      };
    }

    if (looksLikeDate) {
      return {
        category: "Quasi Identifier",
        dataType: "Date",
      };
    }

    if (samples.every((v) => !isNaN(Number(v)))) {
      return {
        category: "Non-Sensitive Attribute",
        dataType: "Numeric",
      };
    }
  }

  return {
    category: "Non-Sensitive Attribute",
    dataType: "Text",
  };
}

function classifyDataset(headers, rows) {
  return headers.map((header) => {
    const values = rows.map((row) => row[header]);
    const identification = identifyColumn(header, values);

    return {
      column: header,
      dataType: identification.dataType,
      category: identification.category,
      sample: values.find(
        (value) => value !== null && value !== undefined && value !== ""
      ) ?? "—",
    };
  });
}

export default function Classification() {
  const [fileName, setFileName] = useState("");
  const [classification, setClassification] = useState([]);
  const [recordCount, setRecordCount] = useState(0);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setLoading(true);
    setFileName(file.name);

    try {
      let rows = [];

      const extension = file.name.split(".").pop().toLowerCase();

      if (extension === "csv") {
        rows = await new Promise((resolve, reject) => {
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (result) => resolve(result.data),
            error: reject,
          });
        });
      } else if (extension === "xlsx" || extension === "xls") {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

        rows = XLSX.utils.sheet_to_json(firstSheet, {
          defval: "",
        });
      } else {
        throw new Error("Please upload a CSV or Excel file.");
      }

      if (!rows.length) {
        throw new Error("The uploaded file does not contain any data.");
      }

      const headers = Object.keys(rows[0]);

      if (!headers.length) {
        throw new Error("No column headings were found.");
      }

      const results = classifyDataset(headers, rows);

      setClassification(results);
      setRecordCount(rows.length);
    } catch (err) {
      setError(err.message || "Unable to process this file.");
      setClassification([]);
      setRecordCount(0);
    } finally {
      setLoading(false);
    }
  }

  function updateCategory(column, category) {
    setClassification((current) =>
      current.map((item) =>
        item.column === column ? { ...item, category } : item
      )
    );
  }

  const filtered = classification.filter((item) =>
    item.column.toLowerCase().includes(search.toLowerCase())
  );

  const countCategory = (category) =>
    classification.filter((item) => item.category === category).length;

  return (
    <div className="classification-page">
      <div className="page-heading">
        <h2>Data Identification & Classification</h2>
        <p>
          Upload a medical dataset to identify its columns and classify
          attributes according to privacy categories.
        </p>
      </div>

      <div className="classification-upload">
        <div className="classification-upload-icon">
          <FileSpreadsheet size={30} />
        </div>

        <div>
          <h3>Upload Medical Dataset</h3>
          <p>Supported formats: CSV, XLSX and XLS</p>
        </div>

        <label className="primary-button classification-upload-button">
          <Upload size={17} />
          Choose Dataset
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFile}
            hidden
          />
        </label>
      </div>

      {loading && <p className="classification-message">Processing dataset...</p>}

      {error && (
        <div className="classification-error">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      {fileName && !error && !loading && (
        <p className="classification-message">
          <ShieldCheck size={17} />
          Dataset: {fileName}
        </p>
      )}

      {classification.length > 0 && (
        <>
          <div className="classification-stats">
            <div className="classification-stat">
              <Database size={20} />
              <span>Total Records</span>
              <strong>{recordCount}</strong>
            </div>

            <div className="classification-stat">
              <FileSpreadsheet size={20} />
              <span>Total Columns</span>
              <strong>{classification.length}</strong>
            </div>

            <div className="classification-stat">
              <ShieldCheck size={20} />
              <span>Sensitive Columns</span>
              <strong>{countCategory("Sensitive Attribute")}</strong>
            </div>

            <div className="classification-stat">
              <AlertTriangle size={20} />
              <span>Direct Identifiers</span>
              <strong>{countCategory("Direct Identifier")}</strong>
            </div>
          </div>

          <section className="panel classification-results">
            <div className="panel-heading">
              <div>
                <h3>Identification Results</h3>
                <p>Review the identified data types and categories.</p>
              </div>
            </div>

            <div className="classification-search">
              <Search size={17} />
              <input
                type="text"
                placeholder="Search column name..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Column Name</th>
                    <th>Identified Type</th>
                    <th>Sample Value</th>
                    <th>Classification</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.column}>
                      <td className="patient-id">{item.column}</td>
                      <td>{item.dataType}</td>
                      <td className="sample-value">
                        {String(item.sample).slice(0, 35)}
                      </td>
                      <td>
                        <select
                          className="category-select"
                          value={item.category}
                          onChange={(event) =>
                            updateCategory(item.column, event.target.value)
                          }
                        >
                          {categories.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}

                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan="4" className="empty-state">
                        No matching columns found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <div className="classification-note">
            <AlertTriangle size={18} />
            <p>
              These results are generated using rule-based column-name and
              sample-value checks. They are preliminary suggestions, not
              guaranteed privacy classifications. Review them manually.
            </p>
          </div>
        </>
      )}

      {!classification.length && !loading && !error && (
        <div className="classification-empty">
          <Database size={35} />
          <h3>No dataset uploaded yet</h3>
          <p>Upload a CSV or Excel file to begin identification.</p>
        </div>
      )}
    </div>
  );
}
