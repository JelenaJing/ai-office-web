/**
 * TypeScript类型定义
 */

export interface Project {
  project_id: string;
  project_dir: string;
  paper_filename: string;
  created_at: string;
  updated_at: string;
  status: string;
}

export interface Idea {
  title: string;
  description: string;
  innovation: string;
  references: string[];
}

export interface ContentCheckResult {
  original_text: string;
  updated_text: string;
  updated_references: Reference[];
  issues: Issue[];
}

export interface Reference {
  title: string;
  authors: string;
  year: string;
  doi?: string;
}

export interface Issue {
  type: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  suggestion?: string;
}

export interface ExperimentDesign {
  purpose: string;
  principle: string;
  method: string;
  expected_results: string;
}

export interface Recipe {
  materials: Material[];
  steps: RecipeStep[];
  notes?: string;
}

export interface Material {
  name: string;
  specification: string;
  amount: string;
}

export interface RecipeStep {
  step: number;
  description: string;
  parameters: Record<string, string>;
}

export interface TheoryAnalysis {
  analysis: string;
  formulas: string[];
  derivation_steps: string[];
}

export interface OverallCheckResult {
  issues: Issue[];
  suggestions: string[];
}

export interface PlotResult {
  plot_url?: string;
  plot_path?: string;
  plot_base64?: string;
  metadata?: any;
}

export type RemakeType =
  | 'idea'
  | 'check'
  | 'experiment'
  | 'extract-experiment'
  | 'visualize-experiment'
  | 'recipe-experiment'
  | 'theory'
  | 'overall'
  | 'introduction'
  | 'full-paper-remake';

export interface ProjectFile {
  name: string;
  path: string;
  is_directory: boolean;
  size: number;
  modified: string;
}

export interface ProjectFileList {
  project_id: string;
  path: string;
  files: ProjectFile[];
}

export interface ProjectFileContent {
  name: string;
  path: string;
  size: number;
  modified: string;
  type: 'json' | 'text' | 'binary';
  content?: any;
  url?: string;
}
