// ==UserScript==
// @name         VRC Show Private Worlds In Favorites
// @namespace    Invertex
// @version      2025-03-27
// @description  Make worlds that have been privated still show the thumbnail so you know wtf they are.
// @author       Invertex
// @match        https://vrchat.com/home/favorites/world/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=vrchat.com
// @grant        unsafeWindow
// @run-at       document-start
// ==/UserScript==

const { fetch: originalFetch } = unsafeWindow;
let favsList = null;

unsafeWindow.fetch = exportFunction(async (...args) => {
    let [resource, config] = args;

    if(resource?.constructor === Request && resource.url.includes('/api/1/worlds/favorites?'))
    {
        let first200FavsReq = new Request('https://vrchat.com/api/1/favorites?n=200&offset=0&type=world', resource);
        let last200FavsReq = new Request('https://vrchat.com/api/1/favorites?n=200&offset=200&type=world', resource);

        const response = await originalFetch(resource, config);

        let json = await response.json();

        for(let i = 0; i < json.length; i++)
        {
            let favEntry = json[i];
            if(favEntry.releaseStatus == "private" || favEntry.releaseStatus == "hidden")
            {
                if(favsList == null)
                {
                    const first200 = await originalFetch(first200FavsReq, config);
                    const first200json = await first200.json();
                    const next200 = await originalFetch(last200FavsReq, config);
                    const next200json = await next200.json();
                    favsList = first200json.concat(next200json);
                }

                const favID = favEntry.favoriteId;
                let privateFav = favsList.find((fave)=> fave.id == favID);

                if(privateFav)
                {
                    let getWorldReq = new Request('https://vrchat.com/api/1/worlds/' + privateFav.favoriteId, resource);
                    let worldDataFetch = await originalFetch(getWorldReq, config);

                    if(worldDataFetch.ok === true)
                    {
                        let worldData = await worldDataFetch.json();

                        Object.assign(json[i], worldData);
                    } else if (favEntry.releaseStatus == "hidden") { favEntry.name = "[WORLD DELETED]"; }
                }
            }
        }
        return new Response(JSON.stringify(json), { status: response.status, statusText: response.statusText, headers: response.headers });
    }

    const defaultResp = await originalFetch(resource,config);
    return defaultResp;
}, unsafeWindow);
