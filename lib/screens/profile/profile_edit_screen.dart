import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:image_picker/image_picker.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'dart:io';
import '../../services/auth_service.dart';
import '../../models/user_model.dart';
import '../../utils/app_localizations.dart';
import '../../utils/task_categories.dart';

class ProfileEditScreen extends StatefulWidget {
  const ProfileEditScreen({super.key});

  @override
  State<ProfileEditScreen> createState() => _ProfileEditScreenState();
}

class _ProfileEditScreenState extends State<ProfileEditScreen> {
  final AuthService _auth = AuthService();
  final _nameController = TextEditingController();
  final _bioController = TextEditingController();
  UserModel? _user;
  String? _photoUrl;
  bool _isTasker = false;
  List<String> _skills = [];
  bool _isAvailable = true;
  bool _loading = true;
  String _error = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _bioController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    final uid = FirebaseAuth.instance.currentUser?.uid;
    if (uid == null) {
      setState(() => _loading = false);
      return;
    }
    final user = await _auth.getUserProfile(uid);
    if (mounted && user != null) {
      setState(() {
        _user = user;
        _nameController.text = user.displayName ?? '';
        _bioController.text = user.bio ?? '';
        _photoUrl = user.photoUrl;
        _isTasker = user.isTasker;
        _skills = List.from(user.skills);
        _isAvailable = user.isAvailable;
        _loading = false;
      });
    } else if (mounted) {
      setState(() => _loading = false);
    }
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final x = await picker.pickImage(source: ImageSource.gallery);
    if (x == null || !mounted || _user == null) return;
    setState(() => _loading = true);
    try {
      final ref = FirebaseStorage.instance
          .ref()
          .child('profiles')
          .child('${_user!.id}.jpg');
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
    if (_user == null) return;
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
      final updated = _user!.copyWith(
        displayName: name,
        bio: _bioController.text.trim().isEmpty ? null : _bioController.text.trim(),
        photoUrl: _photoUrl ?? _user!.photoUrl,
        isTasker: _isTasker,
        skills: _skills,
        isAvailable: _isAvailable,
        updatedAt: DateTime.now(),
      );
      await _auth.setUserProfile(updated);
      if (!mounted) return;
      Navigator.of(context).pop();
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

    if (_loading && _user == null) {
      return Scaffold(
        appBar: AppBar(title: Text(l10n.profile)),
        body: const Center(child: CircularProgressIndicator()),
      );
    }
    if (_user == null) {
      return Scaffold(
        appBar: AppBar(title: Text(l10n.profile)),
        body: const Center(child: Text('Profile not found')),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.profile),
        actions: [
          TextButton(
            onPressed: _loading ? null : _save,
            child: Text(l10n.save),
          ),
        ],
      ),
      body: SingleChildScrollView(
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
              decoration: InputDecoration(labelText: l10n.isAmharic ? 'ስም' : 'Display Name'),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _bioController,
              maxLines: 2,
              decoration: InputDecoration(labelText: l10n.bio),
            ),
            const SizedBox(height: 16),
            SwitchListTile(
              title: Text(l10n.isAmharic ? 'ተግባር ሠራተኛ' : 'I am a Tasker'),
              value: _isTasker,
              onChanged: (v) => setState(() => _isTasker = v),
            ),
            if (_isTasker)
              SwitchListTile(
                title: Text(l10n.isAmharic ? 'ገኝነት አለኝ' : 'Available'),
                value: _isAvailable,
                onChanged: (v) => setState(() => _isAvailable = v),
              ),
            if (_isTasker) ...[
              const SizedBox(height: 8),
              Text(l10n.isAmharic ? 'ችሎታዎች' : 'Skills'),
              Wrap(
                spacing: 8,
                children: taskCategories.map((c) {
                  final selected = _skills.contains(c.id);
                  return FilterChip(
                    label: Text(c.name(l10n.isAmharic)),
                    selected: selected,
                    onSelected: (v) {
                      setState(() {
                        if (v) _skills.add(c.id); else _skills.remove(c.id);
                      });
                    },
                  );
                }).toList(),
              ),
            ],
            if (_user!.averageRating != null) ...[
              const SizedBox(height: 16),
              Text('${l10n.rating}: ${_user!.averageRating!.toStringAsFixed(1)} (${_user!.totalReviews ?? 0} ${l10n.isAmharic ? 'ግምገማ' : 'reviews'})'),
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
    );
  }
}
