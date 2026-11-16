// 成就判定核对：扫描全部成就提交点，输出每条成就的判定入口，供人工逐条核对定义表
// JudgeEvents 内的循环提交按事件类型展开，避免出现「静态看不到引用」的假阴性
import fs from "node:fs";
import path from "node:path";

const root = process.argv[2] || process.cwd();
const targets = ["scripts/game", "scripts/ui", "scripts/main.lua"];
const JUDGE = path.join(root, "scripts/game/Achievements.lua");

const files = [];
function walk(p) {
  const stat = fs.statSync(p);
  if (stat.isDirectory()) {
    for (const name of fs.readdirSync(p)) walk(path.join(p, name));
  } else if (p.endsWith(".lua")) {
    files.push(p);
  }
}
for (const t of targets) {
  const full = path.join(root, t);
  if (fs.existsSync(full)) walk(full);
}

const defined = new Set();
for (const m of fs.readFileSync(JUDGE, "utf8").matchAll(/\{\s*id\s*=\s*"([a-z0-9_]+)"/g)) defined.add(m[1]);

// 判定层：JudgeEvents 里按事件类型分支提交的成就
const judgeIds = new Set();
const judgeSrc = fs.readFileSync(JUDGE, "utf8");
for (const m of judgeSrc.matchAll(/Achievements\.Submit\(\s*profile,\s*"([a-z0-9_]+)"/g)) judgeIds.add(m[1]);

const used = new Map();
function mark(id, where) {
  if (!used.has(id)) used.set(id, new Set());
  used.get(id).add(where);
}
for (const id of judgeIds) mark(id, "game/Achievements.JudgeEvents");

for (const f of files) {
  const rel = path.relative(path.join(root, "scripts"), f).replace(/\\/g, "/");
  if (rel === "game/Achievements.lua") continue;
  const src = fs.readFileSync(f, "utf8");
  for (const m of src.matchAll(/Achievements\.Submit\(\s*[^,]+,\s*"([a-z0-9_]+)"/g)) mark(m[1], rel);
  for (const m of src.matchAll(/Profile\.ReachProgress\(\s*[^,]+,\s*"([a-z0-9_]+)"/g)) mark(m[1], rel);
}

console.log("定义: " + defined.size + " 条, 有判定入口: " + used.size + " 条");
for (const id of [...defined].sort()) {
  const where = used.get(id);
  console.log((where ? "  [x] " : "  [ ] ") + id + (where ? "  <- " + [...where].join(", ") : "  (无提交点)"));
}
const unknown = [...used.keys()].filter((id) => !defined.has(id));
if (unknown.length) {
  console.log("未定义却被引用: " + unknown.join(", "));
  process.exitCode = 1;
}
const missing = [...defined].filter((id) => !used.has(id));
if (missing.length) {
  console.log("缺少判定入口: " + missing.join(", "));
  process.exitCode = 1;
}
