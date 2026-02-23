import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../services/auth_service.dart';
import '../../utils/app_localizations.dart';
import 'post_task_tab.dart';
import 'browse_tasks_tab.dart';
import 'my_tasks_tab.dart';
import '../auth/login_register_screen.dart';
import '../profile/profile_edit_screen.dart';

class HomeDashboard extends StatefulWidget {
  const HomeDashboard({super.key});

  @override
  State<HomeDashboard> createState() => _HomeDashboardState();
}

class _HomeDashboardState extends State<HomeDashboard> {
  int _index = 0;
  final AuthService _auth = AuthService();

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final tabs = [
      PostTaskTab(key: ValueKey('post')),
      BrowseTasksTab(key: ValueKey('browse')),
      MyTasksTab(key: ValueKey('mytasks')),
      _ProfileTab(auth: _auth),
    ];
    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.appName),
        actions: [
          IconButton(
            icon: const Icon(Icons.emergency),
            tooltip: l10n.sos,
            onPressed: () async {
              final uri = Uri(scheme: 'tel', path: '911');
              if (await canLaunchUrl(uri)) await launchUrl(uri);
            },
          ),
        ],
      ),
      body: IndexedStack(
        index: _index,
        children: tabs,
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        destinations: [
          NavigationDestination(
            icon: const Icon(Icons.add_circle_outline),
            selectedIcon: const Icon(Icons.add_circle),
            label: l10n.postTask,
          ),
          NavigationDestination(
            icon: const Icon(Icons.list_alt),
            selectedIcon: const Icon(Icons.list),
            label: l10n.browseTasks,
          ),
          NavigationDestination(
            icon: const Icon(Icons.assignment_outlined),
            selectedIcon: const Icon(Icons.assignment),
            label: l10n.myTasks,
          ),
          NavigationDestination(
            icon: const Icon(Icons.person_outline),
            selectedIcon: const Icon(Icons.person),
            label: l10n.profile,
          ),
        ],
      ),
    );
  }
}

class _ProfileTab extends StatelessWidget {
  final AuthService auth;

  const _ProfileTab({required this.auth});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final user = auth.currentUser;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          const SizedBox(height: 24),
          if (user != null) ...[
            ListTile(
              leading: CircleAvatar(
                child: Text((user.displayName ?? user.email ?? '?').substring(0, 1).toUpperCase()),
              ),
              title: Text(user.displayName ?? user.email ?? ''),
              subtitle: user.email != null ? Text(user.email!) : null,
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: () {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => ProfileEditScreen()),
                );
              },
              icon: const Icon(Icons.edit),
              label: Text(l10n.profile),
            ),
            const SizedBox(height: 16),
            OutlinedButton.icon(
              onPressed: () async {
                await auth.signOut();
                if (context.mounted) {
                  Navigator.of(context).pushAndRemoveUntil(
                    MaterialPageRoute(builder: (_) => const LoginRegisterScreen()),
                    (r) => false,
                  );
                }
              },
              icon: const Icon(Icons.logout),
              label: Text(l10n.logout),
            ),
          ],
        ],
      ),
    );
  }
}
