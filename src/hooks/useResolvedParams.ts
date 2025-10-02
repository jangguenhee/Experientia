'use client';

import { use } from 'react';

/**
 * Next.js App Router 페이지 params Promise를 안전하게 동기 해석합니다.
 */
export const useResolvedParams = <T>(params: Promise<T>): T => use(params);
