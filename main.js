const Apify = require('apify');
const { URL } = require('url')


function uid_from_url(urlString) {
    // Only following characters are allowed in keys by Apify platform
    const allowedCharacters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!-_.\'()/'

    const url = new URL(urlString);

    // Retain only origin and pathname and replace all '/' by '_'
    let uid = `${url.hostname}${url.pathname}`.replace(/\//g, '_');

    // Prefix current timestamp
    uid = `${new Date().toISOString()}__${uid}`

    // Filter out characters that are not allowed
    uid = uid.split('').filter((char) => allowedCharacters.includes(char)).join('')

    // Return first 256 characters of uid as it's the limit of the Apify platform
    return uid.slice(0, 256)
}

Apify.main(async () => {
    const {
        startURLs,
        maxRequestsPerCrawl,
        maxConcurrency,
        linkSelector,
        sameOrigin
    } = await Apify.getInput();
    
    const requestQueue = await Apify.openRequestQueue();
    for (const startURL of startURLs) {
        await requestQueue.addRequest(startURL);
    }

    const pseudoURLs = [];
    if (sameOrigin) {
        for (const startURL of startURLs) {
            const url = new URL(startURL.url);
            pseudoURLs.push(`${url.origin}/[.*]`);
        }
    }

    const handlePageFunction = async ({ request, page }) => {
        const uid = uid_from_url(request.url);
        console.log(`Creating backup of ${request.url} under id ${uid}`);

        const session = await page.target().createCDPSession();
        const { data: snapshot } = await session.send('Page.captureSnapshot', { format: 'mhtml' });

        await Apify.setValue(
            uid,
            snapshot,
            {
                contentType: 'multipart/related'
            },
        );

        await Apify.utils.enqueueLinks({
            page,
            selector: linkSelector,
            requestQueue,
            pseudoUrls: pseudoURLs,
        });
    };

    const crawler = new Apify.PuppeteerCrawler({
        requestQueue,
        handlePageFunction,
        maxRequestsPerCrawl,
        maxConcurrency,
        launchPuppeteerOptions: {
            headless: true
        },
    });

    await crawler.run();
});