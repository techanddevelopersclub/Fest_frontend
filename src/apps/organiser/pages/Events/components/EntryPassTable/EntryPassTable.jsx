import { useState, useMemo } from "react";
import { useGetEntryPassesByEventQuery } from "../../../../../../state/redux/entryPass/entryPassApi";
import DataTable from "../../../../../../components/AdminCommons/DataTable/DataTable";
import { formatDateTime } from "../../../../../../utils/time";
import { exportEntryPassesToCSV, downloadCSV } from "../../../../../../utils/csvExport";
import { Download } from "lucide-react";
import styles from "./EntryPassTable.module.css";

const EntryPassTable = ({ eventId }) => {
  const { data: { entryPasses } = {} } = useGetEntryPassesByEventQuery(eventId);
  
  const [statusFilter, setStatusFilter] = useState("");
  const [collegeFilter, setCollegeFilter] = useState("");

  // Handle CSV download
  const handleDownloadCSV = () => {
    const csvContent = exportEntryPassesToCSV(filteredEntryPasses);
    const filename = `entry-passes-${eventId}-${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(csvContent, filename);
  };

  // Filter data based on status and college
  const filteredEntryPasses = useMemo(() => {
    if (!entryPasses) return [];
    
    return entryPasses.filter((entryPass) => {
      const isUsed = entryPass.isUsed;
      const college = entryPass.user?.college || "";
      
      const statusMatch = !statusFilter || 
        (statusFilter === "used" && isUsed) || 
        (statusFilter === "unused" && !isUsed);
      const collegeMatch = !collegeFilter || 
        college.toLowerCase().includes(collegeFilter.toLowerCase());
      
      return statusMatch && collegeMatch;
    });
  }, [entryPasses, statusFilter, collegeFilter]);

  // Get unique colleges for filter dropdown
  const uniqueColleges = useMemo(() => {
    if (!entryPasses) return [];
    const colleges = [...new Set(entryPasses.map(ep => ep.user?.college).filter(Boolean))];
    return colleges.sort();
  }, [entryPasses]);

  const columns = [
    {
      label: "Created At",
      key: "createdAt",
      modifier: (value) => formatDateTime(value),
    },
    {
      label: "User Name",
      key: "user",
      modifier: (value) => value?.name || "N/A",
    },
    {
      label: "Email",
      key: "user",
      modifier: (value) => value?.email || "N/A",
    },
    {
      label: "College",
      key: "user",
      modifier: (value) => value?.college || "N/A",
    },
    {
      label: "Branch",
      key: "user",
      modifier: (value) => value?.branchName || "N/A",
    },
    {
      label: "Degree",
      key: "user",
      modifier: (value) => value?.degree || "N/A",
    },
    {
      label: "Graduation Year",
      key: "user",
      modifier: (value) => value?.yearOfGraduation || "N/A",
    },
    {
      label: "Status",
      key: "isUsed",
      modifier: (value) => (
        <span className={`${styles.statusBadge} ${value ? styles.used : styles.unused}`}>
          {value ? "Used" : "Unused"}
        </span>
      ),
    },
    {
      label: "Used At",
      key: "usedAt",
      modifier: (value) => value ? formatDateTime(value) : "N/A",
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h3>Entry Passes</h3>
          <p>Verified entry passes for this event</p>
        </div>
        
        <div className={styles.actions}>
          <button 
            className={styles.downloadBtn}
            onClick={handleDownloadCSV}
            disabled={!filteredEntryPasses.length}
          >
            <Download size={16} />
            Download CSV ({filteredEntryPasses.length})
          </button>
        </div>
      </div>

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label htmlFor="statusFilter">Status:</label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">All Status</option>
            <option value="used">Used</option>
            <option value="unused">Unused</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="collegeFilter">College:</label>
          <select
            id="collegeFilter"
            value={collegeFilter}
            onChange={(e) => setCollegeFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">All Colleges</option>
            {uniqueColleges.map((college) => (
              <option key={college} value={college}>
                {college}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <DataTable
        title={`Entry Passes (${filteredEntryPasses.length} of ${entryPasses?.length || 0})`}
        columns={columns}
        data={filteredEntryPasses}
        getRowId={(row) => row._id}
      />
    </div>
  );
};

export default EntryPassTable;
