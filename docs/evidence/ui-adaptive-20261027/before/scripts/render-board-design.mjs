import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

assert.equal(process.argv.length, 3, '用法：node scripts/render-board-design.mjs 新预览.html')
const workspace = fileURLToPath(new URL('../', import.meta.url))
const output = resolve(process.argv[2])
const local = relative(workspace, output)
assert(local && !local.startsWith('..') && !isAbsolute(local), '预览必须位于本项目内')
assert.equal(output.toLowerCase().endsWith('.html'), true, '输出必须是HTML文件')
const catalog = JSON.parse(
  await readFile(new URL('../question-banks/catalog/板块规划.json', import.meta.url), 'utf8'),
)
assert.equal(catalog.schemaVersion, 1)
assert(Array.isArray(catalog.boards) && catalog.boards.length > 0)
const escape = (value) => String(value).replace(/[&<>"']/gu, (char) => `&#${char.codePointAt(0)};`)
const marks = [
  'C',
  'C++',
  'DS',
  'ARM',
  'I/O',
  'MCU',
  'BUS',
  'NET',
  'RTOS',
  'LIN',
  'DRV',
  'HW',
  'FS',
  'DBG',
  'PRJ',
  'RF',
  'SEC',
  'DSP',
  'CTL',
  'CAR',
  'BOT',
  'FPGA',
]

function cards(tier) {
  return catalog.boards
    .filter((board) => board.tier === tier)
    .map((board) => {
      const count = catalog.existingTopics
        .filter((topic) => topic.recommendedBoardKey === board.key)
        .reduce((sum, topic) => sum + topic.candidateQuestionCount, 0)
      return `<details class="board" data-tier="${escape(tier)}" data-search="${escape([board.title, ...board.plannedTopics].join(' ').toLocaleLowerCase())}">
      <summary><span class="mark" aria-hidden="true">${marks[board.order - 1] ?? '·'}</span>
        <h3>${escape(board.title)}</h3><p>${escape(board.summary)}</p>
        <div class="meta"><span class="badge ${count ? 'available' : ''}">${count ? `仓库候选 ${count} 题` : '待补题'}</span><span class="expand">查看专题</span></div>
      </summary>
      <div class="topics"><p class="caption">规划专题 · ${board.plannedTopics.length}</p><ul>${board.plannedTopics.map((title) => `<li>${escape(title)}</li>`).join('')}</ul><p class="boundary">${escape(board.boundary)}</p></div>
    </details>`
    })
    .join('\n')
}

const foundationCount = catalog.boards.filter((board) => board.tier === 'foundation').length
const extensionCount = catalog.boards.filter((board) => board.tier === 'extension').length
const html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="icon" href="data:,">
<title>嵌入式刷题本 · 板块规划</title>
<style>
:root{color-scheme:light dark;--bg:#f3f6f4;--surface:#fff;--text:#213f39;--muted:#526a63;--line:#cfded7;--accent:#216c57;--soft:#e8f2ec;--shadow:0 4px 16px #234a3610}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:16px/1.6 "Segoe UI","Microsoft YaHei",sans-serif}main{max-width:1232px;margin:auto;padding:40px 28px 56px}.eyebrow{margin:0;color:var(--accent);font-size:13px;letter-spacing:.08em}h1{font-size:32px;line-height:1.3;margin:12px 0}h2{font-size:21px;margin:32px 0 16px}h3{font-size:18px;line-height:1.5;margin:14px 0 8px}.intro{max-width:760px;color:var(--muted);margin:0 0 22px}.stats{display:flex;gap:24px;flex-wrap:wrap;margin:20px 0 24px}.stats span{font-size:14px;color:var(--muted)}.stats strong{color:var(--text);font-size:24px;margin-right:6px}.tools{display:flex;gap:20px;align-items:center;flex-wrap:wrap;padding:16px;background:var(--surface);border:1px solid var(--line);border-radius:14px}.search{flex:1;min-width:220px}.search span{display:block;font-size:13px;color:var(--muted);margin-bottom:5px}input[type=search]{width:100%;min-height:44px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--text);padding:8px 12px;font:inherit}.toggle{display:flex;align-items:center;gap:9px;min-height:44px}input[type=checkbox]{width:18px;height:18px;accent-color:var(--accent)}.status{margin:12px 0 0;font-size:13px;color:var(--muted)}.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;align-items:start}.board{border:1px solid var(--line);border-radius:14px;background:var(--surface);box-shadow:var(--shadow);overflow:hidden}.board summary{list-style:none;cursor:pointer;padding:20px;min-height:235px}.board summary::-webkit-details-marker{display:none}.mark{display:inline-flex;min-width:46px;height:42px;align-items:center;justify-content:center;border-radius:12px;background:var(--soft);color:var(--accent);font-size:14px;font-weight:700;padding:0 8px}.board summary p{margin:0;min-height:48px;font-size:14px;color:var(--muted)}.meta{margin-top:19px;display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:12px}.badge{border-radius:7px;background:var(--bg);color:var(--muted);padding:4px 7px}.available{background:var(--soft);color:var(--accent)}.expand{color:var(--accent);white-space:nowrap}.topics{padding:0 20px 20px;border-top:1px solid var(--line)}.caption{font-size:12px;color:var(--muted);margin:14px 0 6px}ul{padding-left:18px;margin:0;font-size:14px}li{margin:5px 0}.boundary{font-size:12px;color:var(--muted);padding-top:10px;margin-bottom:0}.empty{padding:24px;border:1px dashed var(--line);border-radius:12px;text-align:center;color:var(--muted)}footer{margin-top:30px;color:var(--muted);font-size:13px;border-top:1px solid var(--line);padding-top:18px}summary:focus-visible,input:focus-visible{outline:3px solid var(--accent);outline-offset:3px}[hidden]{display:none!important}
@media(max-width:1050px){.grid{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:760px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}main{padding:28px 18px}.board summary{min-height:230px;padding:16px}.meta{flex-wrap:wrap}h1{font-size:27px}}@media(max-width:430px){.grid{grid-template-columns:1fr}.board summary{min-height:200px}.tools{align-items:stretch}.toggle{width:100%}.stats{gap:16px}}@media(prefers-color-scheme:dark){:root{--bg:#15231f;--surface:#1e3029;--text:#e4f1ea;--muted:#b7cec0;--line:#425b4e;--accent:#9ddabd;--soft:#294a3c;--shadow:none}}
</style></head><body><main>
<p class="eyebrow">嵌入式刷题本 / 板块规划</p><h1>按知识领域找题，逐步补齐题库。</h1>
<p class="intro">先建立清晰的学习版图。点击卡片查看规划专题；有题后沿同一板块补充。候选题数量来自仓库，尚待用户审阅，不代表个人库中的题数。</p>
<div class="stats"><span><strong>${foundationCount}</strong>基础板块</span><span><strong>${extensionCount}</strong>拓展方向</span><span><strong>${catalog.existingTopics.length}</strong>现有候选专题</span></div>
<div class="tools"><label class="search"><span>查找板块或规划专题</span><input id="board-search" type="search" placeholder="例如：GPIO、Linux、蓝牙、Python"></label><label class="toggle"><input id="show-extensions" type="checkbox">显示拓展方向</label></div>
<p id="board-status" class="status" role="status"></p>
<section id="foundation"><h2>基础板块</h2><div class="grid">${cards('foundation')}</div></section>
<section id="extension" hidden><h2>拓展方向</h2><div class="grid">${cards('extension')}</div></section>
<p id="no-results" class="empty" hidden>没有匹配的板块。可尝试其他关键词，或显示拓展方向。</p>
<footer>板块 → 专题；标签用于跨专题找题。空板块显示待补题，可先查看规划专题。此页为 ${escape(catalog.designDate)} 设计预览。</footer>
</main><script>
const search = document.getElementById('board-search');
const toggle = document.getElementById('show-extensions');
const boards = [...document.querySelectorAll('.board')];
function update() {
  const query = search.value.trim().toLocaleLowerCase();
  for (const board of boards) board.hidden = !board.dataset.search.includes(query) || (board.dataset.tier === 'extension' && !toggle.checked);
  for (const tier of ['foundation', 'extension']) document.getElementById(tier).hidden = !boards.some(board => board.dataset.tier === tier && !board.hidden);
  const visible = boards.filter(board => !board.hidden).length;
  document.getElementById('board-status').textContent = '显示 ' + visible + ' 个板块 · 点击查看内容范围';
  document.getElementById('no-results').hidden = visible !== 0;
}
for (const board of boards) board.addEventListener('toggle', () => { board.querySelector('.expand').textContent = board.open ? '收起专题' : '查看专题'; });
search.addEventListener('input', update);
toggle.addEventListener('change', update);
update();
</script></body></html>`
await mkdir(dirname(output), { recursive: true })
await writeFile(output, html, { encoding: 'utf8', flag: 'wx' })
console.log(`已生成新预览：${output}`)
