import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/task_model.dart';
import '../models/bid_model.dart';
import '../utils/offline_sync.dart';

/// Firestore CRUD for tasks and bids; offline cache on read.
class TaskService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  CollectionReference<Map<String, dynamic>> get _tasks =>
      _firestore.collection('tasks');
  CollectionReference<Map<String, dynamic>> get _bids =>
      _firestore.collection('bids');

  Future<String> createTask(TaskModel task) async {
    final ref = _tasks.doc(task.id);
    await ref.set(task.toMap());
    OfflineSync.cacheTask(task.id, task.toMap());
    return task.id;
  }

  Future<void> updateTask(TaskModel task) async {
    await _tasks.doc(task.id).update({
      ...task.toMap(),
      'updatedAt': DateTime.now().toIso8601String(),
    });
    OfflineSync.cacheTask(task.id, task.toMap());
  }

  Future<TaskModel?> getTask(String id) async {
    try {
      final doc = await _tasks.doc(id).get();
      if (doc.exists && doc.data() != null) {
        final task = TaskModel.fromMap({...doc.data()!, 'id': doc.id});
        OfflineSync.cacheTask(id, task.toMap());
        return task;
      }
    } catch (_) {}
    return OfflineSync.getCachedTask(id) != null
        ? TaskModel.fromMap(OfflineSync.getCachedTask(id)!)
        : null;
  }

  Stream<DocumentSnapshot<Map<String, dynamic>>> watchTask(String id) {
    return _tasks.doc(id).snapshots();
  }

  /// List tasks (optionally by category, location bounds). Cache for offline.
  Future<List<TaskModel>> listTasks({
    String? categoryId,
    int limit = 50,
  }) async {
    try {
      Query<Map<String, dynamic>> q = _tasks
          .where('status', isEqualTo: 'open')
          .orderBy('createdAt', descending: true)
          .limit(limit);
      if (categoryId != null && categoryId.isNotEmpty) {
        q = q.where('categoryId', isEqualTo: categoryId);
      }
      final snap = await q.get();
      final list = <TaskModel>[];
      for (final doc in snap.docs) {
        final task = TaskModel.fromMap({...doc.data(), 'id': doc.id});
        list.add(task);
        OfflineSync.cacheTask(doc.id, task.toMap());
      }
      return list;
    } catch (_) {
      return OfflineSync.getAllCachedTasks().map(TaskModel.fromMap).toList();
    }
  }

  Future<List<TaskModel>> listTasksByClient(String clientId) async {
    try {
      final snap = await _tasks
          .where('clientId', isEqualTo: clientId)
          .orderBy('createdAt', descending: true)
          .get();
      return snap.docs
          .map((d) => TaskModel.fromMap({...d.data(), 'id': d.id}))
          .toList();
    } catch (_) {
      return [];
    }
  }

  Future<void> createBid(BidModel bid) async {
    await _bids.doc(bid.id).set(bid.toMap());
  }

  Future<List<BidModel>> getBidsForTask(String taskId) async {
    try {
      final snap = await _bids
          .where('taskId', isEqualTo: taskId)
          .orderBy('createdAt', descending: true)
          .get();
      return snap.docs
          .map((d) => BidModel.fromMap({...d.data(), 'id': d.id}))
          .toList();
    } catch (_) {
      return [];
    }
  }

  Future<void> acceptBid(String taskId, String bidId, String taskerId) async {
    final batch = _firestore.batch();
    batch.update(_tasks.doc(taskId), {
      'status': 'assigned',
      'assignedTaskerId': taskerId,
      'updatedAt': DateTime.now().toIso8601String(),
    });
    batch.update(_bids.doc(bidId), {
      'status': 'accepted',
      'updatedAt': DateTime.now().toIso8601String(),
    });
    await batch.commit();
  }
}
