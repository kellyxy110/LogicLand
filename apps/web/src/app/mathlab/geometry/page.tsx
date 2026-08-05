// Geometry Lab — construct, measure and transform shapes on a coordinate grid (MathLab, ADR-029).
import { GeometryLab } from "@/features/mathlab/GeometryLab";

export const metadata = {
  title: "Geometry Lab · LogicLand",
  description: "Construct, measure and transform — side lengths, angles, area and rigid transforms, all computed and explained.",
};

export default function GeometryLabPage() {
  return <GeometryLab />;
}
