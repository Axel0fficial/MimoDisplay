import {
  requireNativeModule,
} from "expo-modules-core";

export type MimoUdpMessageEvent = {
  message: string;
  address: string;
};

export type MimoHttpRequestEvent = {
  method: string;
  path: string;
  body: string;
};

export default requireNativeModule(
  "MimoUdp"
);