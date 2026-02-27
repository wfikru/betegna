import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../services/auth_service.dart';
import '../utils/app_localizations.dart';
import 'auth/login_register_screen.dart';
import 'home/home_dashboard.dart';

class SplashScreen extends StatefulWidget {
  final bool testModeBypass;
  const SplashScreen({super.key, this.testModeBypass = false});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  final AuthService _auth = AuthService();

  @override
  void initState() {
    super.initState();
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    await Future.delayed(const Duration(milliseconds: 1500));
    if (!mounted) return;
    
    // TEST MODE BYPASS: Skip login if testModeBypass is enabled
    if (widget.testModeBypass) {
      debugPrint('TEST_MODE_BYPASS: Skipping authentication, navigating to home');
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => HomeDashboard(testModeBypass: true)),
      );
      return;
    }
    
    final user = _auth.currentUser;
    if (user != null) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const HomeDashboard()),
      );
    } else {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => LoginRegisterScreen(testModeBypass: widget.testModeBypass)),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Scaffold(
      body: Container(
        width: double.infinity,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Theme.of(context).colorScheme.primary,
              Theme.of(context).colorScheme.primary.withOpacity(0.8),
            ],
          ),
        ),
        child: SafeArea(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const SizedBox(height: 48),
              Text(
                l10n.appName,
                style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 24),
              const CircularProgressIndicator(color: Colors.white),
              const Spacer(),
              Text(
                'Task platform for Ethiopia',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.white70,
                    ),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}
