import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_ar.dart';
import 'app_localizations_en.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale) : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  static const LocalizationsDelegate<AppLocalizations> delegate = _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates = <LocalizationsDelegate<dynamic>>[
    delegate,
    GlobalMaterialLocalizations.delegate,
    GlobalCupertinoLocalizations.delegate,
    GlobalWidgetsLocalizations.delegate,
  ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[Locale('ar'), Locale('en')];

  /// Short product name (app launcher, browser tab)
  ///
  /// In en, this message translates to:
  /// **'ZONA Sales'**
  String get appName;

  /// No description provided for @appPortal.
  ///
  /// In en, this message translates to:
  /// **'Admin Portal'**
  String get appPortal;

  /// Accessible name for the logo image
  ///
  /// In en, this message translates to:
  /// **'ZONA'**
  String get appBrandLabel;

  /// No description provided for @navDashboard.
  ///
  /// In en, this message translates to:
  /// **'Dashboard'**
  String get navDashboard;

  /// No description provided for @navEmployees.
  ///
  /// In en, this message translates to:
  /// **'Employees'**
  String get navEmployees;

  /// No description provided for @navAttendance.
  ///
  /// In en, this message translates to:
  /// **'Attendance'**
  String get navAttendance;

  /// No description provided for @navLiveMap.
  ///
  /// In en, this message translates to:
  /// **'Live map'**
  String get navLiveMap;

  /// No description provided for @navMarketing.
  ///
  /// In en, this message translates to:
  /// **'Marketing'**
  String get navMarketing;

  /// No description provided for @navReports.
  ///
  /// In en, this message translates to:
  /// **'Reports'**
  String get navReports;

  /// No description provided for @navSettings.
  ///
  /// In en, this message translates to:
  /// **'Settings'**
  String get navSettings;

  /// No description provided for @navCollapse.
  ///
  /// In en, this message translates to:
  /// **'Collapse sidebar'**
  String get navCollapse;

  /// No description provided for @navExpand.
  ///
  /// In en, this message translates to:
  /// **'Expand sidebar'**
  String get navExpand;

  /// No description provided for @navMain.
  ///
  /// In en, this message translates to:
  /// **'Main navigation'**
  String get navMain;

  /// No description provided for @navSearchPlaceholder.
  ///
  /// In en, this message translates to:
  /// **'Search employees, IDs, products…'**
  String get navSearchPlaceholder;

  /// Mobile bottom tab
  ///
  /// In en, this message translates to:
  /// **'Home'**
  String get tabHome;

  /// Mobile bottom tab
  ///
  /// In en, this message translates to:
  /// **'Catalogue'**
  String get tabCatalogue;

  /// Mobile bottom tab
  ///
  /// In en, this message translates to:
  /// **'Leave'**
  String get tabLeave;

  /// Mobile bottom tab
  ///
  /// In en, this message translates to:
  /// **'Profile'**
  String get tabProfile;

  /// No description provided for @statusPresent.
  ///
  /// In en, this message translates to:
  /// **'Present'**
  String get statusPresent;

  /// No description provided for @statusLate.
  ///
  /// In en, this message translates to:
  /// **'Late'**
  String get statusLate;

  /// No description provided for @statusAbsent.
  ///
  /// In en, this message translates to:
  /// **'Absent'**
  String get statusAbsent;

  /// Auto-flagged by fraud detection, waiting for human review
  ///
  /// In en, this message translates to:
  /// **'Suspected fake'**
  String get statusSuspectedFake;

  /// A reviewer confirmed the check-in was fraudulent
  ///
  /// In en, this message translates to:
  /// **'Confirmed fake'**
  String get statusConfirmedFake;

  /// No description provided for @statusOnLeave.
  ///
  /// In en, this message translates to:
  /// **'On leave'**
  String get statusOnLeave;

  /// Worked less than the required daily hours
  ///
  /// In en, this message translates to:
  /// **'Short by {duration}'**
  String statusShortBy(String duration);

  /// Hours and minutes, e.g. 7h 40m
  ///
  /// In en, this message translates to:
  /// **'{hours}h {minutes}m'**
  String durationHm(String hours, String minutes);

  /// Whole hours, e.g. 8h
  ///
  /// In en, this message translates to:
  /// **'{hours}h'**
  String durationH(String hours);

  /// No description provided for @dayNotCheckedIn.
  ///
  /// In en, this message translates to:
  /// **'Not checked in'**
  String get dayNotCheckedIn;

  /// No description provided for @dayOnDuty.
  ///
  /// In en, this message translates to:
  /// **'On duty'**
  String get dayOnDuty;

  /// No description provided for @dayOnBreak.
  ///
  /// In en, this message translates to:
  /// **'On break'**
  String get dayOnBreak;

  /// No description provided for @dayCheckedOut.
  ///
  /// In en, this message translates to:
  /// **'Checked out'**
  String get dayCheckedOut;

  /// No description provided for @heroCheckIn.
  ///
  /// In en, this message translates to:
  /// **'Check in'**
  String get heroCheckIn;

  /// No description provided for @heroCheckOut.
  ///
  /// In en, this message translates to:
  /// **'Check out'**
  String get heroCheckOut;

  /// No description provided for @heroCheckInHint.
  ///
  /// In en, this message translates to:
  /// **'Tap to check in at {site}'**
  String heroCheckInHint(String site);

  /// Worked time out of the required daily time
  ///
  /// In en, this message translates to:
  /// **'{worked} of {required}'**
  String heroWorkedOf(String worked, String required);

  /// No description provided for @heroRemaining.
  ///
  /// In en, this message translates to:
  /// **'{duration} to go'**
  String heroRemaining(String duration);

  /// No description provided for @heroComplete.
  ///
  /// In en, this message translates to:
  /// **'Required hours complete'**
  String get heroComplete;

  /// No description provided for @heroCheckedInAt.
  ///
  /// In en, this message translates to:
  /// **'Checked in at {time}'**
  String heroCheckedInAt(String time);

  /// No description provided for @heroLocationOn.
  ///
  /// In en, this message translates to:
  /// **'Location sharing is ON'**
  String get heroLocationOn;

  /// No description provided for @heroLocationOnHint.
  ///
  /// In en, this message translates to:
  /// **'Turns off automatically when you check out.'**
  String get heroLocationOnHint;

  /// No description provided for @heroEarlyTitle.
  ///
  /// In en, this message translates to:
  /// **'Check out early?'**
  String get heroEarlyTitle;

  /// No description provided for @heroEarlyBody.
  ///
  /// In en, this message translates to:
  /// **'You have worked {worked}. The required day is {required}, so {remaining} is left. Your day will be marked as short.'**
  String heroEarlyBody(String worked, String required, String remaining);

  /// No description provided for @heroEarlyConfirm.
  ///
  /// In en, this message translates to:
  /// **'Check out anyway'**
  String get heroEarlyConfirm;

  /// No description provided for @heroKeepWorking.
  ///
  /// In en, this message translates to:
  /// **'Keep working'**
  String get heroKeepWorking;

  /// No description provided for @actionSave.
  ///
  /// In en, this message translates to:
  /// **'Save'**
  String get actionSave;

  /// No description provided for @actionCancel.
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get actionCancel;

  /// No description provided for @actionConfirm.
  ///
  /// In en, this message translates to:
  /// **'Confirm'**
  String get actionConfirm;

  /// No description provided for @actionRetry.
  ///
  /// In en, this message translates to:
  /// **'Try again'**
  String get actionRetry;

  /// No description provided for @actionClose.
  ///
  /// In en, this message translates to:
  /// **'Close'**
  String get actionClose;

  /// No description provided for @actionSearch.
  ///
  /// In en, this message translates to:
  /// **'Search'**
  String get actionSearch;

  /// No description provided for @actionFilter.
  ///
  /// In en, this message translates to:
  /// **'Filter'**
  String get actionFilter;

  /// No description provided for @actionColumns.
  ///
  /// In en, this message translates to:
  /// **'Columns'**
  String get actionColumns;

  /// No description provided for @actionExport.
  ///
  /// In en, this message translates to:
  /// **'Export'**
  String get actionExport;

  /// No description provided for @actionActions.
  ///
  /// In en, this message translates to:
  /// **'Actions'**
  String get actionActions;

  /// No description provided for @actionViewDetails.
  ///
  /// In en, this message translates to:
  /// **'View details'**
  String get actionViewDetails;

  /// No description provided for @actionViewTrail.
  ///
  /// In en, this message translates to:
  /// **'View location trail'**
  String get actionViewTrail;

  /// No description provided for @actionReview.
  ///
  /// In en, this message translates to:
  /// **'Review'**
  String get actionReview;

  /// No description provided for @actionApprove.
  ///
  /// In en, this message translates to:
  /// **'Approve'**
  String get actionApprove;

  /// No description provided for @actionReject.
  ///
  /// In en, this message translates to:
  /// **'Reject'**
  String get actionReject;

  /// No description provided for @actionDelete.
  ///
  /// In en, this message translates to:
  /// **'Delete'**
  String get actionDelete;

  /// No description provided for @actionSelectAll.
  ///
  /// In en, this message translates to:
  /// **'Select all rows'**
  String get actionSelectAll;

  /// No description provided for @actionSelectRow.
  ///
  /// In en, this message translates to:
  /// **'Select {name}'**
  String actionSelectRow(String name);

  /// No description provided for @actionShowMore.
  ///
  /// In en, this message translates to:
  /// **'Show more'**
  String get actionShowMore;

  /// No description provided for @actionNewEmployee.
  ///
  /// In en, this message translates to:
  /// **'New employee'**
  String get actionNewEmployee;

  /// No description provided for @actionDismiss.
  ///
  /// In en, this message translates to:
  /// **'Dismiss notification'**
  String get actionDismiss;

  /// No description provided for @stateLoading.
  ///
  /// In en, this message translates to:
  /// **'Loading…'**
  String get stateLoading;

  /// No description provided for @stateErrorTitle.
  ///
  /// In en, this message translates to:
  /// **'Something went wrong'**
  String get stateErrorTitle;

  /// No description provided for @stateErrorBody.
  ///
  /// In en, this message translates to:
  /// **'We couldn\'t load this data. Check your connection and try again.'**
  String get stateErrorBody;

  /// No description provided for @stateEmptyReviewTitle.
  ///
  /// In en, this message translates to:
  /// **'No suspected check-ins'**
  String get stateEmptyReviewTitle;

  /// No description provided for @stateEmptyReviewBody.
  ///
  /// In en, this message translates to:
  /// **'Flagged check-ins will appear here for review.'**
  String get stateEmptyReviewBody;

  /// No description provided for @stateOfflineTitle.
  ///
  /// In en, this message translates to:
  /// **'You\'re offline'**
  String get stateOfflineTitle;

  /// No description provided for @stateOfflineBody.
  ///
  /// In en, this message translates to:
  /// **'Showing data from {time}. We\'ll refresh when you reconnect.'**
  String stateOfflineBody(String time);

  /// No description provided for @stateNoResults.
  ///
  /// In en, this message translates to:
  /// **'No employees match your filters'**
  String get stateNoResults;

  /// No description provided for @stateNoResultsBody.
  ///
  /// In en, this message translates to:
  /// **'Try a different name, employee ID or team.'**
  String get stateNoResultsBody;

  /// No description provided for @fieldEmail.
  ///
  /// In en, this message translates to:
  /// **'Work email'**
  String get fieldEmail;

  /// No description provided for @fieldPhone.
  ///
  /// In en, this message translates to:
  /// **'Mobile number'**
  String get fieldPhone;

  /// No description provided for @fieldEmployeeId.
  ///
  /// In en, this message translates to:
  /// **'Employee ID'**
  String get fieldEmployeeId;

  /// No description provided for @fieldPassword.
  ///
  /// In en, this message translates to:
  /// **'Password'**
  String get fieldPassword;

  /// No description provided for @fieldTeam.
  ///
  /// In en, this message translates to:
  /// **'Team'**
  String get fieldTeam;

  /// No description provided for @fieldTeamPlaceholder.
  ///
  /// In en, this message translates to:
  /// **'Select a team'**
  String get fieldTeamPlaceholder;

  /// No description provided for @fieldRemark.
  ///
  /// In en, this message translates to:
  /// **'Review remark'**
  String get fieldRemark;

  /// No description provided for @fieldRemarkHint.
  ///
  /// In en, this message translates to:
  /// **'Required. Explain the evidence behind your decision.'**
  String get fieldRemarkHint;

  /// No description provided for @fieldOptional.
  ///
  /// In en, this message translates to:
  /// **'Optional'**
  String get fieldOptional;

  /// No description provided for @fieldRequired.
  ///
  /// In en, this message translates to:
  /// **'Required'**
  String get fieldRequired;

  /// No description provided for @fieldErrorRequired.
  ///
  /// In en, this message translates to:
  /// **'This field is required'**
  String get fieldErrorRequired;

  /// No description provided for @fieldErrorPhone.
  ///
  /// In en, this message translates to:
  /// **'Enter a valid Saudi mobile number, e.g. 05XXXXXXXX'**
  String get fieldErrorPhone;

  /// No description provided for @fieldPhoneHint.
  ///
  /// In en, this message translates to:
  /// **'We send one-time login codes to this number.'**
  String get fieldPhoneHint;

  /// No description provided for @fieldSearchLabel.
  ///
  /// In en, this message translates to:
  /// **'Search the register'**
  String get fieldSearchLabel;

  /// No description provided for @teamRiyadhNorth.
  ///
  /// In en, this message translates to:
  /// **'Riyadh North'**
  String get teamRiyadhNorth;

  /// No description provided for @teamJeddahCentral.
  ///
  /// In en, this message translates to:
  /// **'Jeddah Central'**
  String get teamJeddahCentral;

  /// No description provided for @teamDammamEast.
  ///
  /// In en, this message translates to:
  /// **'Dammam East'**
  String get teamDammamEast;

  /// No description provided for @tableEmployee.
  ///
  /// In en, this message translates to:
  /// **'Employee'**
  String get tableEmployee;

  /// No description provided for @tableEmployeeId.
  ///
  /// In en, this message translates to:
  /// **'Employee ID'**
  String get tableEmployeeId;

  /// No description provided for @tableTeam.
  ///
  /// In en, this message translates to:
  /// **'Team'**
  String get tableTeam;

  /// No description provided for @tableCheckIn.
  ///
  /// In en, this message translates to:
  /// **'Check-in'**
  String get tableCheckIn;

  /// No description provided for @tableCheckOut.
  ///
  /// In en, this message translates to:
  /// **'Check-out'**
  String get tableCheckOut;

  /// No description provided for @tableWorked.
  ///
  /// In en, this message translates to:
  /// **'Worked'**
  String get tableWorked;

  /// No description provided for @tableStatus.
  ///
  /// In en, this message translates to:
  /// **'Status'**
  String get tableStatus;

  /// No description provided for @tableSelected.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, one {{count} selected} other {{count} selected}}'**
  String tableSelected(int count);

  /// No description provided for @tableRows.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, one {{count} employee} other {{count} employees}}'**
  String tableRows(int count);

  /// No description provided for @tableSortAsc.
  ///
  /// In en, this message translates to:
  /// **'Sorted ascending'**
  String get tableSortAsc;

  /// No description provided for @tableSortDesc.
  ///
  /// In en, this message translates to:
  /// **'Sorted descending'**
  String get tableSortDesc;

  /// No description provided for @tableNotSorted.
  ///
  /// In en, this message translates to:
  /// **'Not sorted. Activate to sort.'**
  String get tableNotSorted;

  /// No description provided for @tableCaption.
  ///
  /// In en, this message translates to:
  /// **'Attendance register for {date}'**
  String tableCaption(String date);

  /// No description provided for @reviewTitle.
  ///
  /// In en, this message translates to:
  /// **'Review suspected fake check-in'**
  String get reviewTitle;

  /// No description provided for @reviewEvidence.
  ///
  /// In en, this message translates to:
  /// **'Evidence'**
  String get reviewEvidence;

  /// No description provided for @reviewSignalMock.
  ///
  /// In en, this message translates to:
  /// **'A mock-location app was active on the device'**
  String get reviewSignalMock;

  /// No description provided for @reviewSignalMismatch.
  ///
  /// In en, this message translates to:
  /// **'GPS and network locations were {distance} apart'**
  String reviewSignalMismatch(String distance);

  /// No description provided for @reviewSignalSpeed.
  ///
  /// In en, this message translates to:
  /// **'Moved {distance} in {minutes, plural, one {{minutes} minute} other {{minutes} minutes}} — faster than possible by road'**
  String reviewSignalSpeed(String distance, int minutes);

  /// No description provided for @reviewConfirmFake.
  ///
  /// In en, this message translates to:
  /// **'Confirm as fake'**
  String get reviewConfirmFake;

  /// No description provided for @reviewMarkGenuine.
  ///
  /// In en, this message translates to:
  /// **'Mark as genuine'**
  String get reviewMarkGenuine;

  /// No description provided for @reviewAuditNote.
  ///
  /// In en, this message translates to:
  /// **'Your decision is logged with your name. To change it later, re-open the month.'**
  String get reviewAuditNote;

  /// No description provided for @toastCheckedIn.
  ///
  /// In en, this message translates to:
  /// **'Checked in at {time}'**
  String toastCheckedIn(String time);

  /// No description provided for @toastCheckedInBody.
  ///
  /// In en, this message translates to:
  /// **'Location sharing stays on until you check out.'**
  String get toastCheckedInBody;

  /// No description provided for @toastLeaveApproved.
  ///
  /// In en, this message translates to:
  /// **'Leave approved'**
  String get toastLeaveApproved;

  /// No description provided for @toastLeaveApprovedBody.
  ///
  /// In en, this message translates to:
  /// **'{name} is on leave {range}.'**
  String toastLeaveApprovedBody(String name, String range);

  /// No description provided for @toastOfflineQueued.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, one {{count} location update is saved and will be sent when you\'re back online.} other {{count} location updates are saved and will be sent when you\'re back online.}}'**
  String toastOfflineQueued(int count);

  /// No description provided for @toastGeofenceExit.
  ///
  /// In en, this message translates to:
  /// **'You left your work area'**
  String get toastGeofenceExit;

  /// No description provided for @toastGeofenceExitBody.
  ///
  /// In en, this message translates to:
  /// **'Your administrator has been notified. Location sharing continues while you\'re on duty.'**
  String get toastGeofenceExitBody;

  /// No description provided for @toastSaveFailed.
  ///
  /// In en, this message translates to:
  /// **'Changes not saved'**
  String get toastSaveFailed;

  /// No description provided for @kpiOnDuty.
  ///
  /// In en, this message translates to:
  /// **'On duty now'**
  String get kpiOnDuty;

  /// No description provided for @kpiNotCheckedIn.
  ///
  /// In en, this message translates to:
  /// **'Not checked in'**
  String get kpiNotCheckedIn;

  /// No description provided for @kpiLate.
  ///
  /// In en, this message translates to:
  /// **'Late today'**
  String get kpiLate;

  /// No description provided for @kpiSuspected.
  ///
  /// In en, this message translates to:
  /// **'Suspected fake today'**
  String get kpiSuspected;

  /// No description provided for @kpiVsYesterday.
  ///
  /// In en, this message translates to:
  /// **'{delta} vs yesterday'**
  String kpiVsYesterday(String delta);

  /// No description provided for @kpiOfTeam.
  ///
  /// In en, this message translates to:
  /// **'of {total} scheduled'**
  String kpiOfTeam(String total);

  /// Map marker accessible name. Must contain the visible initials (WCAG 2.5.3); avoid parentheses, which some checkers strip.
  ///
  /// In en, this message translates to:
  /// **'{name}, {initials}, {status}, last update {time}'**
  String mapMarker(String name, String initials, String status, String time);

  /// No description provided for @mapCluster.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, one {{count} employee in this area} other {{count} employees in this area}}'**
  String mapCluster(int count);

  /// No description provided for @mapLegend.
  ///
  /// In en, this message translates to:
  /// **'Map legend'**
  String get mapLegend;

  /// No description provided for @mapLastUpdate.
  ///
  /// In en, this message translates to:
  /// **'Updated {time}'**
  String mapLastUpdate(String time);

  /// No description provided for @settingsTheme.
  ///
  /// In en, this message translates to:
  /// **'Theme'**
  String get settingsTheme;

  /// No description provided for @settingsThemeSystem.
  ///
  /// In en, this message translates to:
  /// **'System'**
  String get settingsThemeSystem;

  /// No description provided for @settingsThemeLight.
  ///
  /// In en, this message translates to:
  /// **'Light'**
  String get settingsThemeLight;

  /// No description provided for @settingsThemeDark.
  ///
  /// In en, this message translates to:
  /// **'Dark'**
  String get settingsThemeDark;

  /// No description provided for @settingsLanguage.
  ///
  /// In en, this message translates to:
  /// **'Language'**
  String get settingsLanguage;

  /// Always shown in its own language
  ///
  /// In en, this message translates to:
  /// **'English'**
  String get settingsLanguageEn;

  /// Always shown in its own language
  ///
  /// In en, this message translates to:
  /// **'العربية'**
  String get settingsLanguageAr;

  /// No description provided for @settingsDigits.
  ///
  /// In en, this message translates to:
  /// **'Numbers'**
  String get settingsDigits;

  /// No description provided for @settingsDigitsWestern.
  ///
  /// In en, this message translates to:
  /// **'0-9'**
  String get settingsDigitsWestern;

  /// No description provided for @settingsDigitsArabic.
  ///
  /// In en, this message translates to:
  /// **'٠-٩'**
  String get settingsDigitsArabic;

  /// No description provided for @settingsHijri.
  ///
  /// In en, this message translates to:
  /// **'Show Hijri date'**
  String get settingsHijri;

  /// No description provided for @dsTitle.
  ///
  /// In en, this message translates to:
  /// **'Design system'**
  String get dsTitle;

  /// No description provided for @dsSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Phase 0 review: every core component in English and Arabic, light and dark.'**
  String get dsSubtitle;

  /// No description provided for @dsInterimLogo.
  ///
  /// In en, this message translates to:
  /// **'Interim logo: extracted from the guidelines sheet at native resolution. Final assets need the vector masters.'**
  String get dsInterimLogo;

  /// No description provided for @dsBrand.
  ///
  /// In en, this message translates to:
  /// **'Brand'**
  String get dsBrand;

  /// No description provided for @dsColor.
  ///
  /// In en, this message translates to:
  /// **'Colour'**
  String get dsColor;

  /// No description provided for @dsTypography.
  ///
  /// In en, this message translates to:
  /// **'Typography'**
  String get dsTypography;

  /// No description provided for @dsFoundations.
  ///
  /// In en, this message translates to:
  /// **'Spacing, radius, elevation & motion'**
  String get dsFoundations;

  /// No description provided for @dsComponents.
  ///
  /// In en, this message translates to:
  /// **'Components'**
  String get dsComponents;

  /// No description provided for @dsMobile.
  ///
  /// In en, this message translates to:
  /// **'Mobile components (Flutter)'**
  String get dsMobile;

  /// No description provided for @dsContrast.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, one {{count} contrast pair passes WCAG AA} other {{count} contrast pairs pass WCAG AA}}'**
  String dsContrast(int count);

  /// No description provided for @dsPreferences.
  ///
  /// In en, this message translates to:
  /// **'Preferences'**
  String get dsPreferences;

  /// No description provided for @dsComboEnLight.
  ///
  /// In en, this message translates to:
  /// **'English · Light'**
  String get dsComboEnLight;

  /// No description provided for @dsComboEnDark.
  ///
  /// In en, this message translates to:
  /// **'English · Dark'**
  String get dsComboEnDark;

  /// No description provided for @dsComboArLight.
  ///
  /// In en, this message translates to:
  /// **'Arabic · Light'**
  String get dsComboArLight;

  /// No description provided for @dsComboArDark.
  ///
  /// In en, this message translates to:
  /// **'Arabic · Dark'**
  String get dsComboArDark;

  /// Sample employee name
  ///
  /// In en, this message translates to:
  /// **'Faisal Al-Harbi'**
  String get dsSampleName;

  /// No description provided for @dsSampleParagraph.
  ///
  /// In en, this message translates to:
  /// **'Sales representatives check in once per day from an approved site. Location sharing runs only while they are on duty and stops at check-out.'**
  String get dsSampleParagraph;

  /// No description provided for @dsSampleBidi.
  ///
  /// In en, this message translates to:
  /// **'Employee {id} ({email}) checked in from {phone}.'**
  String dsSampleBidi(String id, String email, String phone);

  /// No description provided for @dsSamplePlural.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, one {{count} visit today} other {{count} visits today}}'**
  String dsSamplePlural(int count);

  /// No description provided for @dsSampleDateGregorian.
  ///
  /// In en, this message translates to:
  /// **'Gregorian'**
  String get dsSampleDateGregorian;

  /// No description provided for @dsSampleDateHijri.
  ///
  /// In en, this message translates to:
  /// **'Hijri (Umm al-Qura)'**
  String get dsSampleDateHijri;

  /// No description provided for @dsSampleSite.
  ///
  /// In en, this message translates to:
  /// **'Olaya branch'**
  String get dsSampleSite;

  /// No description provided for @dsSkip.
  ///
  /// In en, this message translates to:
  /// **'Skip to content'**
  String get dsSkip;

  /// No description provided for @dsTryIt.
  ///
  /// In en, this message translates to:
  /// **'Try it'**
  String get dsTryIt;

  /// No description provided for @dsScales.
  ///
  /// In en, this message translates to:
  /// **'Brand scales'**
  String get dsScales;

  /// No description provided for @dsRoles.
  ///
  /// In en, this message translates to:
  /// **'Semantic roles'**
  String get dsRoles;

  /// No description provided for @dsStatusTokens.
  ///
  /// In en, this message translates to:
  /// **'Attendance statuses'**
  String get dsStatusTokens;

  /// No description provided for @dsChart.
  ///
  /// In en, this message translates to:
  /// **'Chart palette'**
  String get dsChart;

  /// No description provided for @dsChartNote.
  ///
  /// In en, this message translates to:
  /// **'Validated for colour-blind separation in both themes. On light backgrounds, slots 3 to 5 need direct labels or a table view.'**
  String get dsChartNote;

  /// No description provided for @dsTightest.
  ///
  /// In en, this message translates to:
  /// **'Tightest pair: {pair}'**
  String dsTightest(String pair);

  /// No description provided for @dsSpacing.
  ///
  /// In en, this message translates to:
  /// **'Spacing'**
  String get dsSpacing;

  /// No description provided for @dsRadius.
  ///
  /// In en, this message translates to:
  /// **'Radius'**
  String get dsRadius;

  /// No description provided for @dsElevation.
  ///
  /// In en, this message translates to:
  /// **'Elevation'**
  String get dsElevation;

  /// No description provided for @dsMotion.
  ///
  /// In en, this message translates to:
  /// **'Motion'**
  String get dsMotion;

  /// No description provided for @dsMotionNote.
  ///
  /// In en, this message translates to:
  /// **'Every duration drops to 0 ms when the device asks for reduced motion.'**
  String get dsMotionNote;

  /// No description provided for @dsNumerals.
  ///
  /// In en, this message translates to:
  /// **'Numbers and dates'**
  String get dsNumerals;

  /// No description provided for @dsPlurals.
  ///
  /// In en, this message translates to:
  /// **'Plural rules'**
  String get dsPlurals;

  /// No description provided for @dsBidi.
  ///
  /// In en, this message translates to:
  /// **'Mixed-direction text'**
  String get dsBidi;

  /// No description provided for @dsCButtons.
  ///
  /// In en, this message translates to:
  /// **'Buttons'**
  String get dsCButtons;

  /// No description provided for @dsCForms.
  ///
  /// In en, this message translates to:
  /// **'Form controls'**
  String get dsCForms;

  /// No description provided for @dsCStatus.
  ///
  /// In en, this message translates to:
  /// **'Status chips'**
  String get dsCStatus;

  /// No description provided for @dsCCards.
  ///
  /// In en, this message translates to:
  /// **'Cards and KPI tiles'**
  String get dsCCards;

  /// No description provided for @dsCTable.
  ///
  /// In en, this message translates to:
  /// **'Data table'**
  String get dsCTable;

  /// No description provided for @dsCShell.
  ///
  /// In en, this message translates to:
  /// **'Sidebar and global search'**
  String get dsCShell;

  /// No description provided for @dsCMap.
  ///
  /// In en, this message translates to:
  /// **'Map markers'**
  String get dsCMap;

  /// No description provided for @dsCDialog.
  ///
  /// In en, this message translates to:
  /// **'Dialog'**
  String get dsCDialog;

  /// No description provided for @dsCToast.
  ///
  /// In en, this message translates to:
  /// **'Toasts'**
  String get dsCToast;

  /// No description provided for @dsCStates.
  ///
  /// In en, this message translates to:
  /// **'Loading, empty, error and offline'**
  String get dsCStates;

  /// No description provided for @dsCMobileNote.
  ///
  /// In en, this message translates to:
  /// **'Rendered by Flutter golden tests from the same tokens and translations.'**
  String get dsCMobileNote;

  /// No description provided for @dsCMobileMissing.
  ///
  /// In en, this message translates to:
  /// **'Mobile screenshots appear here after running the Flutter golden tests.'**
  String get dsCMobileMissing;

  /// No description provided for @dsCDashboardTitle.
  ///
  /// In en, this message translates to:
  /// **'Today at a glance'**
  String get dsCDashboardTitle;

  /// No description provided for @homeGreeting.
  ///
  /// In en, this message translates to:
  /// **'Hello, {name}'**
  String homeGreeting(String name);

  /// No description provided for @summaryTitle.
  ///
  /// In en, this message translates to:
  /// **'This month'**
  String get summaryTitle;

  /// No description provided for @summaryPresent.
  ///
  /// In en, this message translates to:
  /// **'Days present'**
  String get summaryPresent;

  /// No description provided for @summaryLate.
  ///
  /// In en, this message translates to:
  /// **'Late arrivals'**
  String get summaryLate;

  /// No description provided for @summaryAbsent.
  ///
  /// In en, this message translates to:
  /// **'Days absent'**
  String get summaryAbsent;

  /// No description provided for @summaryLeave.
  ///
  /// In en, this message translates to:
  /// **'Leave days'**
  String get summaryLeave;

  /// No description provided for @summaryShort.
  ///
  /// In en, this message translates to:
  /// **'Short days'**
  String get summaryShort;

  /// Compact header toggle label: the OTHER language, in its own script
  ///
  /// In en, this message translates to:
  /// **'ع'**
  String get settingsLanguageToggle;

  /// No description provided for @settingsSwitchLanguage.
  ///
  /// In en, this message translates to:
  /// **'Switch to Arabic'**
  String get settingsSwitchLanguage;

  /// No description provided for @navNotifications.
  ///
  /// In en, this message translates to:
  /// **'Notifications'**
  String get navNotifications;

  /// No description provided for @authTitle.
  ///
  /// In en, this message translates to:
  /// **'Sign in'**
  String get authTitle;

  /// No description provided for @authSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Use your employee ID to continue.'**
  String get authSubtitle;

  /// No description provided for @authSignIn.
  ///
  /// In en, this message translates to:
  /// **'Sign in'**
  String get authSignIn;

  /// No description provided for @authUseCode.
  ///
  /// In en, this message translates to:
  /// **'Sign in with a one-time code'**
  String get authUseCode;

  /// No description provided for @authUsePassword.
  ///
  /// In en, this message translates to:
  /// **'Sign in with password'**
  String get authUsePassword;

  /// No description provided for @authSendCode.
  ///
  /// In en, this message translates to:
  /// **'Send code'**
  String get authSendCode;

  /// No description provided for @authCodeLabel.
  ///
  /// In en, this message translates to:
  /// **'6-digit code'**
  String get authCodeLabel;

  /// No description provided for @authCodeSent.
  ///
  /// In en, this message translates to:
  /// **'We sent a code to your registered mobile number.'**
  String get authCodeSent;

  /// No description provided for @authDevCode.
  ///
  /// In en, this message translates to:
  /// **'Development code: {code}'**
  String authDevCode(String code);

  /// No description provided for @authForgot.
  ///
  /// In en, this message translates to:
  /// **'Forgot password?'**
  String get authForgot;

  /// No description provided for @authResetTitle.
  ///
  /// In en, this message translates to:
  /// **'Reset password'**
  String get authResetTitle;

  /// No description provided for @authResetDone.
  ///
  /// In en, this message translates to:
  /// **'Password updated. Sign in with your new password.'**
  String get authResetDone;

  /// No description provided for @authNewPassword.
  ///
  /// In en, this message translates to:
  /// **'New password'**
  String get authNewPassword;

  /// No description provided for @authCurrentPassword.
  ///
  /// In en, this message translates to:
  /// **'Current password'**
  String get authCurrentPassword;

  /// No description provided for @authPasswordRule.
  ///
  /// In en, this message translates to:
  /// **'At least 10 characters, with letters and numbers.'**
  String get authPasswordRule;

  /// No description provided for @authChangeTitle.
  ///
  /// In en, this message translates to:
  /// **'Create a new password'**
  String get authChangeTitle;

  /// No description provided for @authChangeBody.
  ///
  /// In en, this message translates to:
  /// **'For your security, set your own password before you continue.'**
  String get authChangeBody;

  /// No description provided for @authSaveContinue.
  ///
  /// In en, this message translates to:
  /// **'Save and continue'**
  String get authSaveContinue;

  /// No description provided for @authSignOut.
  ///
  /// In en, this message translates to:
  /// **'Sign out'**
  String get authSignOut;

  /// No description provided for @authSignOutConfirm.
  ///
  /// In en, this message translates to:
  /// **'Sign out of ZONA Sales on this phone?'**
  String get authSignOutConfirm;

  /// No description provided for @errorINVALIDCREDENTIALS.
  ///
  /// In en, this message translates to:
  /// **'Employee ID or password is incorrect.'**
  String get errorINVALIDCREDENTIALS;

  /// No description provided for @errorACCOUNTLOCKED.
  ///
  /// In en, this message translates to:
  /// **'Too many attempts. Try again in a few minutes.'**
  String get errorACCOUNTLOCKED;

  /// No description provided for @errorOTPINVALID.
  ///
  /// In en, this message translates to:
  /// **'The code is invalid or has expired.'**
  String get errorOTPINVALID;

  /// No description provided for @errorOTPTOOSOON.
  ///
  /// In en, this message translates to:
  /// **'Wait a minute before requesting another code.'**
  String get errorOTPTOOSOON;

  /// No description provided for @errorPASSWORDWEAK.
  ///
  /// In en, this message translates to:
  /// **'Use at least 10 characters with letters and numbers.'**
  String get errorPASSWORDWEAK;

  /// No description provided for @errorPASSWORDREUSED.
  ///
  /// In en, this message translates to:
  /// **'Choose a password you haven\'t used here before.'**
  String get errorPASSWORDREUSED;

  /// No description provided for @errorMOBILENOTALLOWED.
  ///
  /// In en, this message translates to:
  /// **'This account uses the admin portal.'**
  String get errorMOBILENOTALLOWED;

  /// No description provided for @errorSESSIONENDED.
  ///
  /// In en, this message translates to:
  /// **'Your session has ended. Please sign in again.'**
  String get errorSESSIONENDED;

  /// No description provided for @errorOUTSIDEGEOFENCE.
  ///
  /// In en, this message translates to:
  /// **'You are {distance} from {site}. Move inside your work area to check in.'**
  String errorOUTSIDEGEOFENCE(String distance, String site);

  /// No description provided for @errorONLEAVE.
  ///
  /// In en, this message translates to:
  /// **'You are on approved leave today.'**
  String get errorONLEAVE;

  /// No description provided for @errorALREADYCHECKEDIN.
  ///
  /// In en, this message translates to:
  /// **'You have already checked in today.'**
  String get errorALREADYCHECKEDIN;

  /// No description provided for @errorNOTCHECKEDIN.
  ///
  /// In en, this message translates to:
  /// **'You are not checked in.'**
  String get errorNOTCHECKEDIN;

  /// No description provided for @errorCONSENTREQUIRED.
  ///
  /// In en, this message translates to:
  /// **'Please accept location sharing first.'**
  String get errorCONSENTREQUIRED;

  /// No description provided for @errorLOCATIONPERMISSION.
  ///
  /// In en, this message translates to:
  /// **'Location access is needed to check in.'**
  String get errorLOCATIONPERMISSION;

  /// No description provided for @errorLOCATIONUNAVAILABLE.
  ///
  /// In en, this message translates to:
  /// **'We couldn\'t get your location. Move to an open area and try again.'**
  String get errorLOCATIONUNAVAILABLE;

  /// No description provided for @errorNETWORK.
  ///
  /// In en, this message translates to:
  /// **'You\'re offline. Check your connection and try again.'**
  String get errorNETWORK;

  /// No description provided for @errorOVERLAP.
  ///
  /// In en, this message translates to:
  /// **'You already have a leave request for these dates.'**
  String get errorOVERLAP;

  /// No description provided for @errorCORRECTIONPENDING.
  ///
  /// In en, this message translates to:
  /// **'A correction for this day is already waiting for review.'**
  String get errorCORRECTIONPENDING;

  /// No description provided for @errorMONTHFINALIZED.
  ///
  /// In en, this message translates to:
  /// **'This month is finalized. Contact your administrator to change it.'**
  String get errorMONTHFINALIZED;

  /// No description provided for @onboardingConsentTitle.
  ///
  /// In en, this message translates to:
  /// **'Location sharing'**
  String get onboardingConsentTitle;

  /// No description provided for @onboardingConsentAccept.
  ///
  /// In en, this message translates to:
  /// **'I agree'**
  String get onboardingConsentAccept;

  /// No description provided for @onboardingPermTitle.
  ///
  /// In en, this message translates to:
  /// **'Allow location access'**
  String get onboardingPermTitle;

  /// No description provided for @onboardingPermBody.
  ///
  /// In en, this message translates to:
  /// **'ZONA Sales needs “Allow all the time” so your location keeps updating while you\'re checked in, even when the app is closed. It is never collected after you check out.'**
  String get onboardingPermBody;

  /// No description provided for @onboardingPermAllow.
  ///
  /// In en, this message translates to:
  /// **'Allow location'**
  String get onboardingPermAllow;

  /// No description provided for @onboardingPermOpenSettings.
  ///
  /// In en, this message translates to:
  /// **'Open settings'**
  String get onboardingPermOpenSettings;

  /// No description provided for @onboardingPermAlwaysNeeded.
  ///
  /// In en, this message translates to:
  /// **'In Settings, choose Location → “Allow all the time”.'**
  String get onboardingPermAlwaysNeeded;

  /// No description provided for @onboardingContinue.
  ///
  /// In en, this message translates to:
  /// **'Continue'**
  String get onboardingContinue;

  /// No description provided for @homeLocating.
  ///
  /// In en, this message translates to:
  /// **'Getting your location…'**
  String get homeLocating;

  /// No description provided for @homeOffDay.
  ///
  /// In en, this message translates to:
  /// **'Today is your day off.'**
  String get homeOffDay;

  /// No description provided for @homeHoliday.
  ///
  /// In en, this message translates to:
  /// **'Public holiday: {name}'**
  String homeHoliday(String name);

  /// No description provided for @homeOnLeave.
  ///
  /// In en, this message translates to:
  /// **'You\'re on approved leave today.'**
  String get homeOnLeave;

  /// No description provided for @homeFlagged.
  ///
  /// In en, this message translates to:
  /// **'Your check-in was sent to your administrator for review.'**
  String get homeFlagged;

  /// No description provided for @homeTrackingTitle.
  ///
  /// In en, this message translates to:
  /// **'Location sharing is ON'**
  String get homeTrackingTitle;

  /// No description provided for @homeTrackingText.
  ///
  /// In en, this message translates to:
  /// **'You\'re checked in. Sharing stops when you check out.'**
  String get homeTrackingText;

  /// No description provided for @homePending.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, one {{count} location update waiting to send} other {{count} location updates waiting to send}}'**
  String homePending(int count);

  /// No description provided for @catalogueAll.
  ///
  /// In en, this message translates to:
  /// **'All'**
  String get catalogueAll;

  /// No description provided for @catalogueSearch.
  ///
  /// In en, this message translates to:
  /// **'Search products'**
  String get catalogueSearch;

  /// No description provided for @catalogueEmpty.
  ///
  /// In en, this message translates to:
  /// **'No products match your search'**
  String get catalogueEmpty;

  /// No description provided for @catalogueOffer.
  ///
  /// In en, this message translates to:
  /// **'Offer'**
  String get catalogueOffer;

  /// No description provided for @catalogueValidUntil.
  ///
  /// In en, this message translates to:
  /// **'Until {date}'**
  String catalogueValidUntil(String date);

  /// No description provided for @catalogueShare.
  ///
  /// In en, this message translates to:
  /// **'Share'**
  String get catalogueShare;

  /// No description provided for @catalogueShareVia.
  ///
  /// In en, this message translates to:
  /// **'Share via'**
  String get catalogueShareVia;

  /// No description provided for @catalogueWhatsapp.
  ///
  /// In en, this message translates to:
  /// **'WhatsApp'**
  String get catalogueWhatsapp;

  /// No description provided for @catalogueSms.
  ///
  /// In en, this message translates to:
  /// **'SMS'**
  String get catalogueSms;

  /// No description provided for @catalogueEmail.
  ///
  /// In en, this message translates to:
  /// **'Email'**
  String get catalogueEmail;

  /// No description provided for @catalogueCopyLink.
  ///
  /// In en, this message translates to:
  /// **'Copy link'**
  String get catalogueCopyLink;

  /// No description provided for @catalogueMore.
  ///
  /// In en, this message translates to:
  /// **'More options'**
  String get catalogueMore;

  /// No description provided for @catalogueRecipient.
  ///
  /// In en, this message translates to:
  /// **'Customer contact (optional)'**
  String get catalogueRecipient;

  /// No description provided for @catalogueShareText.
  ///
  /// In en, this message translates to:
  /// **'{name}\n{link}'**
  String catalogueShareText(String name, String link);

  /// No description provided for @catalogueLinkCopied.
  ///
  /// In en, this message translates to:
  /// **'Link copied'**
  String get catalogueLinkCopied;

  /// No description provided for @catalogueShared.
  ///
  /// In en, this message translates to:
  /// **'Shared and logged'**
  String get catalogueShared;

  /// No description provided for @leaveNew.
  ///
  /// In en, this message translates to:
  /// **'New request'**
  String get leaveNew;

  /// No description provided for @leaveEmpty.
  ///
  /// In en, this message translates to:
  /// **'No leave requests yet'**
  String get leaveEmpty;

  /// No description provided for @leaveType.
  ///
  /// In en, this message translates to:
  /// **'Type'**
  String get leaveType;

  /// No description provided for @leaveTypeLeave.
  ///
  /// In en, this message translates to:
  /// **'Leave'**
  String get leaveTypeLeave;

  /// No description provided for @leaveTypeOffDay.
  ///
  /// In en, this message translates to:
  /// **'Off day'**
  String get leaveTypeOffDay;

  /// No description provided for @leaveFrom.
  ///
  /// In en, this message translates to:
  /// **'From'**
  String get leaveFrom;

  /// No description provided for @leaveTo.
  ///
  /// In en, this message translates to:
  /// **'To'**
  String get leaveTo;

  /// No description provided for @leaveReason.
  ///
  /// In en, this message translates to:
  /// **'Reason'**
  String get leaveReason;

  /// No description provided for @leaveSubmit.
  ///
  /// In en, this message translates to:
  /// **'Submit request'**
  String get leaveSubmit;

  /// No description provided for @leaveCancelRequest.
  ///
  /// In en, this message translates to:
  /// **'Cancel request'**
  String get leaveCancelRequest;

  /// No description provided for @leaveStatusPending.
  ///
  /// In en, this message translates to:
  /// **'Pending'**
  String get leaveStatusPending;

  /// No description provided for @leaveStatusApproved.
  ///
  /// In en, this message translates to:
  /// **'Approved'**
  String get leaveStatusApproved;

  /// No description provided for @leaveStatusRejected.
  ///
  /// In en, this message translates to:
  /// **'Rejected'**
  String get leaveStatusRejected;

  /// No description provided for @leaveStatusCancelled.
  ///
  /// In en, this message translates to:
  /// **'Cancelled'**
  String get leaveStatusCancelled;

  /// No description provided for @leaveSubmitted.
  ///
  /// In en, this message translates to:
  /// **'Request sent to your administrator'**
  String get leaveSubmitted;

  /// No description provided for @leaveDays.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, one {{count} day} other {{count} days}}'**
  String leaveDays(int count);

  /// No description provided for @profileSupervisor.
  ///
  /// In en, this message translates to:
  /// **'Supervisor'**
  String get profileSupervisor;

  /// No description provided for @profileBranch.
  ///
  /// In en, this message translates to:
  /// **'Branch'**
  String get profileBranch;

  /// No description provided for @profileMyAttendance.
  ///
  /// In en, this message translates to:
  /// **'My attendance'**
  String get profileMyAttendance;

  /// No description provided for @profilePrivacy.
  ///
  /// In en, this message translates to:
  /// **'Privacy'**
  String get profilePrivacy;

  /// No description provided for @profileVersion.
  ///
  /// In en, this message translates to:
  /// **'Version {version}'**
  String profileVersion(String version);

  /// No description provided for @attendanceRequestCorrection.
  ///
  /// In en, this message translates to:
  /// **'Request correction'**
  String get attendanceRequestCorrection;

  /// No description provided for @attendanceCorrectionPending.
  ///
  /// In en, this message translates to:
  /// **'Correction pending'**
  String get attendanceCorrectionPending;

  /// No description provided for @attendanceCorrectionSent.
  ///
  /// In en, this message translates to:
  /// **'Correction request sent'**
  String get attendanceCorrectionSent;

  /// No description provided for @attendanceNoRecords.
  ///
  /// In en, this message translates to:
  /// **'No attendance records this month'**
  String get attendanceNoRecords;

  /// No description provided for @attendanceMissingCheckout.
  ///
  /// In en, this message translates to:
  /// **'No check-out'**
  String get attendanceMissingCheckout;

  /// No description provided for @attendanceCorrectionReason.
  ///
  /// In en, this message translates to:
  /// **'What should be corrected?'**
  String get attendanceCorrectionReason;

  /// No description provided for @notifyCheckedIn.
  ///
  /// In en, this message translates to:
  /// **'You checked in'**
  String get notifyCheckedIn;

  /// No description provided for @notifyCheckedOut.
  ///
  /// In en, this message translates to:
  /// **'You checked out'**
  String get notifyCheckedOut;

  /// No description provided for @notifyCheckedOutShort.
  ///
  /// In en, this message translates to:
  /// **'You checked out before the required hours'**
  String get notifyCheckedOutShort;

  /// No description provided for @notifyAutoCheckedOut.
  ///
  /// In en, this message translates to:
  /// **'You were checked out automatically after the shift limit'**
  String get notifyAutoCheckedOut;

  /// No description provided for @notifyLateWarning.
  ///
  /// In en, this message translates to:
  /// **'Check in soon to avoid being marked late'**
  String get notifyLateWarning;

  /// No description provided for @notifyHoursCompleted.
  ///
  /// In en, this message translates to:
  /// **'You\'ve completed today\'s required hours'**
  String get notifyHoursCompleted;

  /// No description provided for @notifyGeofenceExit.
  ///
  /// In en, this message translates to:
  /// **'You left your work area'**
  String get notifyGeofenceExit;

  /// No description provided for @notifyLeaveApproved.
  ///
  /// In en, this message translates to:
  /// **'Your leave request was approved'**
  String get notifyLeaveApproved;

  /// No description provided for @notifyLeaveRejected.
  ///
  /// In en, this message translates to:
  /// **'Your leave request was rejected'**
  String get notifyLeaveRejected;

  /// No description provided for @notifyCorrectionApproved.
  ///
  /// In en, this message translates to:
  /// **'Your correction request was approved'**
  String get notifyCorrectionApproved;

  /// No description provided for @notifyCorrectionRejected.
  ///
  /// In en, this message translates to:
  /// **'Your correction request was rejected'**
  String get notifyCorrectionRejected;

  /// No description provided for @notifyFraudFlagged.
  ///
  /// In en, this message translates to:
  /// **'A check-in by {employeeId} needs your review'**
  String notifyFraudFlagged(String employeeId);

  /// No description provided for @notificationsEmpty.
  ///
  /// In en, this message translates to:
  /// **'You\'re all caught up'**
  String get notificationsEmpty;

  /// No description provided for @notificationsMarkAll.
  ///
  /// In en, this message translates to:
  /// **'Mark all as read'**
  String get notificationsMarkAll;

  /// No description provided for @notifyNewContent.
  ///
  /// In en, this message translates to:
  /// **'New in the catalogue: {name}'**
  String notifyNewContent(String name);

  /// No description provided for @portalSignInTitle.
  ///
  /// In en, this message translates to:
  /// **'Admin portal sign in'**
  String get portalSignInTitle;

  /// No description provided for @portalSignInBody.
  ///
  /// In en, this message translates to:
  /// **'For the ZONA administrator. Sales representatives use the ZONA Sales app.'**
  String get portalSignInBody;

  /// No description provided for @portalErrorPORTALNOTALLOWED.
  ///
  /// In en, this message translates to:
  /// **'Sales representatives use the mobile app.'**
  String get portalErrorPORTALNOTALLOWED;

  /// No description provided for @portalSignedInAs.
  ///
  /// In en, this message translates to:
  /// **'Signed in as {name}'**
  String portalSignedInAs(String name);

  /// No description provided for @portalRoleSuperAdmin.
  ///
  /// In en, this message translates to:
  /// **'Administrator'**
  String get portalRoleSuperAdmin;

  /// No description provided for @portalRoleHrAdmin.
  ///
  /// In en, this message translates to:
  /// **'HR admin'**
  String get portalRoleHrAdmin;

  /// No description provided for @portalRoleSalesSupervisor.
  ///
  /// In en, this message translates to:
  /// **'Sales supervisor'**
  String get portalRoleSalesSupervisor;

  /// No description provided for @portalRoleSalesRep.
  ///
  /// In en, this message translates to:
  /// **'Sales representative'**
  String get portalRoleSalesRep;

  /// No description provided for @portalToday.
  ///
  /// In en, this message translates to:
  /// **'Today'**
  String get portalToday;

  /// No description provided for @portalAllTeams.
  ///
  /// In en, this message translates to:
  /// **'All teams'**
  String get portalAllTeams;

  /// No description provided for @portalAllStatuses.
  ///
  /// In en, this message translates to:
  /// **'All statuses'**
  String get portalAllStatuses;

  /// No description provided for @portalNotCheckedIn.
  ///
  /// In en, this message translates to:
  /// **'Not checked in'**
  String get portalNotCheckedIn;

  /// No description provided for @portalPendingReviews.
  ///
  /// In en, this message translates to:
  /// **'Suspected check-ins to review'**
  String get portalPendingReviews;

  /// No description provided for @portalPendingLeave.
  ///
  /// In en, this message translates to:
  /// **'Leave requests'**
  String get portalPendingLeave;

  /// No description provided for @portalPendingCorrections.
  ///
  /// In en, this message translates to:
  /// **'Correction requests'**
  String get portalPendingCorrections;

  /// No description provided for @portalNeedsAttention.
  ///
  /// In en, this message translates to:
  /// **'Needs your attention'**
  String get portalNeedsAttention;

  /// No description provided for @portalLiveNow.
  ///
  /// In en, this message translates to:
  /// **'Live now'**
  String get portalLiveNow;

  /// No description provided for @portalOnDutyCount.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, one {{count} rep on duty} other {{count} reps on duty}}'**
  String portalOnDutyCount(int count);

  /// No description provided for @portalNoOneOnDuty.
  ///
  /// In en, this message translates to:
  /// **'No one is on duty right now'**
  String get portalNoOneOnDuty;

  /// No description provided for @portalCheckedInAt.
  ///
  /// In en, this message translates to:
  /// **'Checked in {time}'**
  String portalCheckedInAt(String time);

  /// No description provided for @portalMinutesAgo.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =0 {just now} one {{count} min ago} other {{count} min ago}}'**
  String portalMinutesAgo(int count);

  /// No description provided for @portalTrail.
  ///
  /// In en, this message translates to:
  /// **'Today\'s trail'**
  String get portalTrail;

  /// No description provided for @portalTrailPoints.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, one {{count} point} other {{count} points}}'**
  String portalTrailPoints(int count);

  /// No description provided for @portalTabRegister.
  ///
  /// In en, this message translates to:
  /// **'Register'**
  String get portalTabRegister;

  /// No description provided for @portalTabReviews.
  ///
  /// In en, this message translates to:
  /// **'Suspected check-ins'**
  String get portalTabReviews;

  /// No description provided for @portalTabCorrections.
  ///
  /// In en, this message translates to:
  /// **'Corrections'**
  String get portalTabCorrections;

  /// No description provided for @portalTabLeave.
  ///
  /// In en, this message translates to:
  /// **'Leave requests'**
  String get portalTabLeave;

  /// No description provided for @portalDetails.
  ///
  /// In en, this message translates to:
  /// **'Attendance details'**
  String get portalDetails;

  /// No description provided for @portalStatusTrail.
  ///
  /// In en, this message translates to:
  /// **'Status history'**
  String get portalStatusTrail;

  /// No description provided for @portalCauseCheckIn.
  ///
  /// In en, this message translates to:
  /// **'Checked in'**
  String get portalCauseCheckIn;

  /// No description provided for @portalCauseCheckOut.
  ///
  /// In en, this message translates to:
  /// **'Checked out'**
  String get portalCauseCheckOut;

  /// No description provided for @portalCauseFraudFlagged.
  ///
  /// In en, this message translates to:
  /// **'Flagged automatically'**
  String get portalCauseFraudFlagged;

  /// No description provided for @portalCauseReviewConfirmed.
  ///
  /// In en, this message translates to:
  /// **'Confirmed as fake'**
  String get portalCauseReviewConfirmed;

  /// No description provided for @portalCauseReviewCleared.
  ///
  /// In en, this message translates to:
  /// **'Marked genuine'**
  String get portalCauseReviewCleared;

  /// No description provided for @portalCauseCorrectionApproved.
  ///
  /// In en, this message translates to:
  /// **'Correction approved'**
  String get portalCauseCorrectionApproved;

  /// No description provided for @portalCauseLeaveApproved.
  ///
  /// In en, this message translates to:
  /// **'Leave approved'**
  String get portalCauseLeaveApproved;

  /// No description provided for @portalCauseLeaveCancelled.
  ///
  /// In en, this message translates to:
  /// **'Leave cancelled'**
  String get portalCauseLeaveCancelled;

  /// No description provided for @portalCauseAbsentMarked.
  ///
  /// In en, this message translates to:
  /// **'Marked absent'**
  String get portalCauseAbsentMarked;

  /// No description provided for @portalCauseMonthCorrection.
  ///
  /// In en, this message translates to:
  /// **'Month-end correction'**
  String get portalCauseMonthCorrection;

  /// No description provided for @portalSystem.
  ///
  /// In en, this message translates to:
  /// **'System'**
  String get portalSystem;

  /// No description provided for @portalSignalMockLocation.
  ///
  /// In en, this message translates to:
  /// **'A mock-location app was active on the device'**
  String get portalSignalMockLocation;

  /// No description provided for @portalSignalGpsNetworkMismatch.
  ///
  /// In en, this message translates to:
  /// **'GPS and network positions were {distance} apart'**
  String portalSignalGpsNetworkMismatch(String distance);

  /// No description provided for @portalSignalImpossibleSpeed.
  ///
  /// In en, this message translates to:
  /// **'Moved at {speed} km/h between pings'**
  String portalSignalImpossibleSpeed(String speed);

  /// No description provided for @portalSignalRootedDevice.
  ///
  /// In en, this message translates to:
  /// **'Rooted, jailbroken or emulated device'**
  String get portalSignalRootedDevice;

  /// No description provided for @portalSignalOutsideGeofence.
  ///
  /// In en, this message translates to:
  /// **'{distance} outside the work area'**
  String portalSignalOutsideGeofence(String distance);

  /// No description provided for @portalNoPending.
  ///
  /// In en, this message translates to:
  /// **'Nothing waiting for review'**
  String get portalNoPending;

  /// No description provided for @portalRequested.
  ///
  /// In en, this message translates to:
  /// **'Requested'**
  String get portalRequested;

  /// No description provided for @portalCurrent.
  ///
  /// In en, this message translates to:
  /// **'Current'**
  String get portalCurrent;

  /// No description provided for @portalApproveRemark.
  ///
  /// In en, this message translates to:
  /// **'Remark (optional for approval, required to reject)'**
  String get portalApproveRemark;

  /// No description provided for @portalDecided.
  ///
  /// In en, this message translates to:
  /// **'Decision saved'**
  String get portalDecided;

  /// No description provided for @portalEmployeeSaved.
  ///
  /// In en, this message translates to:
  /// **'Employee saved'**
  String get portalEmployeeSaved;

  /// No description provided for @portalEmployeeCreated.
  ///
  /// In en, this message translates to:
  /// **'Employee created. Temporary password: {password}'**
  String portalEmployeeCreated(String password);

  /// No description provided for @portalEditEmployee.
  ///
  /// In en, this message translates to:
  /// **'Edit employee'**
  String get portalEditEmployee;

  /// No description provided for @portalNameEn.
  ///
  /// In en, this message translates to:
  /// **'Name (English)'**
  String get portalNameEn;

  /// No description provided for @portalNameAr.
  ///
  /// In en, this message translates to:
  /// **'Name (Arabic)'**
  String get portalNameAr;

  /// No description provided for @portalRole.
  ///
  /// In en, this message translates to:
  /// **'Role'**
  String get portalRole;

  /// No description provided for @portalStatus.
  ///
  /// In en, this message translates to:
  /// **'Status'**
  String get portalStatus;

  /// No description provided for @portalActive.
  ///
  /// In en, this message translates to:
  /// **'Active'**
  String get portalActive;

  /// No description provided for @portalInactive.
  ///
  /// In en, this message translates to:
  /// **'Inactive'**
  String get portalInactive;

  /// No description provided for @portalDeactivate.
  ///
  /// In en, this message translates to:
  /// **'Deactivate'**
  String get portalDeactivate;

  /// No description provided for @portalActivate.
  ///
  /// In en, this message translates to:
  /// **'Activate'**
  String get portalActivate;

  /// No description provided for @portalShiftWindow.
  ///
  /// In en, this message translates to:
  /// **'Sign-in window'**
  String get portalShiftWindow;

  /// No description provided for @portalShiftWindowValue.
  ///
  /// In en, this message translates to:
  /// **'{from} – {to}'**
  String portalShiftWindowValue(String from, String to);

  /// No description provided for @portalNoSupervisor.
  ///
  /// In en, this message translates to:
  /// **'No supervisor'**
  String get portalNoSupervisor;

  /// No description provided for @portalProducts.
  ///
  /// In en, this message translates to:
  /// **'Products and offers'**
  String get portalProducts;

  /// No description provided for @portalNewProduct.
  ///
  /// In en, this message translates to:
  /// **'New item'**
  String get portalNewProduct;

  /// No description provided for @portalEditProduct.
  ///
  /// In en, this message translates to:
  /// **'Edit item'**
  String get portalEditProduct;

  /// No description provided for @portalItemType.
  ///
  /// In en, this message translates to:
  /// **'Type'**
  String get portalItemType;

  /// No description provided for @portalTypeProduct.
  ///
  /// In en, this message translates to:
  /// **'Product'**
  String get portalTypeProduct;

  /// No description provided for @portalTypeOffer.
  ///
  /// In en, this message translates to:
  /// **'Offer'**
  String get portalTypeOffer;

  /// No description provided for @portalTypePromo.
  ///
  /// In en, this message translates to:
  /// **'Promotion'**
  String get portalTypePromo;

  /// No description provided for @portalCategory.
  ///
  /// In en, this message translates to:
  /// **'Category'**
  String get portalCategory;

  /// No description provided for @portalDescriptionEn.
  ///
  /// In en, this message translates to:
  /// **'Description (English)'**
  String get portalDescriptionEn;

  /// No description provided for @portalDescriptionAr.
  ///
  /// In en, this message translates to:
  /// **'Description (Arabic)'**
  String get portalDescriptionAr;

  /// No description provided for @portalValidFrom.
  ///
  /// In en, this message translates to:
  /// **'Valid from'**
  String get portalValidFrom;

  /// No description provided for @portalValidTo.
  ///
  /// In en, this message translates to:
  /// **'Valid until'**
  String get portalValidTo;

  /// No description provided for @portalPublish.
  ///
  /// In en, this message translates to:
  /// **'Publish'**
  String get portalPublish;

  /// No description provided for @portalUnpublish.
  ///
  /// In en, this message translates to:
  /// **'Move to draft'**
  String get portalUnpublish;

  /// No description provided for @portalArchive.
  ///
  /// In en, this message translates to:
  /// **'Archive'**
  String get portalArchive;

  /// No description provided for @portalContentDraft.
  ///
  /// In en, this message translates to:
  /// **'Draft'**
  String get portalContentDraft;

  /// No description provided for @portalContentPublished.
  ///
  /// In en, this message translates to:
  /// **'Published'**
  String get portalContentPublished;

  /// No description provided for @portalContentArchived.
  ///
  /// In en, this message translates to:
  /// **'Archived'**
  String get portalContentArchived;

  /// No description provided for @portalShares.
  ///
  /// In en, this message translates to:
  /// **'Shares'**
  String get portalShares;

  /// No description provided for @portalAttendanceRules.
  ///
  /// In en, this message translates to:
  /// **'Attendance rules'**
  String get portalAttendanceRules;

  /// No description provided for @portalRulesBody.
  ///
  /// In en, this message translates to:
  /// **'Rules are effective-dated: a change applies from its start date and history is kept for audits.'**
  String get portalRulesBody;

  /// No description provided for @portalNewRule.
  ///
  /// In en, this message translates to:
  /// **'New rule'**
  String get portalNewRule;

  /// No description provided for @portalScope.
  ///
  /// In en, this message translates to:
  /// **'Applies to'**
  String get portalScope;

  /// No description provided for @portalScopeGlobal.
  ///
  /// In en, this message translates to:
  /// **'Everyone'**
  String get portalScopeGlobal;

  /// No description provided for @portalRequiredHours.
  ///
  /// In en, this message translates to:
  /// **'Required hours'**
  String get portalRequiredHours;

  /// No description provided for @portalGrace.
  ///
  /// In en, this message translates to:
  /// **'Grace after latest start'**
  String get portalGrace;

  /// No description provided for @portalPingInterval.
  ///
  /// In en, this message translates to:
  /// **'Location update interval'**
  String get portalPingInterval;

  /// No description provided for @portalOutsideAction.
  ///
  /// In en, this message translates to:
  /// **'Outside the work area'**
  String get portalOutsideAction;

  /// No description provided for @portalOutsideFlag.
  ///
  /// In en, this message translates to:
  /// **'Flag for review'**
  String get portalOutsideFlag;

  /// No description provided for @portalOutsideBlock.
  ///
  /// In en, this message translates to:
  /// **'Block check-in'**
  String get portalOutsideBlock;

  /// No description provided for @portalEffectiveFrom.
  ///
  /// In en, this message translates to:
  /// **'Effective from'**
  String get portalEffectiveFrom;

  /// No description provided for @portalMinutesValue.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, one {{count} minute} other {{count} minutes}}'**
  String portalMinutesValue(int count);

  /// No description provided for @portalGeofences.
  ///
  /// In en, this message translates to:
  /// **'Work areas (geofences)'**
  String get portalGeofences;

  /// No description provided for @portalNewGeofence.
  ///
  /// In en, this message translates to:
  /// **'New work area'**
  String get portalNewGeofence;

  /// No description provided for @portalGeofenceHint.
  ///
  /// In en, this message translates to:
  /// **'Click the map to place the centre, then set the radius.'**
  String get portalGeofenceHint;

  /// No description provided for @portalRadius.
  ///
  /// In en, this message translates to:
  /// **'Radius'**
  String get portalRadius;

  /// No description provided for @portalAssignedTo.
  ///
  /// In en, this message translates to:
  /// **'Assigned to'**
  String get portalAssignedTo;

  /// No description provided for @portalAssign.
  ///
  /// In en, this message translates to:
  /// **'Assign'**
  String get portalAssign;

  /// No description provided for @portalAssignBranch.
  ///
  /// In en, this message translates to:
  /// **'Branch'**
  String get portalAssignBranch;

  /// No description provided for @portalAssignTeam.
  ///
  /// In en, this message translates to:
  /// **'Team'**
  String get portalAssignTeam;

  /// No description provided for @portalAssignEmployee.
  ///
  /// In en, this message translates to:
  /// **'Employee'**
  String get portalAssignEmployee;

  /// No description provided for @portalEndAssignment.
  ///
  /// In en, this message translates to:
  /// **'Remove'**
  String get portalEndAssignment;

  /// No description provided for @portalUnassigned.
  ///
  /// In en, this message translates to:
  /// **'Not assigned'**
  String get portalUnassigned;

  /// No description provided for @portalSharesReport.
  ///
  /// In en, this message translates to:
  /// **'Marketing activity'**
  String get portalSharesReport;

  /// No description provided for @portalByProduct.
  ///
  /// In en, this message translates to:
  /// **'By product'**
  String get portalByProduct;

  /// No description provided for @portalByEmployee.
  ///
  /// In en, this message translates to:
  /// **'By employee'**
  String get portalByEmployee;

  /// No description provided for @portalByChannel.
  ///
  /// In en, this message translates to:
  /// **'By channel'**
  String get portalByChannel;

  /// No description provided for @portalChannelWhatsapp.
  ///
  /// In en, this message translates to:
  /// **'WhatsApp'**
  String get portalChannelWhatsapp;

  /// No description provided for @portalChannelSms.
  ///
  /// In en, this message translates to:
  /// **'SMS'**
  String get portalChannelSms;

  /// No description provided for @portalChannelEmail.
  ///
  /// In en, this message translates to:
  /// **'Email'**
  String get portalChannelEmail;

  /// No description provided for @portalChannelLink.
  ///
  /// In en, this message translates to:
  /// **'Link'**
  String get portalChannelLink;

  /// No description provided for @portalChannelOther.
  ///
  /// In en, this message translates to:
  /// **'Other'**
  String get portalChannelOther;

  /// No description provided for @portalNoData.
  ///
  /// In en, this message translates to:
  /// **'No data for this period'**
  String get portalNoData;

  /// No description provided for @portalFrom.
  ///
  /// In en, this message translates to:
  /// **'From'**
  String get portalFrom;

  /// No description provided for @portalTo.
  ///
  /// In en, this message translates to:
  /// **'To'**
  String get portalTo;

  /// No description provided for @portalMonthlySummary.
  ///
  /// In en, this message translates to:
  /// **'Monthly attendance summary'**
  String get portalMonthlySummary;

  /// No description provided for @portalComingPhase5.
  ///
  /// In en, this message translates to:
  /// **'Arrives in Phase 5: compute, review, finalize and export.'**
  String get portalComingPhase5;

  /// No description provided for @portalSignOut.
  ///
  /// In en, this message translates to:
  /// **'Sign out'**
  String get portalSignOut;

  /// No description provided for @portalMinutesShort.
  ///
  /// In en, this message translates to:
  /// **'{count} min'**
  String portalMinutesShort(String count);

  /// No description provided for @portalTabSummary.
  ///
  /// In en, this message translates to:
  /// **'Monthly summary'**
  String get portalTabSummary;

  /// No description provided for @portalMonth.
  ///
  /// In en, this message translates to:
  /// **'Month'**
  String get portalMonth;

  /// No description provided for @portalCompute.
  ///
  /// In en, this message translates to:
  /// **'Recalculate'**
  String get portalCompute;

  /// No description provided for @portalFinalize.
  ///
  /// In en, this message translates to:
  /// **'Finalize month'**
  String get portalFinalize;

  /// No description provided for @portalReopen.
  ///
  /// In en, this message translates to:
  /// **'Re-open month'**
  String get portalReopen;

  /// No description provided for @portalReopenReason.
  ///
  /// In en, this message translates to:
  /// **'Reason for re-opening'**
  String get portalReopenReason;

  /// No description provided for @portalPeriodOpen.
  ///
  /// In en, this message translates to:
  /// **'Open'**
  String get portalPeriodOpen;

  /// No description provided for @portalPeriodDraft.
  ///
  /// In en, this message translates to:
  /// **'Draft'**
  String get portalPeriodDraft;

  /// No description provided for @portalPeriodFinalized.
  ///
  /// In en, this message translates to:
  /// **'Finalized'**
  String get portalPeriodFinalized;

  /// No description provided for @portalPeriodReopened.
  ///
  /// In en, this message translates to:
  /// **'Re-opened'**
  String get portalPeriodReopened;

  /// No description provided for @portalBlockedSuspected.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, one {{count} suspected check-in must be reviewed before finalizing} other {{count} suspected check-ins must be reviewed before finalizing}}'**
  String portalBlockedSuspected(int count);

  /// No description provided for @portalExportCsv.
  ///
  /// In en, this message translates to:
  /// **'CSV'**
  String get portalExportCsv;

  /// No description provided for @portalExportExcel.
  ///
  /// In en, this message translates to:
  /// **'Excel'**
  String get portalExportExcel;

  /// No description provided for @portalExportPdf.
  ///
  /// In en, this message translates to:
  /// **'Print / PDF'**
  String get portalExportPdf;

  /// No description provided for @portalVersion.
  ///
  /// In en, this message translates to:
  /// **'Version'**
  String get portalVersion;

  /// No description provided for @portalCorrectDay.
  ///
  /// In en, this message translates to:
  /// **'Correct'**
  String get portalCorrectDay;

  /// No description provided for @portalNewStatus.
  ///
  /// In en, this message translates to:
  /// **'New status'**
  String get portalNewStatus;

  /// No description provided for @portalCorrectionReason.
  ///
  /// In en, this message translates to:
  /// **'Reason (required)'**
  String get portalCorrectionReason;

  /// No description provided for @portalFinalizedNote.
  ///
  /// In en, this message translates to:
  /// **'This month is locked. HRMS can now read these counts.'**
  String get portalFinalizedNote;

  /// No description provided for @portalNotComputed.
  ///
  /// In en, this message translates to:
  /// **'Not calculated yet. Select Recalculate.'**
  String get portalNotComputed;

  /// No description provided for @portalComputedAt.
  ///
  /// In en, this message translates to:
  /// **'Calculated {time}'**
  String portalComputedAt(String time);

  /// No description provided for @portalDaysOf.
  ///
  /// In en, this message translates to:
  /// **'Days for {name}'**
  String portalDaysOf(String name);

  /// No description provided for @errorSUSPECTEDPENDING.
  ///
  /// In en, this message translates to:
  /// **'Review every suspected check-in in this month first.'**
  String get errorSUSPECTEDPENDING;

  /// No description provided for @errorMONTHNOTENDED.
  ///
  /// In en, this message translates to:
  /// **'A month can be finalized only after it ends.'**
  String get errorMONTHNOTENDED;

  /// No description provided for @errorUSEREVIEW.
  ///
  /// In en, this message translates to:
  /// **'Decide suspected or confirmed fakes through the review.'**
  String get errorUSEREVIEW;

  /// No description provided for @errorCHECKINREQUIRED.
  ///
  /// In en, this message translates to:
  /// **'A day without a check-in can only be marked absent.'**
  String get errorCHECKINREQUIRED;

  /// No description provided for @errorNOTFINALIZED.
  ///
  /// In en, this message translates to:
  /// **'This month is not finalized.'**
  String get errorNOTFINALIZED;

  /// No description provided for @portalOrg.
  ///
  /// In en, this message translates to:
  /// **'Organisation'**
  String get portalOrg;

  /// No description provided for @portalBranches.
  ///
  /// In en, this message translates to:
  /// **'Branches'**
  String get portalBranches;

  /// No description provided for @portalTeams.
  ///
  /// In en, this message translates to:
  /// **'Teams'**
  String get portalTeams;

  /// No description provided for @portalNewBranch.
  ///
  /// In en, this message translates to:
  /// **'New branch'**
  String get portalNewBranch;

  /// No description provided for @portalNewTeam.
  ///
  /// In en, this message translates to:
  /// **'New team'**
  String get portalNewTeam;

  /// No description provided for @portalCode.
  ///
  /// In en, this message translates to:
  /// **'Code'**
  String get portalCode;

  /// No description provided for @portalEdit.
  ///
  /// In en, this message translates to:
  /// **'Edit'**
  String get portalEdit;

  /// No description provided for @portalHolidays.
  ///
  /// In en, this message translates to:
  /// **'Holidays and company off days'**
  String get portalHolidays;

  /// No description provided for @portalHolidaysBody.
  ///
  /// In en, this message translates to:
  /// **'Holidays are excluded from absence counts. Add Eid dates each year once they are announced.'**
  String get portalHolidaysBody;

  /// No description provided for @portalNewHoliday.
  ///
  /// In en, this message translates to:
  /// **'Add holiday'**
  String get portalNewHoliday;

  /// No description provided for @portalDate.
  ///
  /// In en, this message translates to:
  /// **'Date'**
  String get portalDate;

  /// No description provided for @portalAllBranches.
  ///
  /// In en, this message translates to:
  /// **'All branches'**
  String get portalAllBranches;

  /// No description provided for @portalKindPublicHoliday.
  ///
  /// In en, this message translates to:
  /// **'Public holiday'**
  String get portalKindPublicHoliday;

  /// No description provided for @portalKindCompanyOffDay.
  ///
  /// In en, this message translates to:
  /// **'Company off day'**
  String get portalKindCompanyOffDay;

  /// No description provided for @portalResetPassword.
  ///
  /// In en, this message translates to:
  /// **'Reset password'**
  String get portalResetPassword;

  /// No description provided for @portalTempPasswordTitle.
  ///
  /// In en, this message translates to:
  /// **'Temporary password'**
  String get portalTempPasswordTitle;

  /// No description provided for @portalTempPasswordBody.
  ///
  /// In en, this message translates to:
  /// **'Give this to {name} privately. They must change it at their next sign-in. It will not be shown again.'**
  String portalTempPasswordBody(String name);

  /// No description provided for @portalCopy.
  ///
  /// In en, this message translates to:
  /// **'Copy'**
  String get portalCopy;

  /// No description provided for @portalCopied.
  ///
  /// In en, this message translates to:
  /// **'Copied'**
  String get portalCopied;

  /// No description provided for @portalSaved.
  ///
  /// In en, this message translates to:
  /// **'Saved'**
  String get portalSaved;

  /// No description provided for @errorHOLIDAYINPAST.
  ///
  /// In en, this message translates to:
  /// **'Past holidays already affect recorded attendance and can\'t be removed.'**
  String get errorHOLIDAYINPAST;

  /// No description provided for @errorEMPLOYEEEXISTS.
  ///
  /// In en, this message translates to:
  /// **'An employee with this ID already exists.'**
  String get errorEMPLOYEEEXISTS;

  /// No description provided for @errorDUPLICATE.
  ///
  /// In en, this message translates to:
  /// **'This already exists.'**
  String get errorDUPLICATE;

  /// No description provided for @authForgotAdmin.
  ///
  /// In en, this message translates to:
  /// **'Forgot your password? Ask your administrator to reset it.'**
  String get authForgotAdmin;

  /// No description provided for @errorOTPUNAVAILABLE.
  ///
  /// In en, this message translates to:
  /// **'One-time codes aren\'t available yet. Ask an administrator to reset your password.'**
  String get errorOTPUNAVAILABLE;

  /// No description provided for @portalEmployeesBody.
  ///
  /// In en, this message translates to:
  /// **'Every account here is a sales rep. Only you create accounts and passwords — reps can\'t sign themselves up.'**
  String get portalEmployeesBody;

  /// No description provided for @credTitle.
  ///
  /// In en, this message translates to:
  /// **'Sign-in details'**
  String get credTitle;

  /// No description provided for @credBody.
  ///
  /// In en, this message translates to:
  /// **'Give these to {name} privately. They won\'t be shown again.'**
  String credBody(String name);

  /// No description provided for @credMustChange.
  ///
  /// In en, this message translates to:
  /// **'They\'ll choose their own password at first sign-in.'**
  String get credMustChange;

  /// No description provided for @credKeep.
  ///
  /// In en, this message translates to:
  /// **'They\'ll keep using this password until you reset it.'**
  String get credKeep;

  /// No description provided for @credGenerate.
  ///
  /// In en, this message translates to:
  /// **'Generate'**
  String get credGenerate;

  /// No description provided for @credAskChange.
  ///
  /// In en, this message translates to:
  /// **'Ask them to choose a new password at first sign-in'**
  String get credAskChange;

  /// No description provided for @credResetTitle.
  ///
  /// In en, this message translates to:
  /// **'Reset password for {name}'**
  String credResetTitle(String name);

  /// No description provided for @credResetBody.
  ///
  /// In en, this message translates to:
  /// **'Their current sign-ins end immediately.'**
  String get credResetBody;

  /// No description provided for @errorADMINREQUIRED.
  ///
  /// In en, this message translates to:
  /// **'The administrator account can\'t be deactivated.'**
  String get errorADMINREQUIRED;

  /// No description provided for @errorNOTAREP.
  ///
  /// In en, this message translates to:
  /// **'Targets are for sales representatives only.'**
  String get errorNOTAREP;

  /// No description provided for @errorNOTONDUTY.
  ///
  /// In en, this message translates to:
  /// **'Check in first — visits and orders are logged while you\'re on duty.'**
  String get errorNOTONDUTY;

  /// No description provided for @errorINVALIDMONTH.
  ///
  /// In en, this message translates to:
  /// **'Choose a valid month.'**
  String get errorINVALIDMONTH;

  /// No description provided for @navTargets.
  ///
  /// In en, this message translates to:
  /// **'Sales targets'**
  String get navTargets;

  /// No description provided for @targetsBody.
  ///
  /// In en, this message translates to:
  /// **'Set monthly visit and order targets. Reps log each visit and order in the ZONA Sales app while checked in.'**
  String get targetsBody;

  /// No description provided for @targetsSetAll.
  ///
  /// In en, this message translates to:
  /// **'Set for all reps'**
  String get targetsSetAll;

  /// No description provided for @targetsSetSelected.
  ///
  /// In en, this message translates to:
  /// **'Set target for selected'**
  String get targetsSetSelected;

  /// No description provided for @targetsSet.
  ///
  /// In en, this message translates to:
  /// **'Set target'**
  String get targetsSet;

  /// No description provided for @targetsSetFor.
  ///
  /// In en, this message translates to:
  /// **'Target for {name}'**
  String targetsSetFor(String name);

  /// No description provided for @targetsRemove.
  ///
  /// In en, this message translates to:
  /// **'Remove target'**
  String get targetsRemove;

  /// No description provided for @targetsVisits.
  ///
  /// In en, this message translates to:
  /// **'Visits'**
  String get targetsVisits;

  /// No description provided for @targetsOrders.
  ///
  /// In en, this message translates to:
  /// **'Orders'**
  String get targetsOrders;

  /// No description provided for @targetsVisitsTarget.
  ///
  /// In en, this message translates to:
  /// **'Visits target'**
  String get targetsVisitsTarget;

  /// No description provided for @targetsOrdersTarget.
  ///
  /// In en, this message translates to:
  /// **'Orders target'**
  String get targetsOrdersTarget;

  /// No description provided for @targetsNote.
  ///
  /// In en, this message translates to:
  /// **'Note for the rep'**
  String get targetsNote;

  /// No description provided for @targetsOverwrite.
  ///
  /// In en, this message translates to:
  /// **'Replace targets already set for this month'**
  String get targetsOverwrite;

  /// No description provided for @targetsProgress.
  ///
  /// In en, this message translates to:
  /// **'{done} of {target}'**
  String targetsProgress(String done, String target);

  /// No description provided for @targetsNoTarget.
  ///
  /// In en, this message translates to:
  /// **'No target'**
  String get targetsNoTarget;

  /// No description provided for @targetsApplied.
  ///
  /// In en, this message translates to:
  /// **'Targets set: {applied}. Already set and kept: {skipped}.'**
  String targetsApplied(String applied, String skipped);

  /// No description provided for @targetsSaved.
  ///
  /// In en, this message translates to:
  /// **'Target saved'**
  String get targetsSaved;

  /// No description provided for @targetsTabProgress.
  ///
  /// In en, this message translates to:
  /// **'Progress'**
  String get targetsTabProgress;

  /// No description provided for @targetsTabLog.
  ///
  /// In en, this message translates to:
  /// **'Visits and orders log'**
  String get targetsTabLog;

  /// No description provided for @targetsKpiVisits.
  ///
  /// In en, this message translates to:
  /// **'Visits this month'**
  String get targetsKpiVisits;

  /// No description provided for @targetsKpiOrders.
  ///
  /// In en, this message translates to:
  /// **'Orders this month'**
  String get targetsKpiOrders;

  /// No description provided for @targetsKpiNoTarget.
  ///
  /// In en, this message translates to:
  /// **'Reps without a target'**
  String get targetsKpiNoTarget;

  /// No description provided for @targetsKindVisit.
  ///
  /// In en, this message translates to:
  /// **'Visit'**
  String get targetsKindVisit;

  /// No description provided for @targetsKindOrder.
  ///
  /// In en, this message translates to:
  /// **'Order'**
  String get targetsKindOrder;

  /// No description provided for @targetsCustomer.
  ///
  /// In en, this message translates to:
  /// **'Customer'**
  String get targetsCustomer;

  /// No description provided for @targetsWhen.
  ///
  /// In en, this message translates to:
  /// **'Logged at'**
  String get targetsWhen;

  /// No description provided for @targetsType.
  ///
  /// In en, this message translates to:
  /// **'Type'**
  String get targetsType;

  /// No description provided for @targetsVoid.
  ///
  /// In en, this message translates to:
  /// **'Void entry'**
  String get targetsVoid;

  /// No description provided for @targetsVoidReason.
  ///
  /// In en, this message translates to:
  /// **'Reason'**
  String get targetsVoidReason;

  /// No description provided for @targetsVoided.
  ///
  /// In en, this message translates to:
  /// **'Voided'**
  String get targetsVoided;

  /// No description provided for @targetsVoidTitle.
  ///
  /// In en, this message translates to:
  /// **'Void this entry?'**
  String get targetsVoidTitle;

  /// No description provided for @targetsVoidBody.
  ///
  /// In en, this message translates to:
  /// **'It stops counting toward the target. The entry stays in the log with your reason.'**
  String get targetsVoidBody;

  /// No description provided for @targetsEmptyLog.
  ///
  /// In en, this message translates to:
  /// **'No visits or orders logged this month'**
  String get targetsEmptyLog;

  /// No description provided for @targetsEmptyLogBody.
  ///
  /// In en, this message translates to:
  /// **'Entries appear here as reps log them in the app.'**
  String get targetsEmptyLogBody;

  /// No description provided for @targetsSelectedCount.
  ///
  /// In en, this message translates to:
  /// **'{count} selected reps'**
  String targetsSelectedCount(String count);

  /// No description provided for @salesTitle.
  ///
  /// In en, this message translates to:
  /// **'My target'**
  String get salesTitle;

  /// No description provided for @salesMonthTarget.
  ///
  /// In en, this message translates to:
  /// **'Target for {month}'**
  String salesMonthTarget(String month);

  /// No description provided for @salesNone.
  ///
  /// In en, this message translates to:
  /// **'No target set for this month yet'**
  String get salesNone;

  /// No description provided for @salesNoneBody.
  ///
  /// In en, this message translates to:
  /// **'Your administrator sets monthly targets. You can still log visits and orders.'**
  String get salesNoneBody;

  /// No description provided for @salesLogVisit.
  ///
  /// In en, this message translates to:
  /// **'Log a visit'**
  String get salesLogVisit;

  /// No description provided for @salesLogOrder.
  ///
  /// In en, this message translates to:
  /// **'Log an order'**
  String get salesLogOrder;

  /// No description provided for @salesCustomerHint.
  ///
  /// In en, this message translates to:
  /// **'Shop or customer name'**
  String get salesCustomerHint;

  /// No description provided for @salesNoteHint.
  ///
  /// In en, this message translates to:
  /// **'What happened? (optional)'**
  String get salesNoteHint;

  /// No description provided for @salesLogged.
  ///
  /// In en, this message translates to:
  /// **'Saved'**
  String get salesLogged;

  /// No description provided for @salesCheckInFirst.
  ///
  /// In en, this message translates to:
  /// **'Check in to log visits and orders.'**
  String get salesCheckInFirst;

  /// No description provided for @salesRecent.
  ///
  /// In en, this message translates to:
  /// **'This month'**
  String get salesRecent;

  /// No description provided for @salesEmpty.
  ///
  /// In en, this message translates to:
  /// **'Nothing logged yet this month'**
  String get salesEmpty;

  /// No description provided for @salesRemaining.
  ///
  /// In en, this message translates to:
  /// **'{count} to go'**
  String salesRemaining(String count);

  /// No description provided for @salesReached.
  ///
  /// In en, this message translates to:
  /// **'Target reached'**
  String get salesReached;

  /// No description provided for @salesViewAll.
  ///
  /// In en, this message translates to:
  /// **'View all'**
  String get salesViewAll;

  /// No description provided for @notifyTargetSet.
  ///
  /// In en, this message translates to:
  /// **'Your sales target for {month} has been set'**
  String notifyTargetSet(String month);

  /// No description provided for @demoBadge.
  ///
  /// In en, this message translates to:
  /// **'Live demo'**
  String get demoBadge;

  /// No description provided for @demoBanner.
  ///
  /// In en, this message translates to:
  /// **'Live demo — simulated reps are working right now; data resets every night.'**
  String get demoBanner;

  /// No description provided for @demoGetIt.
  ///
  /// In en, this message translates to:
  /// **'Get SFMS for your team'**
  String get demoGetIt;

  /// No description provided for @demoSource.
  ///
  /// In en, this message translates to:
  /// **'Source on GitHub'**
  String get demoSource;

  /// No description provided for @demoLoginTitle.
  ///
  /// In en, this message translates to:
  /// **'Try the live demo'**
  String get demoLoginTitle;

  /// No description provided for @demoLoginBody.
  ///
  /// In en, this message translates to:
  /// **'Explore as the administrator. Simulated reps are checking in, driving routes and logging visits right now — open the live map.'**
  String get demoLoginBody;

  /// No description provided for @demoSignIn.
  ///
  /// In en, this message translates to:
  /// **'Enter the demo'**
  String get demoSignIn;

  /// No description provided for @demoCredentials.
  ///
  /// In en, this message translates to:
  /// **'Administrator {id} · password {password}'**
  String demoCredentials(String id, String password);

  /// No description provided for @demoBuiltBy.
  ///
  /// In en, this message translates to:
  /// **'Built by Muhammad Abdullah Waseem'**
  String get demoBuiltBy;

  /// No description provided for @demoAppHint.
  ///
  /// In en, this message translates to:
  /// **'Demo: sign in as {id} with password {password}. Check-ins from outside the Riyadh office are flagged for review — that\'s the fraud check at work.'**
  String demoAppHint(String id, String password);

  /// No description provided for @demoUseDemo.
  ///
  /// In en, this message translates to:
  /// **'Fill in demo sign-in'**
  String get demoUseDemo;

  /// No description provided for @errorDEMOPROTECTED.
  ///
  /// In en, this message translates to:
  /// **'Demo accounts are shared by every visitor, so they can\'t be changed. Create your own employee to try this.'**
  String get errorDEMOPROTECTED;
}

class _AppLocalizationsDelegate extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) => <String>['ar', 'en'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'ar':
      return AppLocalizationsAr();
    case 'en':
      return AppLocalizationsEn();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
