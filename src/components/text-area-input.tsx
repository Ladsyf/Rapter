export default function TextAreaInput({
  value,
  onChange,
  disabled,
  placeholder,
}: {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <textarea
      className="w-full rounded-[14px] border border-white/15 bg-[rgba(15,23,42,0.74)] px-3 py-2 text-[#e5e7eb] placeholder:text-[#94a3b8] outline-none transition-shadow duration-150 focus:border-[rgba(59,130,246,0.65)] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.25)] disabled:bg-[rgba(30,41,59,0.65)] disabled:text-[#94a3b8] font-mono"
      value={value}
      onChange={onChange}
      rows={3}
      disabled={disabled ?? false}
      placeholder={placeholder}
    />
  );
}
