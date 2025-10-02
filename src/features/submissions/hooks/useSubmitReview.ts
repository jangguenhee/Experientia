"use client";

import { useMutation } from "@tanstack/react-query";
import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";
import { SubmitReviewSchema, SubmittedReviewSchema, type SubmitReviewInput } from "../backend/schema";

export function useSubmitReview() {
  return useMutation({
    mutationFn: async (input: SubmitReviewInput) => {
      const body = SubmitReviewSchema.parse(input);
      const res = await apiClient.post("/api/submissions", body);
      return SubmittedReviewSchema.parse(res.data);
    },
    onError: (error) => {
      throw new Error(extractApiErrorMessage(error, "리뷰 제출 실패"));
    },
  });
}


