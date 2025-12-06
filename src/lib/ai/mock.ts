/**
 * Mock content generator type
 * Used for providing mock responses when API keys are not configured
 */
export type MockContentGenerator = string | (() => string);
