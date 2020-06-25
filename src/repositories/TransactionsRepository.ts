import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  private transactions: Transaction[];

  public async find(): Promise<Transaction[]> {
    this.transactions = await super.find({
      relations: ['category'],
    });

    return this.transactions;
  }

  public async getBalance(): Promise<Balance> {
    if (!this.transactions) {
      this.transactions = await this.find();
    }

    const sumIncome = this.transactions
      .filter(types => types.type === 'income')
      .map(values => values.value)
      .reduce(
        (accumulatedValue, current): number => accumulatedValue + current,
        0,
      );

    const sumOutcome = this.transactions
      .filter(types => types.type === 'outcome')
      .map(values => values.value)
      .reduce(
        (accumulatedValue, current): number => accumulatedValue + current,
        0,
      );

    const balance: Balance = {
      income: sumIncome,
      outcome: sumOutcome,
      total: sumIncome - sumOutcome,
    };

    return balance;
  }
}

export default TransactionsRepository;
