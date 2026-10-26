import { _electron, expect } from '@playwright/test'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join, resolve, dirname, basename } from 'node:path'
import { tmpdir } from 'node:os'
const root=resolve('output/playwright/ui-reference-recheck-20261026')
const original=JSON.parse(await readFile(join(root,'real-bank/runtime.json'),'utf8'))
if(resolve(dirname(original.data))!==resolve(tmpdir()) || !basename(original.data).startsWith('embedded-practice-ui2-review-')) throw Error('只允许本轮独立测试库')
const target=process.env.EMBEDDED_PRACTICE_PACKAGED_EXECUTABLE
if(!target || resolve(target)!==original.actual.exe)throw Error('目标不一致')
const env={...process.env,EMBEDDED_PRACTICE_TEST_DATA_DIR:original.data}
delete env.ELECTRON_RUN_AS_NODE;delete env.ELECTRON_RENDERER_URL
const output=join(root,'followup');await mkdir(output)
const result={checks:[]}
const app=await _electron.launch({executablePath:target,args:[],env})
try{
 const page=await app.firstWindow();const w=await app.browserWindow(page)
 result.actual=await app.evaluate(({app})=>({exe:app.getPath('exe'),userData:app.getPath('userData'),packaged:app.isPackaged,version:app.getVersion()}))
 expect(result.actual).toEqual(original.actual)
 await expect(page.locator('footer')).toContainText(original.build)
 const nav=async name=>page.getByRole('navigation',{name:'主要页面',exact:true}).getByRole('link',{name,exact:true}).click()
 const snap=async name=>{await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await writeFile(join(output,name+'.png'),Buffer.from(await w.evaluate(async win=>(await win.capturePage()).toPNG().toString('base64')),'base64'))}
 await w.evaluate(win=>win.setContentSize(900,900))
 await nav('开始练习');await page.getByRole('button',{name:'继续练习',exact:true}).click()
 await expect(page.getByRole('button',{name:'不熟',exact:true})).toBeEnabled()
 await page.locator('.reference-answer').scrollIntoViewIfNeeded()
 await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight))
 await snap('21-reading-answer-bottom-900-22')
 result.checks.push({name:'阅读答案末尾时返回按钮与操作栏位置',returnButton:await page.getByRole('button',{name:'保存并返回',exact:true}).boundingBox(),actions:await page.locator('.practice-actions').boundingBox(),scroll:await page.evaluate(()=>scrollY)})
 await page.getByRole('button',{name:'保存并返回',exact:true}).click()
 await nav('设置与数据');await page.getByRole('tab',{name:'外观主题',exact:true}).click()
 await page.getByLabel('正文字号',{exact:true}).selectOption('17');await page.getByRole('button',{name:'保存并应用',exact:true}).click()
 await expect(page.getByText('显示设置已保存。',{exact:true})).toBeVisible()
 await w.evaluate(win=>win.setContentSize(1440,900))
 await nav('题库');await page.getByLabel('专题',{exact:true}).selectOption('stm32f103-gpio')
 result.checks.push({name:'分类导航滚动容器',containers:await page.locator('.library-navigation,.category-tree,.library-workspace').evaluateAll(els=>els.map(e=>({class:e.className,client:e.clientHeight,scroll:e.scrollHeight,overflow:getComputedStyle(e).overflowY,top:e.getBoundingClientRect().top,height:e.getBoundingClientRect().height})))})
 await page.locator('.question-row').first().click();await snap('22-library-first-row-1440-17')
 await nav('知识板块');await snap('23-boards-1440-17')
 result.checks.push({name:'板块首屏尺寸',cards:await page.locator('.board-card').evaluateAll(els=>els.slice(0,8).map(e=>{const r=e.getBoundingClientRect();return {name:e.querySelector('h3')?.textContent,top:r.top,height:r.height}}))})
 result.complete=true
}finally{await writeFile(join(output,'results.json'),JSON.stringify(result,null,2));await app.close().catch(()=>{})}
