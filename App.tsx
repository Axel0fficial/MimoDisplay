import React from "react";
import {
  Dimensions,
  Platform,
  SafeAreaView,
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

      <View style={styles.left}>
        <Text style={styles.title}>MIMO DISPLAY</Text>
        <Text style={styles.status}>POC READY</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.text}>
          WINDOW: {Math.round(window.width)} × {Math.round(window.height)}
        </Text>

        <Text style={styles.text}>
          SCREEN: {Math.round(screen.width)} × {Math.round(screen.height)}
        </Text>

        <Text style={styles.text}>
          ANDROID API: {Platform.Version}
        </Text>
      </View>

      <View style={styles.test}>
        <Text style={styles.testText}>1920 × 165 TEST</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#101010",
    paddingHorizontal: 30,
  },

  left: {
    width: 350,
  },

  title: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
  },

  status: {
    color: "#4ade80",
    fontSize: 18,
    marginTop: 4,
  },

  info: {
    flex: 1,
  },

  text: {
    color: "white",
    fontSize: 17,
    marginVertical: 2,
  },

  test: {
    width: 350,
    height: 90,
    borderWidth: 3,
    borderColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },

  testText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
});