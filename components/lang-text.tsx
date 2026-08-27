import { hasArabicOrUrdu } from "@/lib/language";

interface LangTextProps {
  children: React.ReactNode;
  as?: "span" | "p" | "h1" | "h2" | "h3" | "h4" | "div";
  className?: string;
  style?: React.CSSProperties;
}

export function LangText({
  children,
  as: Tag = "span",
  className = "",
  style,
}: LangTextProps) {
  const text = typeof children === "string" ? children : "";
  const isRtl = hasArabicOrUrdu(text);
  const langClass = isRtl ? "lang-ur" : "";

  return (
    <Tag
      className={`${langClass} ${className}`.trim()}
      dir={isRtl ? "rtl" : undefined}
      style={style}
    >
      {children}
    </Tag>
  );
}
