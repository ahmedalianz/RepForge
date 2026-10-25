import { View } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '../../src/app/theme/ThemeProvider';
import { RecordSummary } from '../../src/features/home/components/RecordSummary';
import { getDashboardPresentation } from '../../src/features/home/domain/presentation';
import { initializeLocalization } from '../../src/localization/i18n';
import {
  languageDirection,
  type AppLanguage,
} from '../../src/localization/types';

test.each<AppLanguage>(['ar-EG', 'en-US'])(
  'estimated-max weight follows the %s screen direction',
  async language => {
    await initializeLocalization(language);
    const dashboard = getDashboardPresentation(
      {
        days: [],
        weeklyWorkouts: 0,
        totalWorkouts: 0,
        weeklyVolumeKg: 0,
        activeTimeMs: 0,
        streakDays: 0,
        recentRecord: null,
        recentVolumeKg: 0,
        previousVolumeKg: 0,
      },
      'kg',
      Date.now(),
    );
    await render(
      <ThemeProvider>
        <View style={{ direction: languageDirection(language) }}>
          <RecordSummary
            dashboard={{ ...dashboard, estimate: '138' }}
            onRecords={jest.fn()}
          />
        </View>
      </ThemeProvider>,
    );
    const weightRow = screen.getByText('138').parent!;
    expect(weightRow).toHaveStyle({
      direction: 'inherit',
      flexDirection: 'row',
    });
    expect(screen.getByText(language === 'ar-EG' ? 'كجم' : 'kg').parent).toBe(
      weightRow,
    );
  },
);
