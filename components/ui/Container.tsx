interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "main";
  size?: "sm" | "md" | "lg" | "xl";
}

const sizes = {
  sm: "max-w-3xl",
  md: "max-w-5xl",
  lg: "max-w-7xl",
  xl: "max-w-[90rem]",
};

export default function Container({ children, className = "", as: Tag = "div", size = "lg" }: ContainerProps) {
  return (
    <Tag className={`mx-auto w-full ${sizes[size]} px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </Tag>
  );
}
