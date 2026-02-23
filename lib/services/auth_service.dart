import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../models/user_model.dart';

/// Firebase Auth wrapper: Google Sign-In (Gmail), profile in Firestore.
class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final GoogleSignIn _googleSignIn = GoogleSignIn();

  User? get currentUser => _auth.currentUser;
  Stream<User?> get authStateChanges => _auth.authStateChanges();

  /// Sign in with Google (Gmail). Returns the Firebase user on success.
  Future<User?> signInWithGoogle() async {
    try {
      final googleUser = await _googleSignIn.signIn();
      if (googleUser == null) return null;

      final googleAuth = await googleUser.authentication;
      final credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );
      final userCredential = await _auth.signInWithCredential(credential);
      return userCredential.user;
    } catch (e) {
      rethrow;
    }
  }

  Future<void> signOut() async {
    await _googleSignIn.signOut();
    await _auth.signOut();
  }

  /// Create or update user profile in Firestore.
  Future<void> setUserProfile(UserModel user) async {
    await _firestore.collection('users').doc(user.id).set(user.toMap());
  }

  /// Get user profile from Firestore (with offline cache in caller).
  Future<UserModel?> getUserProfile(String uid) async {
    try {
      final doc = await _firestore.collection('users').doc(uid).get();
      if (doc.exists && doc.data() != null) {
        return UserModel.fromMap({...doc.data()!, 'id': doc.id});
      }
    } catch (e) {
      // ignore
    }
    return null;
  }

  Stream<DocumentSnapshot<Map<String, dynamic>>> watchUserProfile(String uid) {
    return _firestore.collection('users').doc(uid).snapshots();
  }
}
