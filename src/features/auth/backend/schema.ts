import { z } from 'zod';

export const UserRoleEnum = z.enum(['ADVERTISER', 'INFLUENCER']);
export type UserRole = z.infer<typeof UserRoleEnum>;

export const CreateProfileSchema = z.object({
  role: UserRoleEnum,
  name: z.string().min(1),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  phone: z.string().min(8),
});

export type CreateProfileInput = z.infer<typeof CreateProfileSchema>;

export const CreateAdvertiserSchema = z.object({
  companyName: z.string().min(1),
  businessNumber: z.string().min(5),
  representative: z.string().min(1),
  storePhone: z.string().min(8),
  address: z.string().min(1),
});

export type CreateAdvertiserInput = z.infer<typeof CreateAdvertiserSchema>;

export const ChannelPlatformEnum = z.enum([
  'NAVER_BLOG',
  'INSTAGRAM',
  'YOUTUBE',
  'THREADS',
  'OTHER',
]);

export const CreateInfluencerSchema = z.object({
  channelPlatform: ChannelPlatformEnum,
  channelName: z.string().min(1),
  channelUrl: z.string().url(),
  followers: z.number().int().nonnegative(),
});

export type CreateInfluencerInput = z.infer<typeof CreateInfluencerSchema>;

export const OnboardingStatusSchema = z.object({
  hasProfile: z.boolean(),
  role: UserRoleEnum.nullable(),
  advertiserCompleted: z.boolean().nullable(),
  influencerCompleted: z.boolean().nullable(),
});

export type OnboardingStatus = z.infer<typeof OnboardingStatusSchema>;

