import 'dart:math' as math;
import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/user_model.dart';

/// Simple matching: taskers near task location with matching skills (rule-based for MVP).
class MatchingService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  /// Find taskers: has skill matching task category, is available, optionally near lat/lng.
  Future<List<UserModel>> findMatchingTaskers({
    required String categoryId,
    double? latitude,
    double? longitude,
    double radiusKm = 50,
    int limit = 20,
  }) async {
    try {
      // Map category to skill keywords (Ethiopia categories).
      final skillQuery = categoryToSkill(categoryId);
      Query<Map<String, dynamic>> q = _firestore
          .collection('users')
          .where('isTasker', isEqualTo: true)
          .where('isAvailable', isEqualTo: true)
          .limit(limit * 2); // fetch more then filter by skills

      final snap = await q.get();
      final list = <UserModel>[];
      for (final doc in snap.docs) {
        final user = UserModel.fromMap({...doc.data(), 'id': doc.id});
        if (!user.isTasker || !user.isAvailable) continue;
        if (skillQuery != null) {
          final hasSkill = user.skills.any(
            (s) => s.toLowerCase().contains(skillQuery.toLowerCase()),
          );
          if (!hasSkill) continue;
        }
        if (latitude != null && longitude != null &&
            user.latitude != null && user.longitude != null) {
          final d = _haversine(
            latitude,
            longitude,
            user.latitude!,
            user.longitude!,
          );
          if (d > radiusKm) continue;
        }
        list.add(user);
        if (list.length >= limit) break;
      }
      return list;
    } catch (_) {
      return [];
    }
  }

  /// Category id -> skill keyword for matching.
  String? categoryToSkill(String categoryId) {
    const map = {
      'farming': 'farming',
      'market': 'market',
      'event': 'event',
      'delivery': 'delivery',
      'repair': 'repair',
      'errand': 'errand',
      'cleaning': 'cleaning',
    };
    return map[categoryId];
  }

  double _haversine(double lat1, double lon1, double lat2, double lon2) {
    const p = 0.017453292519943295;
    final a = 0.5 -
        math.cos((lat2 - lat1) * p) / 2 +
        math.cos(lat1 * p) * math.cos(lat2 * p) * (1 - math.cos((lon2 - lon1) * p)) / 2;
    return 12742 * math.asin(math.sqrt(a)); // km
  }
}