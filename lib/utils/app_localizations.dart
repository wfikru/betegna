import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

/// Amharic (default) and English strings for Betegna.
class AppLocalizations {
  final Locale locale;
  AppLocalizations(this.locale);

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  static const List<Locale> supportedLocales = [
    Locale('am'),
    Locale('en'),
  ];

  bool get isAmharic => locale.languageCode == 'am';

  // App
  String get appName => isAmharic ? 'በተኛ' : 'Betegna';
  String get postTask => isAmharic ? 'ተግባር ለጥፍ' : 'Post Task';
  String get browseTasks => isAmharic ? 'ተግባሮችን ለማየት' : 'Browse Tasks';
  String get myTasks => isAmharic ? 'ተግባሮቼ' : 'My Tasks';
  String get profile => isAmharic ? 'መገለጫ' : 'Profile';
  String get login => isAmharic ? 'ግባ' : 'Login';
  String get register => isAmharic ? 'ይመዝገቡ' : 'Register';
  String get logout => isAmharic ? 'ውጣ' : 'Logout';
  String get save => isAmharic ? 'አስቀምጥ' : 'Save';
  String get cancel => isAmharic ? 'ሰርዝ' : 'Cancel';
  String get submit => isAmharic ? 'አስገባ' : 'Submit';
  String get chat => isAmharic ? 'መገናኛ' : 'Chat';
  String get pay => isAmharic ? 'ክፈል' : 'Pay';
  String get bid => isAmharic ? 'ዋጋ ስጥ' : 'Bid';
  String get sos => isAmharic ? 'SOS' : 'SOS';
  String get rating => isAmharic ? 'ደረጃ' : 'Rating';
  String get client => isAmharic ? 'ደንበኛ' : 'Client';
  String get tasker => isAmharic ? 'ተግባር ሠራተኛ' : 'Tasker';
  String get budget => isAmharic ? 'በጀት (ብር)' : 'Budget (ETB)';
  String get category => isAmharic ? 'ምድብ' : 'Category';
  String get description => isAmharic ? 'ገለጻ' : 'Description';
  String get message => isAmharic ? 'መልእክት' : 'Message';
  String get bio => isAmharic ? 'ባዮ' : 'Bio';
  String get location => isAmharic ? 'ቦታ' : 'Location';
  String get selectLocation => isAmharic ? 'ቦታ ምረጥ' : 'Select Location';
  String get nearbyTasks => isAmharic ? 'ቅርብ ተግባሮች' : 'Nearby Tasks';
  String get noTasks => isAmharic ? 'ተግባር የለም' : 'No tasks yet';
  String get completeTask => isAmharic ? 'ተግባር አጠናቅቅ' : 'Complete Task';
  String get releasePayment => isAmharic ? 'ክፍያ ፈታ' : 'Release Payment';
  String get rateTasker => isAmharic ? 'ተግባር ሠራተኛን ገምግም' : 'Rate Tasker';
}
