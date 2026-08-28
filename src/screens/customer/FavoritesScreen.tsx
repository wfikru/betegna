import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../components/common/Screen';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { ProCard } from '../../components/cards/ProCard';
import { SkeletonList } from '../../components/common/Skeleton';
import { useTheme } from '../../state/ThemeContext';
import { useAuth } from '../../state/AuthContext';
import { t } from '../../i18n';
import type { FavoriteItem, ProfessionalProfile } from '../../models/types';
import { subscribeFavorites } from '../../services/favorites';
import { getPro } from '../../services/professionals';
import { useAppNavigation } from '../../app/navigation/useAppNavigation';
import type { RootStackParamList } from '../../app/navigation/types';

export default function FavoritesScreen() {
  const { palette } = useTheme();
  const { user } = useAuth();
  const navigation = useAppNavigation();
  const [favs, setFavs] = useState<FavoriteItem[] | null>(null);
  const [pros, setPros] = useState<Record<string, ProfessionalProfile>>({});

  useEffect(() => {
    if (!user) return;
    return subscribeFavorites(user.uid, (list) => {
      setFavs(list);
      list.forEach((f) => {
        if (!pros[f.proId]) void getPro(f.proId).then((p) => p && setPros((prev) => ({ ...prev, [f.proId]: p })));
      });
    });
  }, [user, pros]);

  return (
    <Screen scroll>
      <PageHeader title="Saved professionals" fallbackTab="ProfileTab" />
      <Text style={{ color: palette.text, fontSize: 26, fontWeight: '800', marginBottom: 16 }}>{t('fav.title')}</Text>
      {favs === null ? (
        <SkeletonList rows={2} />
      ) : favs.length === 0 ? (
        <EmptyState icon="heart-outline" title={t('fav.empty')} message="Tap the ♥ on any professional to save them here." />
      ) : (
        favs.map((f) => {
          const pro = pros[f.proId];
          if (!pro) return null;
          return (
            <ProCard
              key={f.id}
              pro={pro}
              onPress={() => navigation.navigate('ProProfile', { proId: pro.uid })}
            />
          );
        })
      )}
    </Screen>
  );
}
