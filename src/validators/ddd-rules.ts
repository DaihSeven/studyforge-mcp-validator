export const UBIQUITOUS_LANGUAGE = {
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
        errors.push(`❌ DraftQuestion NUNCA é publicado. Definição ubíqua violada.`);
      }
      if (term === 'Question' && specText.includes('não revisado')) {
        errors.push(`❌ Question SÃO revisadas. Definição ubíqua violada.`);
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
      `❌ Unknown bounded context: ${declaredContext}. Valid: ${validContexts.join(', ')}`,
    );
  }

  const otherContexts = validContexts.filter((c) => c !== declaredContext);
  otherContexts.forEach((ctx) => {
    if (ctx === 'identity' && declaredContext === 'quiz' && specText.includes('User')) {
      if (!specText.includes('shared/contracts')) {
        errors.push(
          `❌ ${declaredContext} context menciona User mas não via shared/contracts. Contextos não podem se acoplar diretamente.`,
        );
      }
    }
  });

  return errors;
}
