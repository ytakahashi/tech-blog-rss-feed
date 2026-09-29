import RssParser from 'rss-parser';
import { describe, expect, it } from 'vitest';
import type { CustomRssParserItem } from '../src/feed/feed-crawler';
import { LiteFeedGenerator, type LiteFeedSettings } from '../src/feed/lite-feed-generator';

const SETTINGS: LiteFeedSettings = {
  title: '企業テックブログRSS (lite)',
  description: 'description',
  language: 'ja',
  link: 'https://github.com/example/tech-blog-rss-feed',
  feedUrl: 'https://example.github.io/tech-blog-rss-feed/feeds/lite.xml',
  copyright: 'copyright',
  generator: 'generator',
  maxDescriptionLength: 10,
};

const feedItem = (overrides: Partial<CustomRssParserItem> = {}) =>
  ({
    title: 'テスト記事',
    link: 'https://example.com/articles/1',
    guid: 'https://example.com/?p=1',
    isoDate: '2026-09-29T01:02:03.000Z',
    summary: '要約の本文です。\n改行を含み、長い文章です。',
    categories: ['Go', 'AWS'],
    creator: 'Alice',
    blogTitle: 'Example Tech Blog',
    blogLink: 'https://example.com',
    ...overrides,
  }) as CustomRssParserItem;

const parse = (rss: string) => new RssParser().parseString(rss);

describe('LiteFeedGenerator', () => {
  it('outputs only the minimal fields', async () => {
    const rss = new LiteFeedGenerator().generateRss([feedItem()], SETTINGS, new Date('2026-09-30T00:00:00Z'));
    const feed = await parse(rss);

    expect(feed.title).toBe('企業テックブログRSS (lite)');
    expect(feed.items).toHaveLength(1);
    expect(feed.items[0]).toMatchObject({
      title: 'テスト記事 | Example Tech Blog',
      link: 'https://example.com/articles/1',
      guid: 'https://example.com/?p=1',
      isoDate: '2026-09-29T01:02:03.000Z',
      // Whitespace collapsed, then truncated to maxDescriptionLength characters.
      content: '要約の本文です。 改',
      categories: ['Go', 'AWS'],
      author: 'Alice',
    });
    expect(rss).not.toContain('<content:encoded>');
    expect(rss).not.toContain('<enclosure');
  });

  it('HTML-escapes text inside CDATA', async () => {
    const rss = new LiteFeedGenerator().generateRss(
      [feedItem({ title: 'A & B <tips>', summary: 'x < y && z', categories: ['C<T>'] })],
      { ...SETTINGS, maxDescriptionLength: 200 },
      new Date(),
    );
    const [item] = (await parse(rss)).items;

    // rss-parser returns CDATA as is; feed readers decode it as HTML into the original text.
    expect(item.title).toBe('A &amp; B &lt;tips&gt; | Example Tech Blog');
    expect(item.content).toBe('x &lt; y &amp;&amp; z');
    expect(item.categories).toEqual(['C&lt;T&gt;']);
  });

  it('uses the link as the guid when the guid is not a URL', async () => {
    const rss = new LiteFeedGenerator().generateRss([feedItem({ guid: '6a853e4d08752169' })], SETTINGS, new Date());

    expect((await parse(rss)).items[0].guid).toBe('https://example.com/articles/1');
  });

  it('skips items without a valid link or a date', async () => {
    const rss = new LiteFeedGenerator().generateRss(
      [
        feedItem({ link: 'not-a-url' }),
        feedItem({ isoDate: '' }),
        feedItem({ link: 'https://example.com/articles/2' }),
      ],
      SETTINGS,
      new Date(),
    );

    expect((await parse(rss)).items.map((item) => item.link)).toEqual(['https://example.com/articles/2']);
  });
});
