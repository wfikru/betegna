import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:uuid/uuid.dart';
import '../../models/message_model.dart';
import '../../services/chat_service.dart';
import '../../services/auth_service.dart';
import '../../utils/app_localizations.dart';

/// Real-time chat; translation placeholder for future.
class ChatScreen extends StatefulWidget {
  final String chatId;
  final String otherUserId;

  const ChatScreen({super.key, required this.chatId, required this.otherUserId});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final ChatService _chat = ChatService();
  final AuthService _auth = AuthService();
  final _textController = TextEditingController();
  final _scrollController = ScrollController();

  @override
  void dispose() {
    _textController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    final text = _textController.text.trim();
    if (text.isEmpty) return;
    final uid = FirebaseAuth.instance.currentUser?.uid;
    if (uid == null) return;
    _textController.clear();
    final msg = MessageModel(
      id: const Uuid().v4(),
      chatId: widget.chatId,
      senderId: uid,
      text: text,
      createdAt: DateTime.now(),
      read: false,
    );
    await _chat.sendMessage(msg);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final uid = FirebaseAuth.instance.currentUser?.uid ?? '';

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.chat),
        actions: [
          IconButton(
            icon: const Icon(Icons.translate),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text(l10n.isAmharic ? 'ትርጉም (በቅርብ ጊዜ)' : 'Translation (coming soon)')),
              );
            },
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: StreamBuilder(
              stream: _chat.watchMessages(widget.chatId),
              builder: (context, snap) {
                if (!snap.hasData) {
                  return const Center(child: CircularProgressIndicator());
                }
                final docs = snap.data!.docs;
                final messages = docs.map((d) => MessageModel.fromMap({...d.data(), 'id': d.id})).toList();
                if (messages.isEmpty) {
                  return Center(
                    child: Text(
                      l10n.isAmharic ? 'መልእክት አልቀረበም' : 'No messages yet',
                      style: Theme.of(context).textTheme.bodyLarge,
                    ),
                  );
                }
                return ListView.builder(
                  controller: _scrollController,
                  reverse: true,
                  padding: const EdgeInsets.all(16),
                  itemCount: messages.length,
                  itemBuilder: (context, i) {
                    final m = messages[i];
                    final isMe = m.senderId == uid;
                    return Align(
                      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                        decoration: BoxDecoration(
                          color: isMe
                              ? Theme.of(context).colorScheme.primaryContainer
                              : Theme.of(context).colorScheme.surfaceContainerHighest,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Text(m.text),
                      ),
                    );
                  },
                );
              },
            ),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(8),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _textController,
                      decoration: InputDecoration(
                        hintText: l10n.isAmharic ? 'መልእክት ይጻፉ...' : 'Type message...',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(24)),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                      ),
                      onSubmitted: (_) => _send(),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton.filled(
                    onPressed: _send,
                    icon: const Icon(Icons.send),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
