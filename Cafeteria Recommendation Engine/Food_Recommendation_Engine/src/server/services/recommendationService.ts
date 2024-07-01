import { INTENSIFIERS, NEGATIVE_WORDS, NEUTRAL_WORDS, POSITIVE_WORDS } from '../definations/constants';
import { recommendationDB } from '../repositories/recommendationRepository';
import { RatingComment } from '../utils/types';
import { format } from 'date-fns';

const positiveWords = new Set(POSITIVE_WORDS);
const negativeWords = new Set(NEGATIVE_WORDS);
const neutralWords = new Set(NEUTRAL_WORDS);
const intensifiers = new Set(INTENSIFIERS);

export async function calculateSentiments() {
    console.log('i am inside sentiments')
  try {
    const rows = await getRecentComments();
    console.log('rows', rows);
    const commentsMap = mapCommentsByMenuItem(rows);
    console.log('commentsMap', commentsMap);

    for (const menuItemId in commentsMap) {
      const comments = commentsMap[menuItemId];
      console.log('comments', comments);
      const { sentiment, score } = analyze(comments);
        console.log('sentiment', sentiment);
        console.log('score', score);
      const ratings = rows
        .filter(row => row.menu_item_id === parseInt(menuItemId, 10))
        .map(row => row.rating);
        console.log('ratings', ratings);
      const averageRating = calculateAverageRating(ratings);
        console.log('averageRating', averageRating);
      await saveSentimentAnalysis(parseInt(menuItemId, 10), sentiment, averageRating, score);
    }

    console.log('Sentiments Updated....');
    // callback({ success: true });
  } catch (error) {
    console.error('Error updating sentiments:', error);
    // callback({ success: false });
  }
}

function analyze(comments: string[]): { sentiment: string, score: number } {
  let positiveCount = 0;
  let negativeCount = 0;
  let neutralCount = 0;

  comments.forEach(comment => {
    const result = processText(comment);
    positiveCount += result.positiveCount;
    negativeCount += result.negativeCount;
    neutralCount += result.neutralCount;
  });

  return calculateSentiment(positiveCount, negativeCount, neutralCount);
}

function processText(comment: string): { positiveCount: number, negativeCount: number, neutralCount: number } {
  let positiveCount = 0;
  let negativeCount = 0;
  let neutralCount = 0;

  const words = comment.toLowerCase().split(/\W+/);
  let modifiedWords = [...words];

  words.forEach((word, index) => {
    if (word === 'not' && index < words.length - 1) {
      const nextWord = words[index + 1];
      if (positiveWords.has(nextWord)) {
        negativeCount += 1;
        modifiedWords[index + 1] = '';
      } else if (negativeWords.has(nextWord)) {
        positiveCount += 1;
        modifiedWords[index + 1] = '';
      }
    } else if (intensifiers.has(word) && index < words.length - 1) {
      const nextWord = words[index + 1];
      if (positiveWords.has(nextWord)) {
        positiveCount += 2;
      } else if (negativeWords.has(nextWord)) {
        negativeCount += 2;
      }
    }
  });

  modifiedWords.forEach(word => {
    if (positiveWords.has(word)) positiveCount += 1;
    if (negativeWords.has(word)) negativeCount += 1;
    if (neutralWords.has(word)) neutralCount += 1;
  });

  return { positiveCount, negativeCount, neutralCount };
}

function calculateSentiment(positiveCount: number, negativeCount: number, neutralCount: number): { sentiment: string, score: number } {
  const totalWords = positiveCount + negativeCount + neutralCount;
  if (totalWords === 0) {
    return { sentiment: 'Average', score: 50 };
  }

  const positiveScore = (positiveCount / totalWords) * 100;
  const negativeScore = (negativeCount / totalWords) * 100;
  const sentimentScore = positiveScore - negativeScore;

  let sentiment: string;
  if (sentimentScore >= 80) {
    sentiment = 'Highly Recommended';
  } else if (sentimentScore >= 60) {
    sentiment = 'Good';
  } else if (sentimentScore >= 40) {
    sentiment = 'Average';
  } else if (sentimentScore >= 20) {
    sentiment = 'Bad';
  } else {
    sentiment = 'Avoid';
  }

  return { sentiment, score: Math.abs(Math.round(sentimentScore)) };
}

async function getRecentComments(): Promise<RatingComment[]> {
  const threeMonthsAgo = format(new Date(new Date().setMonth(new Date().getMonth() - 3)), 'yyyy-MM-dd');
  console.log('threeMonthsAgo', threeMonthsAgo);
  return await recommendationDB.getRecentComments(threeMonthsAgo);
}

function mapCommentsByMenuItem(rows: RatingComment[]): { [key: number]: string[] } {
  return rows.reduce((map, row) => {
    if (!map[row.menu_item_id]) {
      map[row.menu_item_id] = [];
    }
    map[row.menu_item_id].push(row.comment);
    return map;
  }, {} as { [key: number]: string[] });
}

async function saveSentimentAnalysis(menuItemId: number, sentiment: string, averageRating: number, score: number) {
  const existingSentiment = await recommendationDB.getExistingSentiment(menuItemId);
  console.log("existingSentiment",existingSentiment);

  if (existingSentiment.length > 0) {
    await recommendationDB.updateSentiments(menuItemId, sentiment, averageRating, score);
  } else {
    await recommendationDB.insertSentiments(menuItemId, sentiment, averageRating, score);
  }
}

function calculateAverageRating(ratings: number[]): number {
  if (ratings.length === 0) return 0;
  const total = ratings.reduce((sum, rating) => sum + rating, 0);
  return total / ratings.length;
}
