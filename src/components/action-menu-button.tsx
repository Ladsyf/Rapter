import { useRef } from "react";

type ActionMenuOption = {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "danger" | "success";
};

interface ActionMenuButtonProps {
  caption: string;
  options: ActionMenuOption[];
  className?: string;
}

export default function ActionMenuButton({
  caption,
  options,
  className,
}: ActionMenuButtonProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  const baseItemClass =
    "w-full rounded-xl border px-3 py-2 text-left text-sm font-semibold transition-all duration-150 hover:-translate-y-0.5";

  const variantClass = {
    primary:
      "text-white bg-[linear-gradient(to_bottom_right,#114fc2,#1b66f2)] shadow-[0_8px_20px_rgba(16,84,210,0.26)]",
    secondary: "text-[#e5e7eb] border-white/20 bg-[rgba(15,23,42,0.72)]",
    danger: "text-white bg-[linear-gradient(to_bottom_right,#ab2d2d,#ce4a4a)]",
    success: "text-white bg-[linear-gradient(to_bottom_right,#14895f,#20b17d)]",
  };

  const closeMenu = () => {
    detailsRef.current?.removeAttribute("open");
  };

  return (
    <details ref={detailsRef} className={`group relative ${className ?? ""}`}>
      <summary
        className="list-none rounded-full border border-transparent px-4 py-2 text-sm font-semibold cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:brightness-110 text-white bg-[linear-gradient(to_bottom_right,#114fc2,#1b66f2)] shadow-[0_8px_20px_rgba(16,84,210,0.26)] [&::-webkit-details-marker]:hidden"
        aria-label={caption}
      >
        <span className="inline-flex items-center gap-2.5">
          {caption}
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className="h-4 w-4 opacity-90 transition-transform duration-200 group-open:rotate-180"
            fill="none"
          >
            <path
              d="M5 7.5L10 12.5L15 7.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </summary>

      <div className="absolute right-0 z-30 mt-2 min-w-52 rounded-2xl border border-white/15 bg-[rgba(2,6,23,0.94)] p-2 shadow-[0_16px_38px_rgba(2,6,23,0.42)] backdrop-blur-sm">
        <div className="flex flex-col gap-2">
          {options.map((option) => (
            <button
              key={option.label}
              type="button"
              className={`${baseItemClass} ${variantClass[option.variant ?? "secondary"]}`}
              onClick={() => {
                option.onClick();
                closeMenu();
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </details>
  );
}
