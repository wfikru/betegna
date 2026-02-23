import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../../models/task_model.dart';
import '../../utils/task_categories.dart';
import '../task/task_detail_screen.dart';

class TasksMapView extends StatelessWidget {
  final List<TaskModel> tasks;

  const TasksMapView({super.key, required this.tasks});

  @override
  Widget build(BuildContext context) {
    // Default: Addis Ababa
    final center = LatLng(9.0320, 38.7469);
    final markers = <Marker>[];
    for (final task in tasks) {
      if (task.latitude != null && task.longitude != null) {
        markers.add(
          Marker(
            point: LatLng(task.latitude!, task.longitude!),
            width: 40,
            height: 40,
            child: GestureDetector(
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => TaskDetailScreen(taskId: task.id),
                  ),
                );
              },
              child: const Icon(Icons.place, color: Colors.green, size: 40),
            ),
          ),
        );
      }
    }
    return FlutterMap(
      options: MapOptions(
        initialCenter: center,
        initialZoom: 12,
        interactionOptions: const InteractionOptions(flags: InteractiveFlag.all),
      ),
      children: [
        TileLayer(
          urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          userAgentPackageName: 'com.betegna.betegna',
        ),
        MarkerLayer(markers: markers),
      ],
    );
  }
}
