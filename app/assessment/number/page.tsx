import type { Metadata } from "next";
import NumberCheckpoint from "@/components/number-checkpoint";
import { numberCheckpointView } from "@/lib/number-checkpoint";

export const metadata: Metadata = {
  title: "Number checkpoint 1 · OpenMind",
  description: "A composed practice checkpoint across five completed AQA GCSE Mathematics Number objectives.",
};

export default function NumberCheckpointPage() {
  const checkpoint = numberCheckpointView();
  return (
    <main className="container page">
      <NumberCheckpoint checkpoint={checkpoint} />
    </main>
  );
}
