import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../models/task_model.dart';
import '../../services/task_service.dart';
import '../../utils/app_localizations.dart';
import '../../utils/etb_format.dart';
import '../../utils/task_categories.dart';
import '../task/task_detail_screen.dart';
import 'tasks_map_view.dart';

class BrowseTasksTab extends StatefulWidget {
  const BrowseTasksTab({super.key});

  @override
  State<BrowseTasksTab> createState() => _BrowseTasksTabState();
}

class _BrowseTasksTabState extends State<BrowseTasksTab> {
  final TaskService _taskService = TaskService();
  List<TaskModel> _tasks = [];
  String? _categoryId;
  bool _loading = true;
  bool _showMap = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final list = await _taskService.listTasks(categoryId: _categoryId);
    if (mounted) setState(() {
      _tasks = list;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              DropdownButton<String>(
                value: _categoryId,
                hint: Text(l10n.category),
                items: [
                  DropdownMenuItem(value: null, child: Text(l10n.isAmharic ? 'ሁሉም' : 'All')),
                  ...taskCategories.map((c) => DropdownMenuItem(
                        value: c.id,
                        child: Text(c.name(l10n.isAmharic)),
                      )),
                ],
                onChanged: (v) {
                  setState(() {
                    _categoryId = v;
                    _load();
                  });
                },
              ),
              const Spacer(),
              IconButton(
                icon: Icon(_showMap ? Icons.list : Icons.map),
                onPressed: () => setState(() => _showMap = !_showMap),
              ),
            ],
          ),
        ),
        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator())
              : _showMap
                  ? TasksMapView(tasks: _tasks)
                  : _tasks.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.inbox_outlined, size: 64, color: Theme.of(context).colorScheme.outline),
                              const SizedBox(height: 16),
                              Text(l10n.noTasks, style: Theme.of(context).textTheme.titleMedium),
                            ],
                          ),
                        )
                      : RefreshIndicator(
                          onRefresh: _load,
                          child: ListView.builder(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
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
                                      Text(EtbFormat.format(task.budgetEtb), style: Theme.of(context).textTheme.titleSmall),
                                    ],
                                  ),
                                  trailing: const Icon(Icons.chevron_right),
                                  onTap: () {
                                    Navigator.of(context).push(
                                      MaterialPageRoute(
                                        builder: (_) => TaskDetailScreen(taskId: task.id),
                                      ),
                                    );
                                  },
                                ),
                              );
                            },
                          ),
                        ),
        ),
      ],
    );
  }
}
