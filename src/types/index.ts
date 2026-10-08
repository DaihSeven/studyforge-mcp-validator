export interface ValidationResult {
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
