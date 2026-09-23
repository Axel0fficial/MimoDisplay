import React from "react";
import {
  Dimensions,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function App() {
  const window = Dimensions.get("window");
  const screen = Dimensions.get("screen");

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      <View style={styles.leftEdge} />

      <View style={styles.content}>
        <Text style={styles.title}>MIMO DISPLAY POC</Text>

        <Text style={styles.info}>
          WINDOW {Math.round(window.width)} × {Math.round(window.height)}
        </Text>

        <Text style={styles.info}>
          SCREEN {Math.round(screen.width)} × {Math.round(screen.height)}
        </Text>

        <Text style={styles.info}>
          API {Platform.Version}
        </Text>
      </View>

      <View style={styles.rightEdge} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#111",
  },

  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    color: "white",
    fontSize: 26,
    fontWeight: "bold",
  },

  info: {
    color: "white",
    fontSize: 16,
  },

  leftEdge: {
    width: 10,
    height: "100%",
    backgroundColor: "red",
  },

  rightEdge: {
    width: 10,
    height: "100%",
    backgroundColor: "blue",
  },
});