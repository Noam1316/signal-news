/**
 * Article Classifier - thin wrapper around ai-analyzer
 * Provides a simple classifyArticle() function for use by bias/coverage analysis
 */

import { analyzeArticle } from './ai-analyzer';

interface ClassifiedArticle {
  topics: string[];
  sentiment: string;
  isSignal: boolean;
  signalScore: number;
  region: string;
  politicalLeaning: string;
}

/**
 * Classify a single article (any shape with sourceId + title + description)
 */
export function classifyArticle(article: {
  sourceId: string;
  title: string;
  description?: string;
  [key: string]: any;
}): ClassifiedArticle {
  // Adapt to FetchedArticle shape expected by analyzeArticle
  const adapted = {
    id: article.id || article.sourceId + '-' + Date.now(),
    sourceId: article.sourceId,
    sourceName: article.sourceName || article.sourceId,
    lensCategory: article.lensCategory || 'unknown',
    language: article.language || 'en',
    title: article.title,
    description: article.description || '',
    link: article.link || '',
    pubDate: article.pubDate || new Date().toISOString(),
    fetchedAt: article.fetchedAt || new Date().toISOString(),
  };

  const analysis = analyzeArticle(adapted as any);

  return {
    topics: analysis.topics,
    sentiment: analysis.sentiment,
    isSignal: analysis.isSignal,
    signalScore: analysis.signalScore,
    region: analysis.region,
    politicalLeaning: analysis.politicalLeaning,
  };
}
