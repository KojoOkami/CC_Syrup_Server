const WebS = require("ws")
const localtunnel = require('localtunnel')
const { pat } = require('./config.js')
const GitHub = require('github-api')

let wss = undefined

const sendFile = (name, contents, to) => {
  console.log(`Sending file ${name} to client ${to}`)
  wss.broadcast({id:"proxy",to:to,request:"update",data:{name: name, contents: contents}})
}

const closeConnection = (to) => {
  console.log(`Closing connection with client ${to}`)
  wss.broadcast({id:"proxy",to:to,request:"close",data:""})
}

const getGithubUpdates = async (branch, to) => {
  console.log(`Getting github updates for client ${to} at branch ${branch}`)

  if (branch == undefined || branch === '') {
      branch = 'alpha'
  }

  var gh = new GitHub({
      token: pat
  })

  var repo = gh.getRepo('KojoOkami', 'CC_Syrup')
  repo.getSha(branch, './').then((result) => {
    if (result != undefined) {
      const timeout = setTimeout(closeConnection, 5000, to)
      for (const r of result.data) {
        if (r['path'].endsWith('.lua')) {
          repo.getBlob(r['sha']).then((result) => {
            timeout.refresh()
            sendFile(r['name'], result.data, to)
          })
        }
      }
    }
  })
}

const createTunnel = async () => {
  wss = new WebS.Server({port:8081})
  console.log('Creating Server...')
  
  wss.on("connection",async (ws) =>{
    console.log("Connection!")
    ws.on("message",async (msg)=>{
      const request = JSON.parse(msg)
      if (request.to === "proxy") {
        if (request.request === "update") {
          await getGithubUpdates(request.data, request.id)
        } else if (request.request === "comment") {
          console.log(`Incoming Comment: ${msg.data}`)
        }
      }
    })
  })
  
  wss.broadcast = function broadcast(msg){
    wss.clients.forEach(function each(client) {
      client.send(JSON.stringify(msg))
    })
  }
  console.log('Done')
  console.log('Creating Tunnel...')

  const tunnel = await localtunnel({ port: 8081, subdomain: 'nekomataalpha' });
  
  console.log('Done')
  console.log('Checking Tunnel...')

  if (tunnel.url == 'https://nekomataalpha.loca.lt') {
    console.log('Success')
  } else {
    console.log('Failed: ' + tunnel.url)
  }

  tunnel.on('close', () => {
    wss.broadcast({id:"alpha",func:"close"})
    console.log('Tunnel closed')
  });
}

createTunnel()