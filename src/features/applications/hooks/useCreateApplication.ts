"use client";

import { useMutation } from "@tanstack/react-query";
import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";
import { CreateApplicationSchema, type CreateApplicationInput, CreatedApplicationSchema } from "../backend/schema";

export function useCreateApplication() {
  return useMutation({
    mutationFn: async (input: CreateApplicationInput) => {
      const body = CreateApplicationSchema.parse(input);
      const res = await apiClient.post("/api/applications", body);
      return CreatedApplicationSchema.parse(res.data);
    },
    onError: (error) => {
      throw new Error(extractApiErrorMessage(error, "지원 생성 실패"));
    },
  });
}


