export const ARCHITECTURE_RULES = {
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
          `❌ Domain lib "${libName}" imports "${imp}". ${ARCHITECTURE_RULES.domain_no_external.message}`,
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
    errors.push(`❌ Unknown scope: ${scope}`);
    return errors;
  }

  imports.forEach((imp) => {
    const importScope = extractScope(imp);
    if (!allowed.includes(importScope)) {
      errors.push(
        `❌ scope:${scope} cannot import ${importScope}. Allowed: ${allowed.join(', ')}`,
      );
    }
  });

  return errors;
}

function extractScope(importPath) {
  const match = importPath.match(/@studyforge\/(\w+)/);
  return match ? `scope:${match[1]}` : 'unknown';
}
