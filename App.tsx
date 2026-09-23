import React, { useEffect, useState } from "react";
import {
  Image,
  ImageSourcePropType,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

import MimoUdp, {
  MimoUdpMessageEvent,
} from "./modules/mimo-udp/src/MimoUdpModule";

const UDP_PORT = 5005;

const images: Record<string, ImageSourcePropType> = {
  HOME: require("./assets/home.png"),
  ONE: require("./assets/one.png"),
  TWO: require("./assets/two.png"),
};

export default function App() {
  const [currentCommand, setCurrentCommand] = useState("HOME");
  const [lastSender, setLastSender] = useState<string | null>(null);

  useEffect(() => {
    console.log(`Starting UDP listener on port ${UDP_PORT}`);

    MimoUdp.startListening(UDP_PORT);

    const subscription = MimoUdp.addListener(
      "onMessage",
      (event: MimoUdpMessageEvent) => {
        const command = event.message
          .trim()
          .toUpperCase();

        console.log(
          `UDP from ${event.address}: ${command}`
        );

        if (command.startsWith("__ERROR__:")) {
          console.log("UDP error:", command);
          return;
        }

        if (images[command]) {
          setCurrentCommand(command);
          setLastSender(event.address);
        } else {
          console.log(
            `Unknown UDP command: ${command}`
          );
        }
      }
    );

    return () => {
      subscription.remove();
      MimoUdp.stopListening();
    };
  }, []);

  const currentImage = images[currentCommand];

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      <Image
        source={currentImage}
        style={styles.image}
        resizeMode="cover"
      />

      <View style={styles.debug}>
        <Text style={styles.debugText}>
          UDP :{UDP_PORT} | {currentCommand}
          {lastSender ? ` | ${lastSender}` : ""}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },

  image: {
    width: "100%",
    height: "100%",
  },

  debug: {
    position: "absolute",
    left: 10,
    bottom: 5,
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 8,
    paddingVertical: 3,
  },

  debugText: {
    color: "white",
    fontSize: 11,
  },
});