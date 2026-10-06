// ignore: unused_import
import 'package:intl/intl.dart' as intl;

import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appName => 'ZONA Sales';

  @override
  String get appPortal => 'Admin Portal';

  @override
  String get appBrandLabel => 'ZONA';

  @override
  String get navDashboard => 'Dashboard';

  @override
  String get navEmployees => 'Employees';

  @override
  String get navAttendance => 'Attendance';

  @override
  String get navLiveMap => 'Live map';

  @override
  String get navMarketing => 'Marketing';

  @override
  String get navReports => 'Reports';

  @override
  String get navSettings => 'Settings';

  @override
  String get navCollapse => 'Collapse sidebar';

  @override
  String get navExpand => 'Expand sidebar';

  @override
  String get navMain => 'Main navigation';

  @override
  String get navSearchPlaceholder => 'Search employees, IDs, products…';

  @override
  String get tabHome => 'Home';

  @override
  String get tabCatalogue => 'Catalogue';

  @override
  String get tabLeave => 'Leave';

  @override
  String get tabProfile => 'Profile';

  @override
  String get statusPresent => 'Present';

  @override
  String get statusLate => 'Late';

  @override
  String get statusAbsent => 'Absent';

  @override
  String get statusSuspectedFake => 'Suspected fake';

  @override
  String get statusConfirmedFake => 'Confirmed fake';

  @override
  String get statusOnLeave => 'On leave';

  @override
  String statusShortBy(String duration) {
    return 'Short by $duration';
  }

  @override
  String durationHm(String hours, String minutes) {
    return '${hours}h ${minutes}m';
  }

  @override
  String durationH(String hours) {
    return '${hours}h';
  }

  @override
  String get dayNotCheckedIn => 'Not checked in';

  @override
  String get dayOnDuty => 'On duty';

  @override
  String get dayOnBreak => 'On break';

  @override
  String get dayCheckedOut => 'Checked out';

  @override
  String get heroCheckIn => 'Check in';

  @override
  String get heroCheckOut => 'Check out';

  @override
  String heroCheckInHint(String site) {
    return 'Tap to check in at $site';
  }

  @override
  String heroWorkedOf(String worked, String required) {
    return '$worked of $required';
  }

  @override
  String heroRemaining(String duration) {
    return '$duration to go';
  }

  @override
  String get heroComplete => 'Required hours complete';

  @override
  String heroCheckedInAt(String time) {
    return 'Checked in at $time';
  }

  @override
  String get heroLocationOn => 'Location sharing is ON';

  @override
  String get heroLocationOnHint => 'Turns off automatically when you check out.';

  @override
  String get heroEarlyTitle => 'Check out early?';

  @override
  String heroEarlyBody(String worked, String required, String remaining) {
    return 'You have worked $worked. The required day is $required, so $remaining is left. Your day will be marked as short.';
  }

  @override
  String get heroEarlyConfirm => 'Check out anyway';

  @override
  String get heroKeepWorking => 'Keep working';

  @override
  String get actionSave => 'Save';

  @override
  String get actionCancel => 'Cancel';

  @override
  String get actionConfirm => 'Confirm';

  @override
  String get actionRetry => 'Try again';

  @override
  String get actionClose => 'Close';

  @override
  String get actionSearch => 'Search';

  @override
  String get actionFilter => 'Filter';

  @override
  String get actionColumns => 'Columns';

  @override
  String get actionExport => 'Export';

  @override
  String get actionActions => 'Actions';

  @override
  String get actionViewDetails => 'View details';

  @override
  String get actionViewTrail => 'View location trail';

  @override
  String get actionReview => 'Review';

  @override
  String get actionApprove => 'Approve';

  @override
  String get actionReject => 'Reject';

  @override
  String get actionDelete => 'Delete';

  @override
  String get actionSelectAll => 'Select all rows';

  @override
  String actionSelectRow(String name) {
    return 'Select $name';
  }

  @override
  String get actionShowMore => 'Show more';

  @override
  String get actionNewEmployee => 'New employee';

  @override
  String get actionDismiss => 'Dismiss notification';

  @override
  String get stateLoading => 'Loading…';

  @override
  String get stateErrorTitle => 'Something went wrong';

  @override
  String get stateErrorBody => 'We couldn\'t load this data. Check your connection and try again.';

  @override
  String get stateEmptyReviewTitle => 'No suspected check-ins';

  @override
  String get stateEmptyReviewBody => 'Flagged check-ins will appear here for review.';

  @override
  String get stateOfflineTitle => 'You\'re offline';

  @override
  String stateOfflineBody(String time) {
    return 'Showing data from $time. We\'ll refresh when you reconnect.';
  }

  @override
  String get stateNoResults => 'No employees match your filters';

  @override
  String get stateNoResultsBody => 'Try a different name, employee ID or team.';

  @override
  String get fieldEmail => 'Work email';

  @override
  String get fieldPhone => 'Mobile number';

  @override
  String get fieldEmployeeId => 'Employee ID';

  @override
  String get fieldPassword => 'Password';

  @override
  String get fieldTeam => 'Team';

  @override
  String get fieldTeamPlaceholder => 'Select a team';

  @override
  String get fieldRemark => 'Review remark';

  @override
  String get fieldRemarkHint => 'Required. Explain the evidence behind your decision.';

  @override
  String get fieldOptional => 'Optional';

  @override
  String get fieldRequired => 'Required';

  @override
  String get fieldErrorRequired => 'This field is required';

  @override
  String get fieldErrorPhone => 'Enter a valid Saudi mobile number, e.g. 05XXXXXXXX';

  @override
  String get fieldPhoneHint => 'We send one-time login codes to this number.';

  @override
  String get fieldSearchLabel => 'Search the register';

  @override
  String get teamRiyadhNorth => 'Riyadh North';

  @override
  String get teamJeddahCentral => 'Jeddah Central';

  @override
  String get teamDammamEast => 'Dammam East';

  @override
  String get tableEmployee => 'Employee';

  @override
  String get tableEmployeeId => 'Employee ID';

  @override
  String get tableTeam => 'Team';

  @override
  String get tableCheckIn => 'Check-in';

  @override
  String get tableCheckOut => 'Check-out';

  @override
  String get tableWorked => 'Worked';

  @override
  String get tableStatus => 'Status';

  @override
  String tableSelected(int count) {
    String _temp0 = intl.Intl.pluralLogic(count, locale: localeName, other: '$count selected', one: '$count selected');
    return '$_temp0';
  }

  @override
  String tableRows(int count) {
    String _temp0 = intl.Intl.pluralLogic(count, locale: localeName, other: '$count employees', one: '$count employee');
    return '$_temp0';
  }

  @override
  String get tableSortAsc => 'Sorted ascending';

  @override
  String get tableSortDesc => 'Sorted descending';

  @override
  String get tableNotSorted => 'Not sorted. Activate to sort.';

  @override
  String tableCaption(String date) {
    return 'Attendance register for $date';
  }

  @override
  String get reviewTitle => 'Review suspected fake check-in';

  @override
  String get reviewEvidence => 'Evidence';

  @override
  String get reviewSignalMock => 'A mock-location app was active on the device';

  @override
  String reviewSignalMismatch(String distance) {
    return 'GPS and network locations were $distance apart';
  }

  @override
  String reviewSignalSpeed(String distance, int minutes) {
    String _temp0 = intl.Intl.pluralLogic(minutes, locale: localeName, other: '$minutes minutes', one: '$minutes minute');
    return 'Moved $distance in $_temp0 — faster than possible by road';
  }

  @override
  String get reviewConfirmFake => 'Confirm as fake';

  @override
  String get reviewMarkGenuine => 'Mark as genuine';

  @override
  String get reviewAuditNote => 'Your decision is logged with your name. To change it later, re-open the month.';

  @override
  String toastCheckedIn(String time) {
    return 'Checked in at $time';
  }

  @override
  String get toastCheckedInBody => 'Location sharing stays on until you check out.';

  @override
  String get toastLeaveApproved => 'Leave approved';

  @override
  String toastLeaveApprovedBody(String name, String range) {
    return '$name is on leave $range.';
  }

  @override
  String toastOfflineQueued(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count location updates are saved and will be sent when you\'re back online.',
      one: '$count location update is saved and will be sent when you\'re back online.',
    );
    return '$_temp0';
  }

  @override
  String get toastGeofenceExit => 'You left your work area';

  @override
  String get toastGeofenceExitBody => 'Your administrator has been notified. Location sharing continues while you\'re on duty.';

  @override
  String get toastSaveFailed => 'Changes not saved';

  @override
  String get kpiOnDuty => 'On duty now';

  @override
  String get kpiNotCheckedIn => 'Not checked in';

  @override
  String get kpiLate => 'Late today';

  @override
  String get kpiSuspected => 'Suspected fake today';

  @override
  String kpiVsYesterday(String delta) {
    return '$delta vs yesterday';
  }

  @override
  String kpiOfTeam(String total) {
    return 'of $total scheduled';
  }

  @override
  String mapMarker(String name, String initials, String status, String time) {
    return '$name, $initials, $status, last update $time';
  }

  @override
  String mapCluster(int count) {
    String _temp0 = intl.Intl.pluralLogic(count, locale: localeName, other: '$count employees in this area', one: '$count employee in this area');
    return '$_temp0';
  }

  @override
  String get mapLegend => 'Map legend';

  @override
  String mapLastUpdate(String time) {
    return 'Updated $time';
  }

  @override
  String get settingsTheme => 'Theme';

  @override
  String get settingsThemeSystem => 'System';

  @override
  String get settingsThemeLight => 'Light';

  @override
  String get settingsThemeDark => 'Dark';

  @override
  String get settingsLanguage => 'Language';

  @override
  String get settingsLanguageEn => 'English';

  @override
  String get settingsLanguageAr => 'العربية';

  @override
  String get settingsDigits => 'Numbers';

  @override
  String get settingsDigitsWestern => '0-9';

  @override
  String get settingsDigitsArabic => '٠-٩';

  @override
  String get settingsHijri => 'Show Hijri date';

  @override
  String get dsTitle => 'Design system';

  @override
  String get dsSubtitle => 'Phase 0 review: every core component in English and Arabic, light and dark.';

  @override
  String get dsInterimLogo => 'Interim logo: extracted from the guidelines sheet at native resolution. Final assets need the vector masters.';

  @override
  String get dsBrand => 'Brand';

  @override
  String get dsColor => 'Colour';

  @override
  String get dsTypography => 'Typography';

  @override
  String get dsFoundations => 'Spacing, radius, elevation & motion';

  @override
  String get dsComponents => 'Components';

  @override
  String get dsMobile => 'Mobile components (Flutter)';

  @override
  String dsContrast(int count) {
    String _temp0 = intl.Intl.pluralLogic(count, locale: localeName, other: '$count contrast pairs pass WCAG AA', one: '$count contrast pair passes WCAG AA');
    return '$_temp0';
  }

  @override
  String get dsPreferences => 'Preferences';

  @override
  String get dsComboEnLight => 'English · Light';

  @override
  String get dsComboEnDark => 'English · Dark';

  @override
  String get dsComboArLight => 'Arabic · Light';

  @override
  String get dsComboArDark => 'Arabic · Dark';

  @override
  String get dsSampleName => 'Faisal Al-Harbi';

  @override
  String get dsSampleParagraph =>
      'Sales representatives check in once per day from an approved site. Location sharing runs only while they are on duty and stops at check-out.';

  @override
  String dsSampleBidi(String id, String email, String phone) {
    return 'Employee $id ($email) checked in from $phone.';
  }

  @override
  String dsSamplePlural(int count) {
    String _temp0 = intl.Intl.pluralLogic(count, locale: localeName, other: '$count visits today', one: '$count visit today');
    return '$_temp0';
  }

  @override
  String get dsSampleDateGregorian => 'Gregorian';

  @override
  String get dsSampleDateHijri => 'Hijri (Umm al-Qura)';

  @override
  String get dsSampleSite => 'Olaya branch';

  @override
  String get dsSkip => 'Skip to content';

  @override
  String get dsTryIt => 'Try it';

  @override
  String get dsScales => 'Brand scales';

  @override
  String get dsRoles => 'Semantic roles';

  @override
  String get dsStatusTokens => 'Attendance statuses';

  @override
  String get dsChart => 'Chart palette';

  @override
  String get dsChartNote => 'Validated for colour-blind separation in both themes. On light backgrounds, slots 3 to 5 need direct labels or a table view.';

  @override
  String dsTightest(String pair) {
    return 'Tightest pair: $pair';
  }

  @override
  String get dsSpacing => 'Spacing';

  @override
  String get dsRadius => 'Radius';

  @override
  String get dsElevation => 'Elevation';

  @override
  String get dsMotion => 'Motion';

  @override
  String get dsMotionNote => 'Every duration drops to 0 ms when the device asks for reduced motion.';

  @override
  String get dsNumerals => 'Numbers and dates';

  @override
  String get dsPlurals => 'Plural rules';

  @override
  String get dsBidi => 'Mixed-direction text';

  @override
  String get dsCButtons => 'Buttons';

  @override
  String get dsCForms => 'Form controls';

  @override
  String get dsCStatus => 'Status chips';

  @override
  String get dsCCards => 'Cards and KPI tiles';

  @override
  String get dsCTable => 'Data table';

  @override
  String get dsCShell => 'Sidebar and global search';

  @override
  String get dsCMap => 'Map markers';

  @override
  String get dsCDialog => 'Dialog';

  @override
  String get dsCToast => 'Toasts';

  @override
  String get dsCStates => 'Loading, empty, error and offline';

  @override
  String get dsCMobileNote => 'Rendered by Flutter golden tests from the same tokens and translations.';

  @override
  String get dsCMobileMissing => 'Mobile screenshots appear here after running the Flutter golden tests.';

  @override
  String get dsCDashboardTitle => 'Today at a glance';

  @override
  String homeGreeting(String name) {
    return 'Hello, $name';
  }

  @override
  String get summaryTitle => 'This month';

  @override
  String get summaryPresent => 'Days present';

  @override
  String get summaryLate => 'Late arrivals';

  @override
  String get summaryAbsent => 'Days absent';

  @override
  String get summaryLeave => 'Leave days';

  @override
  String get summaryShort => 'Short days';

  @override
  String get settingsLanguageToggle => 'ع';

  @override
  String get settingsSwitchLanguage => 'Switch to Arabic';

  @override
  String get navNotifications => 'Notifications';

  @override
  String get authTitle => 'Sign in';

  @override
  String get authSubtitle => 'Use your employee ID to continue.';

  @override
  String get authSignIn => 'Sign in';

  @override
  String get authUseCode => 'Sign in with a one-time code';

  @override
  String get authUsePassword => 'Sign in with password';

  @override
  String get authSendCode => 'Send code';

  @override
  String get authCodeLabel => '6-digit code';

  @override
  String get authCodeSent => 'We sent a code to your registered mobile number.';

  @override
  String authDevCode(String code) {
    return 'Development code: $code';
  }

  @override
  String get authForgot => 'Forgot password?';

  @override
  String get authResetTitle => 'Reset password';

  @override
  String get authResetDone => 'Password updated. Sign in with your new password.';

  @override
  String get authNewPassword => 'New password';

  @override
  String get authCurrentPassword => 'Current password';

  @override
  String get authPasswordRule => 'At least 10 characters, with letters and numbers.';

  @override
  String get authChangeTitle => 'Create a new password';

  @override
  String get authChangeBody => 'For your security, set your own password before you continue.';

  @override
  String get authSaveContinue => 'Save and continue';

  @override
  String get authSignOut => 'Sign out';

  @override
  String get authSignOutConfirm => 'Sign out of ZONA Sales on this phone?';

  @override
  String get errorINVALIDCREDENTIALS => 'Employee ID or password is incorrect.';

  @override
  String get errorACCOUNTLOCKED => 'Too many attempts. Try again in a few minutes.';

  @override
  String get errorOTPINVALID => 'The code is invalid or has expired.';

  @override
  String get errorOTPTOOSOON => 'Wait a minute before requesting another code.';

  @override
  String get errorPASSWORDWEAK => 'Use at least 10 characters with letters and numbers.';

  @override
  String get errorPASSWORDREUSED => 'Choose a password you haven\'t used here before.';

  @override
  String get errorMOBILENOTALLOWED => 'This account uses the admin portal.';

  @override
  String get errorSESSIONENDED => 'Your session has ended. Please sign in again.';

  @override
  String errorOUTSIDEGEOFENCE(String distance, String site) {
    return 'You are $distance from $site. Move inside your work area to check in.';
  }

  @override
  String get errorONLEAVE => 'You are on approved leave today.';

  @override
  String get errorALREADYCHECKEDIN => 'You have already checked in today.';

  @override
  String get errorNOTCHECKEDIN => 'You are not checked in.';

  @override
  String get errorCONSENTREQUIRED => 'Please accept location sharing first.';

  @override
  String get errorLOCATIONPERMISSION => 'Location access is needed to check in.';

  @override
  String get errorLOCATIONUNAVAILABLE => 'We couldn\'t get your location. Move to an open area and try again.';

  @override
  String get errorNETWORK => 'You\'re offline. Check your connection and try again.';

  @override
  String get errorOVERLAP => 'You already have a leave request for these dates.';

  @override
  String get errorCORRECTIONPENDING => 'A correction for this day is already waiting for review.';

  @override
  String get errorMONTHFINALIZED => 'This month is finalized. Contact your administrator to change it.';

  @override
  String get onboardingConsentTitle => 'Location sharing';

  @override
  String get onboardingConsentAccept => 'I agree';

  @override
  String get onboardingPermTitle => 'Allow location access';

  @override
  String get onboardingPermBody =>
      'ZONA Sales needs “Allow all the time” so your location keeps updating while you\'re checked in, even when the app is closed. It is never collected after you check out.';

  @override
  String get onboardingPermAllow => 'Allow location';

  @override
  String get onboardingPermOpenSettings => 'Open settings';

  @override
  String get onboardingPermAlwaysNeeded => 'In Settings, choose Location → “Allow all the time”.';

  @override
  String get onboardingContinue => 'Continue';

  @override
  String get homeLocating => 'Getting your location…';

  @override
  String get homeOffDay => 'Today is your day off.';

  @override
  String homeHoliday(String name) {
    return 'Public holiday: $name';
  }

  @override
  String get homeOnLeave => 'You\'re on approved leave today.';

  @override
  String get homeFlagged => 'Your check-in was sent to your administrator for review.';

  @override
  String get homeTrackingTitle => 'Location sharing is ON';

  @override
  String get homeTrackingText => 'You\'re checked in. Sharing stops when you check out.';

  @override
  String homePending(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count location updates waiting to send',
      one: '$count location update waiting to send',
    );
    return '$_temp0';
  }

  @override
  String get catalogueAll => 'All';

  @override
  String get catalogueSearch => 'Search products';

  @override
  String get catalogueEmpty => 'No products match your search';

  @override
  String get catalogueOffer => 'Offer';

  @override
  String catalogueValidUntil(String date) {
    return 'Until $date';
  }

  @override
  String get catalogueShare => 'Share';

  @override
  String get catalogueShareVia => 'Share via';

  @override
  String get catalogueWhatsapp => 'WhatsApp';

  @override
  String get catalogueSms => 'SMS';

  @override
  String get catalogueEmail => 'Email';

  @override
  String get catalogueCopyLink => 'Copy link';

  @override
  String get catalogueMore => 'More options';

  @override
  String get catalogueRecipient => 'Customer contact (optional)';

  @override
  String catalogueShareText(String name, String link) {
    return '$name\n$link';
  }

  @override
  String get catalogueLinkCopied => 'Link copied';

  @override
  String get catalogueShared => 'Shared and logged';

  @override
  String get leaveNew => 'New request';

  @override
  String get leaveEmpty => 'No leave requests yet';

  @override
  String get leaveType => 'Type';

  @override
  String get leaveTypeLeave => 'Leave';

  @override
  String get leaveTypeOffDay => 'Off day';

  @override
  String get leaveFrom => 'From';

  @override
  String get leaveTo => 'To';

  @override
  String get leaveReason => 'Reason';

  @override
  String get leaveSubmit => 'Submit request';

  @override
  String get leaveCancelRequest => 'Cancel request';

  @override
  String get leaveStatusPending => 'Pending';

  @override
  String get leaveStatusApproved => 'Approved';

  @override
  String get leaveStatusRejected => 'Rejected';

  @override
  String get leaveStatusCancelled => 'Cancelled';

  @override
  String get leaveSubmitted => 'Request sent to your administrator';

  @override
  String leaveDays(int count) {
    String _temp0 = intl.Intl.pluralLogic(count, locale: localeName, other: '$count days', one: '$count day');
    return '$_temp0';
  }

  @override
  String get profileSupervisor => 'Supervisor';

  @override
  String get profileBranch => 'Branch';

  @override
  String get profileMyAttendance => 'My attendance';

  @override
  String get profilePrivacy => 'Privacy';

  @override
  String profileVersion(String version) {
    return 'Version $version';
  }

  @override
  String get attendanceRequestCorrection => 'Request correction';

  @override
  String get attendanceCorrectionPending => 'Correction pending';

  @override
  String get attendanceCorrectionSent => 'Correction request sent';

  @override
  String get attendanceNoRecords => 'No attendance records this month';

  @override
  String get attendanceMissingCheckout => 'No check-out';

  @override
  String get attendanceCorrectionReason => 'What should be corrected?';

  @override
  String get notifyCheckedIn => 'You checked in';

  @override
  String get notifyCheckedOut => 'You checked out';

  @override
  String get notifyCheckedOutShort => 'You checked out before the required hours';

  @override
  String get notifyAutoCheckedOut => 'You were checked out automatically after the shift limit';

  @override
  String get notifyLateWarning => 'Check in soon to avoid being marked late';

  @override
  String get notifyHoursCompleted => 'You\'ve completed today\'s required hours';

  @override
  String get notifyGeofenceExit => 'You left your work area';

  @override
  String get notifyLeaveApproved => 'Your leave request was approved';

  @override
  String get notifyLeaveRejected => 'Your leave request was rejected';

  @override
  String get notifyCorrectionApproved => 'Your correction request was approved';

  @override
  String get notifyCorrectionRejected => 'Your correction request was rejected';

  @override
  String notifyFraudFlagged(String employeeId) {
    return 'A check-in by $employeeId needs your review';
  }

  @override
  String get notificationsEmpty => 'You\'re all caught up';

  @override
  String get notificationsMarkAll => 'Mark all as read';

  @override
  String notifyNewContent(String name) {
    return 'New in the catalogue: $name';
  }

  @override
  String get portalSignInTitle => 'Admin portal sign in';

  @override
  String get portalSignInBody => 'For the ZONA administrator. Sales representatives use the ZONA Sales app.';

  @override
  String get portalErrorPORTALNOTALLOWED => 'Sales representatives use the mobile app.';

  @override
  String portalSignedInAs(String name) {
    return 'Signed in as $name';
  }

  @override
  String get portalRoleSuperAdmin => 'Administrator';

  @override
  String get portalRoleHrAdmin => 'HR admin';

  @override
  String get portalRoleSalesSupervisor => 'Sales supervisor';

  @override
  String get portalRoleSalesRep => 'Sales representative';

  @override
  String get portalToday => 'Today';

  @override
  String get portalAllTeams => 'All teams';

  @override
  String get portalAllStatuses => 'All statuses';

  @override
  String get portalNotCheckedIn => 'Not checked in';

  @override
  String get portalPendingReviews => 'Suspected check-ins to review';

  @override
  String get portalPendingLeave => 'Leave requests';

  @override
  String get portalPendingCorrections => 'Correction requests';

  @override
  String get portalNeedsAttention => 'Needs your attention';

  @override
  String get portalLiveNow => 'Live now';

  @override
  String portalOnDutyCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(count, locale: localeName, other: '$count reps on duty', one: '$count rep on duty');
    return '$_temp0';
  }

  @override
  String get portalNoOneOnDuty => 'No one is on duty right now';

  @override
  String portalCheckedInAt(String time) {
    return 'Checked in $time';
  }

  @override
  String portalMinutesAgo(int count) {
    String _temp0 = intl.Intl.pluralLogic(count, locale: localeName, other: '$count min ago', one: '$count min ago', zero: 'just now');
    return '$_temp0';
  }

  @override
  String get portalTrail => 'Today\'s trail';

  @override
  String portalTrailPoints(int count) {
    String _temp0 = intl.Intl.pluralLogic(count, locale: localeName, other: '$count points', one: '$count point');
    return '$_temp0';
  }

  @override
  String get portalTabRegister => 'Register';

  @override
  String get portalTabReviews => 'Suspected check-ins';

  @override
  String get portalTabCorrections => 'Corrections';

  @override
  String get portalTabLeave => 'Leave requests';

  @override
  String get portalDetails => 'Attendance details';

  @override
  String get portalStatusTrail => 'Status history';

  @override
  String get portalCauseCheckIn => 'Checked in';

  @override
  String get portalCauseCheckOut => 'Checked out';

  @override
  String get portalCauseFraudFlagged => 'Flagged automatically';

  @override
  String get portalCauseReviewConfirmed => 'Confirmed as fake';

  @override
  String get portalCauseReviewCleared => 'Marked genuine';

  @override
  String get portalCauseCorrectionApproved => 'Correction approved';

  @override
  String get portalCauseLeaveApproved => 'Leave approved';

  @override
  String get portalCauseLeaveCancelled => 'Leave cancelled';

  @override
  String get portalCauseAbsentMarked => 'Marked absent';

  @override
  String get portalCauseMonthCorrection => 'Month-end correction';

  @override
  String get portalSystem => 'System';

  @override
  String get portalSignalMockLocation => 'A mock-location app was active on the device';

  @override
  String portalSignalGpsNetworkMismatch(String distance) {
    return 'GPS and network positions were $distance apart';
  }

  @override
  String portalSignalImpossibleSpeed(String speed) {
    return 'Moved at $speed km/h between pings';
  }

  @override
  String get portalSignalRootedDevice => 'Rooted, jailbroken or emulated device';

  @override
  String portalSignalOutsideGeofence(String distance) {
    return '$distance outside the work area';
  }

  @override
  String get portalNoPending => 'Nothing waiting for review';

  @override
  String get portalRequested => 'Requested';

  @override
  String get portalCurrent => 'Current';

  @override
  String get portalApproveRemark => 'Remark (optional for approval, required to reject)';

  @override
  String get portalDecided => 'Decision saved';

  @override
  String get portalEmployeeSaved => 'Employee saved';

  @override
  String portalEmployeeCreated(String password) {
    return 'Employee created. Temporary password: $password';
  }

  @override
  String get portalEditEmployee => 'Edit employee';

  @override
  String get portalNameEn => 'Name (English)';

  @override
  String get portalNameAr => 'Name (Arabic)';

  @override
  String get portalRole => 'Role';

  @override
  String get portalStatus => 'Status';

  @override
  String get portalActive => 'Active';

  @override
  String get portalInactive => 'Inactive';

  @override
  String get portalDeactivate => 'Deactivate';

  @override
  String get portalActivate => 'Activate';

  @override
  String get portalShiftWindow => 'Sign-in window';

  @override
  String portalShiftWindowValue(String from, String to) {
    return '$from – $to';
  }

  @override
  String get portalNoSupervisor => 'No supervisor';

  @override
  String get portalProducts => 'Products and offers';

  @override
  String get portalNewProduct => 'New item';

  @override
  String get portalEditProduct => 'Edit item';

  @override
  String get portalItemType => 'Type';

  @override
  String get portalTypeProduct => 'Product';

  @override
  String get portalTypeOffer => 'Offer';

  @override
  String get portalTypePromo => 'Promotion';

  @override
  String get portalCategory => 'Category';

  @override
  String get portalDescriptionEn => 'Description (English)';

  @override
  String get portalDescriptionAr => 'Description (Arabic)';

  @override
  String get portalValidFrom => 'Valid from';

  @override
  String get portalValidTo => 'Valid until';

  @override
  String get portalPublish => 'Publish';

  @override
  String get portalUnpublish => 'Move to draft';

  @override
  String get portalArchive => 'Archive';

  @override
  String get portalContentDraft => 'Draft';

  @override
  String get portalContentPublished => 'Published';

  @override
  String get portalContentArchived => 'Archived';

  @override
  String get portalShares => 'Shares';

  @override
  String get portalAttendanceRules => 'Attendance rules';

  @override
  String get portalRulesBody => 'Rules are effective-dated: a change applies from its start date and history is kept for audits.';

  @override
  String get portalNewRule => 'New rule';

  @override
  String get portalScope => 'Applies to';

  @override
  String get portalScopeGlobal => 'Everyone';

  @override
  String get portalRequiredHours => 'Required hours';

  @override
  String get portalGrace => 'Grace after latest start';

  @override
  String get portalPingInterval => 'Location update interval';

  @override
  String get portalOutsideAction => 'Outside the work area';

  @override
  String get portalOutsideFlag => 'Flag for review';

  @override
  String get portalOutsideBlock => 'Block check-in';

  @override
  String get portalEffectiveFrom => 'Effective from';

  @override
  String portalMinutesValue(int count) {
    String _temp0 = intl.Intl.pluralLogic(count, locale: localeName, other: '$count minutes', one: '$count minute');
    return '$_temp0';
  }

  @override
  String get portalGeofences => 'Work areas (geofences)';

  @override
  String get portalNewGeofence => 'New work area';

  @override
  String get portalGeofenceHint => 'Click the map to place the centre, then set the radius.';

  @override
  String get portalRadius => 'Radius';

  @override
  String get portalAssignedTo => 'Assigned to';

  @override
  String get portalAssign => 'Assign';

  @override
  String get portalAssignBranch => 'Branch';

  @override
  String get portalAssignTeam => 'Team';

  @override
  String get portalAssignEmployee => 'Employee';

  @override
  String get portalEndAssignment => 'Remove';

  @override
  String get portalUnassigned => 'Not assigned';

  @override
  String get portalSharesReport => 'Marketing activity';

  @override
  String get portalByProduct => 'By product';

  @override
  String get portalByEmployee => 'By employee';

  @override
  String get portalByChannel => 'By channel';

  @override
  String get portalChannelWhatsapp => 'WhatsApp';

  @override
  String get portalChannelSms => 'SMS';

  @override
  String get portalChannelEmail => 'Email';

  @override
  String get portalChannelLink => 'Link';

  @override
  String get portalChannelOther => 'Other';

  @override
  String get portalNoData => 'No data for this period';

  @override
  String get portalFrom => 'From';

  @override
  String get portalTo => 'To';

  @override
  String get portalMonthlySummary => 'Monthly attendance summary';

  @override
  String get portalComingPhase5 => 'Arrives in Phase 5: compute, review, finalize and export.';

  @override
  String get portalSignOut => 'Sign out';

  @override
  String portalMinutesShort(String count) {
    return '$count min';
  }

  @override
  String get portalTabSummary => 'Monthly summary';

  @override
  String get portalMonth => 'Month';

  @override
  String get portalCompute => 'Recalculate';

  @override
  String get portalFinalize => 'Finalize month';

  @override
  String get portalReopen => 'Re-open month';

  @override
  String get portalReopenReason => 'Reason for re-opening';

  @override
  String get portalPeriodOpen => 'Open';

  @override
  String get portalPeriodDraft => 'Draft';

  @override
  String get portalPeriodFinalized => 'Finalized';

  @override
  String get portalPeriodReopened => 'Re-opened';

  @override
  String portalBlockedSuspected(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count suspected check-ins must be reviewed before finalizing',
      one: '$count suspected check-in must be reviewed before finalizing',
    );
    return '$_temp0';
  }

  @override
  String get portalExportCsv => 'CSV';

  @override
  String get portalExportExcel => 'Excel';

  @override
  String get portalExportPdf => 'Print / PDF';

  @override
  String get portalVersion => 'Version';

  @override
  String get portalCorrectDay => 'Correct';

  @override
  String get portalNewStatus => 'New status';

  @override
  String get portalCorrectionReason => 'Reason (required)';

  @override
  String get portalFinalizedNote => 'This month is locked. HRMS can now read these counts.';

  @override
  String get portalNotComputed => 'Not calculated yet. Select Recalculate.';

  @override
  String portalComputedAt(String time) {
    return 'Calculated $time';
  }

  @override
  String portalDaysOf(String name) {
    return 'Days for $name';
  }

  @override
  String get errorSUSPECTEDPENDING => 'Review every suspected check-in in this month first.';

  @override
  String get errorMONTHNOTENDED => 'A month can be finalized only after it ends.';

  @override
  String get errorUSEREVIEW => 'Decide suspected or confirmed fakes through the review.';

  @override
  String get errorCHECKINREQUIRED => 'A day without a check-in can only be marked absent.';

  @override
  String get errorNOTFINALIZED => 'This month is not finalized.';

  @override
  String get portalOrg => 'Organisation';

  @override
  String get portalBranches => 'Branches';

  @override
  String get portalTeams => 'Teams';

  @override
  String get portalNewBranch => 'New branch';

  @override
  String get portalNewTeam => 'New team';

  @override
  String get portalCode => 'Code';

  @override
  String get portalEdit => 'Edit';

  @override
  String get portalHolidays => 'Holidays and company off days';

  @override
  String get portalHolidaysBody => 'Holidays are excluded from absence counts. Add Eid dates each year once they are announced.';

  @override
  String get portalNewHoliday => 'Add holiday';

  @override
  String get portalDate => 'Date';

  @override
  String get portalAllBranches => 'All branches';

  @override
  String get portalKindPublicHoliday => 'Public holiday';

  @override
  String get portalKindCompanyOffDay => 'Company off day';

  @override
  String get portalResetPassword => 'Reset password';

  @override
  String get portalTempPasswordTitle => 'Temporary password';

  @override
  String portalTempPasswordBody(String name) {
    return 'Give this to $name privately. They must change it at their next sign-in. It will not be shown again.';
  }

  @override
  String get portalCopy => 'Copy';

  @override
  String get portalCopied => 'Copied';

  @override
  String get portalSaved => 'Saved';

  @override
  String get errorHOLIDAYINPAST => 'Past holidays already affect recorded attendance and can\'t be removed.';

  @override
  String get errorEMPLOYEEEXISTS => 'An employee with this ID already exists.';

  @override
  String get errorDUPLICATE => 'This already exists.';

  @override
  String get authForgotAdmin => 'Forgot your password? Ask your administrator to reset it.';

  @override
  String get errorOTPUNAVAILABLE => 'One-time codes aren\'t available yet. Ask an administrator to reset your password.';

  @override
  String get portalEmployeesBody => 'Every account here is a sales rep. Only you create accounts and passwords — reps can\'t sign themselves up.';

  @override
  String get credTitle => 'Sign-in details';

  @override
  String credBody(String name) {
    return 'Give these to $name privately. They won\'t be shown again.';
  }

  @override
  String get credMustChange => 'They\'ll choose their own password at first sign-in.';

  @override
  String get credKeep => 'They\'ll keep using this password until you reset it.';

  @override
  String get credGenerate => 'Generate';

  @override
  String get credAskChange => 'Ask them to choose a new password at first sign-in';

  @override
  String credResetTitle(String name) {
    return 'Reset password for $name';
  }

  @override
  String get credResetBody => 'Their current sign-ins end immediately.';

  @override
  String get errorADMINREQUIRED => 'The administrator account can\'t be deactivated.';

  @override
  String get errorNOTAREP => 'Targets are for sales representatives only.';

  @override
  String get errorNOTONDUTY => 'Check in first — visits and orders are logged while you\'re on duty.';

  @override
  String get errorINVALIDMONTH => 'Choose a valid month.';

  @override
  String get navTargets => 'Sales targets';

  @override
  String get targetsBody => 'Set monthly visit and order targets. Reps log each visit and order in the ZONA Sales app while checked in.';

  @override
  String get targetsSetAll => 'Set for all reps';

  @override
  String get targetsSetSelected => 'Set target for selected';

  @override
  String get targetsSet => 'Set target';

  @override
  String targetsSetFor(String name) {
    return 'Target for $name';
  }

  @override
  String get targetsRemove => 'Remove target';

  @override
  String get targetsVisits => 'Visits';

  @override
  String get targetsOrders => 'Orders';

  @override
  String get targetsVisitsTarget => 'Visits target';

  @override
  String get targetsOrdersTarget => 'Orders target';

  @override
  String get targetsNote => 'Note for the rep';

  @override
  String get targetsOverwrite => 'Replace targets already set for this month';

  @override
  String targetsProgress(String done, String target) {
    return '$done of $target';
  }

  @override
  String get targetsNoTarget => 'No target';

  @override
  String targetsApplied(String applied, String skipped) {
    return 'Targets set: $applied. Already set and kept: $skipped.';
  }

  @override
  String get targetsSaved => 'Target saved';

  @override
  String get targetsTabProgress => 'Progress';

  @override
  String get targetsTabLog => 'Visits and orders log';

  @override
  String get targetsKpiVisits => 'Visits this month';

  @override
  String get targetsKpiOrders => 'Orders this month';

  @override
  String get targetsKpiNoTarget => 'Reps without a target';

  @override
  String get targetsKindVisit => 'Visit';

  @override
  String get targetsKindOrder => 'Order';

  @override
  String get targetsCustomer => 'Customer';

  @override
  String get targetsWhen => 'Logged at';

  @override
  String get targetsType => 'Type';

  @override
  String get targetsVoid => 'Void entry';

  @override
  String get targetsVoidReason => 'Reason';

  @override
  String get targetsVoided => 'Voided';

  @override
  String get targetsVoidTitle => 'Void this entry?';

  @override
  String get targetsVoidBody => 'It stops counting toward the target. The entry stays in the log with your reason.';

  @override
  String get targetsEmptyLog => 'No visits or orders logged this month';

  @override
  String get targetsEmptyLogBody => 'Entries appear here as reps log them in the app.';

  @override
  String targetsSelectedCount(String count) {
    return '$count selected reps';
  }

  @override
  String get salesTitle => 'My target';

  @override
  String salesMonthTarget(String month) {
    return 'Target for $month';
  }

  @override
  String get salesNone => 'No target set for this month yet';

  @override
  String get salesNoneBody => 'Your administrator sets monthly targets. You can still log visits and orders.';

  @override
  String get salesLogVisit => 'Log a visit';

  @override
  String get salesLogOrder => 'Log an order';

  @override
  String get salesCustomerHint => 'Shop or customer name';

  @override
  String get salesNoteHint => 'What happened? (optional)';

  @override
  String get salesLogged => 'Saved';

  @override
  String get salesCheckInFirst => 'Check in to log visits and orders.';

  @override
  String get salesRecent => 'This month';

  @override
  String get salesEmpty => 'Nothing logged yet this month';

  @override
  String salesRemaining(String count) {
    return '$count to go';
  }

  @override
  String get salesReached => 'Target reached';

  @override
  String get salesViewAll => 'View all';

  @override
  String notifyTargetSet(String month) {
    return 'Your sales target for $month has been set';
  }

  @override
  String get demoBadge => 'Live demo';

  @override
  String get demoBanner => 'Live demo — simulated reps are working right now; data resets every night.';

  @override
  String get demoGetIt => 'Get SFMS for your team';

  @override
  String get demoSource => 'Source on GitHub';

  @override
  String get demoLoginTitle => 'Try the live demo';

  @override
  String get demoLoginBody => 'Explore as the administrator. Simulated reps are checking in, driving routes and logging visits right now — open the live map.';

  @override
  String get demoSignIn => 'Enter the demo';

  @override
  String demoCredentials(String id, String password) {
    return 'Administrator $id · password $password';
  }

  @override
  String get demoBuiltBy => 'Built by Muhammad Abdullah Waseem';

  @override
  String demoAppHint(String id, String password) {
    return 'Demo: sign in as $id with password $password. Check-ins from outside the Riyadh office are flagged for review — that\'s the fraud check at work.';
  }

  @override
  String get demoUseDemo => 'Fill in demo sign-in';

  @override
  String get errorDEMOPROTECTED => 'Demo accounts are shared by every visitor, so they can\'t be changed. Create your own employee to try this.';
}
