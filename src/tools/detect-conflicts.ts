import { ValidationResult } from '../types/index';

export async function detectConflictsTool(specs: string[]): Promise<ValidationResult> {
  const errors: ValidationResult['errors'] = [];
  const warnings: ValidationResult['warnings'] = [];

  try {
    const terms = new Map<string, { spec: string; definition: string }>();

    specs.forEach((specContent: string, idx: number) => {
      const termRegex = /(?:^|\n)(\w+):\s*(.+?)(?=\n\w+:|$)/gms;
      let match: RegExpExecArray | null;
      while ((match = termRegex.exec(specContent)) !== null) {
        const [, term, definition] = match;
        if (terms.has(term)) {
          const existing = terms.get(term)!;
          if (existing.definition !== definition) {
            errors.push({ rule: 'conflict-detection', severity: 'error' as const, message: `❌ Conflicting definition of "${term}"` });
          }
        } else {
          terms.set(term, { spec: `${idx}`, definition });
        }
      }
    });

    if (specs.length > 1) {
      warnings.push({ rule: 'conflict-detection', severity: 'warning' as const, message: `ℹ️ Checked ${specs.length} specs for conflicts` });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    errors.push({ rule: 'conflict-detection', severity: 'error' as const, message: `❌ Error detecting conflicts: ${message}` });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
