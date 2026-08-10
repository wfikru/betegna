import { Badge } from "@/components/ui/badge";
import { Sprout, ShoppingCart, Lightbulb, Package, Wrench, ListTodo, Sparkles, MoreHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";

export const taskCategories = [
  { id: "delivery", nameEn: "Delivery", nameAm: "ማድረስ", color: "bg-amber-100 text-amber-900 border border-amber-200/80", icon: Package },
  { id: "event", nameEn: "Event Setup", nameAm: "ዝግጅት (ጥምቀት/መስቀል)", color: "bg-emerald-100 text-emerald-900 border border-emerald-200/80", icon: Lightbulb },
  { id: "market", nameEn: "Market Shopping", nameAm: "ገበያ ግዢ", color: "bg-teal-100 text-teal-900 border border-teal-200/80", icon: ShoppingCart },
  { id: "repair", nameEn: "Repairs", nameAm: "ጥገና", color: "bg-stone-100 text-stone-800 border border-stone-200/80", icon: Wrench },
  { id: "errand", nameEn: "Errands", nameAm: "ትንንሽ ስራዎች", color: "bg-green-100 text-green-900 border border-green-200/80", icon: ListTodo },
  { id: "cleaning", nameEn: "Cleaning", nameAm: "ማጽዳት", color: "bg-emerald-50 text-emerald-800 border border-emerald-200/80", icon: Sparkles },
  { id: "farming", nameEn: "Farming & Agriculture", nameAm: "ግብርና እና እርሻ", color: "bg-green-100 text-green-800 border border-green-200/80", icon: Sprout },
  { id: "other", nameEn: "Other", nameAm: "ሌላ", color: "bg-gray-100 text-gray-700 border border-gray-200/80", icon: MoreHorizontal },
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