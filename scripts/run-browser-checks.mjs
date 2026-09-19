import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
const require = createRequire(import.meta.url);
const cli = path.join(
  path.dirname(require.resolve("@playwright/cli/package.json")),
  "playwright-cli.js",
);
mkdirSync("output/playwright", { recursive: true });
function run(args) {
  const result = spawnSync(
    process.execPath,
    [cli, "-s=pokehunt-checks", ...args],
    { encoding: "utf8", maxBuffer: 8 * 1024 * 1024 },
  );
  if (result.status !== 0) {
    throw new Error(result.stdout + result.stderr);
  }
  return result.stdout;
}
try {
  run(["open", process.env.POKEHUNT_TEST_URL ?? "http://127.0.0.1:3000"]);
  const output = run(["run-code", "--filename", "scripts/browser-checks.js"]);
  writeFileSync("output/playwright/verification.log", output);
  const match = /### Result\s*\n([^\n]+)/.exec(output);
  if (!match)
    throw new Error("O navegador não retornou um relatório de verificação.");
  const report = JSON.parse(match[1]);
  writeFileSync(
    "output/playwright/report.json",
    JSON.stringify(report, null, 2),
  );
  console.log(
    `${report.passed} verificações aprovadas. ${report.consoleErrors.length} erros de console. ${report.requestsDuringAnalysis} requisições durante a análise.`,
  );
  console.log("Relatório e capturas: output/playwright/");
} finally {
  spawnSync(process.execPath, [cli, "-s=pokehunt-checks", "close"], {
    encoding: "utf8",
  });
}
