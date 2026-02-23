import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:uuid/uuid.dart';
import '../../models/task_model.dart';
import '../../models/bid_model.dart';
import '../../services/task_service.dart';
import '../../services/auth_service.dart';
import '../../services/payment_service.dart';
import '../../services/rating_service.dart';
import '../../utils/app_localizations.dart';
import '../../utils/etb_format.dart';
import '../../utils/task_categories.dart';
import '../chat/chat_screen.dart';
import '../payment/payment_screen.dart';

class TaskDetailScreen extends StatefulWidget {
  final String taskId;

  const TaskDetailScreen({super.key, required this.taskId});

  @override
  State<TaskDetailScreen> createState() => _TaskDetailScreenState();
}

class _TaskDetailScreenState extends State<TaskDetailScreen> {
  final TaskService _taskService = TaskService();
  final AuthService _auth = AuthService();
  final PaymentService _payment = PaymentService();
  final RatingService _rating = RatingService();
  TaskModel? _task;
  List<BidModel> _bids = [];
  bool _loading = true;
  String _error = '';
  final _bidAmountController = TextEditingController();
  final _bidMessageController = TextEditingController();
  bool _showBidForm = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _bidAmountController.dispose();
    _bidMessageController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final task = await _taskService.getTask(widget.taskId);
    final bids = await _taskService.getBidsForTask(widget.taskId);
    if (mounted) setState(() {
      _task = task;
      _bids = bids;
      _loading = false;
    });
  }

  Future<void> _submitBid() async {
    final amount = double.tryParse(_bidAmountController.text.trim());
    if (amount == null || amount <= 0 || _task == null) return;
    final uid = FirebaseAuth.instance.currentUser?.uid;
    if (uid == null) return;
    setState(() => _loading = true);
    try {
      final bid = BidModel(
        id: const Uuid().v4(),
        taskId: _task!.id,
        taskerId: uid,
        amountEtb: amount,
        message: _bidMessageController.text.trim(),
        status: 'pending',
        createdAt: DateTime.now(),
      );
      await _taskService.createBid(bid);
      if (mounted) {
        setState(() {
          _showBidForm = false;
          _loading = false;
        });
        _load();
      }
    } catch (e) {
      if (mounted) setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  Future<void> _acceptBid(BidModel bid) async {
    if (_task == null) return;
    setState(() => _loading = true);
    try {
      await _taskService.acceptBid(_task!.id, bid.id, bid.taskerId);
      await _payment.createEscrow(
        taskId: _task!.id,
        clientId: _task!.clientId,
        taskerId: bid.taskerId,
        amountEtb: bid.amountEtb,
      );
      if (mounted) _load();
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    }
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _markComplete() async {
    if (_task == null) return;
    setState(() => _loading = true);
    try {
      await _taskService.updateTask(_task!.copyWith(status: 'completed'));
      if (mounted) _load();
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    }
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _openChat() async {
    if (_task == null) return;
    final otherId = _task!.clientId == FirebaseAuth.instance.currentUser?.uid
        ? _task!.assignedTaskerId
        : _task!.clientId;
    if (otherId == null) return;
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => ChatScreen(chatId: _task!.id, otherUserId: otherId),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final uid = FirebaseAuth.instance.currentUser?.uid;
    final isClient = uid != null && _task?.clientId == uid;

    if (_loading && _task == null) {
      return Scaffold(
        appBar: AppBar(title: Text(l10n.myTasks)),
        body: const Center(child: CircularProgressIndicator()),
      );
    }
    if (_task == null) {
      return Scaffold(
        appBar: AppBar(title: Text(l10n.myTasks)),
        body: const Center(child: Text('Task not found')),
      );
    }

    final task = _task!;
    final cat = categoryById(task.categoryId);

    return Scaffold(
      appBar: AppBar(
        title: Text(task.title),
        actions: [
          if (task.assignedTaskerId != null)
            IconButton(
              icon: const Icon(Icons.chat),
              onPressed: _openChat,
            ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (cat != null) Chip(label: Text(cat.name(l10n.isAmharic))),
            const SizedBox(height: 8),
            Text(task.description, style: Theme.of(context).textTheme.bodyLarge),
            const SizedBox(height: 8),
            Text(EtbFormat.format(task.budgetEtb), style: Theme.of(context).textTheme.titleMedium),
            if (task.addressLabel != null) Text(task.addressLabel!, style: Theme.of(context).textTheme.bodySmall),
            if (_error.isNotEmpty) Padding(
              padding: const EdgeInsets.only(top: 16),
              child: Text(_error, style: TextStyle(color: Theme.of(context).colorScheme.error)),
            ),
            const SizedBox(height: 24),
            Text(l10n.isAmharic ? 'ዋጋ ስጦታዎች' : 'Bids', style: Theme.of(context).textTheme.titleMedium),
            ..._bids.map((b) => ListTile(
                  title: Text(EtbFormat.format(b.amountEtb)),
                  subtitle: Text(b.message),
                  trailing: isClient && task.status == 'open'
                      ? ElevatedButton(
                          onPressed: () => _acceptBid(b),
                          child: Text(l10n.isAmharic ? 'ተቀበል' : 'Accept'),
                        )
                      : null,
                )),
            if (!isClient && task.status == 'open') ...[
              const SizedBox(height: 16),
              if (!_showBidForm)
                ElevatedButton(
                  onPressed: () => setState(() => _showBidForm = true),
                  child: Text(l10n.bid),
                )
              else ...[
                TextField(
                  controller: _bidAmountController,
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(labelText: l10n.budget),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _bidMessageController,
                  maxLines: 2,
                  decoration: InputDecoration(labelText: l10n.message),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    ElevatedButton(onPressed: _submitBid, child: Text(l10n.submit)),
                    const SizedBox(width: 8),
                    TextButton(
                      onPressed: () => setState(() => _showBidForm = false),
                      child: Text(l10n.cancel),
                    ),
                  ],
                ),
              ],
            ],
            if (isClient && task.status == 'assigned') ...[
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: _markComplete,
                icon: const Icon(Icons.check),
                label: Text(l10n.completeTask),
              ),
            ],
            if (task.status == 'completed' && isClient) ...[
              const SizedBox(height: 16),
              OutlinedButton.icon(
                onPressed: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => PaymentScreen(taskId: task.id),
                    ),
                  );
                },
                icon: const Icon(Icons.payment),
                label: Text(l10n.releasePayment),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
