import WebS from "ws"
import localtunnel from 'localtunnel'
import { getGithubUpdates } from './updates'

const wss = new WebS.Server({port:8081})

wss.on("connection",ws=>{
  console.log("Connection!")
  ws.on("message",msg=>{
    wss.broadcast({id:"alpha",func:msg})
  })
})

wss.broadcast = function broadcast(msg){
  if (msg.func.startsWith("-- ")) {
    console.log(msg.func)
  } else {
    console.log(wss.clients)
    wss.clients.forEach(function each(client) {
      client.send(JSON.stringify(msg))
    })
  }
}

export const createTunnel = async () => {
  const tunnel = await localtunnel({ port: 8081, subdomain: 'nekomataAlpha', allow_invalid_cert: true });

  if (tunnel.url == 'https://nekomataAlpha.loca.lt') {
    console.log('Success')
  } else {
    console.log('Failed: ' + tunnel.url)
  }

  tunnel.on('close', () => {
    wss.broadcast({id:"alpha",func:"close"})
    console.log('Tunnel closed')
  });
}

export const sendFile = (name, contents) => {
  wss.broadcast({id:"alpha",file:{name: name, contents: contents}})
}

export const getFiles = (branch) => {
  getGithubUpdates(branch)
}

createTunnel()