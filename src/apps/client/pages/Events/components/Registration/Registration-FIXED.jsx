// IMPORTANT: This shows the corrected handleTeamMembersChange function
// Replace the existing one in Registration.jsx with this version

const MONGO_OBJECTID_REGEX = /^[0-9a-fA-F]{24}$/;

const handleTeamMembersChange = (e) => {
  const input = e.target.value;
  
  // Parse input: split by comma and/or whitespace, trim each entry
  const parsed = input
    .split(/[,\s]+/)  // Split by comma or whitespace
    .map((member) => member.trim())
    .filter((member) => member !== "");

  // Store the parsed input without strict validation yet
  setMemberIds(parsed);
  
  // Only validate if user has completed entries (contains delimiters like comma/space/newline)
  const hasDelimiters = /[,\s]/.test(input);
  
  if (hasDelimiters && parsed.length > 0) {
    // Now validate the completed entries
    
    // Block if leader's ID is included
    if (parsed.includes(user._id)) {
      setError("Do not include the team leader's ID in members list");
      return;
    }

    // Validate ObjectId format for all entries
    const invalidIds = parsed.filter(id => !MONGO_OBJECTID_REGEX.test(id));
    if (invalidIds.length > 0) {
      setError(`Invalid ID format. All IDs must be valid ObjectIds (${invalidIds[0]})`);
      return;
    }

    const uniqueMemberIds = [...new Set(parsed)];
    const minMembers = Math.max(0, (event.minTeamSize || 1) - 1);
    const maxMembers = Math.max(0, (event.maxTeamSize || 1) - 1);

    if (uniqueMemberIds.length < minMembers) {
      setError(`Please enter ${minMembers} member ID${minMembers > 1 ? "s" : ""}`);
    } else if (uniqueMemberIds.length > maxMembers) {
      setError(`Maximum members allowed is ${maxMembers}`);
    } else {
      setError(null);
    }

    setMemberIds(uniqueMemberIds);
    // Keep memberNames aligned; trim if IDs were removed
    setMemberNames(prev => prev.slice(0, uniqueMemberIds.length));
  } else {
    // While typing a single ID (no delimiters yet), clear error
    setError(null);
  }
};
