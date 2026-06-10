"use client";

type PayButtonProps = {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  label?: string;
};

export default function PayButton({
  onClick,
  loading = false,
  disabled = false,
  label = "Pay with Paystack",
}: PayButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading || disabled}
      className="btn-primary"
    >
      {loading ? "Redirecting..." : label}
    </button>
  );
}