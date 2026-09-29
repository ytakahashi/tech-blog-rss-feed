import { Feed, type FeedOptions } from 'feed';
import { isValidHttpUrl, textTruncate } from './common-util';
import type { CustomRssParserItem } from './feed-crawler';
import { logger } from './logger';

export interface LiteFeedSettings {
  title: string;
  description: string;
  language: string;
  link: string;
  feedUrl: string;
  copyright: string;
  generator: string;
  maxDescriptionLength: number;
}

// Same escaping as FeedGenerator: `feed` outputs title / description as CDATA, which readers
// treat as HTML, so plain text must be HTML-escaped. Category text is escaped by `feed` except
// for `<` and `>`.
const escapeHtml = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escapeAngleBrackets = (text: string) => text.replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Generates the lite RSS feed: only the minimal fields for reading (title, link, guid, date,
 * description, categories and author). Content, images and the site's custom fields are left out
 * to keep the feed small.
 */
export class LiteFeedGenerator {
  public generateRss(feedItems: CustomRssParserItem[], settings: LiteFeedSettings, updated: Date): string {
    const feed = new Feed({
      title: settings.title,
      description: settings.description,
      language: settings.language,
      id: settings.link,
      link: settings.link,
      feedLinks: { rss: settings.feedUrl },
      copyright: settings.copyright,
      generator: settings.generator,
      updated,
    } as FeedOptions);

    for (const feedItem of feedItems) {
      // Skipped for the same reasons as in FeedGenerator.
      if (!isValidHttpUrl(feedItem.link)) {
        logger.warn('[lite-feed-item] invalid link', feedItem.link, feedItem.title);
        continue;
      }
      if (!feedItem.isoDate) {
        logger.warn('[lite-feed-item] no date', feedItem.title);
        continue;
      }

      const id = feedItem.guid && isValidHttpUrl(feedItem.guid) ? feedItem.guid : feedItem.link;
      const text = (feedItem.summary || feedItem.contentSnippet || '').replace(/\s+/g, ' ').trim();

      feed.addItem({
        id,
        guid: id,
        // "Article title | Blog title", so that the blog is known from the title alone.
        title: escapeHtml(`${feedItem.title} | ${feedItem.blogTitle}`),
        description: escapeHtml(textTruncate(text, settings.maxDescriptionLength)),
        link: feedItem.link,
        category: (feedItem.categories || []).map((category) => ({ name: escapeAngleBrackets(category) })),
        author: feedItem.creator && typeof feedItem.creator === 'string' ? [{ name: feedItem.creator }] : undefined,
        date: new Date(feedItem.isoDate),
        published: new Date(feedItem.isoDate),
      });
    }

    return feed.rss2();
  }
}
