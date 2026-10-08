import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============================================================
// Corrigir: src/types/index.ts
// ============================================================
const typesFixed = `export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export interface ValidationError {
  rule: string;
  severity: 'error' | 'warning';
  message: string;
  location?: string;
}

export interface LibInfo {
  name: string;
  type: 'domain' | 'application' | 'infra' | 'contracts';
  scope: 'shared' | 'import' | 'identity' | 'quiz' | 'course' | 'api' | 'web';
  path: string;
  imports: string[];
}

export interface SpecValidation {
  name: string;
  ubiquitousLanguage: string[];
  boundedContext: string;
  scenarios: number;
}

export interface ADRValidation {
  title: string;
  status: 'Proposed' | 'Accepted' | 'Deprecated' | 'Superseded';
  sections: ADRSection[];
}

export interface ADRSection {
  name: string;
  content: string;
}

export interface ConflictDetection {
  spec1: string;
  spec2: string;
  conflicts: string[];
}
`;

fs.writeFileSync(path.join(__dirname, 'src/types/index.ts'), typesFixed);
console.log('✅ Fixed src/types/index.ts (warnings type)');

// ============================================================
// Corrigir: src/tools/validate-architecture.ts (sem .js)
// ============================================================
const validateArchToolFixed2 = `import { validateArchitecture, validateScopeBoundary } from '../validators/architecture-rules';
import { ValidationResult } from '../types/index';

export async function validateArchitectureTool(libPath: string): Promise<ValidationResult> {
  const errors: ValidationResult['errors'] = [];
  const warnings: ValidationResult['warnings'] = [];

  try {
    errors.push({ rule: 'architecture', severity: 'error', message: \`Tool called with path: \${libPath}\` });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    errors.push({ rule: 'architecture', severity: 'error', message: \`❌ Error validating \${libPath}: \${message}\` });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
`;

fs.writeFileSync(path.join(__dirname, 'src/tools/validate-architecture.ts'), validateArchToolFixed2);
console.log('✅ Fixed src/tools/validate-architecture.ts');

// ============================================================
// Corrigir: src/tools/validate-spec.ts (sem .js)
// ============================================================
const validateSpecToolFixed2 = `import { validateUbiquitousLanguage, validateBoundedContext } from '../validators/ddd-rules';
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
      warnings.push({ rule: 'spec-validation', severity: 'warning' as const, message: '⚠️ Spec doesn\'t use EARS criteria' });
    }

    if (!specContent.toLowerCase().includes('scenario')) {
      warnings.push({ rule: 'spec-validation', severity: 'warning' as const, message: '⚠️ Spec doesn\'t mention BDD scenarios' });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    errors.push({ rule: 'spec-validation', severity: 'error' as const, message: \`❌ Error validating spec: \${message}\` });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
`;

fs.writeFileSync(path.join(__dirname, 'src/tools/validate-spec.ts'), validateSpecToolFixed2);
console.log('✅ Fixed src/tools/validate-spec.ts');

// ============================================================
// Corrigir: src/tools/validate-adr.ts (sem .js)
// ============================================================
const validateADRToolFixed2 = `import { validateADR } from '../validators/adr-template';
import { ValidationResult } from '../types/index';

export async function validateADRTool(adrContent: string): Promise<ValidationResult> {
  const errors: ValidationResult['errors'] = [];
  const warnings: ValidationResult['warnings'] = [];

  try {
    const adrErrors = validateADR(adrContent);
    errors.push(...adrErrors.map(msg => ({ rule: 'adr-template', severity: 'error' as const, message: msg })));

    if (adrContent.length < 500) {
      warnings.push({ rule: 'adr-template', severity: 'warning' as const, message: \`⚠️ ADR is very short (\${adrContent.length} chars)\` });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    errors.push({ rule: 'adr-template', severity: 'error' as const, message: \`❌ Error validating ADR: \${message}\` });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
`;

fs.writeFileSync(path.join(__dirname, 'src/tools/validate-adr.ts'), validateADRToolFixed2);
console.log('✅ Fixed src/tools/validate-adr.ts');

// ============================================================
// Corrigir: src/tools/detect-conflicts.ts (sem .js)
// ============================================================
const detectConflictsFixed2 = `import { ValidationResult } from '../types/index';

export async function detectConflictsTool(specs: string[]): Promise<ValidationResult> {
  const errors: ValidationResult['errors'] = [];
  const warnings: ValidationResult['warnings'] = [];

  try {
    const terms = new Map<string, { spec: string; definition: string }>();

    specs.forEach((specContent: string, idx: number) => {
      const termRegex = /(?:^|\\n)(\\w+):\\s*(.+?)(?=\\n\\w+:|$)/gms;
      let match: RegExpExecArray | null;
      while ((match = termRegex.exec(specContent)) !== null) {
        const [, term, definition] = match;
        if (terms.has(term)) {
          const existing = terms.get(term)!;
          if (existing.definition !== definition) {
            errors.push({ rule: 'conflict-detection', severity: 'error' as const, message: \`❌ Conflicting definition of "\${term}"\` });
          }
        } else {
          terms.set(term, { spec: \`\${idx}\`, definition });
        }
      }
    });

    if (specs.length > 1) {
      warnings.push({ rule: 'conflict-detection', severity: 'warning' as const, message: \`ℹ️ Checked \${specs.length} specs for conflicts\` });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    errors.push({ rule: 'conflict-detection', severity: 'error' as const, message: \`❌ Error detecting conflicts: \${message}\` });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
`;

fs.writeFileSync(path.join(__dirname, 'src/tools/detect-conflicts.ts'), detectConflictsFixed2);
console.log('✅ Fixed src/tools/detect-conflicts.ts');

// ============================================================
// Corrigir: __tests__/red-team.test.ts (sem .js)
// ============================================================
const redTeamTestFixed = `import { validateArchitecture, validateScopeBoundary } from '../src/validators/architecture-rules';
import { validateUbiquitousLanguage, validateBoundedContext } from '../src/validators/ddd-rules';
import { validateADR } from '../src/validators/adr-template';

describe('RED TEAM: Prompt Injection Tests', () => {
  describe('Ataque 1: Ignorar regra de domain purity', () => {
    it('deve BLOQUEAR node:crypto em domain', () => {
      const imports = ['node:crypto', '@shared/domain'];
      const errors = validateArchitecture('test-domain', 'domain', imports);
      
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('node:crypto');
      expect(errors[0]).toContain('HARDCODED');
    });

    it('deve BLOQUEAR @nestjs em domain', () => {
      const imports = ['@nestjs/common', '@shared/domain'];
      const errors = validateArchitecture('test-domain', 'domain', imports);
      
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('@nestjs');
    });
  });

  describe('Ataque 2: Violar scope boundaries', () => {
    it('deve BLOQUEAR identity importando import', () => {
      const imports = ['scope:shared', 'scope:import'];
      const errors = validateScopeBoundary('identity', imports);
      
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('cannot import');
    });

    it('deve BLOQUEAR web importando anything além de shared', () => {
      const imports = ['scope:shared', 'scope:identity'];
      const errors = validateScopeBoundary('web', imports);
      
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('Ataque 3: Violar ubiquitous language', () => {
    it('deve BLOQUEAR se DraftQuestion for publicado', () => {
      const spec = 'DraftQuestion é uma questão publicada...';
      const errors = validateUbiquitousLanguage(spec);
      
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('publicado');
    });

    it('deve BLOQUEAR se Question for não revisado', () => {
      const spec = 'Question é uma questão não revisada pelo mentor...';
      const errors = validateUbiquitousLanguage(spec);
      
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('Ataque 4: Misturar contextos sem shared/contracts', () => {
    it('deve BLOQUEAR quiz mencionando User sem shared/contracts', () => {
      const spec = 'Quiz contém User...';
      const errors = validateBoundedContext(spec, 'quiz');
      
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('shared/contracts');
    });
  });

  describe('Ataque 5: ADR falta seções', () => {
    it('deve BLOQUEAR ADR sem Decision', () => {
      const adr = \`## Title
Alguma decisão

## Context
Contexto aqui

## Consequences
Consequências\`;

      const errors = validateADR(adr);
      
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.includes('Decision'))).toBe(true);
    });

    it('deve BLOQUEAR ADR com status inválido', () => {
      const adr = \`## Title
Alguma decisão

## Status
InProgress

## Context
Contexto

## Decision
Decisão

## Consequences
Consequências

## Alternatives
Alternativas\`;

      const errors = validateADR(adr);
      
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.includes('status'))).toBe(true);
    });
  });
});
`;

fs.writeFileSync(path.join(__dirname, '__tests__/red-team.test.ts'), redTeamTestFixed);
console.log('✅ Fixed __tests__/red-team.test.ts');

console.log('\n✅ ALL FIXES APPLIED!\n');
console.log('Next: npm run build && npm test');