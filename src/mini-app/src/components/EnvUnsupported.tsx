import { isColorDark, isRGB, retrieveLaunchParams } from '@telegram-apps/sdk-react';
import { AppRoot, Placeholder } from '@telegram-apps/telegram-ui';
import { useMemo } from 'react';

export function EnvUnsupported() {
  const [platform, isDark] = useMemo(() => {
    try {
      const lp = retrieveLaunchParams();
      const { bg_color: bgColor } = lp.tgWebAppThemeParams;
      return [lp.tgWebAppPlatform, bgColor && isRGB(bgColor) ? isColorDark(bgColor) : false];
    } catch {
      return ['android', false];
    }
  }, []);

  return (
    <AppRoot
      appearance={isDark ? 'dark' : 'light'}
      platform={['ios', 'macos'].includes(platform) ? 'ios' : 'base'}
    >
      <Placeholder
        description="You are using too old Telegram client to run this application"
        header="Oops"
      >
        <img
          alt="Telegram sticker"
          src="https://xelene.me/telegram.gif"
          style={{ display: 'block', height: '144px', width: '144px' }}
        />
      </Placeholder>
    </AppRoot>
  );
}