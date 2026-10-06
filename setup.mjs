import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Garantir diretórios
const dirs = [
  'src/tools',
  'src/validators',
  'src/types',
  '__tests__/fixtures',
];

dirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`✅ Created ${dir}`);
  }
});

// ============================================================
// Arquivo 1: src/types/index.ts
// ============================================================
const typesContent = `export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
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

fs.writeFileSync(path.join(__dirname, 'src/types/index.ts'), typesContent);
console.log('✅ Created src/types/index.ts');

// ============================================================
// Arquivo 2: src/validators/architecture-rules.ts
// ============================================================
const architectureRulesContent = `export const ARCHITECTURE_RULES = {
  domain_no_external: {
    blocked: [
      'node:fs',
      'node:crypto',
      'node:path',
      'node:os',
      'node:process',
      '@nestjs/',
      '@prisma/',
      'axios',
      'express',
    ],
    severity: 'error',
    message: 'Domain libs NEVER can import Node APIs, NestJS, or Prisma. HARDCODED.',
  },

  scope_boundaries: {
    import: ['scope:shared', 'scope:import'],
    identity: ['scope:shared', 'scope:identity'],
    quiz: ['scope:shared', 'scope:quiz'],
    course: ['scope:shared', 'scope:course'],
    api: ['scope:shared', 'scope:import', 'scope:identity', 'scope:quiz', 'scope:course'],
    web: ['scope:shared'],
    shared: ['scope:shared'],
  },

  requires_organization_id: {
    entities: [
      'DraftQuestion',
      'Question',
      'Quiz',
      'Attempt',
      'Material',
      'Membership',
      'Course',
    ],
    exception: ['User'],
    severity: 'error',
    message:
      'Entity MUST have organizationId (except User). This is a domain invariant, not optional.',
  },

  no_direct_context_imports: {
    blocked_pairs: [
      { from: 'import', to: 'quiz' },
      { from: 'quiz', to: 'import' },
      { from: 'identity', to: 'import' },
      { from: 'identity', to: 'quiz' },
    ],
    communication: 'via shared/contracts ONLY',
    severity: 'error',
  },

  entity_pattern: {
    required: ['Object.freeze', 'instanceof EntityId', 'private constructor'],
    severity: 'error',
    message: 'Entity must be immutable (Object.freeze) and use private constructor.',
  },
};

export function validateArchitecture(libName, libType, imports) {
  const errors = [];

  if (libType === 'domain') {
    const blocked = ARCHITECTURE_RULES.domain_no_external.blocked;
    imports.forEach((imp) => {
      if (blocked.some((b) => imp.includes(b))) {
        errors.push(
          \`❌ Domain lib "\${libName}" imports "\${imp}". \${ARCHITECTURE_RULES.domain_no_external.message}\`,
        );
      }
    });
  }

  return errors;
}

export function validateScopeBoundary(scope, imports) {
  const errors = [];
  const allowed = ARCHITECTURE_RULES.scope_boundaries[scope];

  if (!allowed) {
    errors.push(\`❌ Unknown scope: \${scope}\`);
    return errors;
  }

  imports.forEach((imp) => {
    const importScope = extractScope(imp);
    if (!allowed.includes(importScope)) {
      errors.push(
        \`❌ scope:\${scope} cannot import \${importScope}. Allowed: \${allowed.join(', ')}\`,
      );
    }
  });

  return errors;
}

function extractScope(importPath) {
  const match = importPath.match(/@studyforge\\/(\\w+)/);
  return match ? \`scope:\${match[1]}\` : 'unknown';
}
`;

fs.writeFileSync(path.join(__dirname, 'src/validators/architecture-rules.ts'), architectureRulesContent);
console.log('✅ Created src/validators/architecture-rules.ts');

// ============================================================
// Arquivo 3: src/validators/ddd-rules.ts
// ============================================================
const dddRulesContent = `export const UBIQUITOUS_LANGUAGE = {
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

export function validateUbiquitousLanguage(specText) {
  const errors = [];

  Object.entries(UBIQUITOUS_LANGUAGE).forEach(([term, { definition }]) => {
    if (specText.includes(term)) {
      if (term === 'DraftQuestion' && specText.includes('publicado')) {
        errors.push(\`❌ DraftQuestion NUNCA é publicado. Definição ubíqua violada.\`);
      }
      if (term === 'Question' && specText.includes('não revisado')) {
        errors.push(\`❌ Question SÃO revisadas. Definição ubíqua violada.\`);
      }
    }
  });

  return errors;
}

export function validateBoundedContext(specText, declaredContext) {
  const errors = [];

  const validContexts = ['import', 'identity', 'quiz', 'course'];
  if (!validContexts.includes(declaredContext)) {
    errors.push(
      \`❌ Unknown bounded context: \${declaredContext}. Valid: \${validContexts.join(', ')}\`,
    );
  }

  const otherContexts = validContexts.filter((c) => c !== declaredContext);
  otherContexts.forEach((ctx) => {
    if (ctx === 'identity' && declaredContext === 'quiz' && specText.includes('User')) {
      if (!specText.includes('shared/contracts')) {
        errors.push(
          \`❌ \${declaredContext} context menciona User mas não via shared/contracts. Contextos não podem se acoplar diretamente.\`,
        );
      }
    }
  });

  return errors;
}
`;

fs.writeFileSync(path.join(__dirname, 'src/validators/ddd-rules.ts'), dddRulesContent);
console.log('✅ Created src/validators/ddd-rules.ts');

// ============================================================
// Arquivo 4: src/validators/adr-template.ts
// ============================================================
const adrTemplateContent = `export const ADR_SECTIONS = [
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
    const regex = new RegExp(\`##\\\\s*\${section}\`, 'i');
    const found = regex.test(adrText);

    if (required && !found) {
      errors.push(\`❌ ADR missing required section: \${section}\`);
    }

    if (found) {
      const sectionContent = adrText.match(new RegExp(\`##\\\\s*\${section}([\\\\s\\\\S]*?)(?=##|$)\`, 'i'));
      const content = sectionContent ? sectionContent[1].trim() : '';
      if (content.length < minLength) {
        errors.push(
          \`❌ Section "\${section}" too short (\${content.length} chars, min \${minLength})\`,
        );
      }
    }
  });

  const statusMatch = adrText.match(/##\\s*Status\\s*\\n\\s*(.+)/i);
  if (statusMatch) {
    const status = statusMatch[1].trim();
    const validStatuses = ['Proposed', 'Accepted', 'Deprecated', 'Superseded'];
    if (!validStatuses.includes(status)) {
      errors.push(\`❌ Invalid status: \${status}. Must be: \${validStatuses.join(', ')}\`);
    }
  }

  return errors;
}
`;

fs.writeFileSync(path.join(__dirname, 'src/validators/adr-template.ts'), adrTemplateContent);
console.log('✅ Created src/validators/adr-template.ts');

// ============================================================
// Arquivo 5: src/tools/validate-architecture.ts
// ============================================================
const validateArchToolContent = `import { validateArchitecture, validateScopeBoundary } from '../validators/architecture-rules.js';

export async function validateArchitectureTool(libPath) {
  const errors = [];
  const warnings = [];

  try {
    errors.push(\`Tool called with path: \${libPath}\`);
  } catch (err) {
    errors.push(\`❌ Error validating \${libPath}: \${err.message}\`);
  }

  return {
    valid: errors.length === 0,
    errors: errors.map(msg => ({ rule: 'architecture', severity: 'error', message: msg })),
    warnings,
  };
}
`;

fs.writeFileSync(path.join(__dirname, 'src/tools/validate-architecture.ts'), validateArchToolContent);
console.log('✅ Created src/tools/validate-architecture.ts');

// ============================================================
// Arquivo 6: src/tools/validate-spec.ts
// ============================================================
const validateSpecToolContent = `import { validateUbiquitousLanguage, validateBoundedContext } from '../validators/ddd-rules.js';

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
      warnings.push(\`⚠️ Spec doesn't use EARS criteria\`);
    }

    if (!specContent.toLowerCase().includes('scenario')) {
      warnings.push(\`⚠️ Spec doesn't mention BDD scenarios\`);
    }
  } catch (err) {
    errors.push(\`❌ Error validating spec: \${err.message}\`);
  }

  return {
    valid: errors.length === 0,
    errors: errors.map(msg => ({ rule: 'spec-validation', severity: 'error', message: msg })),
    warnings,
  };
}
`;

fs.writeFileSync(path.join(__dirname, 'src/tools/validate-spec.ts'), validateSpecToolContent);
console.log('✅ Created src/tools/validate-spec.ts');

// ============================================================
// Arquivo 7: src/tools/validate-adr.ts
// ============================================================
const validateADRToolContent = `import { validateADR } from '../validators/adr-template.js';

export async function validateADRTool(adrContent) {
  const errors = [];
  const warnings = [];

  try {
    const adrErrors = validateADR(adrContent);
    errors.push(...adrErrors);

    if (adrContent.length < 500) {
      warnings.push(\`⚠️ ADR is very short (\${adrContent.length} chars)\`);
    }
  } catch (err) {
    errors.push(\`❌ Error validating ADR: \${err.message}\`);
  }

  return {
    valid: errors.length === 0,
    errors: errors.map(msg => ({ rule: 'adr-template', severity: 'error', message: msg })),
    warnings,
  };
}
`;

fs.writeFileSync(path.join(__dirname, 'src/tools/validate-adr.ts'), validateADRToolContent);
console.log('✅ Created src/tools/validate-adr.ts');

// ============================================================
// Arquivo 8: src/tools/detect-conflicts.ts
// ============================================================
const detectConflictsContent = `export async function detectConflictsTool(specs) {
  const errors = [];
  const warnings = [];

  try {
    const terms = new Map();

    specs.forEach((specContent, idx) => {
      const termRegex = /(?:^|\\n)(\\w+):\\s*(.+?)(?=\\n\\w+:|$)/gms;
      let match;
      while ((match = termRegex.exec(specContent)) !== null) {
        const [, term, definition] = match;
        if (terms.has(term)) {
          const existing = terms.get(term);
          if (existing.definition !== definition) {
            errors.push(
              \`❌ Conflicting definition of "\${term}"\`,
            );
          }
        } else {
          terms.set(term, { spec: \`\${idx}\`, definition });
        }
      }
    });

    if (specs.length > 1) {
      warnings.push(\`ℹ️ Checked \${specs.length} specs for conflicts\`);
    }
  } catch (err) {
    errors.push(\`❌ Error detecting conflicts: \${err.message}\`);
  }

  return {
    valid: errors.length === 0,
    errors: errors.map(msg => ({ rule: 'conflict-detection', severity: 'error', message: msg })),
    warnings,
  };
}
`;

fs.writeFileSync(path.join(__dirname, 'src/tools/detect-conflicts.ts'), detectConflictsContent);
console.log('✅ Created src/tools/detect-conflicts.ts');

// ============================================================
// Arquivo 9: src/index.ts
// ============================================================
const indexContent = `export * from './tools/validate-architecture.js';
export * from './tools/validate-spec.js';
export * from './tools/validate-adr.js';
export * from './tools/detect-conflicts.js';
export * from './validators/architecture-rules.js';
export * from './validators/ddd-rules.js';
export * from './validators/adr-template.js';
`;

fs.writeFileSync(path.join(__dirname, 'src/index.ts'), indexContent);
console.log('✅ Created src/index.ts');

console.log('\n✅ ALL FILES CREATED SUCCESSFULLY!\n');
console.log('Next steps:');
console.log('  npm install');
console.log('  npm run build');
console.log('  npm test');