import { validateADR } from '../validators/adr-template';
import { ValidationResult } from '../types/index';

export async function validateADRTool(adrContent: string): Promise<ValidationResult> {
  const errors: ValidationResult['errors'] = [];
  const warnings: ValidationResult['warnings'] = [];

  try {
    const adrErrors = validateADR(adrContent);
    errors.push(...adrErrors.map(msg => ({ rule: 'adr-template', severity: 'error' as const, message: msg })));

    if (adrContent.length < 500) {
      warnings.push({ rule: 'adr-template', severity: 'warning' as const, message: `⚠️ ADR is very short (${adrContent.length} chars)` });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    errors.push({ rule: 'adr-template', severity: 'error' as const, message: `❌ Error validating ADR: ${message}` });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
