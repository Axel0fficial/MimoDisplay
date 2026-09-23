import React, { useEffect, useState } from "react";
import {
  Image,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

const SERVER = "http://172.16.1.32:8765";

type Content = {
  version: number;
  type: "image";
  url: string;
};

export default function App() {
  const [content, setContent] = useState<Content | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadContent() {
    try {
      const response = await fetch(`${SERVER}/api/status`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: Content = await response.json();

      setContent(data);
      setError(null);
    } catch (err) {
      console.log(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect to server"
      );
    }
  }

  useEffect(() => {
    loadContent();

    const interval = setInterval(() => {
      loadContent();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <View style={styles.center}>
        <StatusBar hidden />

        <Text style={styles.title}>
          MIMO DISPLAY
        </Text>

        <Text style={styles.error}>
          Server unavailable
        </Text>

        <Text style={styles.server}>
          {SERVER}
        </Text>

        <Text style={styles.retry}>
          Retrying...
        </Text>
      </View>
    );
  }

  if (!content) {
    return (
      <View style={styles.center}>
        <StatusBar hidden />

        <Text style={styles.title}>
          Connecting to MIMO server...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      <Image
        source={{
          uri: `${SERVER}${content.url}?v=${content.version}`,
        }}
        style={styles.image}
        resizeMode="cover"
      />
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

  center: {
    flex: 1,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },

  error: {
    color: "#ff5555",
    fontSize: 18,
    marginTop: 8,
  },

  server: {
    color: "#aaa",
    fontSize: 14,
    marginTop: 4,
  },

  retry: {
    color: "#aaa",
    fontSize: 12,
    marginTop: 4,
  },
});