import { validateArchitecture, validateScopeBoundary } from '../validators/architecture-rules';
import { ValidationResult } from '../types/index';

export async function validateArchitectureTool(libPath: string): Promise<ValidationResult> {
  const errors: ValidationResult['errors'] = [];
  const warnings: ValidationResult['warnings'] = [];

  try {
    errors.push({ rule: 'architecture', severity: 'error', message: `Tool called with path: ${libPath}` });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    errors.push({ rule: 'architecture', severity: 'error', message: `❌ Error validating ${libPath}: ${message}` });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
