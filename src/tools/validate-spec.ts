import { validateUbiquitousLanguage, validateBoundedContext } from '../validators/ddd-rules';
import { ValidationResult } from '../types/index';

export async function validateSpecTool(
  specContent: string,
  boundedContext: string,
): Promise<ValidationResult> {
  const errors: ValidationResult['errors'] = [];
  const warnings: ValidationResult['warnings'] = [];

  try {
    const ubiqErrors = validateUbiquitousLanguage(specContent);
    errors.push(...ubiqErrors.map(msg => ({ rule: 'spec-validation', severity: 'error' as const, message: msg })));

    const contextErrors = validateBoundedContext(specContent, boundedContext);
    errors.push(...contextErrors.map(msg => ({ rule: 'spec-validation', severity: 'error' as const, message: msg })));

    const earsKeywords = ['Given', 'When', 'Then', 'And', 'But'];
    const hasEARS = earsKeywords.some((kw: string) => specContent.includes(kw));
    if (!hasEARS) {
      warnings.push({ rule: 'spec-validation', severity: 'warning' as const, message: 'Spec does not use EARS criteria' });
    }

    if (!specContent.toLowerCase().includes('scenario')) {
      warnings.push({ rule: 'spec-validation', severity: 'warning' as const, message: 'Spec does not mention BDD scenarios' });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    errors.push({ rule: 'spec-validation', severity: 'error' as const, message: `Error validating spec: ${message}` });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
