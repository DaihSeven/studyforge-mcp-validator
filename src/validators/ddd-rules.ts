export interface UbiquitousLanguageTerm {
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
      `Unknown bounded context: ${declaredContext}. Valid: ${validContexts.join(', ')}`,
    );
  }

  const otherContexts = validContexts.filter((c: string) => c !== declaredContext);
  otherContexts.forEach((ctx: string) => {
    if (ctx === 'identity' && declaredContext === 'quiz' && specText.includes('User')) {
      if (!specText.includes('shared/contracts')) {
        errors.push(
          `${declaredContext} context menciona User mas não via shared/contracts. Contextos não podem se acoplar diretamente.`,
        );
      }
    }
  });

  return errors;
}
