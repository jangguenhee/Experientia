"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, Megaphone } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useOnboardingStatus } from "@/features/auth/hooks/useOnboarding";
import { useResolvedParams } from "@/hooks/useResolvedParams";

const cards = [
  {
    role: "ADVERTISER" as const,
    icon: Briefcase,
    title: "광고주로 온보딩",
    badge: "브랜드",
    description:
      "내 브랜드의 프로모션을 등록하고, 지원자를 모니터링하며 선정까지 한번에 관리합니다.",
    highlights: [
      "캠페인 생성 및 지원자 관리",
      "선정 / 대기자 배정",
      "리뷰 제출 현황 확인",
    ],
    href: "/onboarding/advertiser",
    cta: "광고주 정보 작성",
  },
  {
    role: "INFLUENCER" as const,
    icon: Megaphone,
    title: "인플루언서로 온보딩",
    badge: "크리에이터",
    description:
      "맞춤형 캠페인에 지원하고 선정 시 미션 가이드에 따라 콘텐츠를 제작하세요.",
    highlights: [
      "관심 카테고리 캠페인 탐색",
      "간편 지원 및 선정 결과 알림",
      "리뷰 URL 제출 및 피드백",
    ],
    href: "/onboarding/influencer",
    cta: "인플루언서 정보 작성",
  },
];

type RoleSelectPageProps = {
  params: Promise<Record<string, never>>;
};

export default function RoleSelectPage({ params }: RoleSelectPageProps) {
  void useResolvedParams(params);

  const router = useRouter();
  const { data, isLoading } = useOnboardingStatus();

  useEffect(() => {
    if (isLoading || !data) return;

    if (!data.hasProfile) {
      return;
    }

    if (data.role === "ADVERTISER") {
      if (!data.advertiserCompleted) {
        router.replace("/onboarding/advertiser");
      } else {
        router.replace("/dashboard");
      }
      return;
    }

    if (data.role === "INFLUENCER") {
      if (!data.influencerCompleted) {
        router.replace("/onboarding/influencer");
      } else {
        router.replace("/");
      }
    }
  }, [data, isLoading, router]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-16 text-slate-100">
      <header className="space-y-3 text-center">
        <Badge variant="outline" className="mx-auto w-fit border-slate-700 bg-slate-900/60 text-slate-300">
          Onboarding Step 1
        </Badge>
        <h1 className="text-3xl font-semibold">어떤 목적으로 SuperNext를 사용하시나요?</h1>
        <p className="text-sm text-slate-400">
          역할을 선택하면 필요한 정보만 모아서 온보딩을 도와드립니다. 추후 설정에서 언제든 변경하실 수 있습니다.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.role}
              className="group flex h-full flex-col border-slate-800 bg-slate-950/70 transition hover:border-slate-600 hover:bg-slate-900/80"
            >
              <CardHeader className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/80 text-slate-200 ring-1 ring-slate-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="space-y-1">
                    <Badge variant="secondary" className="w-fit bg-slate-800/80 text-slate-200">
                      {card.badge}
                    </Badge>
                    <CardTitle className="text-xl text-slate-100">{card.title}</CardTitle>
                  </div>
                </div>
                <CardDescription className="text-slate-300">
                  {card.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-3">
                <ul className="space-y-2 text-sm text-slate-300">
                  {card.highlights.map((highlight) => (
                    <li key={highlight} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
                      {highlight}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardContent className="pt-0">
                <Button
                  className="h-11 w-full text-base font-medium"
                  onClick={() => router.replace(card.href)}
                >
                  {card.cta}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </section>
    </main>
  );
}
