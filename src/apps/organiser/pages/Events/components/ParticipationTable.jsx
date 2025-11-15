import { useState, useMemo } from "react";
import { useGetParticipationsByEventIdQuery, useUpdateParticipantAttendanceMutation } from "../../../../../state/redux/participants/participantsApi";
import DataTable from "../../../../../components/AdminCommons/DataTable/DataTable";
import { formatDateTime } from "../../../../../utils/time";
import { exportParticipantsToCSV, downloadCSV } from "../../../../../utils/csvExport";
import { Download, CheckCircle, XCircle, Clock } from "lucide-react";
import styles from "./ParticipationTable.module.css";

const ParticipationTable = ({ eventId }) => {
  const { data: { participations } = {} } =
    useGetParticipationsByEventIdQuery(eventId);
  const [updateAttendance] = useUpdateParticipantAttendanceMutation();
  
  const [teamSizeFilter, setTeamSizeFilter] = useState("");
  const [teamNameFilter, setTeamNameFilter] = useState("");
  const [attendanceFilter, setAttendanceFilter] = useState("");

  // Handle attendance update
  const handleAttendanceUpdate = async (participantId, newAttendance) => {
    try {
      await updateAttendance({
        participantId,
        attendance: newAttendance,
      }).unwrap();
    } catch (error) {
      console.error('Failed to update attendance:', error);
    }
  };

  // Handle CSV download
  const handleDownloadCSV = () => {
    const csvContent = exportParticipantsToCSV(filteredParticipations);
    const filename = `participants-${eventId}-${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(csvContent, filename);
  };

  // Filter data based on team size, team name, and attendance
  const filteredParticipations = useMemo(() => {
    if (!participations) return [];
    
    return participations.filter((participation) => {
      const teamSize = participation.teamSize || 1;
      const teamName = participation.teamName || "";
      const attendance = participation.attendance || "pending";
      
      const teamSizeMatch = !teamSizeFilter || teamSize.toString() === teamSizeFilter;
      const teamNameMatch = !teamNameFilter || teamName.toLowerCase().includes(teamNameFilter.toLowerCase());
      const attendanceMatch = !attendanceFilter || attendance === attendanceFilter;
      
      return teamSizeMatch && teamNameMatch && attendanceMatch;
    });
  }, [participations, teamSizeFilter, teamNameFilter, attendanceFilter]);

  // Get unique team sizes for filter dropdown
  const uniqueTeamSizes = useMemo(() => {
    if (!participations) return [];
    const sizes = [...new Set(participations.map(p => p.teamSize || 1))];
    return sizes.sort((a, b) => a - b);
  }, [participations]);

  const columns = [
    {
      label: "Registered At",
      key: "createdAt",
      modifier: (value) => formatDateTime(value),
    },
    {
      label: "Team/Participant Name",
      key: "teamName",
      modifier: (value) => value || "N/A",
    },
    {
      label: "Leader",
      key: "leader",
      modifier: (value) => value.name,
    },
    {
      label: "Contact Email",
      key: "leader",
      modifier: (value) => value.email,
    },
    {
      label: "Mobile",
      key: "leader",
      modifier: (value) => value.mobile,
    },
    {
      label: "Branch",
      key: "leader",
      modifier: (value) => value.branchName,
    },
    {
      label: "Year",
      key: "leader",
      modifier: (value) => value.yearOfGraduation,
    },
    {
      label: "Team Size",
      key: "teamSize",
      modifier: (value) => value || 1,
    },
    {
      label: "Team/Participant Members",
      key: "members",
      modifier: (value) => {
        if (!value || value.length === 0) return "N/A";
        return value.map(member => `${member.name} (${member.email})`).join(", ");
      },
    },
    {
      label: "Members Count",
      key: "members",
      modifier: (value) => value?.length || 0,
    },
    {
      label: "Attendance",
      key: "attendance",
      modifier: (value, row) => {
        const attendance = value || "pending";
        const getAttendanceIcon = () => {
          switch (attendance) {
            case "present":
              return <CheckCircle size={16} className={styles.presentIcon} />;
            case "absent":
              return <XCircle size={16} className={styles.absentIcon} />;
            default:
              return <Clock size={16} className={styles.pendingIcon} />;
          }
        };

        const getAttendanceText = () => {
          switch (attendance) {
            case "present":
              return "Present";
            case "absent":
              return "Absent";
            default:
              return "Pending";
          }
        };

        return (
          <div className={styles.attendanceCell}>
            <div className={styles.attendanceStatus}>
              {getAttendanceIcon()}
              <span className={`${styles.attendanceText} ${styles[attendance]}`}>
                {getAttendanceText()}
              </span>
            </div>
            <div className={styles.attendanceActions}>
              <button
                onClick={() => handleAttendanceUpdate(row._id, "present")}
                className={`${styles.attendanceBtn} ${styles.presentBtn} ${attendance === "present" ? styles.active : ""}`}
                title="Mark as Present"
              >
                <CheckCircle size={14} />
              </button>
              <button
                onClick={() => handleAttendanceUpdate(row._id, "absent")}
                className={`${styles.attendanceBtn} ${styles.absentBtn} ${attendance === "absent" ? styles.active : ""}`}
                title="Mark as Absent"
              >
                <XCircle size={14} />
              </button>
              <button
                onClick={() => handleAttendanceUpdate(row._id, "pending")}
                className={`${styles.attendanceBtn} ${styles.pendingBtn} ${attendance === "pending" ? styles.active : ""}`}
                title="Mark as Pending"
              >
                <Clock size={14} />
              </button>
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label htmlFor="teamSizeFilter">Filter by Team Size:</label>
          <select
            id="teamSizeFilter"
            value={teamSizeFilter}
            onChange={(e) => setTeamSizeFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">All Sizes</option>
            {uniqueTeamSizes.map((size) => (
              <option key={size} value={size}>
                {size} member{size !== 1 ? 's' : ''}
              </option>
            ))}
          </select>
        </div>
        
        <div className={styles.filterGroup}>
          <label htmlFor="teamNameFilter">Filter by Name:</label>
          <input
            id="teamNameFilter"
            type="text"
            value={teamNameFilter}
            onChange={(e) => setTeamNameFilter(e.target.value)}
            placeholder="Search team/participant names..."
            className={styles.filterInput}
          />
        </div>
        
        <div className={styles.filterGroup}>
          <label htmlFor="attendanceFilter">Filter by Attendance:</label>
          <select
            id="attendanceFilter"
            value={attendanceFilter}
            onChange={(e) => setAttendanceFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">All Status</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="pending">Pending</option>
          </select>
        </div>
        
        <div className={styles.filterGroup}>
          <button
            onClick={() => {
              setTeamSizeFilter("");
              setTeamNameFilter("");
              setAttendanceFilter("");
            }}
            className={styles.clearFilters}
          >
            Clear Filters
          </button>
        </div>
        
        <div className={styles.filterGroup}>
          <button
            onClick={handleDownloadCSV}
            className={styles.downloadButton}
            disabled={!filteredParticipations || filteredParticipations.length === 0}
            title={`Download ${filteredParticipations.length} participants as CSV`}
          >
            <Download size={16} />
            Download CSV ({filteredParticipations.length})
          </button>
        </div>
      </div>
      
      <DataTable
        title={`Participants (${filteredParticipations.length} of ${participations?.length || 0})`}
        columns={columns}
        data={filteredParticipations}
        getRowId={(row) => row._id}
      />
    </div>
  );
};

export default ParticipationTable;
