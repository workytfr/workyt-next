import { Metadata } from "next";
import ProgressionClient from "./ProgressionClient";

export const metadata: Metadata = {
  title: "Ma Progression",
  description: "Suivez votre progression par compétence et identifiez vos lacunes",
};

export default function ProgressionPage() {
  return <ProgressionClient />;
}
