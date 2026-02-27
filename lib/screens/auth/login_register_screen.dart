import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../services/auth_service.dart';
import '../../utils/app_localizations.dart';
import '../home/home_dashboard.dart';
import 'profile_setup_screen.dart';

class LoginRegisterScreen extends StatefulWidget {
  final bool testModeBypass;
  const LoginRegisterScreen({super.key, this.testModeBypass = false});

  @override
  State<LoginRegisterScreen> createState() => _LoginRegisterScreenState();
}

class _LoginRegisterScreenState extends State<LoginRegisterScreen> {
  final AuthService _auth = AuthService();
  bool _loading = false;
  String _error = '';

  @override
  void initState() {
    super.initState();
    // TEST MODE BYPASS: Skip login screen and go directly to home
    if (widget.testModeBypass) {
      debugPrint('TEST_MODE_BYPASS: Skipping login screen, navigating to home');
      Future.microtask(() {
        if (mounted) {
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(builder: (_) => HomeDashboard(testModeBypass: true)),
          );
        }
      });
    }
  }

  Future<void> _signInWithGoogle() async {
    setState(() {
      _loading = true;
      _error = '';
    });
    try {
      final user = await _auth.signInWithGoogle();
      if (!mounted) return;
      if (user == null) {
        setState(() => _loading = false);
        return;
      }
      final profile = await _auth.getUserProfile(user.uid);
      if (!mounted) return;
      if (profile == null || profile.displayName == null || profile.displayName!.isEmpty) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (_) => ProfileSetupScreen(
              uid: user.uid,
              initialDisplayName: user.displayName,
              initialPhotoUrl: user.photoURL,
              testModeBypass: widget.testModeBypass,
            ),
          ),
        );
      } else {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => HomeDashboard(testModeBypass: widget.testModeBypass)),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString().replaceFirst('Exception: ', '');
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Scaffold(
      appBar: AppBar(title: Text(l10n.appName)),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 48),
              Text(
                l10n.login,
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 8),
              Text(
                l10n.isAmharic
                    ? 'በ Google (Gmail) ይግቡ'
                    : 'Sign in with your Google (Gmail) account',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
              ),
              const SizedBox(height: 48),
              ElevatedButton.icon(
                onPressed: _loading ? null : _signInWithGoogle,
                icon: _loading
                    ? const SizedBox(
                        height: 24,
                        width: 24,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Icon(Icons.login, size: 24),
                label: Text(_loading
                    ? (l10n.isAmharic ? 'በማስገባት...' : 'Signing in...')
                    : (l10n.isAmharic ? 'በ Google ግባ' : 'Sign in with Google')),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
              ),
              if (_error.isNotEmpty) ...[
                const SizedBox(height: 24),
                Text(
                  _error,
                  style: TextStyle(color: Theme.of(context).colorScheme.error, fontSize: 14),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
