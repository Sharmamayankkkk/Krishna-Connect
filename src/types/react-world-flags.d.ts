declare module "react-world-flags" {
  import { ComponentType, CSSProperties, ReactNode } from "react"

  interface FlagProps {
    code: string
    style?: CSSProperties
    className?: string
    fallback?: ReactNode
  }

  const Flag: ComponentType<FlagProps>
  export default Flag
}
