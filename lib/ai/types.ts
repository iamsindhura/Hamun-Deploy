export interface AIProvider {
  name: string;
  generateJournal(prompt: { systemPrompt: string; userPrompt: string; schema: any; context?: any }): Promise<any>;
}

export interface JournalPromptContext {
  predictedEmotion: string;
  semantics: {
    productivitySummary: string;
    relationshipSummary: string;
    focusSummary: string;
    workloadSummary: string;
    highLevelNarrative: string;
  };
  raw: {
    pipelineMoves: number;
    tasksCompleted: number;
    focusSessionsCount: number;
    totalFocusMinutes: number;
  };
  calculatedScores?: {
    taskScore: number;
    deepWorkScore: number;
    timeManagementScore: number;
    crmScore: number;
    habitScore: number;
    reflectionScore: number;
    overallScore: number;
  };
  attachmentsContext: string;
}
