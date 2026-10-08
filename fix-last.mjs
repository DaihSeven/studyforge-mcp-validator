import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============================================================
// Corrigir: src/tools/validate-spec.ts (string escape)
// ============================================================
const validateSpecFixed = `import { validateUbiquitousLanguage, validateBoundedContext } from '../validators/ddd-rules';
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
    errors.push({ rule: 'spec-validation', severity: 'error' as const, message: \`Error validating spec: \${message}\` });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
`;

fs.writeFileSync(path.join(__dirname, 'src/tools/validate-spec.ts'), validateSpecFixed);
console.log('✅ Fixed src/tools/validate-spec.ts');

// ============================================================
// Corrigir: src/validators/ddd-rules.ts (lógica melhor)
// ============================================================
const dddRulesFixed = `export interface UbiquitousLanguageTerm {
  term: string;
  definition: string;
  context: string;
}

export const UBIQUITOUS_LANGUAGE: Record<string, UbiquitousLanguageTerm> = {
  DraftQuestion: {
    term: 'DraftQuestion',
    definition: 'Questão submetida pelo mentor, aguardando revisão, não publicada',
    context: 'import',
  },
  Question: {
    term: 'Question',
    definition: 'Questão revisada e aprovada pelo mentor, pronta pra quiz',
    context: 'quiz',
  },
  Quiz: {
    term: 'Quiz',
    definition: 'Conjunto publicado de questões que estudante responde',
    context: 'quiz',
  },
  Attempt: {
    term: 'Attempt',
    definition: 'Resposta de um estudante a um quiz em um ponto no tempo',
    context: 'quiz',
  },
  User: {
    term: 'User',
    definition: 'Identidade global do usuário (mentor ou estudante)',
    context: 'identity',
  },
  Organization: {
    term: 'Organization',
    definition: 'Tenant: grupo de usuários que compartilham quizzes e material',
    context: 'identity',
  },
  Membership: {
    term: 'Membership',
    definition: 'Vínculo de User a Organization com role (MENTOR ou STUDENT)',
    context: 'identity',
  },
};

export function validateUbiquitousLanguage(specText: string): string[] {
  const errors: string[] = [];

  // Validação 1: DraftQuestion nunca deve ser descrito como publicado
  if (specText.includes('DraftQuestion') && (specText.includes('publicad') || specText.includes('published'))) {
    errors.push('DraftQuestion NUNCA é publicado. Definição ubíqua violada.');
  }

  // Validação 2: Question sempre deve ser revisado
  if (specText.includes('Question') && specText.includes('não revisad')) {
    errors.push('Question SÃO revisadas. Definição ubíqua violada.');
  }

  // Validação 3: DraftQuestion é interim, Question é final
  if (specText.includes('DraftQuestion') && specText.includes('final')) {
    errors.push('DraftQuestion é interim, não final. Definição ubíqua violada.');
  }

  return errors;
}

export function validateBoundedContext(
  specText: string,
  declaredContext: string,
): string[] {
  const errors: string[] = [];

  const validContexts = ['import', 'identity', 'quiz', 'course'];
  if (!validContexts.includes(declaredContext)) {
    errors.push(
      \`Unknown bounded context: \${declaredContext}. Valid: \${validContexts.join(', ')}\`,
    );
  }

  const otherContexts = validContexts.filter((c: string) => c !== declaredContext);
  otherContexts.forEach((ctx: string) => {
    if (ctx === 'identity' && declaredContext === 'quiz' && specText.includes('User')) {
      if (!specText.includes('shared/contracts')) {
        errors.push(
          \`\${declaredContext} context menciona User mas não via shared/contracts. Contextos não podem se acoplar diretamente.\`,
        );
      }
    }
  });

  return errors;
}
`;

fs.writeFileSync(path.join(__dirname, 'src/validators/ddd-rules.ts'), dddRulesFixed);
console.log('✅ Fixed src/validators/ddd-rules.ts');

// ============================================================
// Corrigir: __tests__/red-team.test.ts (testes corretos)
// ============================================================
const redTeamFixed = `import { validateArchitecture, validateScopeBoundary } from '../src/validators/architecture-rules';
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
      expect(errors[0]).toContain('publicad');
    });

    it('deve BLOQUEAR se Question for não revisado', () => {
      const spec = 'Question é uma questão não revisada pelo mentor...';
      const errors = validateUbiquitousLanguage(spec);
      
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('revisad');
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

fs.writeFileSync(path.join(__dirname, '__tests__/red-team.test.ts'), redTeamFixed);
console.log('✅ Fixed __tests__/red-team.test.ts');

console.log('\n✅ FINAL FIXES APPLIED!\n');
console.log('Next: npm run build && npm test');