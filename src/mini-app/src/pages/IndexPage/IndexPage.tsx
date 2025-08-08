import { Section, Cell, Image, List } from '@telegram-apps/telegram-ui';
import type { FC } from 'react';

import { Link } from '@/components/Link/Link.tsx';
import { Page } from '@/components/Page.tsx';
import { useToast } from '@/components/Toast';

import tonSvg from './ton.svg';

export const IndexPage: FC = () => {
  const { info } = useToast();

  const handleFeatureClick = (feature: string) => {
    info(`🚀 Navigating to ${feature}...`);
  };

  return (
    <Page back={false}>
      <List>
        <Section
          header="Features"
          footer="You can use these pages to learn more about features, provided by Telegram Mini Apps and other useful projects"
        >
          <Link to="/ton-connect" onClick={() => handleFeatureClick('TON Connect')}>
            <Cell
              before={<Image src={tonSvg} style={{ backgroundColor: '#007AFF' }}/>}
              subtitle="Connect your TON wallet"
            >
              TON Connect
            </Cell>
          </Link>
          <Link to="/toast-demo" onClick={() => handleFeatureClick('Toast Demo')}>
            <Cell
              subtitle="Modern toast notifications with daisyUI"
            >
              🍞 Toast Notifications
            </Cell>
          </Link>
        </Section>
        <Section
          header="Application Launch Data"
          footer="These pages help developer to learn more about current launch information"
        >
          <Link to="/init-data" onClick={() => handleFeatureClick('Init Data')}>
            <Cell subtitle="User data, chat information, technical data">Init Data</Cell>
          </Link>
          <Link to="/launch-params" onClick={() => handleFeatureClick('Launch Parameters')}>
            <Cell subtitle="Platform identifier, Mini Apps version, etc.">Launch Parameters</Cell>
          </Link>
          <Link to="/theme-params" onClick={() => handleFeatureClick('Theme Parameters')}>
            <Cell subtitle="Telegram application palette information">Theme Parameters</Cell>
          </Link>
        </Section>
      </List>
    </Page>
  );
};
