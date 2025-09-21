import { useState, useMemo } from "react";
import { useGetParticipationsByEventIdQuery } from "../../../../../state/redux/participants/participantsApi";
import DataTable from "../../../../../components/AdminCommons/DataTable/DataTable";
import { formatDateTime } from "../../../../../utils/time";
import styles from "./ParticipationTable.module.css";

const ParticipationTable = ({ eventId }) => {
  const { data: { participations } = {} } =
    useGetParticipationsByEventIdQuery(eventId);
  
  const [teamSizeFilter, setTeamSizeFilter] = useState("");
  const [teamNameFilter, setTeamNameFilter] = useState("");

  // Filter data based on team size and team name
  const filteredParticipations = useMemo(() => {
    if (!participations) return [];
    
    return participations.filter((participation) => {
      const teamSize = participation.teamSize || 1;
      const teamName = participation.teamName || "";
      
      const teamSizeMatch = !teamSizeFilter || teamSize.toString() === teamSizeFilter;
      const teamNameMatch = !teamNameFilter || teamName.toLowerCase().includes(teamNameFilter.toLowerCase());
      
      return teamSizeMatch && teamNameMatch;
    });
  }, [participations, teamSizeFilter, teamNameFilter]);

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
      label: "Team Size",
      key: "teamSize",
      modifier: (value) => value || 1,
    },
    {
      label: "Team/Participant Members",
      key: "teamMemberNames",
      modifier: (value) => value ? value.join(", ") : "N/A",
    },
    {
      label: "Members Count",
      key: "members",
      modifier: (value) => value.length,
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
          <button
            onClick={() => {
              setTeamSizeFilter("");
              setTeamNameFilter("");
            }}
            className={styles.clearFilters}
          >
            Clear Filters
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
