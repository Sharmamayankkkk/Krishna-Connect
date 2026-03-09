import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../providers/auth_provider.dart';
import '../../services/services.dart';
import '../../models/models.dart';

class GetVerifiedScreen extends StatefulWidget {
  const GetVerifiedScreen({super.key});
  @override
  State<GetVerifiedScreen> createState() => _GetVerifiedScreenState();
}

class _GetVerifiedScreenState extends State<GetVerifiedScreen> {
  String _selectedPlan = 'monthly';
  final _socialLinksController = TextEditingController();
  final _reasonController = TextEditingController();
  bool _isSubmitting = false;
  bool _isLoading = true;
  VerificationRequest? _existingRequest;

  @override
  void initState() {
    super.initState();
    _loadExistingRequest();
  }

  @override
  void dispose() {
    _socialLinksController.dispose();
    _reasonController.dispose();
    super.dispose();
  }

  Future<void> _loadExistingRequest() async {
    try {
      final service = context.read<VerificationService>();
      final request = await service.getExistingRequest();
      setState(() { _existingRequest = request; _isLoading = false; });
    } catch (e) {
      debugPrint('Verification load error: $e');
      setState(() => _isLoading = false);
    }
  }

  Future<void> _submitRequest() async {
    setState(() => _isSubmitting = true);
    try {
      final service = context.read<VerificationService>();
      await service.submitRequest(
        plan: _selectedPlan,
        socialLinks: _socialLinksController.text.isNotEmpty ? _socialLinksController.text : null,
        reason: _reasonController.text.isNotEmpty ? _reasonController.text : null,
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Verification request submitted!'), backgroundColor: Colors.green),
        );
        _loadExistingRequest();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    }
    setState(() => _isSubmitting = false);
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final colorScheme = Theme.of(context).colorScheme;
    final user = auth.user;
    final isAlreadyVerified = user?.isVerified ?? false;

    return Scaffold(
      appBar: AppBar(title: const Text('Get Verified')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // Header
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [colorScheme.primary, colorScheme.primary.withValues(alpha: 0.7)],
                      begin: Alignment.topLeft, end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    children: [
                      const Icon(Icons.verified, size: 48, color: Colors.white),
                      const SizedBox(height: 12),
                      const Text('Krishna Connect Verified', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: Colors.white)),
                      const SizedBox(height: 8),
                      Text(
                        'Stand out with a verified badge and unlock premium features',
                        style: TextStyle(fontSize: 14, color: Colors.white.withValues(alpha: 0.9)),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                if (isAlreadyVerified) ...[
                  _buildStatusCard(
                    Icons.check_circle,
                    'You\'re Verified!',
                    'Your account is already verified. Thank you for being part of our community.',
                    Colors.green,
                    colorScheme,
                  ),
                ] else if (_existingRequest != null) ...[
                  _buildRequestStatus(colorScheme),
                ] else ...[
                  // Benefits
                  const Text('Benefits', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 12),
                  _buildBenefit(Icons.verified, 'Verified Badge', 'Blue checkmark on your profile', colorScheme),
                  _buildBenefit(Icons.priority_high, 'Priority Support', 'Get help faster from our team', colorScheme),
                  _buildBenefit(Icons.trending_up, 'Boosted Visibility', 'Your posts appear higher in feeds', colorScheme),
                  _buildBenefit(Icons.analytics_outlined, 'Advanced Analytics', 'Detailed insights on your content', colorScheme),
                  _buildBenefit(Icons.palette_outlined, 'Custom Themes', 'Exclusive profile customization', colorScheme),
                  const SizedBox(height: 24),

                  // Plan selection
                  const Text('Choose a Plan', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(child: _buildPlanCard('monthly', '₹499', '/month', colorScheme)),
                      const SizedBox(width: 12),
                      Expanded(child: _buildPlanCard('yearly', '₹4,990', '/year', colorScheme, savings: 'Save 17%')),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Social links
                  TextField(
                    controller: _socialLinksController,
                    decoration: InputDecoration(
                      labelText: 'Social Media Links (optional)',
                      hintText: 'Twitter, Instagram, etc.',
                      prefixIcon: const Icon(Icons.link),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      helperText: 'Linking social accounts may get you a discount',
                    ),
                    maxLines: 2,
                  ),
                  const SizedBox(height: 16),

                  // Reason
                  TextField(
                    controller: _reasonController,
                    decoration: InputDecoration(
                      labelText: 'Why do you want to get verified?',
                      hintText: 'Tell us about yourself...',
                      prefixIcon: const Icon(Icons.edit_note),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    maxLines: 3,
                  ),
                  const SizedBox(height: 24),

                  // Submit button
                  FilledButton(
                    onPressed: _isSubmitting ? null : _submitRequest,
                    style: FilledButton.styleFrom(
                      minimumSize: const Size(double.infinity, 52),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: _isSubmitting
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : const Text('Submit Verification Request', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                  ),
                  const SizedBox(height: 32),
                ],
              ],
            ),
    );
  }

  Widget _buildRequestStatus(ColorScheme colorScheme) {
    final status = _existingRequest!.status;
    IconData icon;
    String title;
    String subtitle;
    Color color;

    switch (status) {
      case 'submitted':
        icon = Icons.hourglass_top;
        title = 'Request Submitted';
        subtitle = 'Your verification request is being reviewed. We\'ll notify you of any updates.';
        color = Colors.orange;
      case 'reviewing':
        icon = Icons.rate_review;
        title = 'Under Review';
        subtitle = 'Our team is currently reviewing your application.';
        color = colorScheme.primary;
      case 'verified':
        icon = Icons.check_circle;
        title = 'Verified!';
        subtitle = 'Congratulations! Your account has been verified.';
        color = Colors.green;
      case 'rejected':
        icon = Icons.cancel;
        title = 'Request Declined';
        subtitle = 'Unfortunately your request was declined. You can submit a new request.';
        color = Colors.red;
      default:
        icon = Icons.info;
        title = 'Status: $status';
        subtitle = 'Your request status is being processed.';
        color = colorScheme.onSurface;
    }
    return _buildStatusCard(icon, title, subtitle, color, colorScheme);
  }

  Widget _buildStatusCard(IconData icon, String title, String subtitle, Color color, ColorScheme colorScheme) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Column(
        children: [
          Icon(icon, size: 48, color: color),
          const SizedBox(height: 12),
          Text(title, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: color)),
          const SizedBox(height: 8),
          Text(subtitle, style: TextStyle(fontSize: 14, color: colorScheme.onSurface.withValues(alpha: 0.6)), textAlign: TextAlign.center),
        ],
      ),
    );
  }

  Widget _buildBenefit(IconData icon, String title, String subtitle, ColorScheme colorScheme) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Container(
            width: 40, height: 40,
            decoration: BoxDecoration(color: colorScheme.primary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
            child: Icon(icon, color: colorScheme.primary, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                Text(subtitle, style: TextStyle(fontSize: 12, color: colorScheme.onSurface.withValues(alpha: 0.5))),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPlanCard(String plan, String price, String period, ColorScheme colorScheme, {String? savings}) {
    final isSelected = _selectedPlan == plan;
    return GestureDetector(
      onTap: () => setState(() => _selectedPlan = plan),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected ? colorScheme.primary.withValues(alpha: 0.1) : colorScheme.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? colorScheme.primary : colorScheme.outline.withValues(alpha: 0.3),
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Column(
          children: [
            if (savings != null) ...[
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(color: Colors.green, borderRadius: BorderRadius.circular(8)),
                child: Text(savings, style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w600)),
              ),
              const SizedBox(height: 8),
            ],
            Text(price, style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: isSelected ? colorScheme.primary : colorScheme.onSurface)),
            Text(period, style: TextStyle(fontSize: 12, color: colorScheme.onSurface.withValues(alpha: 0.5))),
            const SizedBox(height: 8),
            Text(plan == 'monthly' ? 'Monthly' : 'Yearly', style: TextStyle(fontWeight: FontWeight.w600, color: isSelected ? colorScheme.primary : colorScheme.onSurface)),
          ],
        ),
      ),
    );
  }
}
