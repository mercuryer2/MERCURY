// src/types.ts
// 集中导出所有公共类型，方便外部导入

// 从各模块重导出核心类型
export type { GitChange } from './git.js';
export type { ValidationResult } from './validation.js';
export type { ReviewOptions, ReviewResult } from './core.js';

// 如果未来有额外的类型定义，也可以直接在此文件中定义，
// 但为了避免重复，目前仅作为重导出层。
