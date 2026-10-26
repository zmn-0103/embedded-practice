import { _electron, expect } from '@playwright/test'
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { DatabaseSync } from 'node:sqlite'
const output = resolve('output/playwright/ui-reference-recheck-20261026/real-bank')
await mkdir(output)
const data = await mkdtemp(join(tmpdir(), 'embedded-practice-ui2-review-'))
const target = process.env.EMBEDDED_PRACTICE_PACKAGED_EXECUTABLE
if (!target) throw Error('必须显式指定本轮程序')
const env = { ...process.env, EMBEDDED_PRACTICE_TEST_DATA_DIR: data }
delete env.ELECTRON_RUN_AS_NODE
delete env.ELECTRON_RENDERER_URL
const record = { data, build: '20261026.1-workbench-e-ui2', shots: [], selections: [], requests: [] }
let app
try {
  app = await _electron.launch({ executablePath: resolve(target), args: [], env })
  const page = await app.firstWindow()
  const window = await app.browserWindow(page)
  page.on('request', r => { if (/^https?:/i.test(r.url())) record.requests.push(r.url()) })
  await window.evaluate(w => w.setContentSize(1440, 900))
  await expect(page.locator('footer')).toContainText(record.build)
  record.actual = await app.evaluate(({app}) => ({exe:app.getPath('exe'), userData:app.getPath('userData'), packaged:app.isPackaged, version:app.getVersion()}))
  expect(record.actual).toEqual({exe:resolve(target),userData:data,packaged:true,version:'0.0.1'})
  const nav = async name => {
    const link = page.getByRole('navigation',{name:'主要页面',exact:true}).getByRole('link',{name,exact:true})
    await expect(link).toHaveAttribute('aria-disabled','false')
    await link.click()
    await expect(link).toHaveAttribute('aria-current','page')
  }
  const settle = async () => page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))
  const shot = async (name, top=true) => {
    if(top) await page.evaluate(()=>scrollTo(0,0))
    await settle()
    const geometry = await page.evaluate(()=>({
      width:innerWidth,height:innerHeight,scrollY,contentWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,contentHeight:document.documentElement.scrollHeight,
      elements:Array.from(document.querySelectorAll('h2,h3,textarea,.practice-actions,.question-row,.library-reader-pane,.appearance-actions,[role="tablist"],.board-card,.import-snapshot-warning,button')).filter(e=>e.getClientRects().length && getComputedStyle(e).visibility!=='hidden').map(e=>{const b=e.getBoundingClientRect();return {tag:e.tagName,class:e.className,text:e.matches('textarea')?'输入区':e.textContent.slice(0,65),x:b.x,y:b.y,width:b.width,height:b.height}})
    }))
    await writeFile(join(output,name+'.png'),Buffer.from(await window.evaluate(async w=>(await w.capturePage()).toPNG().toString('base64')),'base64'))
    record.shots.push({name,geometry})
  }
  const appearance = async (theme='晴空蓝',mode='light',font='17') => {
    await nav('设置与数据')
    await page.getByRole('tab',{name:'外观主题',exact:true}).click()
    await page.getByRole('radio',{name:theme,exact:true}).check()
    await page.getByLabel('显示主题',{exact:true}).selectOption(mode)
    await page.getByLabel('正文字号',{exact:true}).selectOption(font)
    await page.getByRole('button',{name:'保存并应用',exact:true}).click()
    await expect(page.getByText('显示设置已保存。',{exact:true})).toBeVisible()
  }
  await appearance()
  await nav('学习总览')
  await shot('01-empty')
  const manifest=JSON.parse(await readFile('release/V0.0.1-20261025.2/交付题库清单.json','utf8'))
  const paths=manifest.files.map(f=>resolve('release/V0.0.1-20261025.2',f.file))
  await app.evaluate(({dialog},files)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:files})},paths)
  await nav('题库')
  await page.getByRole('button',{name:'导入题库',exact:true}).click()
  await expect(page.getByRole('heading',{name:'导入预览',exact:true})).toBeVisible()
  await shot('08-import-13-topics')
  await page.getByRole('button',{name:'确认导入',exact:true}).click()
  await expect(page.getByText(/^导入完成：/)).toBeVisible()
  await page.getByRole('button',{name:'关闭导入工作区',exact:true}).click()
  await page.evaluate(async files=>{
    const api=window.desktop
    for(const title of new Set(files.map(f=>f.board))){const r=await api.library.updateCategory({kind:'create',title});if(!r.ok)throw Error(r.error.message)}
    const r=await api.library.listQuestions({topicId:null,archived:false,page:1});if(!r.ok)throw Error(r.error.message)
    for(const f of files){const categoryId=r.value.categories.find(c=>c.title===f.board).categoryId;const a=await api.library.updateCategory({kind:'assign',topicId:f.topicId,categoryId});if(!a.ok)throw Error(a.error.message)}
  },manifest.files)
  await page.getByRole('button',{name:'导入题库',exact:true}).click()
  await page.getByRole('button',{name:'确认导入',exact:true}).click()
  await expect(page.getByText(/^导入完成：/)).toBeVisible()
  await page.getByRole('button',{name:'关闭导入工作区',exact:true}).click()
  await page.getByLabel('专题',{exact:true}).selectOption('stm32f103-gpio')
  for(const i of [0,9,19]){
    const row=page.locator('.question-row').nth(i)
    await row.scrollIntoViewIfNeeded()
    const before=await page.locator('.question-list-scroll').evaluate(e=>e.scrollTop)
    const title=await row.locator('span').first().textContent()
    await row.click()
    const heading=page.getByRole('article',{name:'题目内容',exact:true}).getByRole('heading',{name:title,exact:true})
    await expect(heading).toBeInViewport({ratio:1})
    const after=await page.locator('.question-list-scroll').evaluate(e=>e.scrollTop)
    record.selections.push({row:i+1,before,after,title:await heading.boundingBox(),scrollY:await page.evaluate(()=>scrollY)})
    expect(after).toBe(before)
  }
  await shot('03-library-row20')
  await page.locator('.category-manager > summary').click()
  await shot('09-category')
  await page.getByRole('button',{name:'关闭分类管理',exact:true}).click()
  await nav('知识板块'); await shot('02-boards')
  await nav('设置与数据');await page.getByRole('tab',{name:'外观主题',exact:true}).click();await shot('10-appearance')
  await page.getByRole('tab',{name:'备份恢复',exact:true}).click();await shot('11-backup')
  await page.getByRole('tab',{name:'数据位置',exact:true}).click();await shot('11b-data')
  await nav('开始练习')
  await page.getByLabel('练习专题',{exact:true}).selectOption('stm32f103-gpio')
  await shot('04-configuration')
  await page.getByRole('button',{name:'开始练习',exact:true}).click()
  for(const name of ['不会','不熟','掌握']){
    await page.getByRole('button',{name:'查看参考答案',exact:true}).click()
    await page.getByRole('button',{name,exact:true}).click()
  }
  await page.getByRole('textbox',{name:'我的答案',exact:true}).fill('先说明配置步骤，再核对寄存器与电平。此处为隔离演示作答。')
  await page.getByRole('button',{name:'收藏本题',exact:true}).click()
  await expect(page.locator('.practice-save')).toHaveText('已保存')
  await shot('05-unrevealed-1440')
  await page.getByRole('button',{name:'查看参考答案',exact:true}).click()
  await expect(page.getByRole('button',{name:'掌握',exact:true})).toBeEnabled()
  await shot('06-revealed-1440')
  await page.getByRole('button',{name:'保存并返回',exact:true}).click()
  await nav('学习总览');await shot('01-overview')
  await nav('学习记录');await shot('07-records-favorite')
  await page.getByLabel('题库只看收藏',{exact:true}).uncheck()
  await page.getByRole('button',{name:'筛选题库',exact:true}).click()
  await expect(page.locator('.question-row')).toHaveCount(20)
  await shot('07b-records-all')
  await nav('开始练习');await page.getByRole('button',{name:'继续练习',exact:true}).click()
  await page.getByRole('button',{name:'不熟',exact:true}).click()
  await window.evaluate(w=>w.setContentSize(900,900));await shot('12-unrevealed-900')
  await page.getByRole('button',{name:'保存并返回',exact:true}).click()
  await appearance('Claude 风格','dark','22')
  await nav('开始练习');await page.getByRole('button',{name:'继续练习',exact:true}).click()
  await shot('12b-dark-900-22')
  await page.getByRole('button',{name:'查看参考答案',exact:true}).click()
  await shot('12c-dark-revealed-900-22')
  await page.getByRole('button',{name:'保存并返回',exact:true}).click()
  await appearance('晴空蓝','light','22')
  await window.evaluate(w=>w.setContentSize(1440,900));await nav('题库');await shot('03b-library-1440-22')
  await window.evaluate(w=>w.setContentSize(1200,900));await shot('03c-library-1200-22')
  await window.evaluate(w=>w.setContentSize(900,900));await nav('设置与数据');await shot('10b-appearance-900-22')
  const db=new DatabaseSync(join(data,'practice.sqlite3'),{readOnly:true})
  try{record.schema=db.prepare('PRAGMA user_version').get().user_version}finally{db.close()}
  expect(record.schema).toBe(10)
  record.complete=true
} finally {
  await writeFile(join(output,'runtime.json'),JSON.stringify(record,null,2))
  if(app)await app.close().catch(()=>{})
}
