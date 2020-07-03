const Apify = require('apify');
const { URL } = require('url');

const DEPTH_KEY = 'depth';

function uidFromURL(urlString) {
    // Only following characters are allowed in keys by Apify platform
    const allowedCharacters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!-_.\'()/';

    const url = new URL(urlString);

    // Retain only origin and pathname and replace all '/' by '_'
    let uid = `${url.hostname}${url.pathname}`.replace(/\//g, '_');

    // Prefix current timestamp
    uid = `${new Date().toISOString()}__${uid}`;

    // Filter out characters that are not allowed
    uid = uid.split('').filter((char) => allowedCharacters.includes(char)).join('');

    // Return first 256 characters of uid as it's the limit of the Apify platform
    return uid.slice(0, 256);
}

Apify.main(async () => {
    const {
        startURLs,
        maxRequestsPerCrawl,
        maxCrawlingDepth,
        maxConcurrency,
        linkSelector,
        customKeyValueStore,
        sameOrigin,
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
        const uid = uidFromURL(request.url);
        // eslint-disable-next-line no-console
        console.log(`Creating backup of ${request.url} under id ${uid}`);

        // Create mhtml snapshot of the current URL and store in into key value store
        const session = await page.target().createCDPSession();
        const { data: snapshot } = await session.send('Page.captureSnapshot', { format: 'mhtml' });

        const store = customKeyValueStore
            ? await Apify.openKeyValueStore(customKeyValueStore)
            : await Apify.openKeyValueStore();

        await store.setValue(
            uid,
            snapshot,
            { contentType: 'multipart/related' },
        );

        const currentDepth = request.userData[DEPTH_KEY] || 1;
        if (maxCrawlingDepth && maxCrawlingDepth > 0 && currentDepth >= maxCrawlingDepth) {
            return;
        }
        await Apify.utils.enqueueLinks({
            page,
            selector: linkSelector,
            requestQueue,
            pseudoUrls: pseudoURLs,
            transformRequestFunction: (req) => {
                req.userData[DEPTH_KEY] = currentDepth + 1;
                return req;
            },
        });
    };

    const crawler = new Apify.PuppeteerCrawler({
        requestQueue,
        handlePageFunction,
        maxRequestsPerCrawl,
        maxConcurrency,
        launchPuppeteerOptions: {
            headless: true,
        },
    });

    await crawler.run();
});
