import { init } from "./main";
import type { WidgetSDK, WidgetProps } from "./types";

const MOCK_PROPS: WidgetProps = {
  title: "React Widget",
  description: "A widget built with React and the Widget SDK.",
};

const mockSDK: WidgetSDK = {
  whenReady: () => Promise.resolve(),
  shadowRoot: document.getElementById("widget-root")!,
  getProps: () => MOCK_PROPS,
  on: () => () => {},
  emit: () => {},
};

init(mockSDK);
