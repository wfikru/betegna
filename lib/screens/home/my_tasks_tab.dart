import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../models/task_model.dart';
import '../../services/task_service.dart';
import '../../utils/app_localizations.dart';
import '../../utils/etb_format.dart';
import '../../utils/task_categories.dart';
import '../task/task_detail_screen.dart';

class MyTasksTab extends StatefulWidget {
  const MyTasksTab({super.key});

  @override
  State<MyTasksTab> createState() => _MyTasksTabState();
}

class _MyTasksTabState extends State<MyTasksTab> {
  final TaskService _taskService = TaskService();
  List<TaskModel> _tasks = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final uid = FirebaseAuth.instance.currentUser?.uid;
    if (uid == null) {
      setState(() => _loading = false);
      return;
    }
    setState(() => _loading = true);
    final list = await _taskService.listTasksByClient(uid);
    if (mounted) setState(() {
      _tasks = list;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return RefreshIndicator(
      onRefresh: _load,
      child: _loading
          ? const Center(child: CircularProgressIndicator())
          : _tasks.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.assignment_outlined, size: 64, color: Theme.of(context).colorScheme.outline),
                      const SizedBox(height: 16),
                      Text(l10n.noTasks, style: Theme.of(context).textTheme.titleMedium),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _tasks.length,
                  itemBuilder: (context, i) {
                    final task = _tasks[i];
                    final cat = categoryById(task.categoryId);
                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      child: ListTile(
                        contentPadding: const EdgeInsets.all(16),
                        title: Text(task.title),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (cat != null) Text(cat.name(l10n.isAmharic), style: Theme.of(context).textTheme.bodySmall),
                            Text('${EtbFormat.format(task.budgetEtb)} • ${task.status}'),
                          ],
                        ),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => TaskDetailScreen(taskId: task.id),
                            ),
                          ).then((_) => _load());
                        },
                      ),
                    );
                  },
                ),
    );
  }
}
