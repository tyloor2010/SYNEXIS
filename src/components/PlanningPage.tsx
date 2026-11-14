import type { ReactNode } from 'react';
import { SynexisHeader } from './SynexisHeader';
import { CustomCursor } from './CustomCursor';
export function PlanningPage({ title, eyebrow, children }: { title: string; eyebrow: string; children: ReactNode }) {
  return <main className="stage-bg min-h-screen font-mono-ui text-foreground synexis-app"><CustomCursor /><SynexisHeader /><section className="mx-auto max-w-7xl px-5 py-10 md:px-14"><p className="text-[10px] uppercase text-muted-foreground">{eyebrow}</p><h1 className="mt-4 font-soft text-3xl font-bold sm:text-5xl">{title}</h1><div className="mt-8">{children}</div></section></main>;
}