function cleanNamePart(val) {
  if (val == null) return '';
  const str = String(val).trim();
  if (!str || str.toLowerCase() === 'null' || str.toLowerCase() === 'undefined') {
    return '';
  }
  return str;
}

/**
 * Formats a learner's registered name fields as:
 * "First Name [Middle Initial.] Last Name"
 * without modifying or guessing missing name parts.
 */
export function formatLearnerDisplayName(learner) {
  if (!learner || typeof learner !== 'object') return '';

  const first = cleanNamePart(learner.firstName ?? learner.profile?.firstName);
  const middle = cleanNamePart(learner.middleName ?? learner.profile?.middleName);
  const last = cleanNamePart(learner.lastName ?? learner.profile?.lastName);

  if (first && last) {
    if (middle) {
      const middleInitial = `${middle.charAt(0).toUpperCase()}.`;
      return `${first} ${middleInitial} ${last}`;
    }
    return `${first} ${last}`;
  }

  if (first) return first;
  if (last) return last;

  return cleanNamePart(learner.fullName || learner.name);
}
