export async function detectConflictsTool(specs) {
  const errors = [];
  const warnings = [];

  try {
    const terms = new Map();

    specs.forEach((specContent, idx) => {
      const termRegex = /(?:^|\n)(\w+):\s*(.+?)(?=\n\w+:|$)/gms;
      let match;
      while ((match = termRegex.exec(specContent)) !== null) {
        const [, term, definition] = match;
        if (terms.has(term)) {
          const existing = terms.get(term);
          if (existing.definition !== definition) {
            errors.push(
              `❌ Conflicting definition of "${term}"`,
            );
          }
        } else {
          terms.set(term, { spec: `${idx}`, definition });
        }
      }
    });

    if (specs.length > 1) {
      warnings.push(`ℹ️ Checked ${specs.length} specs for conflicts`);
    }
  } catch (err) {
    errors.push(`❌ Error detecting conflicts: ${err.message}`);
  }

  return {
    valid: errors.length === 0,
    errors: errors.map(msg => ({ rule: 'conflict-detection', severity: 'error', message: msg })),
    warnings,
  };
}
