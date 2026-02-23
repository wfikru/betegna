import 'package:flutter/material.dart';
import '../../services/payment_service.dart';
import '../../services/rating_service.dart';
import '../../models/task_model.dart';
import '../../services/task_service.dart';
import '../../utils/app_localizations.dart';
import '../../utils/etb_format.dart';

/// Escrow release (simulated); optional rate tasker after.
class PaymentScreen extends StatefulWidget {
  final String taskId;

  const PaymentScreen({super.key, required this.taskId});

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  final PaymentService _payment = PaymentService();
  final TaskService _taskService = TaskService();
  final RatingService _rating = RatingService();
  Map<String, dynamic>? _escrow;
  TaskModel? _task;
  bool _loading = true;
  bool _released = false;
  int _ratingValue = 0;
  bool _rated = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final escrow = await _payment.getEscrow(widget.taskId);
    final task = await _taskService.getTask(widget.taskId);
    if (mounted) setState(() {
      _escrow = escrow;
      _task = task;
      _loading = false;
    });
  }

  Future<void> _release() async {
    setState(() => _loading = true);
    try {
      await _payment.releasePayment(widget.taskId);
      if (mounted) setState(() {
        _released = true;
        _loading = false;
      });
      _load();
    } catch (e) {
      if (mounted) setState(() {
        _loading = false;
      });
    }
  }

  Future<void> _submitRating() async {
    if (_task?.assignedTaskerId == null || _ratingValue < 1) return;
    setState(() => _loading = true);
    try {
      await _rating.submitRating(
        taskId: widget.taskId,
        taskerId: _task!.assignedTaskerId!,
        clientId: _task!.clientId,
        rating: _ratingValue,
      );
      if (mounted) setState(() {
        _rated = true;
        _loading = false;
      });
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    if (_loading && _escrow == null) {
      return Scaffold(
        appBar: AppBar(title: Text(l10n.pay)),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    final amount = (_escrow?['amountEtb'] as num?)?.toDouble() ?? 0;
    final status = _escrow?['status'] as String? ?? '';

    return Scaffold(
      appBar: AppBar(title: Text(l10n.pay)),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  children: [
                    Text(l10n.isAmharic ? 'የክፍያ ሁኔታ' : 'Payment status', style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 8),
                    Text(EtbFormat.format(amount), style: Theme.of(context).textTheme.headlineSmall),
                    const SizedBox(height: 8),
                    Text(status, style: Theme.of(context).textTheme.bodyMedium),
                  ],
                ),
              ),
            ),
            if (status == 'held') ...[
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _loading ? null : _release,
                child: _loading
                    ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(strokeWidth: 2))
                    : Text(l10n.releasePayment),
              ),
            ],
            if (_released || status == 'released') ...[
              const SizedBox(height: 24),
              Text(l10n.rateTasker, style: Theme.of(context).textTheme.titleMedium),
              if (!_rated) ...[
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(5, (i) {
                    final star = i + 1;
                    return IconButton(
                      icon: Icon(_ratingValue >= star ? Icons.star : Icons.star_border),
                      onPressed: () => setState(() => _ratingValue = star),
                    );
                  }),
                ),
                ElevatedButton(
                  onPressed: _ratingValue < 1 ? null : _submitRating,
                  child: Text(l10n.save),
                ),
              ] else
                Padding(
                  padding: const EdgeInsets.only(top: 16),
                  child: Text(l10n.isAmharic ? 'አመሰግናለሁ!' : 'Thanks for rating!'),
                ),
            ],
          ],
        ),
      ),
    );
  }
}
