import test from 'node:test'
import assert from 'node:assert/strict'
import { DatabaseSync } from 'node:sqlite'
import { readFileSync, readdirSync } from 'node:fs'
import { handleApi } from '../worker/index.ts'
import { newMeeting, joinMeeting, actOnMeeting, tickMeeting, meetingView } from '../src/room-engine.ts'
import { SINNERS } from '../src/game-model.ts'

const demons = ['greg','gus','norm','dot','beelzebabs','mothmanager','bonejamin','cerberus']
const ticket = () => Array.from(crypto.getRandomValues(new Uint8Array(32)), value => value.toString(16).padStart(2,'0')).join('')
test('every case has three charges and both portrait poses; rematches refresh the full backlog', () => {
  const ids = Object.keys(SINNERS)
  assert.equal(ids.length, 9)
  for (const [id, sinner] of Object.entries(SINNERS)) {
    assert.equal(sinner.sins.split('\n').length, 3, `${id} needs three charges`)
    for (const pose of ['idle', 'shocked']) {
      if (id === 'david') assert.ok(readFileSync(`public/art/${id}-${pose}.png`).length > 100_000)
      else assert.ok(readFileSync(`public/art/${id}-${pose}.svg`, 'utf8').includes(`data-character="${id}"`))
    }
  }
  const meeting = newMeeting('HELL', 'host', 'committee', 1000)
  assert.equal(meeting.totalRounds, 3)
  assert.deepEqual(new Set(meeting.sinners), new Set(ids))
  meeting.sinners = meeting.sinners.slice(0, 3) // A room saved before the backlog grew.
  meeting.phase = 'finished'
  actOnMeeting(meeting, 'host', { action: 'rematch', phase: 'finished', round: 1 }, 2000)
  assert.deepEqual(new Set(meeting.sinners), new Set(ids))
})
function localDatabase() {
  const sqlite = new DatabaseSync(':memory:')
  for (const file of readdirSync('drizzle').filter(file => file.endsWith('.sql')).sort()) sqlite.exec(readFileSync('drizzle/' + file, 'utf8'))
  return { sqlite, db: { prepare(sql) { return {
    values: [], bind(...values) { this.values = values; return this },
    async first() { return sqlite.prepare(sql).get(...this.values) ?? null },
    async run() { return { meta: { changes: sqlite.prepare(sql).run(...this.values).changes } } },
  } } } }
}
function client(db) { return async (path, body, token, options={}) => {
  const request = new Request('https://game.test/api/rooms' + path, {
    method: body ? 'POST' : 'GET', headers: { ...(token ? { Authorization: 'Bearer ' + token } : {}), ...options.headers },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const response = await handleApi(request, { DB: db })
  return { status: response.status, view: await response.json() }
} }

test('the room runs three real rounds with 3–8 members, including tied scores and a rematch', () => {
  for (let count=3; count<=8; count++) {
    const meeting=newMeeting('HELL','host','showtime',1000)
    for (let i=0;i<count;i++) joinMeeting(meeting,'phone-'+i,{demon:demons[i],name:'Demon '+i})
    let now=2000
    const host = action => actOnMeeting(meeting,'host',{action,phase:meeting.phase,round:meeting.round},now++)
    host('advance')
    for (let round=1;round<=3;round++) {
      assert.equal(meeting.phase,'pitch'); assert.equal(meeting.round,round)
      for (const player of meeting.players) actOnMeeting(meeting,player.tokenHash,{action:'submit',round,text:player.name+' gives a spectacularly bad eternity.'},now++)
      assert.equal(meeting.phase,'vote')
      const exposure=Object.fromEntries(meeting.entries.map(entry=>[entry.id,0]))
      for (const player of meeting.players) {
        while (meeting.picks[player.id].length<meeting.questions[player.id].length) {
          const q=meeting.questions[player.id][meeting.picks[player.id].length]
          q.choices.forEach(id=>exposure[id]++)
          actOnMeeting(meeting,player.tokenHash,{action:'favorite',round,question:q.id,choice:q.choices[0]},now++)
        }
      }
      assert.equal(new Set(Object.values(exposure)).size,1)
      assert.equal(meeting.phase,'verdict'); assert.equal(meeting.history.length,round)
      const scores=meeting.players.map(player=>player.score)
      tickMeeting(meeting,now++)
      assert.deepEqual(meeting.players.map(player=>player.score),scores,'Polling never awards a round twice')
      assert.ok(meeting.results.every(result=>result.favorites===result.appearances/Math.min(3,count-1)))
      assert.ok(meeting.results.every(result=>result.winner),'Equal choice positions produce co-winners')
      const verdictDuration=Math.max(15000,meeting.results.filter(result=>result.winner).length*5000)
      tickMeeting(meeting,meeting.verdictStartedAt+verdictDuration-1)
      assert.equal(meeting.phase,'verdict','Every co-winner stays visible long enough')
      now=meeting.verdictStartedAt+verdictDuration; tickMeeting(meeting,now++)
    }
    assert.equal(meeting.phase,'finished')
    host('rematch'); assert.equal(meeting.phase,'lobby'); assert.equal(meeting.history.length,0)
    assert.ok(meeting.players.every(player=>player.score===0))
  }
})
test('deadlines progress an incomplete round without inventing a submission or vote', () => {
  const meeting=newMeeting('HELL','host','committee',1000)
  demons.slice(0,4).forEach((demon,i)=>joinMeeting(meeting,'p'+i,{demon,name:'Demon '+i}))
  actOnMeeting(meeting,'host',{action:'advance',phase:'lobby',round:1},2000)
  assert.equal(meeting.deadline,92000)
  meeting.players.slice(0,3).forEach(player=>actOnMeeting(meeting,player.tokenHash,{action:'submit',round:1,text:'An eternity of dramatic forks.'},3000))
  tickMeeting(meeting,91999); assert.equal(meeting.phase,'pitch')
  tickMeeting(meeting,92000); assert.equal(meeting.phase,'vote'); assert.equal(meeting.entries.length,3)
  const player=meeting.players[3], q=meeting.questions[player.id][0]
  actOnMeeting(meeting,player.tokenHash,{action:'favorite',round:1,question:q.id,choice:q.choices[0]},93000)
  tickMeeting(meeting,182001); assert.equal(meeting.phase,'verdict')
  assert.equal(meeting.results.reduce((sum,r)=>sum+r.favorites,0),1)
  assert.equal(meeting.results.reduce((sum,r)=>sum+r.appearances,0),3)
})
test('a room saved on the retired sinner reveal starts writing on its next poll', () => {
  const meeting=newMeeting('HELL','host','committee',1000)
  demons.slice(0,3).forEach((demon,i)=>joinMeeting(meeting,'p'+i,{demon,name:'Demon '+i}))
  meeting.phase='case'; meeting.deadline=null
  tickMeeting(meeting,5000)
  assert.equal(meeting.phase,'pitch')
  assert.equal(meeting.deadline,95000)
})
test('a demo waits for its third player, then two demons complete all three rounds', () => {
  const meeting=newMeeting('DEMO','host','committee',1000)
  const botA=joinMeeting(meeting,'bot-a',{demon:'gus',name:'Gus'})
  const botB=joinMeeting(meeting,'bot-b',{demon:'bonejamin',name:'Bonejamin'})
  assert.throws(()=>actOnMeeting(meeting,'bot-a',{action:'enable-demo',phase:'lobby',round:1,bots:[botA.id,botB.id]},1000),/Only the chair/)
  actOnMeeting(meeting,'host',{action:'enable-demo',phase:'lobby',round:1,bots:[botA.id,botB.id]},1000)
  tickMeeting(meeting,2000);assert.equal(meeting.phase,'lobby')
  joinMeeting(meeting,'human',{demon:'greg',name:'Third player'})
  tickMeeting(meeting,2001);assert.equal(meeting.phase,'pitch')
  let now=2001
  for(let round=1;round<=3;round++) {
    now++;tickMeeting(meeting,now)
    assert.equal(meeting.entries.length,2)
    assert.ok(meeting.entries.every(entry=>[botA.id,botB.id].includes(entry.author)))
    now++;actOnMeeting(meeting,'human',{action:'submit',round,text:'A beautifully dreadful punishment for eternity.'},now)
    assert.equal(meeting.phase,'vote')
    now++;tickMeeting(meeting,now)
    assert.ok([botA.id,botB.id].every(id=>meeting.picks[id].length===meeting.questions[id].length))
    while(meeting.phase==='vote') {
      const picks=meeting.picks[meeting.players[2].id],question=meeting.questions[meeting.players[2].id][picks.length]
      now++;actOnMeeting(meeting,'human',{action:'favorite',round,question:question.id,choice:question.choices[0]},now)
    }
    assert.equal(meeting.phase,'verdict');assert.equal(meeting.history.length,round)
    now+=15001;tickMeeting(meeting,now)
    assert.equal(meeting.phase,round===3?'finished':'pitch')
  }
})
test('API joins and submissions are atomic across independent phones, and seats resume on retry', async t => {
  const {sqlite,db}=localDatabase(); t.after(()=>sqlite.close()); const api=client(db)
  const host=ticket(), created=await api('',{token:host,tone:'showtime'}), code=created.view.code
  assert.equal(created.status,201)
  assert.equal((await api('',{token:host})).view.code,code,'Create retries retain the host room')
  const phones=demons.slice(0,8).map((demon,i)=>({token:ticket(),demon,name:'Phone '+i}))
  const joined=await Promise.all(phones.map(phone=>api('/'+code+'/join',phone)))
  assert.ok(joined.every(result=>result.status===200))
  const resumed=await api('/'+code+'/join',phones[0]); assert.equal(resumed.view.me,joined[0].view.me)
  assert.equal(resumed.view.players.length,8)
  assert.equal((await api('/'+code+'/join',{token:ticket(),demon:'greg',name:'Nine'})).status,409)
  let room=(await api('/'+code,undefined,host)).view
  const advance=async()=>{const result=await api('/'+code+'/action',{action:'advance',phase:room.phase,round:room.round},host);assert.equal(result.status,200);room=result.view}
  await advance(); assert.equal(room.phase,'pitch')
  const filed=await Promise.all(phones.map(phone=>api('/'+code+'/action',{action:'submit',round:1,text:phone.name+' condemns him to an orchestra of forks.'},phone.token)))
  assert.ok(filed.every(result=>result.status===200))
  room=(await api('/'+code,undefined,host)).view
  assert.equal(room.phase,'vote'); assert.equal(room.filedCount,8)
  for (const phone of phones) {
    let state=(await api('/'+code,undefined,phone.token)).view
    assert.equal(state.questionCount,3)
    assert.equal(state.results.length,0)
    assert.equal(state.question.choices.length,3)
    assert.ok(state.question.choices.every(choice=>!('author' in choice)&&!state.players.some(player=>player.id===choice.id)))
    assert.ok(!JSON.stringify(state).includes(phone.token))
    const first={action:'favorite',round:1,question:state.question.id,choice:state.question.choices[0].id}
    const duplicate=await Promise.all([api('/'+code+'/action',first,phone.token),api('/'+code+'/action',first,phone.token)])
    assert.ok(duplicate.every(result=>result.status===200))
    state=(await api('/'+code,undefined,phone.token)).view; assert.equal(state.questionIndex,1)
    while(state.phase==='vote'&&state.question) {
      const voted=await api('/'+code+'/action',{action:'favorite',round:1,question:state.question.id,choice:state.question.choices[0].id},phone.token)
      assert.equal(voted.status,200); state=voted.view
    }
  }
  room=(await api('/'+code,undefined,host)).view
  assert.equal(room.phase,'verdict'); assert.equal(room.results.length,8)
  assert.ok(room.results.every(result=>result.appearances===9))
  assert.equal(room.results.reduce((sum,result)=>sum+result.favorites,0),24)
})
test('API rejects outsiders, another player’s host controls, duplicate demons and foreign ballots', async t => {
  const {sqlite,db}=localDatabase();t.after(()=>sqlite.close());const api=client(db),host=ticket()
  const code=(await api('',{token:host})).view.code
  for (const demon of ['litigator','velvet','dolly']) {
    assert.equal((await api('/'+code+'/join',{token:ticket(),demon,name:'Retired'})).status,400)
  }
  assert.equal((await api('/'+code+'/join',{token:ticket(),name:'No face'})).status,400)
  const token=ticket();await api('/'+code+'/join',{token,demon:'greg',name:'Greg'})
  assert.equal((await api('/'+code,undefined,ticket())).status,401)
  assert.equal((await api('/'+code,undefined,undefined)).status,401)
  assert.equal((await api('/'+code+'/join',{token:ticket(),demon:'greg',name:'Greg 2'})).status,409)
  assert.equal((await api('/'+code+'/action',{action:'advance',phase:'lobby',round:1},token)).status,403)
  assert.equal((await api('/'+code+'/action',{action:'advance',phase:'lobby',round:1},host)).status,409)
  assert.equal((await api('/'+code+'/action',{action:'favorite',round:1,question:'forged',choice:'forged'},token)).status,409)
  assert.equal((await api('',{token:ticket()},undefined,{headers:{Origin:'https://other.test'}})).status,403)
  const view=(await api('/'+code,undefined,token)).view
  assert.ok(!JSON.stringify(view).includes('tokenHash'));assert.ok(!JSON.stringify(view).includes('hostHash'))
  assert.equal(view.myEntry,'');assert.equal(view.results.length,0)
})
