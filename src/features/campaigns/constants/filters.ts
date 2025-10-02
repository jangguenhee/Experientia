import { match } from 'ts-pattern';
import { CampaignSortEnum, CategoryEnum, RegionEnum } from '../lib/dto';

export const categoryOptions = CategoryEnum.options.map((value) => ({ value, label: value }));
export const regionOptions = RegionEnum.options.map((value) => ({ value, label: value }));
export const sortOptions = CampaignSortEnum.options.map((value) => ({ value, label: match(value).with('latest', () => '최신순').with('popular', () => '인기순').exhaustive() }));



