import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../config/theme.dart';
import '../../providers/app_provider.dart';
import '../../providers/auth_provider.dart';
import '../../models/models.dart';
import '../../widgets/user_avatar.dart';

class EventDetailScreen extends StatefulWidget {
  final int eventId;
  const EventDetailScreen({super.key, required this.eventId});
  @override
  State<EventDetailScreen> createState() => _EventDetailScreenState();
}

class _EventDetailScreenState extends State<EventDetailScreen> {
  EventModel? _event;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadEvent();
  }

  Future<void> _loadEvent() async {
    final event = await context.read<AppProvider>().eventService.getEvent(widget.eventId);
    setState(() { _event = event; _isLoading = false; });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    final userId = context.read<AuthProvider>().userId ?? '';

    return Scaffold(
      appBar: AppBar(title: const Text('Event')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _event == null
              ? const Center(child: Text('Event not found'))
              : SingleChildScrollView(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Thumbnail
                      if (_event!.thumbnail != null)
                        CachedNetworkImage(
                          imageUrl: _event!.thumbnail!,
                          width: double.infinity,
                          height: 200,
                          fit: BoxFit.cover,
                          placeholder: (_, __) => Container(height: 200, color: colorScheme.surfaceContainerHighest),
                          errorWidget: (_, __, ___) => Container(height: 200, color: colorScheme.surfaceContainerHighest, child: Icon(Icons.event, size: 48, color: colorScheme.onSurface.withValues(alpha: 0.4))),
                        )
                      else
                        Container(
                          width: double.infinity,
                          height: 160,
                          decoration: BoxDecoration(
                            gradient: LinearGradient(colors: [colorScheme.primary.withValues(alpha: 0.3), theme.scaffoldBackgroundColor]),
                          ),
                          child: Center(child: Icon(Icons.event, size: 48, color: colorScheme.primary)),
                        ),

                      Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(_event!.title, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700)),
                            const SizedBox(height: 12),

                            // Date & time
                            _infoRow(
                              Icons.calendar_today,
                              _formatDateTime(_event!.dateTime),
                            ),
                            const SizedBox(height: 8),

                            // Creator
                            if (_event!.creator != null)
                              _infoRow(
                                Icons.person_outline,
                                'Organized by ${_event!.creator!.displayName}',
                              ),
                            const SizedBox(height: 8),

                            // RSVP counts
                            _infoRow(
                              Icons.people_outline,
                              '${_event!.goingCount} going · ${_event!.interestedCount} interested',
                            ),

                            // Meet link
                            if (_event!.meetLink != null) ...[
                              const SizedBox(height: 8),
                              GestureDetector(
                                onTap: () async {
                                  final uri = Uri.parse(_event!.meetLink!);
                                  if (await canLaunchUrl(uri)) {
                                    await launchUrl(uri, mode: LaunchMode.externalApplication);
                                  }
                                },
                                child: _infoRow(Icons.link, _event!.meetLink!, color: colorScheme.primary),
                              ),
                            ],

                            const SizedBox(height: 16),

                            // Description
                            if (_event!.description != null && _event!.description!.isNotEmpty) ...[
                              const Text('About', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                              const SizedBox(height: 8),
                              Text(_event!.description!, style: TextStyle(fontSize: 14, height: 1.5, color: colorScheme.onSurface.withValues(alpha: 0.7))),
                              const SizedBox(height: 16),
                            ],

                            // RSVP Buttons
                            const Text('Are you going?', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                Expanded(
                                  child: _rsvpButton('going', 'Going', Icons.check_circle_outline, userId),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: _rsvpButton('interested', 'Interested', Icons.star_outline, userId),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: _rsvpButton('not_going', 'Can\'t Go', Icons.cancel_outlined, userId),
                                ),
                              ],
                            ),

                            // Attendees
                            if (_event!.rsvps.isNotEmpty) ...[
                              const SizedBox(height: 24),
                              const Text('Attendees', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                              const SizedBox(height: 12),
                              ...(_event!.rsvps.where((r) => r.status == 'going').take(10).map((rsvp) {
                                return Padding(
                                  padding: const EdgeInsets.only(bottom: 8),
                                  child: Row(
                                    children: [
                                      UserAvatar(imageUrl: rsvp.user?.avatarUrlOrDefault, size: 36, fallbackName: rsvp.user?.displayName),
                                      const SizedBox(width: 10),
                                      Expanded(
                                        child: Text(rsvp.user?.displayName ?? 'Unknown', style: const TextStyle(fontWeight: FontWeight.w500)),
                                      ),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: AppTheme.successColor.withValues(alpha: 0.1),
                                          borderRadius: BorderRadius.circular(12),
                                        ),
                                        child: Text(rsvp.status, style: const TextStyle(fontSize: 11, color: AppTheme.successColor)),
                                      ),
                                    ],
                                  ),
                                );
                              })),
                            ],
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
    );
  }

  Widget _infoRow(IconData icon, String text, {Color? color}) {
    final colorScheme = Theme.of(context).colorScheme;

    return Row(
      children: [
        Icon(icon, size: 18, color: color ?? colorScheme.onSurface.withValues(alpha: 0.4)),
        const SizedBox(width: 8),
        Expanded(child: Text(text, style: TextStyle(fontSize: 14, color: color ?? colorScheme.onSurface.withValues(alpha: 0.7)))),
      ],
    );
  }

  Widget _rsvpButton(String status, String label, IconData icon, String userId) {
    final colorScheme = Theme.of(context).colorScheme;
    final currentRsvp = _event!.rsvps.where((r) => r.oderId == userId).firstOrNull;
    final isSelected = currentRsvp?.status == status;

    return OutlinedButton.icon(
      onPressed: () async {
        await context.read<AppProvider>().eventService.rsvpEvent(widget.eventId, status);
        await _loadEvent();
      },
      icon: Icon(icon, size: 16),
      label: Text(label, style: const TextStyle(fontSize: 12)),
      style: OutlinedButton.styleFrom(
        backgroundColor: isSelected ? colorScheme.primary.withValues(alpha: 0.15) : null,
        foregroundColor: isSelected ? colorScheme.primary : colorScheme.onSurface.withValues(alpha: 0.7),
        side: BorderSide(color: isSelected ? colorScheme.primary : colorScheme.outline.withValues(alpha: 0.3)),
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  String _formatDateTime(String dateStr) {
    final date = DateTime.tryParse(dateStr);
    if (date == null) return dateStr;
    return DateFormat('EEE, MMM d, yyyy · h:mm a').format(date);
  }
}
