import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../providers/app_provider.dart';

class CreateChallengeScreen extends StatefulWidget {
  const CreateChallengeScreen({super.key});
  @override
  State<CreateChallengeScreen> createState() => _CreateChallengeScreenState();
}

class _CreateChallengeScreenState extends State<CreateChallengeScreen> {
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _rulesController = TextEditingController();
  final _prizeController = TextEditingController();
  DateTime? _endDate;
  bool _isCreating = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
        title: const Text('Create Challenge'),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: ElevatedButton(
              onPressed: _isCreating || _titleController.text.trim().isEmpty ? null : _createChallenge,
              child: _isCreating
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Text('Create'),
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Cover image placeholder
            GestureDetector(
              onTap: () {},
              child: Container(
                width: double.infinity,
                height: 150,
                decoration: BoxDecoration(
                  color: AppTheme.cardDarkElevated,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppTheme.borderDark, style: BorderStyle.solid),
                ),
                child: const Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.add_photo_alternate, size: 36, color: AppTheme.textMuted),
                    SizedBox(height: 8),
                    Text('Add Cover Image', style: TextStyle(color: AppTheme.textMuted, fontSize: 13)),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            TextField(
              controller: _titleController,
              onChanged: (_) => setState(() {}),
              decoration: const InputDecoration(
                labelText: 'Challenge Title *',
                hintText: 'e.g., 30-Day Meditation Challenge',
                prefixIcon: Icon(Icons.emoji_events_outlined),
              ),
            ),
            const SizedBox(height: 14),

            TextField(
              controller: _descriptionController,
              maxLines: 4,
              decoration: const InputDecoration(
                labelText: 'Description',
                hintText: 'Describe what this challenge is about...',
                alignLabelWithHint: true,
              ),
            ),
            const SizedBox(height: 14),

            TextField(
              controller: _rulesController,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'Rules',
                hintText: 'Add rules for the challenge...',
                alignLabelWithHint: true,
                prefixIcon: Icon(Icons.rule_outlined),
              ),
            ),
            const SizedBox(height: 14),

            TextField(
              controller: _prizeController,
              decoration: const InputDecoration(
                labelText: 'Prize (optional)',
                hintText: 'Describe the prize for winners...',
                prefixIcon: Icon(Icons.card_giftcard_outlined),
              ),
            ),
            const SizedBox(height: 14),

            // End date
            GestureDetector(
              onTap: () async {
                final date = await showDatePicker(
                  context: context,
                  initialDate: DateTime.now().add(const Duration(days: 7)),
                  firstDate: DateTime.now(),
                  lastDate: DateTime.now().add(const Duration(days: 365)),
                );
                if (date != null) {
                  setState(() => _endDate = date);
                }
              },
              child: InputDecorator(
                decoration: const InputDecoration(
                  labelText: 'End Date (optional)',
                  prefixIcon: Icon(Icons.calendar_today_outlined),
                ),
                child: Text(
                  _endDate != null
                      ? '${_endDate!.day}/${_endDate!.month}/${_endDate!.year}'
                      : 'Select end date',
                  style: TextStyle(color: _endDate != null ? AppTheme.textPrimary : AppTheme.textMuted),
                ),
              ),
            ),
            const SizedBox(height: 32),

            // Info card
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppTheme.primaryColor.withValues(alpha: 0.05),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.primaryColor.withValues(alpha: 0.2)),
              ),
              child: const Row(
                children: [
                  Icon(Icons.info_outline, size: 18, color: AppTheme.primaryColor),
                  SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Once created, the challenge will be visible to all users and they can join it.',
                      style: TextStyle(fontSize: 13, color: AppTheme.textSecondary),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _createChallenge() async {
    if (_titleController.text.trim().isEmpty) return;
    setState(() => _isCreating = true);

    try {
      await context.read<AppProvider>().challengeService.createChallenge(
        title: _titleController.text.trim(),
        description: _descriptionController.text.trim().isNotEmpty ? _descriptionController.text.trim() : null,
        rules: _rulesController.text.trim().isNotEmpty ? _rulesController.text.trim() : null,
        endDate: _endDate?.toIso8601String(),
      );
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Challenge created!')));
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
    setState(() => _isCreating = false);
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _rulesController.dispose();
    _prizeController.dispose();
    super.dispose();
  }
}
