import 'package:hive_flutter/hive_flutter.dart';

/// Offline cache keys and helpers for Betegna (tasks, profiles).
class OfflineSync {
  static const String boxTasks = 'betegna_tasks';
  static const String boxUsers = 'betegna_users';
  static const String boxPendingWrites = 'betegna_pending';

  static Future<void> init() async {
    await Hive.initFlutter();
    await Hive.openBox<dynamic>(boxTasks);
    await Hive.openBox<dynamic>(boxUsers);
    await Hive.openBox<dynamic>(boxPendingWrites);
  }

  static Box<dynamic> get tasksBox => Hive.box<dynamic>(boxTasks);
  static Box<dynamic> get usersBox => Hive.box<dynamic>(boxUsers);
  static Box<dynamic> get pendingBox => Hive.box<dynamic>(boxPendingWrites);

  /// Cache a task for offline browsing.
  static void cacheTask(String id, Map<String, dynamic> data) {
    tasksBox.put(id, data);
  }

  static Map<String, dynamic>? getCachedTask(String id) {
    final v = tasksBox.get(id);
    return v is Map ? Map<String, dynamic>.from(v as Map) : null;
  }

  static void cacheUser(String id, Map<String, dynamic> data) {
    usersBox.put(id, data);
  }

  static Map<String, dynamic>? getCachedUser(String id) {
    final v = usersBox.get(id);
    return v is Map ? Map<String, dynamic>.from(v as Map) : null;
  }

  static List<Map<String, dynamic>> getAllCachedTasks() {
    final list = <Map<String, dynamic>>[];
    for (final key in tasksBox.keys) {
      final v = tasksBox.get(key);
      if (v is Map) list.add(Map<String, dynamic>.from(v as Map));
    }
    return list;
  }

  static void clearTasks() => tasksBox.clear();
  static void clearUsers() => usersBox.clear();
}
