interface ButtonProps {
  caption?: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger" | "success";
  className?: string;
  type?: "button" | "submit" | "reset";
}

export default function Button({
  caption,
  onClick,
  disabled = false,
  variant = "primary",
  className,
  type = "button",
}: ButtonProps) {
  const variantClass = {
    primary:
      "text-white bg-gradient-to-br from-[#114fc2] to-[#1b66f2] shadow-[0_8px_20px_rgba(16,84,210,0.26)]",
    secondary: "text-[#e5e7eb] border-white/20 bg-[rgba(15,23,42,0.72)]",
    danger: "text-white bg-gradient-to-br from-[#ab2d2d] to-[#ce4a4a]",
    success: "text-white bg-gradient-to-br from-[#14895f] to-[#20b17d]",
  }[variant];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full border border-transparent px-4 py-2 text-sm font-semibold cursor-pointer transition-transform duration-150 disabled:cursor-not-allowed disabled:opacity-55 disabled:transform-none ${variantClass}${className ? ` ${className}` : ""}`}
    >
      {caption}
    </button>
  );
}