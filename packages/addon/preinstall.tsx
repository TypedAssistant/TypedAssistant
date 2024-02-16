import { readFileSync, writeFileSync } from "fs"

const packageJsonPath = process.argv[2]
if (typeof packageJsonPath !== "string") {
  console.error("No package.json path provided!")
  process.exit(1)
}

// Read the package.json file
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"))

// Get the list of packages with "workspace:*" versions from dependencies and devDependencies
const packagesToUpdate = [
  ...(Object.entries(packageJson.dependencies || {}) as [string, string][]),
  ...(Object.entries(packageJson.devDependencies || {}) as [string, string][]),
].filter(([_, version]) => version.startsWith("workspace:*"))

// Loop over the packages and update their versions
Promise.all(
  packagesToUpdate.map(async ([packageName, _]) => {
    try {
      // Make a request to npm to get the latest version of the package
      const response = await fetch(
        `https://registry.npmjs.org/${packageName}/latest`,
      ).then((res) => res.json())
      const latestVersion = response.version

      // Update the package version in dependencies or devDependencies
      if (packageJson.dependencies && packageJson.dependencies[packageName]) {
        packageJson.dependencies[packageName] = `^${latestVersion}`
      }
      if (
        packageJson.devDependencies &&
        packageJson.devDependencies[packageName]
      ) {
        packageJson.devDependencies[packageName] = `^${latestVersion}`
      }
    } catch (error) {
      console.error(
        `Failed to get latest version for package ${packageName}:`,
        error,
      )
    }
  }),
)
  .then(() => {
    const newFile = `${JSON.stringify(packageJson, null, 2)}\n`
    writeFileSync(packageJsonPath, newFile)
  })
  .catch((error) => {
    console.error("Failed to update package.json:", error)
  })
