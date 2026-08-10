import type { Metadata } from "next";
import { HallOfFame } from "@/components/hall-of-fame";
import { GAMES } from "@/lib/games";

export const metadata: Metadata = {
  title: "Salón de la Fama · Arcade Vault",
};

export default function SalonPage() {
  return <HallOfFame games={GAMES} />;
}
