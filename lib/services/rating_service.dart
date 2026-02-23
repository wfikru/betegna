import 'package:cloud_firestore/cloud_firestore.dart';

/// Ratings (mandatory post-task); stored in Firestore, aggregated on user profile.
class RatingService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  Future<void> submitRating({
    required String taskId,
    required String taskerId,
    required String clientId,
    required int rating, // 1-5
    String? comment,
  }) async {
    await _firestore.collection('ratings').add({
      'taskId': taskId,
      'taskerId': taskerId,
      'clientId': clientId,
      'rating': rating.clamp(1, 5),
      'comment': comment,
      'createdAt': DateTime.now().toIso8601String(),
    });
    await _updateTaskerAverage(taskerId);
  }

  Future<void> _updateTaskerAverage(String taskerId) async {
    final snap = await _firestore
        .collection('ratings')
        .where('taskerId', isEqualTo: taskerId)
        .get();
    if (snap.docs.isEmpty) return;
    double sum = 0;
    for (final d in snap.docs) {
      sum += (d.data()['rating'] as num?)?.toDouble() ?? 0;
    }
    final avg = sum / snap.docs.length;
    await _firestore.collection('users').doc(taskerId).update({
      'averageRating': avg,
      'totalReviews': snap.docs.length,
      'updatedAt': DateTime.now().toIso8601String(),
    });
  }
}
