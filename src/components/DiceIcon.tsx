import { DICE, Die } from "@/lib/dice";

type DiceIconProps = {
  sides: Die;
  className?: string;
};

export default function DiceIcon({ sides, className }: DiceIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={16}
      height={16}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinejoin="round"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <DiceShape sides={sides} />
    </svg>
  );
}

function DiceShape({ sides }: { sides: Die }) {
  switch (sides) {
    // Tetrahedron — a triangular pyramid.
    case 4:
      return (
        <>
          <path d="M12 3 L21 19 L3 19 Z" />
          <path d="M12 3 L12 19" />
        </>
      );
    // Cube — the classic three-visible-faces isometric box.
    case 6:
      return (
        <>
          <path d="M12 2 L20.5 6.5 L20.5 16.5 L12 21 L3.5 16.5 L3.5 6.5 Z" />
          <path d="M12 11 L12 21" />
          <path d="M12 11 L20.5 6.5" />
          <path d="M12 11 L3.5 6.5" />
        </>
      );
    // Octahedron — two square pyramids joined at their base.
    case 8:
      return (
        <>
          <path d="M12 2 L20 12 L12 22 L4 12 Z" />
          <path d="M4 12 L20 12" />
        </>
      );
    // Pentagonal trapezohedron — a taller, narrower kite than the octahedron.
    case 10:
      return (
        <>
          <path d="M12 1 L17.5 12 L12 23 L6.5 12 Z" />
          <path d="M6.5 12 L17.5 12" />
        </>
      );
    // Dodecahedron — a regular pentagon, one of its twelve faces.
    case 12:
      return <path d="M12 2 L21.5 8.9 L17.9 20.1 L6.1 20.1 L2.5 8.9 Z" />;
    // Icosahedron — a hexagon subdivided into triangular facets.
    case 20:
      return (
        <>
          <path d="M22 12 L17 20.7 L7 20.7 L2 12 L7 3.3 L17 3.3 Z" />
          <path d="M12 12 L22 12" />
          <path d="M12 12 L17 20.7" />
          <path d="M12 12 L7 20.7" />
          <path d="M12 12 L2 12" />
          <path d="M12 12 L7 3.3" />
          <path d="M12 12 L17 3.3" />
        </>
      );
    // Percentile die — a many-faceted sphere, drawn as a circle with facet lines.
    case 100:
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 3 L12 21" />
          <path d="M5.5 5.5 L18.5 18.5" />
          <path d="M18.5 5.5 L5.5 18.5" />
        </>
      );
  }
}
