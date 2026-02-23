import 'package:flutter/material.dart';
import '../../utils/app_localizations.dart';
import '../task/task_creation_screen.dart';

class PostTaskTab extends StatelessWidget {
  const PostTaskTab({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.add_task, size: 80, color: Theme.of(context).colorScheme.primary),
            const SizedBox(height: 24),
            Text(
              l10n.postTask,
              style: Theme.of(context).textTheme.headlineSmall,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              l10n.isAmharic ? 'ተግባር ይለጥፉ እና ባለሙያ ያግኙ' : 'Post a task and find a tasker',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyLarge,
            ),
            const SizedBox(height: 32),
            ElevatedButton.icon(
              onPressed: () {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const TaskCreationScreen()),
                );
              },
              icon: const Icon(Icons.add),
              label: Text(l10n.postTask),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 32),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
