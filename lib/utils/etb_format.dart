import 'package:intl/intl.dart';

/// ETB (Ethiopian Birr) formatting for Betegna.
class EtbFormat {
  static final NumberFormat _currency = NumberFormat.currency(
    locale: 'en_ET',
    symbol: 'Br',
    decimalDigits: 2,
  );

  static String format(double amount) {
    return _currency.format(amount);
  }

  static String formatCompact(double amount) {
    if (amount >= 1000) {
      return 'Br ${(amount / 1000).toStringAsFixed(1)}k';
    }
    return format(amount);
  }
}
