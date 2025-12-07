const fs = require("fs");
const path = require("path");

function writeEnv(frontEnv, backEnv) {
  const frontendPath = path.join(__dirname, "../frontend/.env");
  const backendPath = path.join(__dirname, "../backend/.env");
  const f = Object.entries(frontEnv)
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
  const b = Object.entries(backEnv)
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  fs.writeFileSync(frontendPath, f, "utf8");
  fs.writeFileSync(backendPath, b, "utf8");

  console.log("✨ Auto-wrote frontend/.env");
  console.log("✨ Auto-wrote backend/.env");
}

module.exports = { writeEnv };
