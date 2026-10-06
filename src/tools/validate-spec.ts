import { validateUbiquitousLanguage, validateBoundedContext } from '../validators/ddd-rules.js';

export async function validateSpecTool(specContent, boundedContext) {
  const errors = [];
  const warnings = [];

  try {
    const ubiqErrors = validateUbiquitousLanguage(specContent);
    errors.push(...ubiqErrors);

    const contextErrors = validateBoundedContext(specContent, boundedContext);
    errors.push(...contextErrors);

    const earsKeywords = ['Given', 'When', 'Then', 'And', 'But'];
    const hasEARS = earsKeywords.some((kw) => specContent.includes(kw));
    if (!hasEARS) {
      warnings.push(`⚠️ Spec doesn't use EARS criteria`);
    }

    if (!specContent.toLowerCase().includes('scenario')) {
      warnings.push(`⚠️ Spec doesn't mention BDD scenarios`);
    }
  } catch (err) {
    errors.push(`❌ Error validating spec: ${err.message}`);
  }

  return {
    valid: errors.length === 0,
    errors: errors.map(msg => ({ rule: 'spec-validation', severity: 'error', message: msg })),
    warnings,
  };
}
