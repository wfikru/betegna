import { Badge } from "@/components/ui/badge";

export const taskCategories = [
  { id: "farming", nameEn: "Farming & Agriculture", nameAm: "ግብርና እና እርሻ", color: "bg-green-100 text-green-800" },
  { id: "market", nameEn: "Market Shopping", nameAm: "ገበያ ግዢ", color: "bg-blue-100 text-blue-800" },
  { id: "event", nameEn: "Event Setup", nameAm: "ዝግጅት (ጥምቀት/መስቀል)", color: "bg-purple-100 text-purple-800" },
  { id: "delivery", nameEn: "Delivery", nameAm: "ማድረስ", color: "bg-orange-100 text-orange-800" },
  { id: "repair", nameEn: "Repairs", nameAm: "ጥገና", color: "bg-red-100 text-red-800" },
  { id: "errand", nameEn: "Errands", nameAm: "ትንንሽ ስራዎች", color: "bg-yellow-100 text-yellow-800" },
  { id: "cleaning", nameEn: "Cleaning", nameAm: "ማጽዳት", color: "bg-cyan-100 text-cyan-800" },
  { id: "other", nameEn: "Other", nameAm: "ሌላ", color: "bg-gray-100 text-gray-700" },
];

export function getCategoryById(id) {
  return taskCategories.find((c) => c.id === id) || taskCategories[taskCategories.length - 1];
}

export default function CategoryBadge({ categoryId }) {
  const cat = getCategoryById(categoryId);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cat.color}`}>
      {cat.nameEn}
    </span>
  );
}