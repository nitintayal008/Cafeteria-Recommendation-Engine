import { recommendMenu, viewMonthlyFeedback } from '../src/server/services/chefService';
import { menuRepository } from '../src/server/repositories/menuRepository';

jest.mock('../src/server/repositories/menuRepository', () => ({
  menuRepository: {
    recommendMenu: jest.fn(),
    viewMonthlyFeedback: jest.fn(),
  },
}));

describe('Chef Service', () => {
  const mockItemIds = [1, 2, 3];
  let callback: jest.Mock;

  beforeEach(() => {
    callback = jest.fn();
  });

  it('should recommend menu', async () => {
    (menuRepository.recommendMenu as jest.Mock).mockResolvedValue(['Item1', 'Item2']);
    await recommendMenu(mockItemIds, callback);
    expect(callback).toHaveBeenCalledWith({ success: true, recommendedItems: ['Item1', 'Item2'] });
  });

  it('should view monthly feedback', async () => {
    (menuRepository.viewMonthlyFeedback as jest.Mock).mockResolvedValue('FeedbackReport');
    await viewMonthlyFeedback(callback);
    expect(callback).toHaveBeenCalledWith({ success: true, feedbackReport: 'FeedbackReport' });
  });

});
