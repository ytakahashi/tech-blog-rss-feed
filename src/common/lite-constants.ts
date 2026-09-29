// Settings of the lite feed: a small RSS feed for a personal feed reader.
// Kept apart from constants.ts so that merging upstream changes rarely conflicts.
const siteUrlStem = 'https://ytakahashi.github.io/tech-blog-rss-feed';

export default {
  feedTitle: '企業テックブログRSS (lite)',
  feedDescription: '企業のテックブログの更新をまとめたRSSフィードの軽量版',
  feedLanguage: 'ja',
  feedLink: 'https://github.com/ytakahashi/tech-blog-rss-feed',
  feedUrl: `${siteUrlStem}/feeds/lite.xml`,
  feedCopyright: 'ytakahashi/tech-blog-rss-feed (fork of yamadashy/tech-blog-rss-feed)',
  feedGenerator: 'ytakahashi/tech-blog-rss-feed',

  // The reader parses the whole feed on each fetch within a tight CPU time limit (serverless),
  // so the feed carries only a short period and minimal fields.
  // The period must exceed the longest time the reader may go without fetching (up to 24 hours).
  aggregateFeedDurationInHours: 3 * 24,
  maxFeedDescriptionLength: 200,

  // Relative to the repository root; published with GitHub Pages as `feeds/lite.xml`.
  outputDirPath: 'public/feeds',
  outputFileName: 'lite.xml',
};
