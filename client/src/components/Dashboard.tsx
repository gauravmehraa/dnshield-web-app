import React, { useEffect, useState } from "react";
import 'chart.js/auto';
import { Bar, Doughnut } from "react-chartjs-2";

type ExtendedStatsType = {
  totalLogs: number;
  byPrediction: { _id: string; count: number }[];
  byEventType: { _id: string; count: number }[];
  averageDomainLength: number;
  averageEntropy: number;
  averageSendingBytes: number;
  averageReceivingBytes: number;
  averageTTL: number;
  averageVowelsConsonantRatio: number;
  topDomains: { _id: string; count: number }[];
  largestDomain: {
    domain: string;
    dns_domain_name_length: number;
  } | null;
};

type PredictionType = "benign" | "malware" | "spam" | "phishing";
type EventType = "Query" | "Response";

type LogType = {
  _id: string;
  timestamp: string;
  prediction: PredictionType;
  domain: string;
  event_type: EventType;
  dns_domain_name_length: number;
  numerical_percentage: number;
  character_entropy: number;
  max_numeric_length: number;
  max_alphabet_length: number;
  vowels_consonant_ratio: number;
  receiving_bytes: number;
  sending_bytes: number;
  ttl_mean: number;
  createdAt: string;
  updatedAt: string;
};

type LogsResponse = {
  totalCount: number;
  page: number;
  limit: number;
  logs: LogType[];
};

const PAGE_SIZE = 20;

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<ExtendedStatsType | null>(null);
  const [logs, setLogs] = useState<LogType[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchDomain, setSearchDomain] = useState("");
  const [filterPrediction, setFilterPrediction] = useState<PredictionType | "">("");
  const [sortColumn, setSortColumn] = useState<keyof LogType>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const fetchStats = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/stats");
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch stats", error);
    }
  };
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        domain: searchDomain,
        prediction: filterPrediction,
        page: String(currentPage),
        limit: String(PAGE_SIZE),
        sort: String(sortColumn),
        direction: String(sortDirection)
      });
      const response = await fetch(`http://localhost:8000/api/log?${params.toString()}`);
      const data: LogsResponse = await response.json();
      setLogs(data.logs);
      setTotalCount(data.totalCount ?? 0);
    } catch (error) {
      console.error("Failed to fetch logs", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);
  useEffect(() => {
    fetchLogs();
  }, [searchDomain, filterPrediction, sortColumn, sortDirection, currentPage]);
  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const getPredictionColor = (prediction: PredictionType) => {
    switch (prediction) {
      case "benign": return "badge-success";
      case "malware": return "badge-error";
      case "spam": return "badge-warning";
      case "phishing": return "badge-info";
      default: return "badge-ghost";
    }
  };

  const handleSort = (col: keyof LogType) => {
    if (sortColumn === col) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(col);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };
  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };
  const handleRefresh = () => fetchLogs();

  const handleDownloadCSV = async () => {
    const params = new URLSearchParams({
      domain: searchDomain,
      prediction: filterPrediction,
      limit: "0",
      sort: String(sortColumn),
      direction: String(sortDirection)
    });
    const response = await fetch(`http://localhost:8000/api/log?${params.toString()}`);
    const data: LogsResponse = await response.json();
    if (!data.logs.length) return;
    const headers = [
      "timestamp",
      "prediction",
      "domain",
      "event_type",
      "dns_domain_name_length",
      "character_entropy"
    ];
    const rows = data.logs.map((log) => [
      new Date(log.timestamp).toLocaleString(),
      log.prediction,
      log.domain,
      log.event_type,
      log.dns_domain_name_length,
      log.character_entropy.toFixed(2)
    ]);
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(","))
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "logs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const predictionLabels = stats?.byPrediction.map(item => item._id) || [];
  const predictionCounts = stats?.byPrediction.map(item => item.count) || [];
  const predictionsBarData = {
    labels: predictionLabels,
    datasets: [
      {
        label: "Prediction Counts",
        data: predictionCounts,
        backgroundColor: ["#F87171", "#60A5FA", "#FBBF24", "#34D399"]
      }
    ]
  };
  const eventTypeLabels = stats?.byEventType.map(item => item._id) || [];
  const eventTypeCounts = stats?.byEventType.map(item => item.count) || [];
  const eventTypeDoughnutData = {
    labels: eventTypeLabels,
    datasets: [
      {
        label: "Event Type Distribution",
        data: eventTypeCounts,
        backgroundColor: ["#E879F9", "#34D399", "#FBBF24", "#60A5FA"]
      }
    ]
  };

  return (
    <div data-theme={theme} className="min-h-screen bg-base-200 flex flex-col">
      <div className="navbar bg-neutral text-neutral-content">
        <div className="flex-1 px-2 mx-2">
          <span className="text-lg font-bold">Dashboard</span>
        </div>
        <div className="flex-none mr-4">
          <label className="swap swap-rotate">
            <input
              type="checkbox"
              onChange={toggleTheme}
              checked={theme === "dark"}
            />
            <svg
              className="swap-off fill-current w-6 h-6"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <path d="M5.64 4.22l1.42-1.42L8.46 4.2l-1.42 1.42zM1 11h3v2H1zm2.64 6.78l1.42 1.42 1.4-1.4-1.42-1.42zM11 19h2v3h-2zm7.36-1.22l1.42 1.42 1.42-1.42-1.42-1.42zM19 11h3v2H19zM15.54 4.2l1.4-1.4 1.42 1.42-1.4 1.4zM11 1h2v3h-2z" />
              <circle cx="12" cy="12" r="5" />
            </svg>
            <svg
              className="swap-on fill-current w-6 h-6"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <path d="M21.64 13.66a1 1 0 00-1.11.27 7 7 0 01-7.81 2 7 7 0 01-4.26-4.26 7 7 0 012-7.81 1 1 0 00.27-1.11A1 1 0 009 1a10 10 0 1014 14 1 1 0 00-1.36-1.34z" />
            </svg>
          </label>
        </div>
      </div>
      <div className="container mx-auto p-4 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="card bg-base-100 shadow-md p-4">
            <div className="stat-title">Total Logs</div>
            <div className="stat-value text-primary">
              {stats?.totalLogs ?? 0}
            </div>
          </div>
          <div className="card bg-base-100 shadow-md p-4">
            <div className="stat-title">Avg Domain Len.</div>
            <div className="stat-value">
              {stats ? stats.averageDomainLength.toFixed(2) : 0}
            </div>
          </div>
          <div className="card bg-base-100 shadow-md p-4">
            <div className="stat-title">Avg Entropy</div>
            <div className="stat-value">
              {stats ? stats.averageEntropy.toFixed(2) : 0}
            </div>
          </div>
          <div className="card bg-base-100 shadow-md p-4">
            <div className="stat-title">Avg. TTL</div>
            <div className="stat-value">
              {stats ? stats.averageTTL.toFixed(2) : 0}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="card bg-base-100 shadow-md p-4">
            <div className="stat-title">Avg Sending Bytes</div>
            <div className="stat-value">
              {stats ? stats.averageSendingBytes.toFixed(2) : 0}
            </div>
          </div>
          <div className="card bg-base-100 shadow-md p-4">
            <div className="stat-title">Avg Receiving Bytes</div>
            <div className="stat-value">
              {stats ? stats.averageReceivingBytes.toFixed(2) : 0}
            </div>
          </div>
          <div className="card bg-base-100 shadow-md p-4">
            <div className="stat-title">Avg Vowels/Consonants</div>
            <div className="stat-value">
              {stats ? stats.averageVowelsConsonantRatio.toFixed(2) : 0}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="card bg-base-100 shadow-md p-4">
            <div className="stat-title">Largest Domain</div>
            {stats?.largestDomain ? (
              <div>
                <strong>{stats.largestDomain.domain}</strong> 
                &nbsp;({stats.largestDomain.dns_domain_name_length} chars)
              </div>
            ) : (
              <div>N/A</div>
            )}
          </div>
          <div className="card bg-base-100 shadow-md p-4">
            <div className="card-title">Top Domains</div>
            {stats?.topDomains && stats.topDomains.length > 0 ? (
              <ul className="list-disc ml-5">
                {stats.topDomains.map((d) => (
                  <li key={d._id}>
                    {d._id} ({d.count})
                  </li>
                ))}
              </ul>
            ) : (
              <div>No data</div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="card bg-base-100 shadow-md p-4">
            <div className="card-title">Predictions Overview</div>
            <Bar data={predictionsBarData} />
          </div>
          <div className="card bg-base-100 shadow-md p-4">
            <div className="card-title">Event Type Distribution</div>
            <div className="w-64 h-64 sm:w-96 sm:h-96 mx-auto">
              <Doughnut data={eventTypeDoughnutData}/>
            </div>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-2 mb-4 items-center">
          <div className="flex-1 flex flex-col md:flex-row gap-2">
            <input
              type="text"
              placeholder="Search Domain..."
              className="input input-bordered w-full md:w-1/2"
              value={searchDomain}
              onChange={(e) => {
                const forbiddenChars = /[*^/[\]()+\\]/;
                if (!forbiddenChars.test(e.target.value)) setSearchDomain(e.target.value);
                setCurrentPage(1);
              }}
            />
            <select
              className="select select-bordered w-full md:w-1/2"
              value={filterPrediction}
              onChange={(e) => {
                setFilterPrediction(e.target.value as PredictionType | "");
                setCurrentPage(1);
              }}
            >
              <option value="">All Predictions</option>
              <option value="benign">Benign</option>
              <option value="malware">Malware</option>
              <option value="spam">Spam</option>
              <option value="phishing">Phishing</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={handleRefresh}>
            Refresh
          </button>
          <button className="btn" onClick={handleDownloadCSV} disabled={!logs.length}>
            Download CSV
          </button>
        </div>
        <div className="card bg-base-100 shadow-md h-full relative">
          <div className="card-body flex flex-col">
            <h2 className="card-title">Recent Logs</h2>
            {loading && (
              <div className="absolute right-4 top-16">
                <div className="flex items-center space-x-2">
                  <span className="loading loading-spinner loading-md"></span>
                  <span className="font-bold">Loading...</span>
                </div>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th
                      className="cursor-pointer"
                      onClick={() => handleSort("timestamp")}
                    >
                      Timestamp
                      {sortColumn === "timestamp" &&
                        (sortDirection === "asc" ? " ▲" : " ▼")}
                    </th>
                    <th
                      className="cursor-pointer"
                      onClick={() => handleSort("prediction")}
                    >
                      Prediction
                      {sortColumn === "prediction" &&
                        (sortDirection === "asc" ? " ▲" : " ▼")}
                    </th>
                    <th
                      className="cursor-pointer"
                      onClick={() => handleSort("domain")}
                    >
                      Domain
                      {sortColumn === "domain" &&
                        (sortDirection === "asc" ? " ▲" : " ▼")}
                    </th>
                    <th
                      className="cursor-pointer"
                      onClick={() => handleSort("event_type")}
                    >
                      Event Type
                      {sortColumn === "event_type" &&
                        (sortDirection === "asc" ? " ▲" : " ▼")}
                    </th>
                    <th
                      className="cursor-pointer"
                      onClick={() => handleSort("dns_domain_name_length")}
                    >
                      Domain Length
                      {sortColumn === "dns_domain_name_length" &&
                        (sortDirection === "asc" ? " ▲" : " ▼")}
                    </th>
                    <th
                      className="cursor-pointer"
                      onClick={() => handleSort("character_entropy")}
                    >
                      Entropy
                      {sortColumn === "character_entropy" &&
                        (sortDirection === "asc" ? " ▲" : " ▼")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length > 0 ? (
                    logs.map((log) => (
                      <tr key={log._id}>
                        <td>{new Date(log.timestamp).toLocaleString()}</td>
                        <td>
                          <span className={`badge ${getPredictionColor(log.prediction)}`}>
                            {log.prediction}
                          </span>
                        </td>
                        <td>{log.domain}</td>
                        <td>{log.event_type}</td>
                        <td>{log.dns_domain_name_length}</td>
                        <td>{log.character_entropy.toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center">
                        No logs found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex justify-center items-center mt-4 gap-2">
              <button
                className="btn btn-sm"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="btn btn-sm"
                onClick={handleNextPage}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
