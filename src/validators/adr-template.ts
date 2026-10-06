export const ADR_SECTIONS = [
  { section: 'Title', required: true, minLength: 5 },
  { section: 'Status', required: true, minLength: 3 },
  { section: 'Context', required: true, minLength: 20 },
  { section: 'Decision', required: true, minLength: 30 },
  { section: 'Consequences', required: true, minLength: 30 },
  { section: 'Alternatives', required: true, minLength: 10 },
  { section: 'Related ADRs', required: false, minLength: 0 },
];

export function validateADR(adrText) {
  const errors = [];

  ADR_SECTIONS.forEach(({ section, required, minLength }) => {
    const regex = new RegExp(`##\\s*${section}`, 'i');
    const found = regex.test(adrText);

    if (required && !found) {
      errors.push(`❌ ADR missing required section: ${section}`);
    }

    if (found) {
      const sectionContent = adrText.match(new RegExp(`##\\s*${section}([\\s\\S]*?)(?=##|$)`, 'i'));
      const content = sectionContent ? sectionContent[1].trim() : '';
      if (content.length < minLength) {
        errors.push(
          `❌ Section "${section}" too short (${content.length} chars, min ${minLength})`,
        );
      }
    }
  });

  const statusMatch = adrText.match(/##\s*Status\s*\n\s*(.+)/i);
  if (statusMatch) {
    const status = statusMatch[1].trim();
    const validStatuses = ['Proposed', 'Accepted', 'Deprecated', 'Superseded'];
    if (!validStatuses.includes(status)) {
      errors.push(`❌ Invalid status: ${status}. Must be: ${validStatuses.join(', ')}`);
    }
  }

  return errors;
}
