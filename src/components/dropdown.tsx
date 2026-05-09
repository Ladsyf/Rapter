export interface IDropdownOption {
  label: string;
  value: string | number;
}

export default function Dropdown({
  value,
  onChange,
  options,
}: {
  value: string | number | readonly string[] | undefined;
  onChange: React.ChangeEventHandler<HTMLSelectElement, HTMLSelectElement>;
  options: IDropdownOption[];
}) {
  return (<select
    className="w-full rounded-[14px] border border-white/15 bg-[rgba(15,23,42,0.74)] px-3 py-2 text-[#e5e7eb] outline-none transition-shadow duration-150 focus:border-[rgba(59,130,246,0.65)] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.25)]"
    value={value}
    onChange={onChange}
  >
    {options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>);
}