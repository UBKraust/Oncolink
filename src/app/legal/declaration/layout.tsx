import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Declarație pe proprie răspundere · Ce`ai Pățit?",
  description: "Declarație privind conformitatea datelor furnizate pentru pacienții minori.",
};

export default function DeclarationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
