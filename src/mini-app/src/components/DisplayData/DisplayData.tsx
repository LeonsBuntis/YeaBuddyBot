import type { FC, ReactNode } from 'react';

import { isRGB } from '@telegram-apps/sdk-react';
import { Cell, Checkbox, Section } from '@telegram-apps/telegram-ui';

import { Link } from '@/components/Link/Link.tsx';
import { RGB } from '@/components/RGB/RGB.tsx';
import { bem } from '@/css/bem.ts';

import './DisplayData.css';

const [, e] = bem('display-data');

export interface DisplayDataProps {
  footer?: ReactNode;
  header?: ReactNode;
  rows: DisplayDataRow[];
}

export type DisplayDataRow =
  & { title: string }
  & (
  | { type: 'link'; value?: string }
  | { value: ReactNode }
  )

export const DisplayData: FC<DisplayDataProps> = ({ header, rows }) => (
  <Section header={header}>
    {rows.map((item, idx) => {
      let valueNode: ReactNode;

      if (item.value === undefined) {
        valueNode = <i>empty</i>;
      } else {
        if ('type' in item) {
          valueNode = <Link to={item.value}>Open</Link>;
        } else if (typeof item.value === 'string') {
          valueNode = isRGB(item.value)
            ? <RGB color={item.value}/>
            : item.value;
        } else if (typeof item.value === 'boolean') {
          valueNode = <Checkbox checked={item.value} disabled/>;
        } else {
          valueNode = item.value;
        }
      }

      return (
        <Cell
          className={e('line')}
          key={idx}
          multiline={true}
          readOnly
          subhead={item.title}
        >
          <span className={e('line-value')}>
            {valueNode}
          </span>
        </Cell>
      );
    })}
  </Section>
);
