/// Bid/application from a tasker on a task.
class BidModel {
  final String id;
  final String taskId;
  final String taskerId;
  final double amountEtb;
  final String message;
  final String status; // pending, accepted, rejected
  final DateTime createdAt;
  final DateTime? updatedAt;

  const BidModel({
    required this.id,
    required this.taskId,
    required this.taskerId,
    required this.amountEtb,
    this.message = '',
    this.status = 'pending',
    required this.createdAt,
    this.updatedAt,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'taskId': taskId,
      'taskerId': taskerId,
      'amountEtb': amountEtb,
      'message': message,
      'status': status,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }

  factory BidModel.fromMap(Map<String, dynamic> map) {
    return BidModel(
      id: map['id'] as String? ?? '',
      taskId: map['taskId'] as String? ?? '',
      taskerId: map['taskerId'] as String? ?? '',
      amountEtb: (map['amountEtb'] as num?)?.toDouble() ?? 0,
      message: map['message'] as String? ?? '',
      status: map['status'] as String? ?? 'pending',
      createdAt: map['createdAt'] != null
          ? DateTime.tryParse(map['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
      updatedAt: map['updatedAt'] != null
          ? DateTime.tryParse(map['updatedAt'].toString())
          : null,
    );
  }
}
