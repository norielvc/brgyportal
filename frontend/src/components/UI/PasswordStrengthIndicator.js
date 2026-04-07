import { Check, X } from "lucide-react";

export default function PasswordStrengthIndicator({ password }) {
  const requirements = [
    { label: "At least 6 characters", met: password.length >= 6 },
    { label: "Contains lowercase letter", met: /[a-z]/.test(password) },
    { label: "Contains uppercase letter", met: /[A-Z]/.test(password) },
    { label: "Contains number", met: /\d/.test(password) },
  ];

  const metCount = requirements.filter((r) => r.met).length;
  const strength =
    metCount === 4 ? "strong" : metCount >= 2 ? "medium" : "weak";

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition ${
              i < metCount
                ? strength === "strong"
                  ? "bg-green-500"
                  : strength === "medium"
                    ? "bg-yellow-500"
                    : "bg-red-500"
                : "bg-gray-200"
            }`}
          />
        ))}
      </div>
      <div className="space-y-1">
        {requirements.map((req, idx) => (
          <div key={idx} className="flex items-center gap-2 text-xs">
            {req.met ? (
              <Check className="w-3 h-3 text-green-600" />
            ) : (
              <X className="w-3 h-3 text-gray-300" />
            )}
            <span className={req.met ? "text-green-700" : "text-gray-500"}>
              {req.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
