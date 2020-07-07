# Apify Actor - Website Backup

## Description

This actor is meant to be used for creation of website backups. Given URL entry points, it recursively crawls the links found on the pages using a provided CSS selector and create a separate [`MHTML`](https://en.wikipedia.org/wiki/MHTML) snapshot of each page. Each snapshot is taken after the full page is rendered with [Puppeteer crawler](https://sdk.apify.com/docs/examples/puppeteer-crawler) and includes all the content such as images and CSS.

## Input parameters

See [INPUT_SCHEMA.json](https://github.com/mato93/apify-actor-website-backup/blob/master/INPUT_SCHEMA.json) for updated list of parameters.

## Output

Single zip file containing `MHTML` snapshot and its metadata is stored in a key value store (`default` or `named` depending on the input argument) for each URL visited. The key for each zip file includes a timestamp and the URL in a human readable form. Note that the Apify platform only supports certain characters and limits the length of the key to 256 characters (that is why e.g. `/` is replace with `_`).
