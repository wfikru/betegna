/// Ethiopia-specific task categories for Betegna.
class TaskCategory {
  final String id;
  final String nameEn;
  final String nameAm;

  const TaskCategory({
    required this.id,
    required this.nameEn,
    required this.nameAm,
  });

  String name(bool isAmharic) => isAmharic ? nameAm : nameEn;
}

const List<TaskCategory> taskCategories = [
  TaskCategory(id: 'farming', nameEn: 'Farming & Agriculture', nameAm: 'ግብርና እና እርሻ'),
  TaskCategory(id: 'market', nameEn: 'Market Shopping', nameAm: 'ገበያ ግዢ'),
  TaskCategory(id: 'event', nameEn: 'Event Setup (Timkat/Meskel)', nameAm: 'ዝግጅት (ጥምቀት/መስቀል)'),
  TaskCategory(id: 'delivery', nameEn: 'Delivery', nameAm: 'ማድረስ'),
  TaskCategory(id: 'repair', nameEn: 'Repairs', nameAm: 'ጥገና'),
  TaskCategory(id: 'errand', nameEn: 'Errands', nameAm: 'ትንንሽ ስራዎች'),
  TaskCategory(id: 'cleaning', nameEn: 'Cleaning', nameAm: 'ማጽዳት'),
  TaskCategory(id: 'other', nameEn: 'Other', nameAm: 'ሌላ'),
];

TaskCategory? categoryById(String id) {
  try {
    return taskCategories.firstWhere((c) => c.id == id);
  } catch (_) {
    return null;
  }
}
