type FormInputProps = {
  label: string;
  name: string;
  type?: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
};

export default function FormInput({
  label,
  name,
  type = "text",
  value,
  placeholder,
  onChange,
}: FormInputProps) {
  return (
    <div>
      <label htmlFor={name} className="mb-2 block text-sm text-slate-300">
        {label}
      </label>
     <input
  id={name}
  name={name}
  type={type}
  value={value ?? ""}   // ✅ FIX HERE
  onChange={(e) => onChange(e.target.value)}
  className="input"
/>
    </div>
  );
}