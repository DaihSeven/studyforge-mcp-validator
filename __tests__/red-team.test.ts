import { validateArchitecture, validateScopeBoundary } from '../src/validators/architecture-rules';
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
      const adr = `## Title
Alguma decisão

## Context
Contexto aqui

## Consequences
Consequências`;

      const errors = validateADR(adr);
      
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.includes('Decision'))).toBe(true);
    });

    it('deve BLOQUEAR ADR com status inválido', () => {
      const adr = `## Title
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
Alternativas`;

      const errors = validateADR(adr);
      
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.includes('status'))).toBe(true);
    });
  });
});
