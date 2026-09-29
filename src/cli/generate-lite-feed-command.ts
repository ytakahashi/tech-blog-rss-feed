import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as url from 'node:url';
import constants from '../common/constants';
import liteConstants from '../common/lite-constants';
import { FeedCrawler } from '../feed/feed-crawler';
import { FeedValidator } from '../feed/feed-validator';
import { LiteFeedGenerator } from '../feed/lite-feed-generator';
import { logger } from '../feed/logger';
import { FEED_INFO_LIST } from '../resources/feed-info-list';

// Generates only the lite feed (public/feeds/lite.xml), without the site and the full feeds.
const rootDirPath = path.join(url.fileURLToPath(new URL('.', import.meta.url)), '../..');

(async () => {
  const startTime = Date.now();

  const crawlFeedsResult = await new FeedCrawler().crawlFeeds(
    FEED_INFO_LIST,
    constants.feedFetchConcurrency,
    constants.feedOgFetchConcurrency,
    new Date(Date.now() - liteConstants.aggregateFeedDurationInHours * 60 * 60 * 1000),
    // The lite feed has no images or Hatena Bookmark counts; skip the requests for them.
    { fetchFeedItemOg: false, fetchFeedBlogOg: false, fetchHatenaCount: false },
  );

  const rss = new LiteFeedGenerator().generateRss(
    crawlFeedsResult.feedItems,
    {
      title: liteConstants.feedTitle,
      description: liteConstants.feedDescription,
      language: liteConstants.feedLanguage,
      link: liteConstants.feedLink,
      feedUrl: liteConstants.feedUrl,
      copyright: liteConstants.feedCopyright,
      generator: liteConstants.feedGenerator,
      maxDescriptionLength: liteConstants.maxFeedDescriptionLength,
    },
    new Date(),
  );

  // Validated before writing, so that a broken feed never replaces the published one.
  await new FeedValidator().assertXmlFeed('lite-rss', rss);

  const outputDirPath = path.join(rootDirPath, liteConstants.outputDirPath);
  await fs.mkdir(outputDirPath, { recursive: true });
  await fs.writeFile(path.join(outputDirPath, liteConstants.outputFileName), rss, 'utf-8');

  logger.info(
    '[lite-feed] generated',
    `${crawlFeedsResult.feedItems.length} items`,
    `${Buffer.byteLength(rss)} bytes`,
    `${((Date.now() - startTime) / 1000).toFixed(1)}s`,
  );
})();
