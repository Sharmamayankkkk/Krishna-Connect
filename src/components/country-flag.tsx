"use client"

import Flag from "react-world-flags"

interface CountryFlagProps {
  countryCode: string
  className?: string
  size?: number
}

export function CountryFlag({ countryCode, className, size = 20 }: CountryFlagProps) {
  return (
    <Flag
      code={countryCode}
      style={{
        width: size,
        height: Math.round(size * 0.75),
        objectFit: "cover",
        borderRadius: 2,
      }}
      className={className}
      fallback={<span className="inline-block rounded-sm bg-muted" style={{ width: size, height: Math.round(size * 0.75) }} />}
    />
  )
}
