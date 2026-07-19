// A single Math Fix™ topic's practice session. Server shell validates the topic
// id against the registry (404 for anything unknown) and hands its id to the
// client practice experience.
import { ArrowLeft, Sigma } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MathFixTopic } from "@/features/math-fix/MathFixTopic";
import { MATH_TOPICS, mathTopicById } from "@/lib/engines/math-fix";

export function generateStaticParams() {
  return MATH_TOPICS.map((t) => ({ topic: t.id }));
}

export function generateMetadata({ params }: { params: { topic: string } }) {
  const topic = mathTopicById(params.topic);
  return {
    title: topic ? `${topic.name} · Math Fix™ · LogicLand` : "Math Fix™ · LogicLand",
  };
}

export default function MathFixTopicPage({ params }: { params: { topic: string } }) {
  const topic = mathTopicById(params.topic);
  if (!topic) notFound();

  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <header className="mb-5">
        <Link
          href="/academies/math-fix"
          className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Math Fix topics
        </Link>
      </header>

      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-md">
          <Sigma className="h-7 w-7" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-extrabold sm:text-3xl">{topic.name}</h1>
          <p className="text-sm font-semibold text-brand">{topic.blurb}</p>
        </div>
      </div>

      <MathFixTopic topicId={topic.id} />
    </main>
  );
}
