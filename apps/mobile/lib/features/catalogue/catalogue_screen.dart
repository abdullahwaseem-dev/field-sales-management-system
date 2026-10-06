import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:uuid/uuid.dart';

import '../../core/api_client.dart';
import '../../core/app_scope.dart';
import '../../design_system/design_system.dart';
import '../../l10n/app_localizations.dart';

/// Catalogue (FR-MKT-01): published products and offers, filter by category, search in both languages.
class CatalogueScreen extends StatefulWidget {
  const CatalogueScreen({super.key});

  @override
  State<CatalogueScreen> createState() => _CatalogueScreenState();
}

class _CatalogueScreenState extends State<CatalogueScreen> {
  List<Map<String, dynamic>> _categories = [];
  List<Map<String, dynamic>>? _items;
  String? _category;
  final _search = TextEditingController();
  Timer? _debounce;
  Object? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    final api = AppScope.of(context).api;
    try {
      _categories = ((await api.get('/catalogue/categories')) as List).cast<Map<String, dynamic>>();
      final q = Uri(queryParameters: {'categoryId': ?_category, if (_search.text.trim().isNotEmpty) 'q': _search.text.trim()}).query;
      final items = ((await api.get('/catalogue${q.isEmpty ? '' : '?$q'}')) as List).cast<Map<String, dynamic>>();
      if (mounted) setState(() => (_items = items, _error = null));
    } catch (e) {
      if (mounted) setState(() => _error = e);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final arabic = Localizations.localeOf(context).languageCode == 'ar';
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(padding: const EdgeInsets.all(ZonaSpace.s4), children: [
        TextField(
          controller: _search,
          decoration: InputDecoration(prefixIcon: const Icon(LucideIcons.search, size: ZonaSize.iconMd), hintText: l10n.catalogueSearch),
          onChanged: (_) {
            _debounce?.cancel();
            _debounce = Timer(const Duration(milliseconds: 350), _load);
          },
        ),
        const SizedBox(height: ZonaSpace.s3),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(children: [
            for (final cat in [null, ..._categories])
              Padding(
                padding: const EdgeInsetsDirectional.only(end: ZonaSpace.s2),
                child: ChoiceChip(
                  label: Text(cat == null ? l10n.catalogueAll : cat[arabic ? 'name_ar' : 'name_en'] as String),
                  selected: _category == cat?['category_id'],
                  onSelected: (_) {
                    setState(() => _category = cat?['category_id'] as String?);
                    _load();
                  },
                ),
              ),
          ]),
        ),
        const SizedBox(height: ZonaSpace.s3),
        if (_error != null && _items == null)
          EmptyState(icon: LucideIcons.wifiOff, title: l10n.stateErrorTitle, body: errorMessage(context, _error!))
        else if (_items == null)
          const ZonaCard(child: SkeletonList())
        else if (_items!.isEmpty)
          EmptyState(icon: LucideIcons.packageSearch, title: l10n.catalogueEmpty, body: '')
        else
          for (final item in _items!) Padding(padding: const EdgeInsets.only(bottom: ZonaSpace.s3), child: _ProductCard(item: item)),
      ]),
    );
  }
}

class _ProductCard extends StatelessWidget {
  const _ProductCard({required this.item});
  final Map<String, dynamic> item;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final t = ZonaText.of(context);
    final c = ZonaColors.of(context);
    final f = ZonaFormat.of(context);
    final arabic = Localizations.localeOf(context).languageCode == 'ar';
    final isOffer = item['item_type'] != 'product';
    final validTo = item['valid_to'] as String?;
    return ZonaCard(
      padding: EdgeInsets.zero,
      child: InkWell(
        borderRadius: BorderRadius.circular(ZonaRadius.lg),
        onTap: () => showModalBottomSheet<void>(context: context, isScrollControlled: true, showDragHandle: true, builder: (_) => ShareSheet(item: item)),
        child: Padding(
          padding: const EdgeInsets.all(ZonaSpace.s4),
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(color: isOffer ? c.accentSubtle : c.brandSubtle, borderRadius: BorderRadius.circular(ZonaRadius.md)),
              child: Icon(isOffer ? LucideIcons.badgePercent : LucideIcons.package, color: isOffer ? c.accentFg : c.brandFg),
            ),
            const SizedBox(width: ZonaSpace.s3),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(item[arabic ? 'name_ar' : 'name_en'] as String, style: t.subtitle),
                const SizedBox(height: ZonaSpace.s1),
                Text(item[arabic ? 'description_ar' : 'description_en'] as String, style: t.body.copyWith(color: c.fgMuted), maxLines: 2, overflow: TextOverflow.ellipsis),
                if (isOffer || validTo != null) ...[
                  const SizedBox(height: ZonaSpace.s2),
                  Wrap(spacing: ZonaSpace.s2, children: [
                    if (isOffer) Text(l10n.catalogueOffer, style: t.labelSm.copyWith(color: c.accentFg)),
                    if (validTo != null) Text(l10n.catalogueValidUntil(f.shortDate(DateTime.parse(validTo))), style: t.labelSm.copyWith(color: c.fgMuted)),
                  ]),
                ],
              ]),
            ),
            Icon(LucideIcons.share2, size: ZonaSize.iconMd, color: c.brandFg),
          ]),
        ),
      ),
    );
  }
}

/// Share a product (FR-MKT-02) and log it (FR-MKT-03) — offline-safe via the outbox.
class ShareSheet extends StatefulWidget {
  const ShareSheet({super.key, required this.item});
  final Map<String, dynamic> item;

  @override
  State<ShareSheet> createState() => _ShareSheetState();
}

class _ShareSheetState extends State<ShareSheet> {
  final _recipient = TextEditingController();

  Future<void> _share(String channel) async {
    final scope = AppScope.of(context);
    final l10n = AppLocalizations.of(context);
    final arabic = Localizations.localeOf(context).languageCode == 'ar';
    final item = widget.item;
    final name = item[arabic ? 'name_ar' : 'name_en'] as String;
    final link = item['shareUrl'] as String;
    final text = l10n.catalogueShareText(name, link);
    final to = _recipient.text.trim();
    switch (channel) {
      case 'whatsapp':
        final phone = to.replaceAll(RegExp(r'[^0-9]'), '');
        await launchUrl(Uri.parse('https://wa.me/$phone?text=${Uri.encodeComponent(text)}'), mode: LaunchMode.externalApplication);
      case 'sms':
        await launchUrl(Uri(scheme: 'sms', path: to, queryParameters: {'body': text}));
      case 'email':
        await launchUrl(Uri(scheme: 'mailto', path: to, query: 'subject=${Uri.encodeComponent(name)}&body=${Uri.encodeComponent(text)}'));
      case 'link':
        await Clipboard.setData(ClipboardData(text: link));
        if (mounted) showZonaToast(context, variant: ZonaToastVariant.info, title: l10n.catalogueLinkCopied);
      default:
        await SharePlus.instance.share(ShareParams(text: text, subject: name));
    }
    final body = {'shareId': const Uuid().v4(), 'channel': channel, if (to.isNotEmpty) 'recipient': to, 'sharedAt': DateTime.now().toUtc().toIso8601String()};
    final path = '/catalogue/${item['product_id']}/shares';
    try {
      await scope.api.post(path, body);
    } on ApiException catch (e) {
      if (e.isNetwork) await scope.outbox.addRequest(path, body);
    }
    if (mounted) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final t = ZonaText.of(context);
    final c = ZonaColors.of(context);
    final arabic = Localizations.localeOf(context).languageCode == 'ar';
    Widget option(IconData icon, String label, String channel) => ListTile(
          leading: Icon(icon, color: c.brandFg),
          title: Text(label, style: t.bodyLg),
          minTileHeight: ZonaSize.touchMin,
          onTap: () => _share(channel),
        );
    return SafeArea(
      child: Padding(
        padding: EdgeInsets.only(left: ZonaSpace.s4, right: ZonaSpace.s4, bottom: MediaQuery.viewInsetsOf(context).bottom + ZonaSpace.s4),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Text(widget.item[arabic ? 'name_ar' : 'name_en'] as String, style: t.title),
          const SizedBox(height: ZonaSpace.s2),
          Text(widget.item[arabic ? 'description_ar' : 'description_en'] as String, style: t.body.copyWith(color: c.fgMuted)),
          const SizedBox(height: ZonaSpace.s4),
          ZonaInput(controller: _recipient, label: l10n.catalogueRecipient, icon: LucideIcons.phone, ltr: true, keyboardType: TextInputType.phone),
          const SizedBox(height: ZonaSpace.s3),
          Text(l10n.catalogueShareVia, style: t.labelSm.copyWith(color: c.fgMuted)),
          option(LucideIcons.messageCircle, l10n.catalogueWhatsapp, 'whatsapp'),
          option(LucideIcons.messageSquare, l10n.catalogueSms, 'sms'),
          option(LucideIcons.mail, l10n.catalogueEmail, 'email'),
          option(LucideIcons.copy, l10n.catalogueCopyLink, 'link'),
          option(LucideIcons.share2, l10n.catalogueMore, 'other'),
        ]),
      ),
    );
  }
}
