import { ReactNode } from "react";

type PageShellProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export default function PageShell({ title, subtitle, actions, children }: PageShellProps) {
  return (
    <section className="mx-auto flex w-full max-w-[1100px] flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="m-0 text-[clamp(1.35rem,1.2rem+1vw,1.95rem)] font-bold tracking-[-0.02em] text-[#f8fafc]">{title}</h1>
          {subtitle ? <p className="mt-1 text-[0.95rem] text-[#94a3b8]">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </header>
      {children}
    </section>
  );
}
