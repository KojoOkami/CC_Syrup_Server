import { pat } from './config'
import GitHub from 'github-api'
import { sendFile } from './server'

export const getGithubUpdates = async (branch) => {
    if (branch == undefined) {
        branch = 'alpha'
    }

    var gh = new GitHub({
        token: pat
    })

    var repo = gh.getRepo('KojoOkami', 'CC_Syrup')
    repo.getSha(branch, './').then((error, result) => {
        for (const r of result) {
            if (r['path'].endsWith('.lua')) {
                repo.getBlob(r['sha']).then((error, result) => {
                    sendFile(r['name'], result)
                })
            }
        }
    })
}

console.log(getGithubUpdates())