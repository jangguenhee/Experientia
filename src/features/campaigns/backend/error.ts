export const campaignErrorCodes = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  NOT_FOUND: 'NOT_FOUND',
  FETCH_FAILED: 'FETCH_FAILED',
  UNKNOWN: 'UNKNOWN',
} as const;

export type CampaignServiceError = typeof campaignErrorCodes[keyof typeof campaignErrorCodes];



