#!/usr/bin/env node

/**
 * Project Reset Script
 * 
 * This script resets the project to a blank state by either moving or deleting
 * existing directories (/app, /components, /hooks, /scripts, /constants) and
 * creating a new minimal /app directory with basic files.
 * 
 * Usage: npm run reset-project
 * 
 * The script will prompt the user to choose between:
 * - Moving existing files to /app-example (preserves code for reference)
 * - Deleting existing files completely
 * 
 * After running, you can safely remove this script from package.json and delete this file.
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");

/**
 * Project root directory
 */
const root = process.cwd();

/**
 * Directories to be moved or deleted during reset
 */
const oldDirs = ["app", "components", "hooks", "constants", "scripts"];

/**
 * Directory name for preserving existing files
 */
const exampleDir = "app-example";

/**
 * New app directory name
 */
const newAppDir = "app";

/**
 * Full path to the example directory
 */
const exampleDirPath = path.join(root, exampleDir);

/**
 * Default content for the new index.tsx file
 */
const indexContent = `import { Text, View } from "react-native";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Edit app/index.tsx to edit this screen.</Text>
    </View>
  );
}
`;

/**
 * Default content for the new _layout.tsx file
 */
const layoutContent = `import { Stack } from "expo-router";

export default function RootLayout() {
  return <Stack />;
}
`;

/**
 * Readline interface for user input
 */
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/**
 * Main function to move or delete directories and create new app structure
 * 
 * @param userInput - User's choice ('y' for move, 'n' for delete)
 */
const moveDirectories = async (userInput) => {
  try {
    if (userInput === "y") {
      // Create the app-example directory
      await fs.promises.mkdir(exampleDirPath, { recursive: true });
      console.log(`📁 /${exampleDir} directory created.`);
    }

    // Move old directories to new app-example directory or delete them
    for (const dir of oldDirs) {
      const oldDirPath = path.join(root, dir);
      if (fs.existsSync(oldDirPath)) {
        if (userInput === "y") {
          const newDirPath = path.join(root, exampleDir, dir);
          await fs.promises.rename(oldDirPath, newDirPath);
          console.log(`➡️ /${dir} moved to /${exampleDir}/${dir}.`);
        } else {
          await fs.promises.rm(oldDirPath, { recursive: true, force: true });
          console.log(`❌ /${dir} deleted.`);
        }
      } else {
        console.log(`➡️ /${dir} does not exist, skipping.`);
      }
    }

    // Create new /app directory
    const newAppDirPath = path.join(root, newAppDir);
    await fs.promises.mkdir(newAppDirPath, { recursive: true });
    console.log("\n📁 New /app directory created.");

    // Create index.tsx
    const indexPath = path.join(newAppDirPath, "index.tsx");
    await fs.promises.writeFile(indexPath, indexContent);
    console.log("📄 app/index.tsx created.");

    // Create _layout.tsx
    const layoutPath = path.join(newAppDirPath, "_layout.tsx");
    await fs.promises.writeFile(layoutPath, layoutContent);
    console.log("📄 app/_layout.tsx created.");

    console.log("\n✅ Project reset complete. Next steps:");
    console.log(
      `1. Run \`npx expo start\` to start a development server.\n2. Edit app/index.tsx to edit the main screen.${
        userInput === "y"
          ? `\n3. Delete the /${exampleDir} directory when you're done referencing it.`
          : ""
      }`
    );
  } catch (error) {
    console.error(`❌ Error during script execution: ${error.message}`);
  }
};

/**
 * Prompt user for input and execute the reset process
 */
rl.question(
  "Do you want to move existing files to /app-example instead of deleting them? (Y/n): ",
  (answer) => {
    const userInput = answer.trim().toLowerCase() || "y";
    if (userInput === "y" || userInput === "n") {
      moveDirectories(userInput).finally(() => rl.close());
    } else {
      console.log("❌ Invalid input. Please enter 'Y' or 'N'.");
      rl.close();
    }
  }
);
