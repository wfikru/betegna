/// Chat message (real-time Firestore).
class MessageModel {
  final String id;
  final String chatId;
  final String senderId;
  final String text;
  final DateTime createdAt;
  final bool read;

  const MessageModel({
    required this.id,
    required this.chatId,
    required this.senderId,
    required this.text,
    required this.createdAt,
    this.read = false,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'chatId': chatId,
      'senderId': senderId,
      'text': text,
      'createdAt': createdAt.toIso8601String(),
      'read': read,
    };
  }

  factory MessageModel.fromMap(Map<String, dynamic> map) {
    return MessageModel(
      id: map['id'] as String? ?? '',
      chatId: map['chatId'] as String? ?? '',
      senderId: map['senderId'] as String? ?? '',
      text: map['text'] as String? ?? '',
      createdAt: map['createdAt'] != null
          ? DateTime.tryParse(map['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
      read: map['read'] as bool? ?? false,
    );
  }
}
