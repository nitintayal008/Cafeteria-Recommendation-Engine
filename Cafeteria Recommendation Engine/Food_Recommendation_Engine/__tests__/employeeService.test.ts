import { voteFood } from '../src/server/services/employeeService';
import { menuRepository } from '../src/server/repositories/menuRepository';

jest.mock('../src/server/repositories/menuRepository', () => ({
  menuRepository: {
    selectMenuItem: jest.fn(),
  },
}));

describe('Employee Service', () => {
  let callback: jest.Mock;

  beforeEach(() => {
    callback = jest.fn();
  });

  it('should vote for food', async () => {
    (menuRepository.selectMenuItem as jest.Mock).mockResolvedValue(true);
    await voteFood('Pizza', 'lunch', 'john.doe', callback);
    expect(callback).toHaveBeenCalledWith(true);
  });

  it('should handle errors when voting for food', async () => {
    (menuRepository.selectMenuItem as jest.Mock).mockRejectedValue(new Error('Test Error'));
    await voteFood('Burger', 'dinner', 'jane.doe', callback);
    expect(callback).toHaveBeenCalledWith(false);
  });
});