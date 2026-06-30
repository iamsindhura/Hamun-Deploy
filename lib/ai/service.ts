import { AIRouter } from "./router";

export const AiService = {
  
  /**
   * Thin wrapper around the AI Router.
   * Promotes separation of concerns and guarantees the business logic
   * never communicates with providers directly.
   */
  async generateStructuredData({
    systemPrompt,
    userPrompt,
    schema,
    failProviders,
    context
  }: {
    systemPrompt: string;
    userPrompt: string;
    schema: any;
    failProviders?: string[];
    context?: any;
  }) {
    // The router is the single source of truth for fallback and timeouts.
    return AIRouter.generateJournal({
      systemPrompt,
      userPrompt,
      schema,
      failProviders,
      context
    });
  }
};
