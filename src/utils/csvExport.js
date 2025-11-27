/**
 * Converts participant data to CSV format
 * @param {Array} participants - Array of participant objects
 * @returns {string} CSV formatted string
 */
export const exportParticipantsToCSV = (participants) => {
  if (!participants || participants.length === 0) {
    return '';
  }

  // Define CSV headers
  const headers = [
    'Event Name',
    'Registered At',
    'Team/Participant Name',
    'Leader Name',
    'Leader Email',
    'Leader Mobile',
    'Leader Branch',
    'Team Size',
    'Team Members (email, mobile)',
    'Members Count',
    'Is Team',
    'Attendance',
    'Attendance Marked At'
  ];

  // Convert participants to CSV rows
  const rows = participants.map(participant => {
    const registeredAt = participant.createdAt ? new Date(participant.createdAt).toLocaleString() : 'N/A';
    const teamName = participant.teamName || 'N/A';
    const leaderName = participant.leader?.name || 'N/A';
    const leaderEmail = participant.leader?.email || 'N/A';
    const leaderMobile = participant.leader?.mobile || 'N/A';
    const leaderBranch = participant.leader?.branchName || 'N/A';
    const teamSize = participant.teamSize || 1;
    const teamMembers = participant.members && participant.members.length > 0 
      ? participant.members.map(member => `${member.name} (${member.email || ''}${member.mobile || member.phone ? ', ' : ''}${member.mobile || member.phone || ''})`).join('; ')
      : Array.isArray(participant.teamMemberNames) && participant.teamMemberNames.length > 0
        ? participant.teamMemberNames.join('; ')
        : 'N/A';
    const membersCount = participant.members?.length || (Array.isArray(participant.teamMemberNames) ? participant.teamMemberNames.length : 0);
    const isTeam = participant.isTeam ? 'Yes' : 'No';
    const attendance = participant.attendance || 'pending';
    const attendanceMarkedAt = participant.attendanceMarkedAt ? new Date(participant.attendanceMarkedAt).toLocaleString() : 'N/A';

    return [
      participant._eventName || '',
      registeredAt,
      teamName,
      leaderName,
      leaderEmail,
      leaderMobile,
      leaderBranch,
      teamSize,
      teamMembers,
      membersCount,
      isTeam,
      attendance,
      attendanceMarkedAt
    ];
  });

  // Combine headers and rows
  const csvContent = [headers, ...rows]
    .map(row => 
      row.map(field => {
        // Escape fields that contain commas, quotes, or newlines
        const stringField = String(field || '');
        if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
          return `"${stringField.replace(/"/g, '""')}"`;
        }
        return stringField;
      }).join(',')
    )
    .join('\n');

  return csvContent;
};

/**
 * Converts entry pass data to CSV format
 * @param {Array} entryPasses - Array of entry pass objects
 * @returns {string} CSV formatted string
 */
export const exportEntryPassesToCSV = (entryPasses) => {
  if (!entryPasses || entryPasses.length === 0) {
    return '';
  }

  // Define CSV headers
  const headers = [
    'Created At',
    'User Name',
    'User Email',
    'College',
    'Branch Name',
    'Degree',
    'Graduation Year',
    'Event Name',
    'Is Used',
    'Used At'
  ];

  // Convert entry passes to CSV rows
  const rows = entryPasses.map(entryPass => {
    const createdAt = entryPass.createdAt ? new Date(entryPass.createdAt).toLocaleString() : 'N/A';
    const userName = entryPass.user?.name || 'N/A';
    const userEmail = entryPass.user?.email || 'N/A';
    const college = entryPass.user?.college || 'N/A';
    const branchName = entryPass.user?.branchName || 'N/A';
    const degree = entryPass.user?.degree || 'N/A';
    const yearOfGraduation = entryPass.user?.yearOfGraduation || 'N/A';
    const eventName = entryPass.event?.name || 'N/A';
    const isUsed = entryPass.isUsed ? 'Yes' : 'No';
    const usedAt = entryPass.usedAt ? new Date(entryPass.usedAt).toLocaleString() : 'N/A';

    return [
      createdAt,
      userName,
      userEmail,
      college,
      branchName,
      degree,
      yearOfGraduation,
      eventName,
      isUsed,
      usedAt
    ];
  });

  // Combine headers and rows
  const csvContent = [headers, ...rows]
    .map(row => 
      row.map(field => {
        // Escape fields that contain commas, quotes, or newlines
        const stringField = String(field || '');
        if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
          return `"${stringField.replace(/"/g, '""')}"`;
        }
        return stringField;
      }).join(',')
    )
    .join('\n');

  return csvContent;
};

/**
 * Downloads CSV content as a file
 * @param {string} csvContent - CSV content string
 * @param {string} filename - Name of the file to download
 */
export const downloadCSV = (csvContent, filename = 'participants.csv') => {
  // Create blob with CSV content
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Create download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  URL.revokeObjectURL(url);
};
