export default function FieldLabel({ children, required }) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
      {children}
      {required && <span className="text-status-red ml-1">*</span>}
    </label>
  );
}