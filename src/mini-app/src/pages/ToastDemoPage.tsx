import { Section, Cell, List, Button, Text } from '@telegram-apps/telegram-ui';
import type { FC } from 'react';

import { Page } from '@/components/Page.tsx';
import { useToast } from '@/components/Toast';

export const ToastDemoPage: FC = () => {
  const { success, error, warning, info } = useToast();

  const showSuccessToast = () => {
    success('✅ Operation completed successfully!');
  };

  const showErrorToast = () => {
    error('❌ Something went wrong. Please try again.');
  };

  const showWarningToast = () => {
    warning('⚠️ Warning: This action cannot be undone.');
  };

  const showInfoToast = () => {
    info('ℹ️ This is an informational message.');
  };

  const showLongToast = () => {
    info('This is a longer toast message that will remain visible for 5 seconds to demonstrate how longer messages are displayed in the toast system.', 5000);
  };

  const showPersistentToast = () => {
    error('This is a persistent toast that won\'t auto-dismiss. Click the X to close it.', 0);
  };

  return (
    <Page>
      <List>
        <Section header="Toast Notification Demo" footer="Try different types of toast notifications below">
          <Cell 
            subtitle="Shows a green success message"
            after={
              <Button size="s" mode="bezeled" onClick={showSuccessToast}>
                Success
              </Button>
            }
          >
            Success Toast
          </Cell>
          
          <Cell 
            subtitle="Shows a red error message"
            after={
              <Button size="s" mode="bezeled" onClick={showErrorToast}>
                Error
              </Button>
            }
          >
            Error Toast
          </Cell>
          
          <Cell 
            subtitle="Shows a yellow warning message"
            after={
              <Button size="s" mode="bezeled" onClick={showWarningToast}>
                Warning
              </Button>
            }
          >
            Warning Toast
          </Cell>
          
          <Cell 
            subtitle="Shows a blue info message"
            after={
              <Button size="s" mode="bezeled" onClick={showInfoToast}>
                Info
              </Button>
            }
          >
            Info Toast
          </Cell>
        </Section>

        <Section header="Advanced Examples" footer="Special toast configurations">
          <Cell 
            subtitle="Displays for 5 seconds instead of default 3"
            after={
              <Button size="s" mode="bezeled" onClick={showLongToast}>
                Long Toast
              </Button>
            }
          >
            Long Duration
          </Cell>
          
          <Cell 
            subtitle="Stays until manually dismissed"
            after={
              <Button size="s" mode="bezeled" onClick={showPersistentToast}>
                Persistent
              </Button>
            }
          >
            Persistent Toast
          </Cell>
        </Section>

        <Section>
          <Text>
            These toast notifications replace traditional JavaScript alerts with a modern, 
            non-blocking interface using daisyUI components. They support different types 
            (success, error, warning, info), custom durations, and manual dismissal.
          </Text>
        </Section>
      </List>
    </Page>
  );
};