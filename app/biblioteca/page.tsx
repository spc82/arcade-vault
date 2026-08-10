import type { Metadata } from "next";
import { LibraryBrowser } from "@/components/library-browser";
import { CATS, GAMES } from "@/lib/games";

export const metadata: Metadata = {
  title: "Biblioteca · Arcade Vault",
};

export default function BibliotecaPage() {
  return <LibraryBrowser games={GAMES} cats={CATS} />;
}
