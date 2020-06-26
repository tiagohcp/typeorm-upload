import { getCustomRepository } from 'typeorm';
import validator from 'validator';
import AppError from '../errors/AppError';

import TransactionsRepository from '../repositories/TransactionsRepository';

class DeleteTransactionService {
  public async execute(id: string): Promise<void> {
    if (!validator.isUUID(id)) {
      throw new AppError('Id Transaction is invalid', 401);
    }

    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const transaction = await transactionsRepository.findOne(id);

    if (!transaction) {
      throw new AppError('Transaction does not exist.', 401);
    }

    await transactionsRepository.delete(id);

    // return new Response.arguments .status(204).send();
  }
}

export default DeleteTransactionService;
