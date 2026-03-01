/**
 * Parse Prestige High Fields flat number format: XYZN
 * X = Tower number (1-10)
 * YZ = Floor number (01-99)
 * N = Unit on floor (1-9)
 *
 * Example: 3154 → Tower 3, Floor 15, Unit 4
 */
export function parseFlatNumber(flatNumber: string): {
  tower: number | null;
  floor: number | null;
  unit: number | null;
  display: string;
} {
  const num = flatNumber.replace(/\D/g, "");

  if (num.length === 4) {
    const tower = parseInt(num[0], 10);
    const floor = parseInt(num.slice(1, 3), 10);
    const unit = parseInt(num[3], 10);
    return {
      tower,
      floor,
      unit,
      display: `T${tower}-F${floor}-U${unit}`,
    };
  }

  // Non-standard format
  return {
    tower: null,
    floor: null,
    unit: null,
    display: flatNumber,
  };
}

/**
 * Format flat number with tower/floor/unit breakdown
 * e.g., "3154" → "3154 (T3-F15-U4)"
 */
export function formatFlatNumber(flatNumber: string): string {
  const parsed = parseFlatNumber(flatNumber);
  if (parsed.tower !== null) {
    return `${flatNumber} (${parsed.display})`;
  }
  return flatNumber;
}
