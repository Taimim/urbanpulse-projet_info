import { ReactNode } from "react";

type PageBlockProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

export function PageBlock({ title, description, children }: PageBlockProps) {
  const idTitre = `heading-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <section className="page" aria-labelledby={idTitre}>
      <header>
        <h2 id={idTitre}>{title}</h2>
        <p>{description}</p>
      </header>
      {children}
    </section>
  );
}
