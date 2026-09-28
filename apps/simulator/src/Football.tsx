import type { SVGProps } from "react";

type FootballProps = SVGProps<SVGSVGElement> & {
  patternTransform?: string;
  label?: string;
};

/** Shared possession marker for the board and player cards. */
export function Football({
  patternTransform,
  label = "Has possession",
  ...props
}: FootballProps) {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-label={label} {...props}>
      <title>{label}</title>
      <circle
        cx="12"
        cy="12"
        r="11"
        fill="#fff"
        stroke="#25362d"
        strokeWidth="1.3"
      />
      <g transform={patternTransform}>
        <path
          d="M12 7 17 10.5 15 16 9 16 7 10.5Z M9 1.5 15 1.5 12 4Z M21.5 6 23 12 19.5 10Z M20 20 14 23 16 19Z M4 20 8 19 10 23Z M1 12 2.5 6 4.5 10Z"
          fill="#25362d"
        />
        <path
          d="M12 4V7 M17 10.5 19.5 10 M15 16 16 19 M9 16 8 19 M7 10.5 4.5 10"
          fill="none"
          stroke="#25362d"
          strokeWidth="1"
        />
      </g>
    </svg>
  );
}
