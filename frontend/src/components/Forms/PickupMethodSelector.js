/**
 * Barangay certificate delivery: pickup at hall vs online (email).
 */
export default function PickupMethodSelector({
  t,
  accentColor,
  pickupMethod,
  onSelect,
  pickupError,
}) {
  return (
    <div>
      <h4 className="text-sm font-bold text-gray-900 mb-1">{t.pickupHeading}</h4>
      <p className="text-xs text-gray-500 mb-3">{t.pickupHelp}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onSelect("pickup")}
          className={`p-4 rounded-xl border-2 text-left transition-colors ${pickupMethod === "pickup" ? "" : "bg-white border-gray-200 hover:border-gray-300"}`}
          style={
            pickupMethod === "pickup"
              ? { borderColor: accentColor, backgroundColor: `${accentColor}0D` }
              : undefined
          }
        >
          <p
            className="text-sm font-bold"
            style={
              pickupMethod === "pickup"
                ? { color: accentColor }
                : { color: "#111827" }
            }
          >
            {t.pickupPickup}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{t.pickupPickupSub}</p>
        </button>
        <button
          type="button"
          onClick={() => onSelect("online")}
          className={`p-4 rounded-xl border-2 text-left transition-colors ${pickupMethod === "online" ? "" : "bg-white border-gray-200 hover:border-gray-300"}`}
          style={
            pickupMethod === "online"
              ? { borderColor: accentColor, backgroundColor: `${accentColor}0D` }
              : undefined
          }
        >
          <p
            className="text-sm font-bold"
            style={
              pickupMethod === "online"
                ? { color: accentColor }
                : { color: "#111827" }
            }
          >
            {t.pickupOnline}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{t.pickupOnlineSub}</p>
        </button>
      </div>
      {pickupError && (
        <p className="text-xs text-red-600 mt-2">{pickupError}</p>
      )}
    </div>
  );
}
