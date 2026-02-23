import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'dart:io';
import '../../services/auth_service.dart';
import '../../models/user_model.dart';
import '../../utils/app_localizations.dart';
import '../../utils/task_categories.dart';
import '../home/home_dashboard.dart';

class ProfileSetupScreen extends StatefulWidget {
  final String uid;
  final String? initialDisplayName;
  final String? initialPhotoUrl;

  const ProfileSetupScreen({
    super.key,
    required this.uid,
    this.initialDisplayName,
    this.initialPhotoUrl,
  });

  @override
  State<ProfileSetupScreen> createState() => _ProfileSetupScreenState();
}

class _ProfileSetupScreenState extends State<ProfileSetupScreen> {
  final AuthService _auth = AuthService();
  final _nameController = TextEditingController();
  final _bioController = TextEditingController();
  String? _photoUrl;
  bool _isTasker = false;
  List<String> _skills = [];
  bool _loading = false;
  String _error = '';

  @override
  void initState() {
    super.initState();
    _nameController.text = widget.initialDisplayName ?? '';
    _photoUrl = widget.initialPhotoUrl;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _bioController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final x = await picker.pickImage(source: ImageSource.gallery);
    if (x == null || !mounted) return;
    setState(() => _loading = true);
    try {
      final ref = FirebaseStorage.instance
          .ref()
          .child('profiles')
          .child('${widget.uid}.jpg');
      await ref.putFile(File(x.path));
      final url = await ref.getDownloadURL();
      if (mounted) setState(() {
        _photoUrl = url;
        _loading = false;
      });
    } catch (e) {
      if (mounted) setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  Future<void> _save() async {
    final name = _nameController.text.trim();
    if (name.isEmpty) {
      setState(() => _error = 'Name required');
      return;
    }
    setState(() {
      _loading = true;
      _error = '';
    });
    try {
      final user = UserModel(
        id: widget.uid,
        displayName: name,
        bio: _bioController.text.trim().isEmpty ? null : _bioController.text.trim(),
        photoUrl: _photoUrl,
        isTasker: _isTasker,
        skills: _skills,
        isAvailable: true,
        kycVerified: false,
        locale: AppLocalizations.of(context).isAmharic ? 'am' : 'en',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      await _auth.setUserProfile(user);
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const HomeDashboard()),
      );
    } catch (e) {
      if (mounted) setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Scaffold(
      appBar: AppBar(title: Text(l10n.profile)),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: GestureDetector(
                  onTap: _loading ? null : _pickImage,
                  child: CircleAvatar(
                    radius: 48,
                    backgroundImage: _photoUrl != null ? NetworkImage(_photoUrl!) : null,
                    child: _photoUrl == null
                        ? Icon(Icons.add_a_photo, size: 48, color: Theme.of(context).colorScheme.primary)
                        : null,
                  ),
                ),
              ),
              const SizedBox(height: 24),
              TextField(
                controller: _nameController,
                decoration: InputDecoration(
                  labelText: l10n.isAmharic ? 'ስም' : 'Display Name',
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _bioController,
                maxLines: 2,
                decoration: InputDecoration(
                  labelText: l10n.bio,
                  hintText: l10n.isAmharic ? 'አጭር ገለጻ' : 'Short bio',
                ),
              ),
              const SizedBox(height: 16),
              SwitchListTile(
                title: Text(l10n.isAmharic ? 'ተግባር ሠራተኛ ነኝ' : 'I am a Tasker'),
                value: _isTasker,
                onChanged: (v) => setState(() => _isTasker = v),
              ),
              if (_isTasker) ...[
                const SizedBox(height: 8),
                Text(l10n.isAmharic ? 'ችሎታዎች (ምድቦች)' : 'Skills (categories)'),
                Wrap(
                  spacing: 8,
                  children: taskCategories.map((c) {
                    final id = c.id;
                    final selected = _skills.contains(id);
                    return FilterChip(
                      label: Text(c.name(l10n.isAmharic)),
                      selected: selected,
                      onSelected: (v) {
                        setState(() {
                          if (v) _skills.add(id); else _skills.remove(id);
                        });
                      },
                    );
                  }).toList(),
                ),
              ],
              if (_error.isNotEmpty) ...[
                const SizedBox(height: 16),
                Text(_error, style: TextStyle(color: Theme.of(context).colorScheme.error)),
              ],
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _loading ? null : _save,
                child: _loading
                    ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(strokeWidth: 2))
                    : Text(l10n.save),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
