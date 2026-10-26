import { _electron, expect } from '@playwright/test'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { resolve, join, dirname, basename } from 'node:path'
import { tmpdir } from 'node:os'
const root = resolve('output/playwright/ui-reference-review-20261026')
const previous = JSON.parse(await readFile(join(root, 'captures-r2/runtime.json'), 'utf8'))
const data = previous.data
if (resolve(dirname(data)) !== resolve(tmpdir()) || !basename(data).startsWith('embedded-practice-ui-audit-')) throw Error('仅允许本轮隔离数据')
const output = join(root, 'interactions')
await mkdir(output)
const env = { ...process.env, EMBEDDED_PRACTICE_TEST_DATA_DIR: data }
delete env.ELECTRON_RUN_AS_NODE
delete env.ELECTRON_RENDERER_URL
const executable = process.env.EMBEDDED_PRACTICE_PACKAGED_EXECUTABLE
if (!executable || resolve(executable) !== previous.actual.exe) throw Error('运行对象不一致')
const app = await _electron.launch({executablePath:resolve(executable),args:[],env})
const result = { data, checks:[] }
try {
  const page = await app.firstWindow()
  const window = await app.browserWindow(page)
  result.actual = await app.evaluate(({app})=>({exe:app.getPath('exe'),userData:app.getPath('userData'),packaged:app.isPackaged,version:app.getVersion()}))
  expect(result.actual).toEqual(previous.actual)
  await expect(page.locator('footer')).toContainText(previous.build)
  const nav = async name => page.getByRole('navigation',{name:'主要页面',exact:true}).getByRole('link',{name,exact:true}).click()
  const shot = async name => {
    await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))
    const png = await window.evaluate(async w=>(await w.capturePage()).toPNG().toString('base64'))
    await writeFile(join(output,name+'.png'),Buffer.from(png,'base64'))
  }
  await window.evaluate(w=>w.setContentSize(1440,900))
  await nav('设置与数据')
  await page.getByLabel('正文字号',{exact:true}).selectOption('17')
  await page.getByRole('button',{name:'保存并应用',exact:true}).click()
  await expect(page.getByText('显示设置已保存。',{exact:true})).toBeVisible()
  await nav('题库')
  await page.getByLabel('专题',{exact:true}).selectOption('stm32f103-gpio')
  const last = page.locator('.question-list li button').last()
  const lastTitle = await last.locator('span').first().textContent()
  await last.click()
  await expect(page.getByRole('article',{name:'题目内容',exact:true}).getByRole('heading',{name:lastTitle,exact:true})).toBeVisible()
  result.checks.push({name:'宽窗点击第20项后详情可见性',value:await page.locator('.question-reader').evaluate(e=>{const b=e.getBoundingClientRect();return {top:b.top,bottom:b.bottom,viewport:innerHeight,scrollY}})})
  await shot('25-点击列表第20题后的实际视口')
  await window.evaluate(w=>w.setContentSize(900,900))
  await nav('学习总览')
  for (let step=0;step<3;step++) {
    await page.evaluate(()=>scrollTo(0,0))
    result.checks.push({name:'窄窗导航步骤'+step,value:await page.evaluate(()=>({expanded:document.querySelector('.navigation-toggle').getAttribute('aria-expanded'),label:document.querySelector('.navigation-toggle').getAttribute('aria-label'),width:getComputedStyle(document.querySelector('.app-shell')).getPropertyValue('--navigation-width'),labelDisplay:getComputedStyle(document.querySelector('.navigation-label')).display}))})
    await shot('26-窄窗导航状态'+step)
    if(step<2) {await page.locator('.navigation-toggle').click();await expect(page.locator('.navigation-toggle')).toBeEnabled()}
  }
  await window.evaluate(w=>w.setContentSize(1440,900))
  await nav('学习记录')
  await page.evaluate(()=>scrollTo(0,0))
  result.checks.push({name:'学习记录第一题位置',value:await page.locator('.question-list li button').first().boundingBox()})
  await nav('设置与数据')
  await page.evaluate(()=>scrollTo(0,0))
  result.checks.push({name:'外观保存按钮位置',value:await page.getByRole('button',{name:'保存并应用',exact:true}).boundingBox()})
  await page.getByRole('button',{name:'备份恢复',exact:true}).click()
  await shot('27-点击备份恢复后的实际视口')
  const backup = join(root,'isolated-audit-backup.zip')
  await app.evaluate(({dialog},path)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:path})},backup)
  await page.getByRole('button',{name:'导出完整备份',exact:true}).click()
  await expect(page.getByText('完整备份已导出并校验。',{exact:true})).toBeVisible()
  await app.evaluate(({dialog},path)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[path]})},backup)
  await page.getByRole('button',{name:'选择备份并预览',exact:true}).click()
  await expect(page.getByText('备份预览校验通过。当前数据保持原状。',{exact:true})).toBeVisible()
  await page.getByRole('button',{name:'恢复此备份…',exact:true}).scrollIntoViewIfNeeded()
  await shot('28-真实备份恢复预览')
  result.complete = true
} finally {
  await writeFile(join(output,'results.json'),JSON.stringify(result,null,2))
  await app.close()
}
