import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../config/theme.dart';
import '../../providers/app_provider.dart';
import '../../models/models.dart';
import '../../widgets/user_avatar.dart';

class EventsScreen extends StatefulWidget {
  const EventsScreen({super.key});
  @override
  State<EventsScreen> createState() => _EventsScreenState();
}

class _EventsScreenState extends State<EventsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AppProvider>().loadEvents();
    });
  }

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Events'),
        actions: [
          IconButton(icon: const Icon(Icons.add), onPressed: () => _showCreateEventSheet(context)),
        ],
      ),
      body: app.events.isEmpty
          ? const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.event_outlined, size: 64, color: AppTheme.textMuted),
                  SizedBox(height: 16),
                  Text('No events yet', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: AppTheme.textSecondary)),
                  SizedBox(height: 6),
                  Text('Events will appear here', style: TextStyle(color: AppTheme.textMuted)),
                ],
              ),
            )
          : RefreshIndicator(
              onRefresh: () => app.loadEvents(),
              child: ListView.builder(
                padding: const EdgeInsets.all(12),
                itemCount: app.events.length,
                itemBuilder: (context, index) => _buildEventCard(context, app.events[index]),
              ),
            ),
    );
  }

  Widget _buildEventCard(BuildContext context, EventModel event) {
    final date = DateTime.tryParse(event.dateTime);
    final dateStr = date != null ? DateFormat('EEE, MMM d · h:mm a').format(date) : event.dateTime;
    final isPast = date != null && date.isBefore(DateTime.now());

    return GestureDetector(
      onTap: () => context.push('/event/${event.id}'),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: AppTheme.cardDark,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppTheme.borderDark),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (event.thumbnail != null)
              ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(14)),
                child: CachedNetworkImage(
                  imageUrl: event.thumbnail!,
                  width: double.infinity,
                  height: 140,
                  fit: BoxFit.cover,
                  placeholder: (_, __) => Container(height: 140, color: AppTheme.cardDarkElevated),
                ),
              ),
            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: isPast ? AppTheme.textMuted.withValues(alpha: 0.2) : AppTheme.primaryColor.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          isPast ? 'Past' : 'Upcoming',
                          style: TextStyle(fontSize: 11, color: isPast ? AppTheme.textMuted : AppTheme.primaryColor, fontWeight: FontWeight.w600),
                        ),
                      ),
                      const Spacer(),
                      Text(dateStr, style: const TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(event.title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600)),
                  if (event.description != null) ...[
                    const SizedBox(height: 4),
                    Text(event.description!, style: const TextStyle(color: AppTheme.textMuted, fontSize: 13), maxLines: 2, overflow: TextOverflow.ellipsis),
                  ],
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      if (event.creator != null) ...[
                        UserAvatar(imageUrl: event.creator!.avatarUrlOrDefault, size: 22, fallbackName: event.creator!.displayName),
                        const SizedBox(width: 6),
                        Text(event.creator!.displayName, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12)),
                      ],
                      const Spacer(),
                      Icon(Icons.people_outline, size: 14, color: AppTheme.textMuted),
                      const SizedBox(width: 4),
                      Text('${event.goingCount} going', style: const TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showCreateEventSheet(BuildContext context) {
    final titleController = TextEditingController();
    final descController = TextEditingController();
    final meetLinkController = TextEditingController();
    DateTime? selectedDate;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => Padding(
          padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
          child: Container(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Create Event', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
                const SizedBox(height: 16),
                TextField(controller: titleController, decoration: const InputDecoration(labelText: 'Event Title *', prefixIcon: Icon(Icons.event))),
                const SizedBox(height: 12),
                TextField(controller: descController, maxLines: 2, decoration: const InputDecoration(labelText: 'Description')),
                const SizedBox(height: 12),
                GestureDetector(
                  onTap: () async {
                    final date = await showDatePicker(context: ctx, initialDate: DateTime.now().add(const Duration(days: 1)), firstDate: DateTime.now(), lastDate: DateTime.now().add(const Duration(days: 365)));
                    if (date != null) {
                      final time = await showTimePicker(context: ctx, initialTime: TimeOfDay.now());
                      if (time != null) {
                        setSheetState(() => selectedDate = DateTime(date.year, date.month, date.day, time.hour, time.minute));
                      }
                    }
                  },
                  child: InputDecorator(
                    decoration: const InputDecoration(labelText: 'Date & Time *', prefixIcon: Icon(Icons.calendar_today)),
                    child: Text(
                      selectedDate != null ? DateFormat('EEE, MMM d · h:mm a').format(selectedDate!) : 'Select date and time',
                      style: TextStyle(color: selectedDate != null ? AppTheme.textPrimary : AppTheme.textMuted),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(controller: meetLinkController, decoration: const InputDecoration(labelText: 'Meeting Link (optional)', prefixIcon: Icon(Icons.link))),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: titleController.text.trim().isEmpty || selectedDate == null ? null : () async {
                      await context.read<AppProvider>().eventService.createEvent(
                        title: titleController.text.trim(),
                        description: descController.text.trim().isNotEmpty ? descController.text.trim() : null,
                        dateTime: selectedDate!.toIso8601String(),
                        meetLink: meetLinkController.text.trim().isNotEmpty ? meetLinkController.text.trim() : null,
                      );
                      await context.read<AppProvider>().loadEvents();
                      if (ctx.mounted) Navigator.pop(ctx);
                    },
                    child: const Text('Create Event'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
