# Apify Actor - Website Backup

## Description

The purpose of this actor is to enable creation of website backups by recursively crawling them. For example, we’d use it to make regular backups of https://blog.apify.com/, so that we don’t lose any content by accident. Although such backup cannot be automatically restored, it’s better than losing data completely.

Given URL entry points, the actors recursively crawls the links found on the pages using a provided CSS selector and create a separate [`MHTML`](https://en.wikipedia.org/wiki/MHTML) snapshot of each page. Each snapshot is taken after the full page is rendered with [Puppeteer crawler](https://sdk.apify.com/docs/examples/puppeteer-crawler) and includes all the content such as images and CSS. 


## Output

Single zip file containing `MHTML` snapshot and its metadata is stored in a key value store (`default` or `named` depending on the input argument) for each URL visited. The key for each zip file includes a timestamp, URL hash and the URL in a human readable form. Note that the Apify platform only supports certain characters and limits the length of the key to 256 characters (that is why e.g. `/` is removed). Apart from the key value store, metadata for the crawled webpages are also stored in a dataset (`default` or `named`).
