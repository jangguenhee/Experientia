import { z } from 'zod';

export const CategoryEnum = z.enum(['FOOD','BEAUTY','TRAVEL','LIFE','CULTURE','DIGITAL']);
export const RegionEnum = z.enum(['SEOUL','INCHEON','GYEONGGI','BUSAN']);
export const CampaignStatusEnum = z.enum(['OPEN','CLOSED','SELECTED']);
export const CampaignSortEnum = z.enum(['latest','popular']);

export const CampaignListQuerySchema = z.object({
  status: CampaignStatusEnum.default('OPEN'),
  category: CategoryEnum.optional(),
  region: RegionEnum.optional(),
  sort: CampaignSortEnum.default('latest'),
  limit: z.coerce.number().int().positive().max(50).default(12),
  cursor: z.string().uuid().nullable().optional(),
});

export type CampaignListQuery = z.infer<typeof CampaignListQuerySchema>;

export const CampaignCardSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  category: CategoryEnum,
  region: RegionEnum,
  endDate: z.string(),
  capacity: z.number().int().positive(),
  applicationCount: z.number().int().nonnegative(),
  coverImageUrl: z.string().url(),
  status: CampaignStatusEnum,
});

export type CampaignCard = z.infer<typeof CampaignCardSchema>;

export const CampaignFeedResponseSchema = z.object({
  items: z.array(CampaignCardSchema),
  nextCursor: z.string().uuid().nullable(),
  hasMore: z.boolean(),
});

export type CampaignFeedResponse = z.infer<typeof CampaignFeedResponseSchema>;

export const CampaignDetailSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  category: CategoryEnum,
  region: RegionEnum,
  benefitDesc: z.string(),
  storeInfo: z.string(),
  mission: z.string(),
  capacity: z.number().int().positive(),
  startDate: z.string(),
  endDate: z.string(),
  selectionDeadline: z.string().nullable(),
  status: CampaignStatusEnum,
  applicationCount: z.number().int().nonnegative(),
  coverImageUrl: z.string().url(),
});

export type CampaignDetail = z.infer<typeof CampaignDetailSchema>;

export const CreateCampaignSchema = z.object({
  title: z.string().min(1),
  category: CategoryEnum,
  region: RegionEnum,
  benefitDesc: z.string().min(1),
  storeInfo: z.string().min(1),
  mission: z.string().min(1),
  capacity: z.coerce.number().int().positive(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  selectionDeadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
});

export type CreateCampaignInput = z.infer<typeof CreateCampaignSchema>;

export const SelectInfluencersSchema = z.object({
  selectedApplicationIds: z.array(z.string().uuid()).min(1),
  waitlistApplicationIds: z.array(z.string().uuid()).optional().default([]),
});

export type SelectInfluencersInput = z.infer<typeof SelectInfluencersSchema>;



