import type { ReactNode } from "react";

type Props = {
    title?: string;
    description?: string;
    children: ReactNode;
    className?: string;
};

export default function SectionCard({
    title,
    description,
    children,
    className = "",
}: Props) {
    return (
        <section className={`form-card ${className}`}>
            {(title || description) && (
                <div className="page-header">
                    {title && <h2>{title}</h2>}
                    {description && <p>{description}</p>}
                </div>
            )}
            {children}
        </section>
    );
}