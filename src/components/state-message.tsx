export default function StateMessage({
  text,
  tone = "muted",
}: {
  text: string;
  tone?: "muted" | "alert";
}) {
  return (
    <p className={tone === "alert" ? "text-sm text-red-400" : "text-sm text-[#94a3b8]"}>
      {text}
    </p>
  );
}
