import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/message_model.dart';

/// Real-time chat via Firestore. ChatId = sorted concatenation of two user ids.
class ChatService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  static String chatId(String uid1, String uid2) {
    final list = [uid1, uid2]..sort();
    return '${list[0]}_${list[1]}';
  }

  CollectionReference<Map<String, dynamic>> _messages(String chatId) =>
      _firestore.collection('chats').doc(chatId).collection('messages');

  Future<void> sendMessage(MessageModel message) async {
    await _messages(message.chatId).doc(message.id).set(message.toMap());
  }

  Stream<QuerySnapshot<Map<String, dynamic>>> watchMessages(String chatId) {
    return _messages(chatId)
        .orderBy('createdAt', descending: true)
        .limit(100)
        .snapshots();
  }

  Future<List<MessageModel>> getMessages(String chatId, {int limit = 50}) async {
    final snap = await _messages(chatId)
        .orderBy('createdAt', descending: true)
        .limit(limit)
        .get();
    return snap.docs
        .map((d) => MessageModel.fromMap({...d.data(), 'id': d.id}))
        .toList();
  }
}
