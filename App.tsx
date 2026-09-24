import React, { useEffect, useState } from "react";
import {
  Image,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

import MimoUdp, {
  MimoUdpMessageEvent,
} from "./modules/mimo-udp/src/MimoUdpModule";

import {
  ContentMapping,
  contentFileExists,
  getContentUri,
  initializeContent,
  loadMappings,
} from "./src/contentManager";

const UDP_PORT = 5005;
const HTTP_PORT = 8080;

export default function App() {
  const [mappings, setMappings] =
    useState<ContentMapping>({});

  const [currentCommand, setCurrentCommand] =
    useState("HOME");

  const [currentImage, setCurrentImage] =
    useState<string | null>(null);

  const [lastSender, setLastSender] =
    useState<string | null>(null);

  const [status, setStatus] =
    useState("Initializing content...");

  useEffect(() => {
    let mounted = true;
    let subscription: any = null;

    async function start() {
      try {
        // ------------------------------------
        // Initialize local writable content
        // ------------------------------------

        await initializeContent();

        const loadedMappings =
          await loadMappings();

        if (!mounted) {
          return;
        }

        setMappings(loadedMappings);

        // ------------------------------------
        // Load HOME
        // ------------------------------------

        const homeFilename =
          loadedMappings["HOME"];

        if (homeFilename) {
          const exists =
            await contentFileExists(homeFilename);

          if (exists && mounted) {
            setCurrentImage(
              getContentUri(homeFilename)
            );

            setCurrentCommand("HOME");
          }
        }

        setStatus(`UDP :${UDP_PORT} | HTTP :${HTTP_PORT}`);

        // ------------------------------------
        // UDP
        // ------------------------------------

        MimoUdp.startListening(UDP_PORT);
        MimoUdp.startHttpServer(HTTP_PORT);

        subscription = MimoUdp.addListener(
          "onMessage",
          async (event: MimoUdpMessageEvent) => {

            const command = event.message
              .trim()
              .toUpperCase();

            console.log(
              `UDP from ${event.address}: ${command}`
            );

            if (
              command.startsWith("__ERROR__:")
            ) {
              setStatus(command);
              return;
            }

            const filename =
              loadedMappings[command];

            if (!filename) {
              console.log(
                `Unknown command: ${command}`
              );

              return;
            }

            const exists =
              await contentFileExists(filename);

            if (!exists) {
              console.log(
                `Mapped file does not exist: ${filename}`
              );

              return;
            }

            if (!mounted) {
              return;
            }

            setCurrentCommand(command);
            setCurrentImage(
              getContentUri(filename)
            );
            setLastSender(event.address);
          }
        );

      } catch (error) {

        console.error(error);

        if (mounted) {
          setStatus(
            `ERROR: ${
              error instanceof Error
                ? error.message
                : String(error)
            }`
          );
        }
      }
    }

    start();

    return () => {
      mounted = false;

      if (subscription) {
        subscription.remove();
      }

      MimoUdp.stopListening();
      MimoUdp.stopHttpServer();
    };
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {currentImage ? (
        <Image
          source={{ uri: currentImage }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.loading}>
          <Text style={styles.loadingText}>
            {status}
          </Text>
        </View>
      )}

      <View style={styles.debug}>
        <Text style={styles.debugText}>
          {status}
          {" | "}
          {currentCommand}
          {lastSender
            ? ` | ${lastSender}`
            : ""}
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

  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    color: "white",
    fontSize: 18,
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