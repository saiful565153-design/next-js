import { spawn } from "child_process";

// Process arguments
const originalArgs = process.argv.slice(2);
const newArgs = [];

for (let i = 0; i < originalArgs.length; i++) {
  const arg = originalArgs[i];
  if (arg === "--host" || arg === "-h") {
    newArgs.push("-H");
    if (originalArgs[i + 1] && !originalArgs[i + 1].startsWith("-")) {
      newArgs.push(originalArgs[i + 1]);
      i++;
    } else {
      newArgs.push("0.0.0.0");
    }
  } else if (arg.startsWith("--host=")) {
    newArgs.push("-H", arg.split("=")[1]);
  } else if (arg === "--port") {
    newArgs.push("-p");
    if (originalArgs[i + 1] && !originalArgs[i + 1].startsWith("-")) {
      newArgs.push(originalArgs[i + 1]);
      i++;
    } else {
      newArgs.push("3000");
    }
  } else if (arg.startsWith("--port=")) {
    newArgs.push("-p", arg.split("=")[1]);
  } else {
    newArgs.push(arg);
  }
}

// Ensure default port is 3000 and hostname is 0.0.0.0 if not specified
if (!newArgs.includes("-p") && !newArgs.includes("--port")) {
  newArgs.push("-p", "3000");
}
if (!newArgs.includes("-H") && !newArgs.includes("--hostname")) {
  newArgs.push("-H", "0.0.0.0");
}

console.log("Running Next.js with args:", newArgs);

const devProcess = spawn("npx", ["next", "dev", ...newArgs], {
  stdio: "inherit",
  shell: true,
});

devProcess.on("exit", (code) => {
  process.exit(code || 0);
});
