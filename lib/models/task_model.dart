/// Task posted by a client (Ethiopia-specific categories).
class TaskModel {
  final String id;
  final String clientId;
  final String title;
  final String description;
  final String categoryId;
  final double budgetEtb;
  final double? latitude;
  final double? longitude;
  final String? addressLabel;
  final List<String> photoUrls;
  final String status; // draft, open, assigned, in_progress, completed, cancelled
  final String? assignedTaskerId;
  final DateTime createdAt;
  final DateTime? updatedAt;
  final DateTime? dueDate;

  const TaskModel({
    required this.id,
    required this.clientId,
    required this.title,
    required this.description,
    required this.categoryId,
    required this.budgetEtb,
    this.latitude,
    this.longitude,
    this.addressLabel,
    this.photoUrls = const [],
    this.status = 'open',
    this.assignedTaskerId,
    required this.createdAt,
    this.updatedAt,
    this.dueDate,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'clientId': clientId,
      'title': title,
      'description': description,
      'categoryId': categoryId,
      'budgetEtb': budgetEtb,
      'latitude': latitude,
      'longitude': longitude,
      'addressLabel': addressLabel,
      'photoUrls': photoUrls,
      'status': status,
      'assignedTaskerId': assignedTaskerId,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
      'dueDate': dueDate?.toIso8601String(),
    };
  }

  factory TaskModel.fromMap(Map<String, dynamic> map) {
    return TaskModel(
      id: map['id'] as String? ?? '',
      clientId: map['clientId'] as String? ?? '',
      title: map['title'] as String? ?? '',
      description: map['description'] as String? ?? '',
      categoryId: map['categoryId'] as String? ?? '',
      budgetEtb: (map['budgetEtb'] as num?)?.toDouble() ?? 0,
      latitude: (map['latitude'] as num?)?.toDouble(),
      longitude: (map['longitude'] as num?)?.toDouble(),
      addressLabel: map['addressLabel'] as String?,
      photoUrls: (map['photoUrls'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      status: map['status'] as String? ?? 'open',
      assignedTaskerId: map['assignedTaskerId'] as String?,
      createdAt: map['createdAt'] != null
          ? DateTime.tryParse(map['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
      updatedAt: map['updatedAt'] != null
          ? DateTime.tryParse(map['updatedAt'].toString())
          : null,
      dueDate: map['dueDate'] != null
          ? DateTime.tryParse(map['dueDate'].toString())
          : null,
    );
  }

  TaskModel copyWith({
    String? id,
    String? clientId,
    String? title,
    String? description,
    String? categoryId,
    double? budgetEtb,
    double? latitude,
    double? longitude,
    String? addressLabel,
    List<String>? photoUrls,
    String? status,
    String? assignedTaskerId,
    DateTime? createdAt,
    DateTime? updatedAt,
    DateTime? dueDate,
  }) {
    return TaskModel(
      id: id ?? this.id,
      clientId: clientId ?? this.clientId,
      title: title ?? this.title,
      description: description ?? this.description,
      categoryId: categoryId ?? this.categoryId,
      budgetEtb: budgetEtb ?? this.budgetEtb,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      addressLabel: addressLabel ?? this.addressLabel,
      photoUrls: photoUrls ?? this.photoUrls,
      status: status ?? this.status,
      assignedTaskerId: assignedTaskerId ?? this.assignedTaskerId,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      dueDate: dueDate ?? this.dueDate,
    );
  }
}
