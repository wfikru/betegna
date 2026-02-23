import 'package:cloud_firestore/cloud_firestore.dart';

/// Escrow simulation in Firestore; Chapa integration placeholder for production.
class PaymentService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  static const String collectionEscrow = 'escrow';

  /// Create escrow record (client "pays" -> hold in Firestore for MVP).
  Future<void> createEscrow({
    required String taskId,
    required String clientId,
    required String taskerId,
    required double amountEtb,
  }) async {
    await _firestore.collection(collectionEscrow).doc(taskId).set({
      'taskId': taskId,
      'clientId': clientId,
      'taskerId': taskerId,
      'amountEtb': amountEtb,
      'status': 'held', // held | released | refunded
      'createdAt': DateTime.now().toIso8601String(),
      'updatedAt': DateTime.now().toIso8601String(),
    });
  }

  /// Release payment to tasker (on task completion).
  Future<void> releasePayment(String taskId) async {
    await _firestore.collection(collectionEscrow).doc(taskId).update({
      'status': 'released',
      'updatedAt': DateTime.now().toIso8601String(),
    });
  }

  Future<Map<String, dynamic>?> getEscrow(String taskId) async {
    final doc = await _firestore.collection(collectionEscrow).doc(taskId).get();
    if (doc.exists && doc.data() != null) {
      return doc.data();
    }
    return null;
  }

  /// Chapa: in production replace with Chapa SDK / server-side API.
  Future<bool> simulateChapaPayment({
    required double amountEtb,
    required String phoneNumber,
    required String reference,
  }) async {
    await Future.delayed(const Duration(seconds: 1));
    return true; // MVP simulation always succeeds
  }
}
