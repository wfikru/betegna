/// User profile for Betegna (Client or Tasker).
class UserModel {
  final String id;
  final String? phoneNumber;
  final String? displayName;
  final String? photoUrl;
  final String? bio;
  /// Client or Tasker
  final bool isTasker;
  /// Tasker skills (e.g. "Farming", "Market Shopping")
  final List<String> skills;
  final bool isAvailable;
  /// KYC placeholder for future
  final bool kycVerified;
  final double? latitude;
  final double? longitude;
  final String? locale; // 'am' | 'en'
  final double? averageRating;
  final int? totalReviews;
  final DateTime createdAt;
  final DateTime? updatedAt;

  const UserModel({
    required this.id,
    this.phoneNumber,
    this.displayName,
    this.photoUrl,
    this.bio,
    this.isTasker = false,
    this.skills = const [],
    this.isAvailable = true,
    this.kycVerified = false,
    this.latitude,
    this.longitude,
    this.locale = 'am',
    this.averageRating,
    this.totalReviews,
    required this.createdAt,
    this.updatedAt,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'phoneNumber': phoneNumber,
      'displayName': displayName,
      'photoUrl': photoUrl,
      'bio': bio,
      'isTasker': isTasker,
      'skills': skills,
      'isAvailable': isAvailable,
      'kycVerified': kycVerified,
      'latitude': latitude,
      'longitude': longitude,
      'locale': locale,
      'averageRating': averageRating,
      'totalReviews': totalReviews,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }

  factory UserModel.fromMap(Map<String, dynamic> map) {
    return UserModel(
      id: map['id'] as String? ?? '',
      phoneNumber: map['phoneNumber'] as String?,
      displayName: map['displayName'] as String?,
      photoUrl: map['photoUrl'] as String?,
      bio: map['bio'] as String?,
      isTasker: map['isTasker'] as bool? ?? false,
      skills: (map['skills'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      isAvailable: map['isAvailable'] as bool? ?? true,
      kycVerified: map['kycVerified'] as bool? ?? false,
      latitude: (map['latitude'] as num?)?.toDouble(),
      longitude: (map['longitude'] as num?)?.toDouble(),
      locale: map['locale'] as String? ?? 'am',
      averageRating: (map['averageRating'] as num?)?.toDouble(),
      totalReviews: map['totalReviews'] as int?,
      createdAt: map['createdAt'] != null
          ? DateTime.tryParse(map['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
      updatedAt: map['updatedAt'] != null
          ? DateTime.tryParse(map['updatedAt'].toString())
          : null,
    );
  }

  UserModel copyWith({
    String? id,
    String? phoneNumber,
    String? displayName,
    String? photoUrl,
    String? bio,
    bool? isTasker,
    List<String>? skills,
    bool? isAvailable,
    bool? kycVerified,
    double? latitude,
    double? longitude,
    String? locale,
    double? averageRating,
    int? totalReviews,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return UserModel(
      id: id ?? this.id,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      displayName: displayName ?? this.displayName,
      photoUrl: photoUrl ?? this.photoUrl,
      bio: bio ?? this.bio,
      isTasker: isTasker ?? this.isTasker,
      skills: skills ?? this.skills,
      isAvailable: isAvailable ?? this.isAvailable,
      kycVerified: kycVerified ?? this.kycVerified,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      locale: locale ?? this.locale,
      averageRating: averageRating ?? this.averageRating,
      totalReviews: totalReviews ?? this.totalReviews,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
