import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:image_picker/image_picker.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:geolocator/geolocator.dart';
import 'dart:io';
import 'package:uuid/uuid.dart';
import '../../models/task_model.dart';
import '../../services/task_service.dart';
import '../../utils/app_localizations.dart';
import '../../utils/task_categories.dart';

class TaskCreationScreen extends StatefulWidget {
  final bool testModeBypass;
  const TaskCreationScreen({super.key, this.testModeBypass = false});

  @override
  State<TaskCreationScreen> createState() => _TaskCreationScreenState();
}

class _TaskCreationScreenState extends State<TaskCreationScreen> {
  final TaskService _taskService = TaskService();
  final _titleController = TextEditingController();
  final _descController = TextEditingController();
  final _budgetController = TextEditingController();
  String _categoryId = taskCategories.first.id;
  double? _latitude;
  double? _longitude;
  String? _addressLabel;
  List<String> _photoUrls = [];
  bool _loading = false;
  String _error = '';
  
  // TEST MODE: Use a mock user ID when in test bypass mode
  static const String _testModeUserId = 'test-user-12345';

  @override
  void dispose() {
    _titleController.dispose();
    _descController.dispose();
    _budgetController.dispose();
    super.dispose();
  }

  Future<void> _pickLocation() async {
    final permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      final req = await Geolocator.requestPermission();
      if (req == LocationPermission.denied || req == LocationPermission.deniedForever) {
        setState(() => _error = 'Location permission needed');
        return;
      }
    }
    setState(() => _loading = true);
    try {
      final pos = await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.medium);
      if (mounted) setState(() {
        _latitude = pos.latitude;
        _longitude = pos.longitude;
        _addressLabel = '${pos.latitude.toStringAsFixed(4)}, ${pos.longitude.toStringAsFixed(4)}';
        _loading = false;
      });
    } catch (e) {
      if (mounted) setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final x = await picker.pickImage(source: ImageSource.gallery);
    if (x == null || !mounted) return;
    setState(() => _loading = true);
    try {
      final uid = FirebaseAuth.instance.currentUser?.uid ?? 'anon';
      final ref = FirebaseStorage.instance.ref().child('tasks').child('${const Uuid().v4()}.jpg');
      await ref.putFile(File(x.path));
      final url = await ref.getDownloadURL();
      if (mounted) setState(() {
        _photoUrls.add(url);
        _loading = false;
      });
    } catch (e) {
      if (mounted) setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  Future<void> _submit() async {
    final title = _titleController.text.trim();
    final desc = _descController.text.trim();
    final budgetStr = _budgetController.text.trim();
    if (title.isEmpty) {
      setState(() => _error = 'Title required');
      return;
    }
    final budget = double.tryParse(budgetStr) ?? 0;
    if (budget <= 0) {
      setState(() => _error = 'Valid budget (ETB) required');
      return;
    }
    final uid = FirebaseAuth.instance.currentUser?.uid;
    if (uid == null) {
      // TEST MODE: Allow submission with mock user ID if in test bypass mode
      if (!widget.testModeBypass) {
        setState(() => _error = 'Not logged in');
        return;
      }
      // Use mock user ID for testing
      debugPrint('TEST_MODE_BYPASS: Using mock user ID for task creation');
    }
    setState(() {
      _loading = true;
      _error = '';
    });
    try {
      // Use actual user ID or mock ID for testing
      final finalUid = uid ?? _testModeUserId;
      final task = TaskModel(
        id: const Uuid().v4(),
        clientId: finalUid,
        title: title,
        description: desc,
        categoryId: _categoryId,
        budgetEtb: budget,
        latitude: _latitude,
        longitude: _longitude,
        addressLabel: _addressLabel,
        photoUrls: _photoUrls,
        status: 'open',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      await _taskService.createTask(task);
      if (!mounted) return;
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(AppLocalizations.of(context).isAmharic ? 'ተግባር ቀረበ' : 'Task posted')),
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
      appBar: AppBar(title: Text(l10n.postTask)),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextField(
                controller: _titleController,
                decoration: InputDecoration(labelText: l10n.isAmharic ? 'ርዕስ' : 'Title'),
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: _categoryId,
                decoration: InputDecoration(labelText: l10n.category),
                items: taskCategories.map((c) => DropdownMenuItem(value: c.id, child: Text(c.name(l10n.isAmharic)))).toList(),
                onChanged: (v) => setState(() => _categoryId = v ?? taskCategories.first.id),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _descController,
                maxLines: 3,
                decoration: InputDecoration(labelText: l10n.description),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _budgetController,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(labelText: l10n.budget, hintText: '500'),
              ),
              const SizedBox(height: 16),
              OutlinedButton.icon(
                onPressed: _loading ? null : _pickLocation,
                icon: const Icon(Icons.location_on),
                label: Text(l10n.selectLocation),
              ),
              if (_addressLabel != null) Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(_addressLabel!, style: Theme.of(context).textTheme.bodySmall),
              ),
              const SizedBox(height: 16),
              OutlinedButton.icon(
                onPressed: _loading ? null : _pickImage,
                icon: const Icon(Icons.photo),
                label: Text(l10n.isAmharic ? 'ፎቶ ጫን' : 'Add photo'),
              ),
              if (_photoUrls.isNotEmpty)
                SizedBox(
                  height: 80,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    itemCount: _photoUrls.length,
                    itemBuilder: (_, i) => Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: Image.network(_photoUrls[i], width: 80, height: 80, fit: BoxFit.cover),
                    ),
                  ),
                ),
              if (_error.isNotEmpty) ...[
                const SizedBox(height: 16),
                Text(_error, style: TextStyle(color: Theme.of(context).colorScheme.error)),
              ],
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _loading ? null : _submit,
                child: _loading ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(strokeWidth: 2)) : Text(l10n.submit),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
