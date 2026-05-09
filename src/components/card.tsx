export default function Card({
  children,
  interactive,
  className,
  onClick,
}: {
  children: React.ReactNode;
  interactive?: boolean;
  className?: string;
  onClick?: () => void;
}) {
  const classes = [
    "rounded-[20px] border border-white/12 bg-[rgba(10,15,28,0.78)] p-4 shadow-[0_16px_42px_rgba(0,0,0,0.45)] backdrop-blur-[6px]",
  ];

  if (interactive) {
    classes.push(
      "cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:border-[rgba(16,84,210,0.45)] hover:shadow-[0_16px_36px_rgba(16,84,210,0.18)]",
    );
  }

  if (className) {
    classes.push(className);
  }

  return (
    <div className={classes.join(" ")} onClick={onClick}>
      {children}
    </div>
  );
}