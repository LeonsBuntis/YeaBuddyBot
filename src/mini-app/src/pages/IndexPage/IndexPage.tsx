import type { FC } from "react";

import { Cell, Image, List, Section } from "@telegram-apps/telegram-ui";

import { Link } from "@/components/Link/Link.tsx";
import { Page } from "@/components/Page.tsx";

import tonSvg from "./ton.svg";

export const IndexPage: FC = () => {
  return (
    <Page back={false}>
      <List>
        <Section
          footer="You can use these pages to learn more about features, provided by Telegram Mini Apps and other useful projects"
          header="Features"
        >
          <Link to="/ton-connect">
            <Cell before={<Image src={tonSvg} style={{ backgroundColor: "#007AFF" }} />} subtitle="Connect your TON wallet">
              TON Connect
            </Cell>
          </Link>
        </Section>
        <Section footer="These pages help developer to learn more about current launch information" header="Application Launch Data">
          <Link to="/init-data">
            <Cell subtitle="User data, chat information, technical data">Init Data</Cell>
          </Link>
          <Link to="/launch-params">
            <Cell subtitle="Platform identifier, Mini Apps version, etc.">Launch Parameters</Cell>
          </Link>
          <Link to="/theme-params">
            <Cell subtitle="Telegram application palette information">Theme Parameters</Cell>
          </Link>
          <Link to="/workout">
            <Cell subtitle="Telegram application palette information">Workout</Cell>
          </Link>
        </Section>
      </List>
    </Page>
  );
};
