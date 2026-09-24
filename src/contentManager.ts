import * as FileSystem from "expo-file-system";
import { Asset } from "expo-asset";

export type ContentMapping = {
  [command: string]: string;
};

const CONTENT_DIR = `${FileSystem.documentDirectory}content/`;
const MAPPING_FILE = `${CONTENT_DIR}mappings.json`;

const DEFAULT_MAPPING: ContentMapping = {
  HOME: "home.png",
  ONE: "one.png",
  TWO: "two.png",
};

const DEFAULT_ASSETS = [
  {
    filename: "home.png",
    asset: require("../assets/home.png"),
  },
  {
    filename: "one.png",
    asset: require("../assets/one.png"),
  },
  {
    filename: "two.png",
    asset: require("../assets/two.png"),
  },
];

async function ensureContentDirectory() {
  const info = await FileSystem.getInfoAsync(CONTENT_DIR);

  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(CONTENT_DIR, {
      intermediates: true,
    });
  }
}

async function copyBundledAsset(
  assetModule: number,
  destination: string
) {
  const destinationInfo =
    await FileSystem.getInfoAsync(destination);

  if (destinationInfo.exists) {
    return;
  }

  const asset = Asset.fromModule(assetModule);

  await asset.downloadAsync();

  if (!asset.localUri) {
    throw new Error(
      `Could not obtain local URI for ${destination}`
    );
  }

  await FileSystem.copyAsync({
    from: asset.localUri,
    to: destination,
  });
}

export async function initializeContent() {
  await ensureContentDirectory();

  const mappingInfo =
    await FileSystem.getInfoAsync(MAPPING_FILE);

  // Only install the defaults when there is no mapping yet.
  //
  // This is important: future app launches must NOT overwrite
  // content uploaded by the PC.
  if (!mappingInfo.exists) {
    for (const item of DEFAULT_ASSETS) {
      await copyBundledAsset(
        item.asset,
        `${CONTENT_DIR}${item.filename}`
      );
    }

    await FileSystem.writeAsStringAsync(
      MAPPING_FILE,
      JSON.stringify(DEFAULT_MAPPING, null, 2)
    );
  }
}

export async function loadMappings():
  Promise<ContentMapping> {

  const info =
    await FileSystem.getInfoAsync(MAPPING_FILE);

  if (!info.exists) {
    return {};
  }

  const text =
    await FileSystem.readAsStringAsync(MAPPING_FILE);

  return JSON.parse(text);
}

export function getContentUri(
  filename: string
): string {
  return `${CONTENT_DIR}${filename}`;
}

export async function contentFileExists(
  filename: string
): Promise<boolean> {

  const info = await FileSystem.getInfoAsync(
    getContentUri(filename)
  );

  return info.exists;
}

export function getContentDirectory(): string {
  return CONTENT_DIR;
}