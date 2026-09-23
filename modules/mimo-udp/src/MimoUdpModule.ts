import { requireNativeModule } from "expo-modules-core";

export type MimoUdpMessageEvent = {
  message: string;
  address: string;
};

export default requireNativeModule("MimoUdp");