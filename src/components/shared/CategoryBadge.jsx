import { Badge } from "@/components/ui/badge";
import { Sprout, ShoppingCart, Lightbulb, Package, Wrench, ListTodo, Sparkles, MoreHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";

export const taskCategories = [
  { id: "delivery", nameEn: "Delivery", nameAm: "ማድረስ", color: "bg-orange-100 text-orange-800", icon: Package },
  { id: "event", nameEn: "Event Setup", nameAm: "ዝግጅት (ጥምቀት/መስቀል)", color: "bg-purple-100 text-purple-800", icon: Lightbulb },
  { id: "market", nameEn: "Market Shopping", nameAm: "ገበያ ግዢ", color: "bg-blue-100 text-blue-800", icon: ShoppingCart },
  { id: "repair", nameEn: "Repairs", nameAm: "ጥገና", color: "bg-red-100 text-red-800", icon: Wrench },
  { id: "errand", nameEn: "Errands", nameAm: "ትንንሽ ስራዎች", color: "bg-yellow-100 text-yellow-800", icon: ListTodo },
  { id: "cleaning", nameEn: "Cleaning", nameAm: "ማጽዳት", color: "bg-cyan-100 text-cyan-800", icon: Sparkles },
  { id: "farming", nameEn: "Farming & Agriculture", nameAm: "ግብርና እና እርሻ", color: "bg-green-100 text-green-800", icon: Sprout },
  { id: "other", nameEn: "Other", nameAm: "ሌላ", color: "bg-gray-100 text-gray-700", icon: MoreHorizontal },
];

export function getCategoryById(id) {
  return taskCategories.find((c) => c.id === id) || taskCategories[taskCategories.length - 1];
}

export default function CategoryBadge({ categoryId }) {
  const { i18n } = useTranslation();
  const cat = getCategoryById(categoryId);
  const displayName = i18n.language === 'am' ? cat.nameAm : cat.nameEn;
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cat.color}`}>
      {displayName}
    </span>
  );
}