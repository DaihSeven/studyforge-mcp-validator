import { validateADR } from '../validators/adr-template.js';

export async function validateADRTool(adrContent) {
  const errors = [];
  const warnings = [];

  try {
    const adrErrors = validateADR(adrContent);
    errors.push(...adrErrors);

    if (adrContent.length < 500) {
      warnings.push(`⚠️ ADR is very short (${adrContent.length} chars)`);
    }
  } catch (err) {
    errors.push(`❌ Error validating ADR: ${err.message}`);
  }

  return {
    valid: errors.length === 0,
    errors: errors.map(msg => ({ rule: 'adr-template', severity: 'error', message: msg })),
    warnings,
  };
}
