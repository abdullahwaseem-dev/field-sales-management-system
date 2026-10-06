// ignore: unused_import
import 'package:intl/intl.dart' as intl;

import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Arabic (`ar`).
class AppLocalizationsAr extends AppLocalizations {
  AppLocalizationsAr([String locale = 'ar']) : super(locale);

  @override
  String get appName => 'زونة للمبيعات';

  @override
  String get appPortal => 'بوابة الإدارة';

  @override
  String get appBrandLabel => 'زونة';

  @override
  String get navDashboard => 'لوحة التحكم';

  @override
  String get navEmployees => 'الموظفون';

  @override
  String get navAttendance => 'الحضور والانصراف';

  @override
  String get navLiveMap => 'الخريطة المباشرة';

  @override
  String get navMarketing => 'التسويق';

  @override
  String get navReports => 'التقارير';

  @override
  String get navSettings => 'الإعدادات';

  @override
  String get navCollapse => 'طيّ القائمة الجانبية';

  @override
  String get navExpand => 'توسيع القائمة الجانبية';

  @override
  String get navMain => 'التنقل الرئيسي';

  @override
  String get navSearchPlaceholder => 'ابحث عن موظف أو رقم وظيفي أو منتج…';

  @override
  String get tabHome => 'الرئيسية';

  @override
  String get tabCatalogue => 'الكتالوج';

  @override
  String get tabLeave => 'الإجازات';

  @override
  String get tabProfile => 'حسابي';

  @override
  String get statusPresent => 'حاضر';

  @override
  String get statusLate => 'متأخر';

  @override
  String get statusAbsent => 'غائب';

  @override
  String get statusSuspectedFake => 'اشتباه تلاعب';

  @override
  String get statusConfirmedFake => 'تلاعب مؤكد';

  @override
  String get statusOnLeave => 'في إجازة';

  @override
  String statusShortBy(String duration) {
    return 'نقص في الساعات: $duration';
  }

  @override
  String durationHm(String hours, String minutes) {
    return '$hours س $minutes د';
  }

  @override
  String durationH(String hours) {
    return '$hours س';
  }

  @override
  String get dayNotCheckedIn => 'لم يُسجَّل الحضور';

  @override
  String get dayOnDuty => 'على رأس العمل';

  @override
  String get dayOnBreak => 'في استراحة';

  @override
  String get dayCheckedOut => 'تم تسجيل الانصراف';

  @override
  String get heroCheckIn => 'تسجيل الحضور';

  @override
  String get heroCheckOut => 'تسجيل الانصراف';

  @override
  String heroCheckInHint(String site) {
    return 'اضغط لتسجيل الحضور في $site';
  }

  @override
  String heroWorkedOf(String worked, String required) {
    return '$worked من $required';
  }

  @override
  String heroRemaining(String duration) {
    return 'المتبقي $duration';
  }

  @override
  String get heroComplete => 'اكتملت الساعات المطلوبة';

  @override
  String heroCheckedInAt(String time) {
    return 'سُجِّل الحضور الساعة $time';
  }

  @override
  String get heroLocationOn => 'مشاركة الموقع مفعّلة';

  @override
  String get heroLocationOnHint => 'تتوقف تلقائيًا عند تسجيل الانصراف.';

  @override
  String get heroEarlyTitle => 'تسجيل الانصراف مبكرًا؟';

  @override
  String heroEarlyBody(String worked, String required, String remaining) {
    return 'عملت $worked حتى الآن، وساعات اليوم المطلوبة $required، أي أن المتبقي $remaining. سيُسجَّل يومك ناقص الساعات.';
  }

  @override
  String get heroEarlyConfirm => 'تسجيل الانصراف على أي حال';

  @override
  String get heroKeepWorking => 'مواصلة العمل';

  @override
  String get actionSave => 'حفظ';

  @override
  String get actionCancel => 'إلغاء';

  @override
  String get actionConfirm => 'تأكيد';

  @override
  String get actionRetry => 'إعادة المحاولة';

  @override
  String get actionClose => 'إغلاق';

  @override
  String get actionSearch => 'بحث';

  @override
  String get actionFilter => 'تصفية';

  @override
  String get actionColumns => 'الأعمدة';

  @override
  String get actionExport => 'تصدير';

  @override
  String get actionActions => 'الإجراءات';

  @override
  String get actionViewDetails => 'عرض التفاصيل';

  @override
  String get actionViewTrail => 'عرض مسار الموقع';

  @override
  String get actionReview => 'مراجعة';

  @override
  String get actionApprove => 'اعتماد';

  @override
  String get actionReject => 'رفض';

  @override
  String get actionDelete => 'حذف';

  @override
  String get actionSelectAll => 'تحديد كل الصفوف';

  @override
  String actionSelectRow(String name) {
    return 'تحديد $name';
  }

  @override
  String get actionShowMore => 'عرض المزيد';

  @override
  String get actionNewEmployee => 'موظف جديد';

  @override
  String get actionDismiss => 'إغلاق الإشعار';

  @override
  String get stateLoading => 'جارٍ التحميل…';

  @override
  String get stateErrorTitle => 'حدث خطأ ما';

  @override
  String get stateErrorBody => 'تعذّر تحميل البيانات. تحقّق من الاتصال ثم حاول مرة أخرى.';

  @override
  String get stateEmptyReviewTitle => 'لا توجد حالات حضور مشتبه بها';

  @override
  String get stateEmptyReviewBody => 'ستظهر هنا حالات الحضور المُعلَّمة لمراجعتها.';

  @override
  String get stateOfflineTitle => 'أنت غير متصل بالإنترنت';

  @override
  String stateOfflineBody(String time) {
    return 'تُعرض بيانات آخر تحديث الساعة $time، وسيتم التحديث عند عودة الاتصال.';
  }

  @override
  String get stateNoResults => 'لا يوجد موظفون مطابقون لعوامل التصفية';

  @override
  String get stateNoResultsBody => 'جرّب اسمًا أو رقمًا وظيفيًا أو فريقًا مختلفًا.';

  @override
  String get fieldEmail => 'البريد الإلكتروني للعمل';

  @override
  String get fieldPhone => 'رقم الجوال';

  @override
  String get fieldEmployeeId => 'الرقم الوظيفي';

  @override
  String get fieldPassword => 'كلمة المرور';

  @override
  String get fieldTeam => 'الفريق';

  @override
  String get fieldTeamPlaceholder => 'اختر الفريق';

  @override
  String get fieldRemark => 'ملاحظة المراجعة';

  @override
  String get fieldRemarkHint => 'مطلوبة. وضّح الأدلة التي بنيت عليها قرارك.';

  @override
  String get fieldOptional => 'اختياري';

  @override
  String get fieldRequired => 'مطلوب';

  @override
  String get fieldErrorRequired => 'هذا الحقل مطلوب';

  @override
  String get fieldErrorPhone => 'أدخل رقم جوال سعوديًا صحيحًا، مثل 05XXXXXXXX';

  @override
  String get fieldPhoneHint => 'نرسل رموز الدخول لمرة واحدة إلى هذا الرقم.';

  @override
  String get fieldSearchLabel => 'البحث في السجل';

  @override
  String get teamRiyadhNorth => 'شمال الرياض';

  @override
  String get teamJeddahCentral => 'وسط جدة';

  @override
  String get teamDammamEast => 'شرق الدمام';

  @override
  String get tableEmployee => 'الموظف';

  @override
  String get tableEmployeeId => 'الرقم الوظيفي';

  @override
  String get tableTeam => 'الفريق';

  @override
  String get tableCheckIn => 'الحضور';

  @override
  String get tableCheckOut => 'الانصراف';

  @override
  String get tableWorked => 'ساعات العمل';

  @override
  String get tableStatus => 'الحالة';

  @override
  String tableSelected(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count صف محدد',
      many: '$count صفًا محددًا',
      few: '$count صفوف محددة',
      two: 'صفّان محددان',
      one: 'صف واحد محدد',
      zero: 'لم يُحدَّد أي صف',
    );
    return '$_temp0';
  }

  @override
  String tableRows(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count موظف',
      many: '$count موظفًا',
      few: '$count موظفين',
      two: 'موظفان',
      one: 'موظف واحد',
      zero: 'لا يوجد موظفون',
    );
    return '$_temp0';
  }

  @override
  String get tableSortAsc => 'مرتّب تصاعديًا';

  @override
  String get tableSortDesc => 'مرتّب تنازليًا';

  @override
  String get tableNotSorted => 'غير مرتّب. فعّله للترتيب.';

  @override
  String tableCaption(String date) {
    return 'سجل الحضور ليوم $date';
  }

  @override
  String get reviewTitle => 'مراجعة تسجيل حضور مشتبه به';

  @override
  String get reviewEvidence => 'الأدلة';

  @override
  String get reviewSignalMock => 'كان تطبيق لتزييف الموقع مفعّلًا على الجهاز';

  @override
  String reviewSignalMismatch(String distance) {
    return 'المسافة بين موقع GPS وموقع الشبكة $distance';
  }

  @override
  String reviewSignalSpeed(String distance, int minutes) {
    String _temp0 = intl.Intl.pluralLogic(
      minutes,
      locale: localeName,
      other: '$minutes دقيقة',
      many: '$minutes دقيقة',
      few: '$minutes دقائق',
      two: 'دقيقتين',
      one: 'دقيقة واحدة',
      zero: '$minutes دقيقة',
    );
    return 'قطع $distance خلال $_temp0، وهي سرعة غير ممكنة برًّا';
  }

  @override
  String get reviewConfirmFake => 'تأكيد التلاعب';

  @override
  String get reviewMarkGenuine => 'اعتماد كحضور صحيح';

  @override
  String get reviewAuditNote => 'يُسجَّل قرارك باسمك. لتغييره لاحقًا، أعد فتح الشهر.';

  @override
  String toastCheckedIn(String time) {
    return 'سُجِّل الحضور الساعة $time';
  }

  @override
  String get toastCheckedInBody => 'تبقى مشاركة الموقع مفعّلة حتى تسجيل الانصراف.';

  @override
  String get toastLeaveApproved => 'تمت الموافقة على الإجازة';

  @override
  String toastLeaveApprovedBody(String name, String range) {
    return '$name في إجازة $range.';
  }

  @override
  String toastOfflineQueued(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: 'حُفظ $count تحديث للموقع وستُرسل عند عودة الاتصال.',
      many: 'حُفظ $count تحديثًا للموقع وستُرسل عند عودة الاتصال.',
      few: 'حُفظت $count تحديثات للموقع وستُرسل عند عودة الاتصال.',
      two: 'حُفظ تحديثان للموقع وسيُرسلان عند عودة الاتصال.',
      one: 'حُفظ تحديث موقع واحد وسيُرسل عند عودة الاتصال.',
      zero: 'لا توجد تحديثات موقع بانتظار الإرسال.',
    );
    return '$_temp0';
  }

  @override
  String get toastGeofenceExit => 'لقد غادرت نطاق العمل';

  @override
  String get toastGeofenceExitBody => 'تم إشعار مسؤول النظام، وتستمر مشاركة الموقع ما دمت على رأس العمل.';

  @override
  String get toastSaveFailed => 'لم تُحفظ التغييرات';

  @override
  String get kpiOnDuty => 'على رأس العمل الآن';

  @override
  String get kpiNotCheckedIn => 'لم يسجّلوا الحضور';

  @override
  String get kpiLate => 'المتأخرون اليوم';

  @override
  String get kpiSuspected => 'حالات الاشتباه اليوم';

  @override
  String kpiVsYesterday(String delta) {
    return '$delta مقارنة بالأمس';
  }

  @override
  String kpiOfTeam(String total) {
    return 'من أصل $total في جدول اليوم';
  }

  @override
  String mapMarker(String name, String initials, String status, String time) {
    return '$name، $initials، $status، آخر تحديث $time';
  }

  @override
  String mapCluster(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count موظف في هذه المنطقة',
      many: '$count موظفًا في هذه المنطقة',
      few: '$count موظفين في هذه المنطقة',
      two: 'موظفان في هذه المنطقة',
      one: 'موظف واحد في هذه المنطقة',
      zero: 'لا يوجد موظفون في هذه المنطقة',
    );
    return '$_temp0';
  }

  @override
  String get mapLegend => 'مفتاح الخريطة';

  @override
  String mapLastUpdate(String time) {
    return 'آخر تحديث $time';
  }

  @override
  String get settingsTheme => 'المظهر';

  @override
  String get settingsThemeSystem => 'حسب النظام';

  @override
  String get settingsThemeLight => 'فاتح';

  @override
  String get settingsThemeDark => 'داكن';

  @override
  String get settingsLanguage => 'اللغة';

  @override
  String get settingsLanguageEn => 'English';

  @override
  String get settingsLanguageAr => 'العربية';

  @override
  String get settingsDigits => 'الأرقام';

  @override
  String get settingsDigitsWestern => '0-9';

  @override
  String get settingsDigitsArabic => '٠-٩';

  @override
  String get settingsHijri => 'عرض التاريخ الهجري';

  @override
  String get dsTitle => 'نظام التصميم';

  @override
  String get dsSubtitle => 'مراجعة المرحلة 0: جميع المكوّنات الأساسية بالعربية والإنجليزية، في الوضعين الفاتح والداكن.';

  @override
  String get dsInterimLogo => 'شعار مؤقت مستخرج من دليل الهوية بدقته الأصلية، وتتطلب الأصول النهائية الملفات المتجهية الأصلية.';

  @override
  String get dsBrand => 'الهوية';

  @override
  String get dsColor => 'الألوان';

  @override
  String get dsTypography => 'الخطوط';

  @override
  String get dsFoundations => 'المسافات والزوايا والظلال والحركة';

  @override
  String get dsComponents => 'المكوّنات';

  @override
  String get dsMobile => 'مكوّنات تطبيق الجوال (Flutter)';

  @override
  String dsContrast(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count زوج تباين يجتاز معيار WCAG AA',
      many: '$count زوجًا للتباين تجتاز معيار WCAG AA',
      few: '$count أزواج تباين تجتاز معيار WCAG AA',
      two: 'زوجا تباين يجتازان معيار WCAG AA',
      one: 'زوج تباين واحد يجتاز معيار WCAG AA',
      zero: 'لا توجد أزواج تباين',
    );
    return '$_temp0';
  }

  @override
  String get dsPreferences => 'التفضيلات';

  @override
  String get dsComboEnLight => 'الإنجليزية · فاتح';

  @override
  String get dsComboEnDark => 'الإنجليزية · داكن';

  @override
  String get dsComboArLight => 'العربية · فاتح';

  @override
  String get dsComboArDark => 'العربية · داكن';

  @override
  String get dsSampleName => 'فيصل الحربي';

  @override
  String get dsSampleParagraph =>
      'يسجّل مندوبو المبيعات حضورهم مرة واحدة يوميًا من موقع معتمد، وتعمل مشاركة الموقع فقط أثناء ساعات العمل وتتوقف عند تسجيل الانصراف.';

  @override
  String dsSampleBidi(String id, String email, String phone) {
    return 'سجّل الموظف $id ($email) حضوره من الرقم $phone.';
  }

  @override
  String dsSamplePlural(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count زيارة اليوم',
      many: '$count زيارة اليوم',
      few: '$count زيارات اليوم',
      two: 'زيارتان اليوم',
      one: 'زيارة واحدة اليوم',
      zero: 'لا زيارات اليوم',
    );
    return '$_temp0';
  }

  @override
  String get dsSampleDateGregorian => 'ميلادي';

  @override
  String get dsSampleDateHijri => 'هجري (أم القرى)';

  @override
  String get dsSampleSite => 'فرع العليا';

  @override
  String get dsSkip => 'تخطَّ إلى المحتوى';

  @override
  String get dsTryIt => 'جرّبه';

  @override
  String get dsScales => 'تدرجات الهوية';

  @override
  String get dsRoles => 'الأدوار الدلالية';

  @override
  String get dsStatusTokens => 'حالات الحضور';

  @override
  String get dsChart => 'ألوان الرسوم البيانية';

  @override
  String get dsChartNote =>
      'تم التحقق من وضوح التمييز بينها لمصابي عمى الألوان في الوضعين. على الخلفيات الفاتحة تحتاج الألوان من 3 إلى 5 إلى تسميات مباشرة أو عرض جدولي.';

  @override
  String dsTightest(String pair) {
    return 'أضيق زوج: $pair';
  }

  @override
  String get dsSpacing => 'المسافات';

  @override
  String get dsRadius => 'الزوايا';

  @override
  String get dsElevation => 'الظلال';

  @override
  String get dsMotion => 'الحركة';

  @override
  String get dsMotionNote => 'تصبح كل المدد 0 مللي ثانية عند تفعيل خيار تقليل الحركة في الجهاز.';

  @override
  String get dsNumerals => 'الأرقام والتواريخ';

  @override
  String get dsPlurals => 'قواعد الجمع';

  @override
  String get dsBidi => 'النصوص ثنائية الاتجاه';

  @override
  String get dsCButtons => 'الأزرار';

  @override
  String get dsCForms => 'عناصر النماذج';

  @override
  String get dsCStatus => 'شارات الحالة';

  @override
  String get dsCCards => 'البطاقات ومؤشرات الأداء';

  @override
  String get dsCTable => 'جدول البيانات';

  @override
  String get dsCShell => 'القائمة الجانبية والبحث الشامل';

  @override
  String get dsCMap => 'علامات الخريطة';

  @override
  String get dsCDialog => 'مربع الحوار';

  @override
  String get dsCToast => 'الإشعارات المنبثقة';

  @override
  String get dsCStates => 'حالات التحميل والفراغ والخطأ وانقطاع الاتصال';

  @override
  String get dsCMobileNote => 'مولَّدة باختبارات Flutter المرجعية من الرموز والترجمات نفسها.';

  @override
  String get dsCMobileMissing => 'تظهر لقطات تطبيق الجوال هنا بعد تشغيل اختبارات Flutter المرجعية.';

  @override
  String get dsCDashboardTitle => 'نظرة سريعة على اليوم';

  @override
  String homeGreeting(String name) {
    return 'مرحبًا، $name';
  }

  @override
  String get summaryTitle => 'هذا الشهر';

  @override
  String get summaryPresent => 'أيام الحضور';

  @override
  String get summaryLate => 'مرات التأخير';

  @override
  String get summaryAbsent => 'أيام الغياب';

  @override
  String get summaryLeave => 'أيام الإجازة';

  @override
  String get summaryShort => 'أيام بساعات ناقصة';

  @override
  String get settingsLanguageToggle => 'EN';

  @override
  String get settingsSwitchLanguage => 'التبديل إلى الإنجليزية';

  @override
  String get navNotifications => 'الإشعارات';

  @override
  String get authTitle => 'تسجيل الدخول';

  @override
  String get authSubtitle => 'استخدم رقمك الوظيفي للمتابعة.';

  @override
  String get authSignIn => 'تسجيل الدخول';

  @override
  String get authUseCode => 'تسجيل الدخول برمز لمرة واحدة';

  @override
  String get authUsePassword => 'تسجيل الدخول بكلمة المرور';

  @override
  String get authSendCode => 'إرسال الرمز';

  @override
  String get authCodeLabel => 'الرمز المكوّن من 6 أرقام';

  @override
  String get authCodeSent => 'أرسلنا رمزًا إلى رقم جوالك المسجّل.';

  @override
  String authDevCode(String code) {
    return 'رمز التطوير: $code';
  }

  @override
  String get authForgot => 'نسيت كلمة المرور؟';

  @override
  String get authResetTitle => 'إعادة تعيين كلمة المرور';

  @override
  String get authResetDone => 'تم تحديث كلمة المرور. سجّل الدخول بكلمة المرور الجديدة.';

  @override
  String get authNewPassword => 'كلمة المرور الجديدة';

  @override
  String get authCurrentPassword => 'كلمة المرور الحالية';

  @override
  String get authPasswordRule => '10 أحرف على الأقل، تتضمن حروفًا وأرقامًا.';

  @override
  String get authChangeTitle => 'أنشئ كلمة مرور جديدة';

  @override
  String get authChangeBody => 'حفاظًا على أمانك، عيّن كلمة مرور خاصة بك قبل المتابعة.';

  @override
  String get authSaveContinue => 'حفظ ومتابعة';

  @override
  String get authSignOut => 'تسجيل الخروج';

  @override
  String get authSignOutConfirm => 'هل تريد تسجيل الخروج من زونة للمبيعات على هذا الجوال؟';

  @override
  String get errorINVALIDCREDENTIALS => 'الرقم الوظيفي أو كلمة المرور غير صحيحة.';

  @override
  String get errorACCOUNTLOCKED => 'محاولات كثيرة. حاول مرة أخرى بعد بضع دقائق.';

  @override
  String get errorOTPINVALID => 'الرمز غير صحيح أو انتهت صلاحيته.';

  @override
  String get errorOTPTOOSOON => 'انتظر دقيقة قبل طلب رمز آخر.';

  @override
  String get errorPASSWORDWEAK => 'استخدم 10 أحرف على الأقل تتضمن حروفًا وأرقامًا.';

  @override
  String get errorPASSWORDREUSED => 'اختر كلمة مرور مختلفة عن السابقة.';

  @override
  String get errorMOBILENOTALLOWED => 'هذا الحساب يستخدم بوابة الإدارة.';

  @override
  String get errorSESSIONENDED => 'انتهت جلستك. يرجى تسجيل الدخول مرة أخرى.';

  @override
  String errorOUTSIDEGEOFENCE(String distance, String site) {
    return 'أنت على بُعد $distance من $site. انتقل إلى نطاق العمل لتسجيل الحضور.';
  }

  @override
  String get errorONLEAVE => 'أنت في إجازة معتمدة اليوم.';

  @override
  String get errorALREADYCHECKEDIN => 'سجّلت حضورك اليوم بالفعل.';

  @override
  String get errorNOTCHECKEDIN => 'لم تسجّل حضورك بعد.';

  @override
  String get errorCONSENTREQUIRED => 'يرجى الموافقة على مشاركة الموقع أولًا.';

  @override
  String get errorLOCATIONPERMISSION => 'يلزم الوصول إلى الموقع لتسجيل الحضور.';

  @override
  String get errorLOCATIONUNAVAILABLE => 'تعذّر تحديد موقعك. انتقل إلى مكان مفتوح وحاول مرة أخرى.';

  @override
  String get errorNETWORK => 'أنت غير متصل. تحقّق من الاتصال وحاول مرة أخرى.';

  @override
  String get errorOVERLAP => 'لديك طلب إجازة لهذه التواريخ بالفعل.';

  @override
  String get errorCORRECTIONPENDING => 'يوجد طلب تصحيح لهذا اليوم قيد المراجعة.';

  @override
  String get errorMONTHFINALIZED => 'تم اعتماد هذا الشهر نهائيًا. تواصل مع مسؤول النظام لتعديله.';

  @override
  String get onboardingConsentTitle => 'مشاركة الموقع';

  @override
  String get onboardingConsentAccept => 'أوافق';

  @override
  String get onboardingPermTitle => 'السماح بالوصول إلى الموقع';

  @override
  String get onboardingPermBody =>
      'يحتاج زونة للمبيعات إلى خيار «السماح طوال الوقت» ليستمر تحديث موقعك أثناء تسجيل حضورك حتى عند إغلاق التطبيق، ولا يُجمع موقعك أبدًا بعد تسجيل الانصراف.';

  @override
  String get onboardingPermAllow => 'السماح بالموقع';

  @override
  String get onboardingPermOpenSettings => 'فتح الإعدادات';

  @override
  String get onboardingPermAlwaysNeeded => 'من الإعدادات، اختر الموقع ← «السماح طوال الوقت».';

  @override
  String get onboardingContinue => 'متابعة';

  @override
  String get homeLocating => 'جارٍ تحديد موقعك…';

  @override
  String get homeOffDay => 'اليوم إجازتك الأسبوعية.';

  @override
  String homeHoliday(String name) {
    return 'عطلة رسمية: $name';
  }

  @override
  String get homeOnLeave => 'أنت في إجازة معتمدة اليوم.';

  @override
  String get homeFlagged => 'أُحيل تسجيل حضورك إلى مسؤول النظام للمراجعة.';

  @override
  String get homeTrackingTitle => 'مشاركة الموقع مفعّلة';

  @override
  String get homeTrackingText => 'أنت مسجّل الحضور، وتتوقف المشاركة عند تسجيل الانصراف.';

  @override
  String homePending(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count تحديث موقع بانتظار الإرسال',
      many: '$count تحديثًا للموقع بانتظار الإرسال',
      few: '$count تحديثات موقع بانتظار الإرسال',
      two: 'تحديثا موقع بانتظار الإرسال',
      one: 'تحديث موقع واحد بانتظار الإرسال',
      zero: 'لا توجد تحديثات بانتظار الإرسال',
    );
    return '$_temp0';
  }

  @override
  String get catalogueAll => 'الكل';

  @override
  String get catalogueSearch => 'ابحث في المنتجات';

  @override
  String get catalogueEmpty => 'لا توجد منتجات مطابقة لبحثك';

  @override
  String get catalogueOffer => 'عرض';

  @override
  String catalogueValidUntil(String date) {
    return 'حتى $date';
  }

  @override
  String get catalogueShare => 'مشاركة';

  @override
  String get catalogueShareVia => 'المشاركة عبر';

  @override
  String get catalogueWhatsapp => 'واتساب';

  @override
  String get catalogueSms => 'رسالة نصية';

  @override
  String get catalogueEmail => 'البريد الإلكتروني';

  @override
  String get catalogueCopyLink => 'نسخ الرابط';

  @override
  String get catalogueMore => 'خيارات أخرى';

  @override
  String get catalogueRecipient => 'جهة اتصال العميل (اختياري)';

  @override
  String catalogueShareText(String name, String link) {
    return '$name\n$link';
  }

  @override
  String get catalogueLinkCopied => 'تم نسخ الرابط';

  @override
  String get catalogueShared => 'تمت المشاركة وتسجيلها';

  @override
  String get leaveNew => 'طلب جديد';

  @override
  String get leaveEmpty => 'لا توجد طلبات إجازة بعد';

  @override
  String get leaveType => 'النوع';

  @override
  String get leaveTypeLeave => 'إجازة';

  @override
  String get leaveTypeOffDay => 'يوم راحة';

  @override
  String get leaveFrom => 'من';

  @override
  String get leaveTo => 'إلى';

  @override
  String get leaveReason => 'السبب';

  @override
  String get leaveSubmit => 'إرسال الطلب';

  @override
  String get leaveCancelRequest => 'إلغاء الطلب';

  @override
  String get leaveStatusPending => 'قيد المراجعة';

  @override
  String get leaveStatusApproved => 'معتمد';

  @override
  String get leaveStatusRejected => 'مرفوض';

  @override
  String get leaveStatusCancelled => 'ملغى';

  @override
  String get leaveSubmitted => 'أُرسل الطلب إلى مسؤول النظام';

  @override
  String leaveDays(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count يوم',
      many: '$count يومًا',
      few: '$count أيام',
      two: 'يومان',
      one: 'يوم واحد',
      zero: 'لا أيام',
    );
    return '$_temp0';
  }

  @override
  String get profileSupervisor => 'المشرف';

  @override
  String get profileBranch => 'الفرع';

  @override
  String get profileMyAttendance => 'حضوري';

  @override
  String get profilePrivacy => 'الخصوصية';

  @override
  String profileVersion(String version) {
    return 'الإصدار $version';
  }

  @override
  String get attendanceRequestCorrection => 'طلب تصحيح';

  @override
  String get attendanceCorrectionPending => 'تصحيح قيد المراجعة';

  @override
  String get attendanceCorrectionSent => 'أُرسل طلب التصحيح';

  @override
  String get attendanceNoRecords => 'لا توجد سجلات حضور هذا الشهر';

  @override
  String get attendanceMissingCheckout => 'بلا انصراف';

  @override
  String get attendanceCorrectionReason => 'ما الذي يحتاج إلى تصحيح؟';

  @override
  String get notifyCheckedIn => 'سجّلت حضورك';

  @override
  String get notifyCheckedOut => 'سجّلت انصرافك';

  @override
  String get notifyCheckedOutShort => 'سجّلت انصرافك قبل اكتمال الساعات المطلوبة';

  @override
  String get notifyAutoCheckedOut => 'سُجّل انصرافك تلقائيًا بعد انتهاء الحد الأقصى للوردية';

  @override
  String get notifyLateWarning => 'سجّل حضورك قريبًا حتى لا تُحتسب متأخرًا';

  @override
  String get notifyHoursCompleted => 'أكملت ساعات العمل المطلوبة اليوم';

  @override
  String get notifyGeofenceExit => 'لقد غادرت نطاق العمل';

  @override
  String get notifyLeaveApproved => 'تمت الموافقة على طلب إجازتك';

  @override
  String get notifyLeaveRejected => 'رُفض طلب إجازتك';

  @override
  String get notifyCorrectionApproved => 'تمت الموافقة على طلب التصحيح';

  @override
  String get notifyCorrectionRejected => 'رُفض طلب التصحيح';

  @override
  String notifyFraudFlagged(String employeeId) {
    return 'تسجيل حضور للموظف $employeeId بحاجة إلى مراجعتك';
  }

  @override
  String get notificationsEmpty => 'لا توجد إشعارات جديدة';

  @override
  String get notificationsMarkAll => 'تحديد الكل كمقروء';

  @override
  String notifyNewContent(String name) {
    return 'جديد في الكتالوج: $name';
  }

  @override
  String get portalSignInTitle => 'تسجيل الدخول إلى بوابة الإدارة';

  @override
  String get portalSignInBody => 'لمسؤول النظام في زونة. يستخدم مندوبو المبيعات تطبيق زونة للمبيعات.';

  @override
  String get portalErrorPORTALNOTALLOWED => 'يستخدم مندوبو المبيعات تطبيق الجوال.';

  @override
  String portalSignedInAs(String name) {
    return 'مسجّل الدخول باسم $name';
  }

  @override
  String get portalRoleSuperAdmin => 'مسؤول النظام';

  @override
  String get portalRoleHrAdmin => 'مسؤول الموارد البشرية';

  @override
  String get portalRoleSalesSupervisor => 'مشرف مبيعات';

  @override
  String get portalRoleSalesRep => 'مندوب مبيعات';

  @override
  String get portalToday => 'اليوم';

  @override
  String get portalAllTeams => 'كل الفرق';

  @override
  String get portalAllStatuses => 'كل الحالات';

  @override
  String get portalNotCheckedIn => 'لم يسجّل الحضور';

  @override
  String get portalPendingReviews => 'حالات حضور مشتبه بها بانتظار المراجعة';

  @override
  String get portalPendingLeave => 'طلبات الإجازة';

  @override
  String get portalPendingCorrections => 'طلبات التصحيح';

  @override
  String get portalNeedsAttention => 'بحاجة إلى اهتمامك';

  @override
  String get portalLiveNow => 'مباشر الآن';

  @override
  String portalOnDutyCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count مندوب على رأس العمل',
      many: '$count مندوبًا على رأس العمل',
      few: '$count مندوبين على رأس العمل',
      two: 'مندوبان على رأس العمل',
      one: 'مندوب واحد على رأس العمل',
      zero: 'لا يوجد مندوبون على رأس العمل',
    );
    return '$_temp0';
  }

  @override
  String get portalNoOneOnDuty => 'لا يوجد أحد على رأس العمل حاليًا';

  @override
  String portalCheckedInAt(String time) {
    return 'سجّل الحضور $time';
  }

  @override
  String portalMinutesAgo(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: 'قبل $count دقيقة',
      many: 'قبل $count دقيقة',
      few: 'قبل $count دقائق',
      two: 'قبل دقيقتين',
      one: 'قبل دقيقة',
      zero: 'الآن',
    );
    return '$_temp0';
  }

  @override
  String get portalTrail => 'مسار اليوم';

  @override
  String portalTrailPoints(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count نقطة',
      many: '$count نقطة',
      few: '$count نقاط',
      two: 'نقطتان',
      one: 'نقطة واحدة',
      zero: 'لا نقاط',
    );
    return '$_temp0';
  }

  @override
  String get portalTabRegister => 'السجل';

  @override
  String get portalTabReviews => 'حالات الاشتباه';

  @override
  String get portalTabCorrections => 'التصحيحات';

  @override
  String get portalTabLeave => 'طلبات الإجازة';

  @override
  String get portalDetails => 'تفاصيل الحضور';

  @override
  String get portalStatusTrail => 'سجل الحالة';

  @override
  String get portalCauseCheckIn => 'تسجيل حضور';

  @override
  String get portalCauseCheckOut => 'تسجيل انصراف';

  @override
  String get portalCauseFraudFlagged => 'تعليم تلقائي';

  @override
  String get portalCauseReviewConfirmed => 'تأكيد التلاعب';

  @override
  String get portalCauseReviewCleared => 'اعتماد كحضور صحيح';

  @override
  String get portalCauseCorrectionApproved => 'اعتماد تصحيح';

  @override
  String get portalCauseLeaveApproved => 'اعتماد إجازة';

  @override
  String get portalCauseLeaveCancelled => 'إلغاء إجازة';

  @override
  String get portalCauseAbsentMarked => 'تسجيل غياب';

  @override
  String get portalCauseMonthCorrection => 'تصحيح نهاية الشهر';

  @override
  String get portalSystem => 'النظام';

  @override
  String get portalSignalMockLocation => 'كان تطبيق لتزييف الموقع مفعّلًا على الجهاز';

  @override
  String portalSignalGpsNetworkMismatch(String distance) {
    return 'المسافة بين موقع GPS وموقع الشبكة $distance';
  }

  @override
  String portalSignalImpossibleSpeed(String speed) {
    return 'تنقّل بسرعة $speed كم/س بين نقطتي تتبّع';
  }

  @override
  String get portalSignalRootedDevice => 'جهاز معدّل الصلاحيات أو محاكي';

  @override
  String portalSignalOutsideGeofence(String distance) {
    return 'خارج نطاق العمل بمسافة $distance';
  }

  @override
  String get portalNoPending => 'لا يوجد ما ينتظر المراجعة';

  @override
  String get portalRequested => 'المطلوب';

  @override
  String get portalCurrent => 'الحالي';

  @override
  String get portalApproveRemark => 'ملاحظة (اختيارية عند الاعتماد، ومطلوبة عند الرفض)';

  @override
  String get portalDecided => 'تم حفظ القرار';

  @override
  String get portalEmployeeSaved => 'تم حفظ بيانات الموظف';

  @override
  String portalEmployeeCreated(String password) {
    return 'تم إنشاء الموظف. كلمة المرور المؤقتة: $password';
  }

  @override
  String get portalEditEmployee => 'تعديل بيانات الموظف';

  @override
  String get portalNameEn => 'الاسم (بالإنجليزية)';

  @override
  String get portalNameAr => 'الاسم (بالعربية)';

  @override
  String get portalRole => 'الدور';

  @override
  String get portalStatus => 'الحالة';

  @override
  String get portalActive => 'نشط';

  @override
  String get portalInactive => 'غير نشط';

  @override
  String get portalDeactivate => 'إيقاف';

  @override
  String get portalActivate => 'تفعيل';

  @override
  String get portalShiftWindow => 'نافذة تسجيل الحضور';

  @override
  String portalShiftWindowValue(String from, String to) {
    return '$from – $to';
  }

  @override
  String get portalNoSupervisor => 'بلا مشرف';

  @override
  String get portalProducts => 'المنتجات والعروض';

  @override
  String get portalNewProduct => 'عنصر جديد';

  @override
  String get portalEditProduct => 'تعديل العنصر';

  @override
  String get portalItemType => 'النوع';

  @override
  String get portalTypeProduct => 'منتج';

  @override
  String get portalTypeOffer => 'عرض';

  @override
  String get portalTypePromo => 'ترويج';

  @override
  String get portalCategory => 'الفئة';

  @override
  String get portalDescriptionEn => 'الوصف (بالإنجليزية)';

  @override
  String get portalDescriptionAr => 'الوصف (بالعربية)';

  @override
  String get portalValidFrom => 'صالح من';

  @override
  String get portalValidTo => 'صالح حتى';

  @override
  String get portalPublish => 'نشر';

  @override
  String get portalUnpublish => 'إعادة إلى المسودة';

  @override
  String get portalArchive => 'أرشفة';

  @override
  String get portalContentDraft => 'مسودة';

  @override
  String get portalContentPublished => 'منشور';

  @override
  String get portalContentArchived => 'مؤرشف';

  @override
  String get portalShares => 'المشاركات';

  @override
  String get portalAttendanceRules => 'قواعد الحضور';

  @override
  String get portalRulesBody => 'القواعد مؤرّخة بتاريخ سريان: يُطبَّق التغيير من تاريخ بدئه ويُحتفظ بالسجل السابق لأغراض التدقيق.';

  @override
  String get portalNewRule => 'قاعدة جديدة';

  @override
  String get portalScope => 'ينطبق على';

  @override
  String get portalScopeGlobal => 'الجميع';

  @override
  String get portalRequiredHours => 'الساعات المطلوبة';

  @override
  String get portalGrace => 'مهلة السماح بعد آخر موعد للحضور';

  @override
  String get portalPingInterval => 'فترة تحديث الموقع';

  @override
  String get portalOutsideAction => 'خارج نطاق العمل';

  @override
  String get portalOutsideFlag => 'إحالة للمراجعة';

  @override
  String get portalOutsideBlock => 'منع تسجيل الحضور';

  @override
  String get portalEffectiveFrom => 'يسري من';

  @override
  String portalMinutesValue(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count دقيقة',
      many: '$count دقيقة',
      few: '$count دقائق',
      two: 'دقيقتان',
      one: 'دقيقة واحدة',
      zero: '$count دقيقة',
    );
    return '$_temp0';
  }

  @override
  String get portalGeofences => 'نطاقات العمل (السياج الجغرافي)';

  @override
  String get portalNewGeofence => 'نطاق عمل جديد';

  @override
  String get portalGeofenceHint => 'انقر على الخريطة لتحديد المركز، ثم حدّد نصف القطر.';

  @override
  String get portalRadius => 'نصف القطر';

  @override
  String get portalAssignedTo => 'مخصّص لـ';

  @override
  String get portalAssign => 'تخصيص';

  @override
  String get portalAssignBranch => 'فرع';

  @override
  String get portalAssignTeam => 'فريق';

  @override
  String get portalAssignEmployee => 'موظف';

  @override
  String get portalEndAssignment => 'إزالة';

  @override
  String get portalUnassigned => 'غير مخصّص';

  @override
  String get portalSharesReport => 'النشاط التسويقي';

  @override
  String get portalByProduct => 'حسب المنتج';

  @override
  String get portalByEmployee => 'حسب الموظف';

  @override
  String get portalByChannel => 'حسب القناة';

  @override
  String get portalChannelWhatsapp => 'واتساب';

  @override
  String get portalChannelSms => 'رسالة نصية';

  @override
  String get portalChannelEmail => 'البريد الإلكتروني';

  @override
  String get portalChannelLink => 'رابط';

  @override
  String get portalChannelOther => 'أخرى';

  @override
  String get portalNoData => 'لا توجد بيانات لهذه الفترة';

  @override
  String get portalFrom => 'من';

  @override
  String get portalTo => 'إلى';

  @override
  String get portalMonthlySummary => 'ملخص الحضور الشهري';

  @override
  String get portalComingPhase5 => 'تتوفر في المرحلة 5: الحساب والمراجعة والاعتماد والتصدير.';

  @override
  String get portalSignOut => 'تسجيل الخروج';

  @override
  String portalMinutesShort(String count) {
    return '$count د';
  }

  @override
  String get portalTabSummary => 'الملخص الشهري';

  @override
  String get portalMonth => 'الشهر';

  @override
  String get portalCompute => 'إعادة الحساب';

  @override
  String get portalFinalize => 'اعتماد الشهر نهائيًا';

  @override
  String get portalReopen => 'إعادة فتح الشهر';

  @override
  String get portalReopenReason => 'سبب إعادة الفتح';

  @override
  String get portalPeriodOpen => 'مفتوح';

  @override
  String get portalPeriodDraft => 'مسودة';

  @override
  String get portalPeriodFinalized => 'معتمد نهائيًا';

  @override
  String get portalPeriodReopened => 'أُعيد فتحه';

  @override
  String portalBlockedSuspected(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: 'يجب مراجعة $count حالة اشتباه قبل الاعتماد',
      many: 'يجب مراجعة $count حالة اشتباه قبل الاعتماد',
      few: 'يجب مراجعة $count حالات اشتباه قبل الاعتماد',
      two: 'يجب مراجعة حالتي اشتباه قبل الاعتماد',
      one: 'يجب مراجعة حالة اشتباه واحدة قبل الاعتماد',
      zero: 'لا توجد حالات اشتباه',
    );
    return '$_temp0';
  }

  @override
  String get portalExportCsv => 'CSV';

  @override
  String get portalExportExcel => 'Excel';

  @override
  String get portalExportPdf => 'طباعة / PDF';

  @override
  String get portalVersion => 'الإصدار';

  @override
  String get portalCorrectDay => 'تصحيح';

  @override
  String get portalNewStatus => 'الحالة الجديدة';

  @override
  String get portalCorrectionReason => 'السبب (مطلوب)';

  @override
  String get portalFinalizedNote => 'هذا الشهر مقفل، ويمكن لنظام الموارد البشرية قراءة هذه الأعداد الآن.';

  @override
  String get portalNotComputed => 'لم يُحسب بعد. اختر «إعادة الحساب».';

  @override
  String portalComputedAt(String time) {
    return 'حُسب في $time';
  }

  @override
  String portalDaysOf(String name) {
    return 'أيام $name';
  }

  @override
  String get errorSUSPECTEDPENDING => 'راجِع جميع حالات الاشتباه في هذا الشهر أولًا.';

  @override
  String get errorMONTHNOTENDED => 'لا يمكن اعتماد الشهر إلا بعد انتهائه.';

  @override
  String get errorUSEREVIEW => 'يُبتّ في حالات الاشتباه والتلاعب من خلال المراجعة.';

  @override
  String get errorCHECKINREQUIRED => 'لا يمكن تسجيل يوم بلا حضور إلا غيابًا.';

  @override
  String get errorNOTFINALIZED => 'هذا الشهر غير معتمد.';

  @override
  String get portalOrg => 'الهيكل التنظيمي';

  @override
  String get portalBranches => 'الفروع';

  @override
  String get portalTeams => 'الفرق';

  @override
  String get portalNewBranch => 'فرع جديد';

  @override
  String get portalNewTeam => 'فريق جديد';

  @override
  String get portalCode => 'الرمز';

  @override
  String get portalEdit => 'تعديل';

  @override
  String get portalHolidays => 'العطل الرسمية وأيام إجازة الشركة';

  @override
  String get portalHolidaysBody => 'تُستثنى العطل من احتساب الغياب. أضف تواريخ الأعياد كل عام بعد الإعلان عنها.';

  @override
  String get portalNewHoliday => 'إضافة عطلة';

  @override
  String get portalDate => 'التاريخ';

  @override
  String get portalAllBranches => 'كل الفروع';

  @override
  String get portalKindPublicHoliday => 'عطلة رسمية';

  @override
  String get portalKindCompanyOffDay => 'إجازة الشركة';

  @override
  String get portalResetPassword => 'إعادة تعيين كلمة المرور';

  @override
  String get portalTempPasswordTitle => 'كلمة مرور مؤقتة';

  @override
  String portalTempPasswordBody(String name) {
    return 'سلّمها إلى $name بشكل خاص، ويجب تغييرها عند تسجيل الدخول التالي. لن تُعرض مرة أخرى.';
  }

  @override
  String get portalCopy => 'نسخ';

  @override
  String get portalCopied => 'تم النسخ';

  @override
  String get portalSaved => 'تم الحفظ';

  @override
  String get errorHOLIDAYINPAST => 'العطل السابقة مرتبطة بسجلات حضور ولا يمكن حذفها.';

  @override
  String get errorEMPLOYEEEXISTS => 'يوجد موظف بهذا الرقم الوظيفي.';

  @override
  String get errorDUPLICATE => 'هذا العنصر موجود بالفعل.';

  @override
  String get authForgotAdmin => 'نسيت كلمة المرور؟ اطلب من مسؤول النظام إعادة تعيينها.';

  @override
  String get errorOTPUNAVAILABLE => 'رموز الدخول لمرة واحدة غير متاحة حالياً. اطلب من المسؤول إعادة تعيين كلمة المرور.';

  @override
  String get portalEmployeesBody => 'جميع الحسابات هنا لمندوبي مبيعات. أنت وحدك من ينشئ الحسابات وكلمات المرور، ولا يمكن للمندوبين التسجيل بأنفسهم.';

  @override
  String get credTitle => 'بيانات تسجيل الدخول';

  @override
  String credBody(String name) {
    return 'سلّم هذه البيانات إلى $name بشكل خاص، ولن تُعرض مرة أخرى.';
  }

  @override
  String get credMustChange => 'سيختار كلمة مرور خاصة به عند أول تسجيل دخول.';

  @override
  String get credKeep => 'سيستخدم كلمة المرور هذه إلى أن تعيد تعيينها.';

  @override
  String get credGenerate => 'إنشاء تلقائي';

  @override
  String get credAskChange => 'اطلب اختيار كلمة مرور جديدة عند أول تسجيل دخول';

  @override
  String credResetTitle(String name) {
    return 'إعادة تعيين كلمة مرور $name';
  }

  @override
  String get credResetBody => 'تنتهي جلسات الدخول الحالية فورًا.';

  @override
  String get errorADMINREQUIRED => 'لا يمكن إيقاف حساب مسؤول النظام.';

  @override
  String get errorNOTAREP => 'الأهداف مخصصة لمندوبي المبيعات فقط.';

  @override
  String get errorNOTONDUTY => 'سجّل حضورك أولًا، فالزيارات والطلبات تُسجَّل أثناء العمل.';

  @override
  String get errorINVALIDMONTH => 'اختر شهرًا صحيحًا.';

  @override
  String get navTargets => 'أهداف المبيعات';

  @override
  String get targetsBody => 'حدّد أهداف الزيارات والطلبات الشهرية. يسجّل المندوبون كل زيارة وطلب في تطبيق زونة للمبيعات أثناء العمل.';

  @override
  String get targetsSetAll => 'تعيين لجميع المندوبين';

  @override
  String get targetsSetSelected => 'تعيين هدف للمحددين';

  @override
  String get targetsSet => 'تعيين الهدف';

  @override
  String targetsSetFor(String name) {
    return 'هدف $name';
  }

  @override
  String get targetsRemove => 'إزالة الهدف';

  @override
  String get targetsVisits => 'الزيارات';

  @override
  String get targetsOrders => 'الطلبات';

  @override
  String get targetsVisitsTarget => 'هدف الزيارات';

  @override
  String get targetsOrdersTarget => 'هدف الطلبات';

  @override
  String get targetsNote => 'ملاحظة للمندوب';

  @override
  String get targetsOverwrite => 'استبدال الأهداف المحددة مسبقًا لهذا الشهر';

  @override
  String targetsProgress(String done, String target) {
    return '$done من $target';
  }

  @override
  String get targetsNoTarget => 'لا يوجد هدف';

  @override
  String targetsApplied(String applied, String skipped) {
    return 'تم تعيين الأهداف: $applied. محددة مسبقًا ولم تتغير: $skipped.';
  }

  @override
  String get targetsSaved => 'تم حفظ الهدف';

  @override
  String get targetsTabProgress => 'التقدّم';

  @override
  String get targetsTabLog => 'سجل الزيارات والطلبات';

  @override
  String get targetsKpiVisits => 'زيارات هذا الشهر';

  @override
  String get targetsKpiOrders => 'طلبات هذا الشهر';

  @override
  String get targetsKpiNoTarget => 'مندوبون بلا هدف';

  @override
  String get targetsKindVisit => 'زيارة';

  @override
  String get targetsKindOrder => 'طلب';

  @override
  String get targetsCustomer => 'العميل';

  @override
  String get targetsWhen => 'وقت التسجيل';

  @override
  String get targetsType => 'النوع';

  @override
  String get targetsVoid => 'إلغاء القيد';

  @override
  String get targetsVoidReason => 'السبب';

  @override
  String get targetsVoided => 'ملغى';

  @override
  String get targetsVoidTitle => 'إلغاء هذا القيد؟';

  @override
  String get targetsVoidBody => 'لن يُحتسب ضمن الهدف، ويبقى في السجل مع السبب الذي تذكره.';

  @override
  String get targetsEmptyLog => 'لا توجد زيارات أو طلبات مسجلة هذا الشهر';

  @override
  String get targetsEmptyLogBody => 'تظهر القيود هنا عندما يسجّلها المندوبون في التطبيق.';

  @override
  String targetsSelectedCount(String count) {
    return 'المندوبون المحددون: $count';
  }

  @override
  String get salesTitle => 'هدفي';

  @override
  String salesMonthTarget(String month) {
    return 'هدف شهر $month';
  }

  @override
  String get salesNone => 'لم يُحدَّد هدف لهذا الشهر بعد';

  @override
  String get salesNoneBody => 'يحدّد مسؤول النظام الأهداف الشهرية، ويمكنك تسجيل الزيارات والطلبات في كل الأحوال.';

  @override
  String get salesLogVisit => 'تسجيل زيارة';

  @override
  String get salesLogOrder => 'تسجيل طلب';

  @override
  String get salesCustomerHint => 'اسم المتجر أو العميل';

  @override
  String get salesNoteHint => 'ماذا حدث؟ (اختياري)';

  @override
  String get salesLogged => 'تم الحفظ';

  @override
  String get salesCheckInFirst => 'سجّل حضورك لتسجيل الزيارات والطلبات.';

  @override
  String get salesRecent => 'هذا الشهر';

  @override
  String get salesEmpty => 'لم يُسجَّل شيء هذا الشهر بعد';

  @override
  String salesRemaining(String count) {
    return 'متبقٍ: $count';
  }

  @override
  String get salesReached => 'تم تحقيق الهدف';

  @override
  String get salesViewAll => 'عرض الكل';

  @override
  String notifyTargetSet(String month) {
    return 'تم تحديد هدف مبيعاتك لشهر $month';
  }

  @override
  String get demoBadge => 'عرض تجريبي مباشر';

  @override
  String get demoBanner => 'عرض تجريبي مباشر — مندوبون افتراضيون يعملون الآن، وتُعاد البيانات كل ليلة.';

  @override
  String get demoGetIt => 'احصل على النظام لفريقك';

  @override
  String get demoSource => 'الشيفرة على GitHub';

  @override
  String get demoLoginTitle => 'جرّب العرض المباشر';

  @override
  String get demoLoginBody => 'استكشف النظام بصفتك مسؤول النظام. المندوبون الافتراضيون يسجّلون حضورهم ويتنقلون ويسجّلون الزيارات الآن — افتح الخريطة المباشرة.';

  @override
  String get demoSignIn => 'ادخل العرض التجريبي';

  @override
  String demoCredentials(String id, String password) {
    return 'مسؤول النظام $id · كلمة المرور $password';
  }

  @override
  String get demoBuiltBy => 'من تطوير محمد عبدالله وسيم';

  @override
  String demoAppHint(String id, String password) {
    return 'تجريبي: سجّل الدخول بـ $id وكلمة المرور $password. يُحال تسجيل الحضور من خارج مكتب الرياض للمراجعة — هذا هو فحص الاحتيال.';
  }

  @override
  String get demoUseDemo => 'تعبئة بيانات الدخول التجريبية';

  @override
  String get errorDEMOPROTECTED => 'الحسابات التجريبية مشتركة بين جميع الزوار ولا يمكن تغييرها. أنشئ موظفًا خاصًا بك لتجربة ذلك.';
}
