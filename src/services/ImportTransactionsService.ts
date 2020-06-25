import csvParse from 'csv-parse';
import fs from 'fs';
import path from 'path';
import { getRepository, In, getCustomRepository } from 'typeorm';
import uploadConfig from '../config/upload';

import Transaction from '../models/Transaction';
// import CreateTransactionService from './CreateTransactionService';
import TransactionsRepository from '../repositories/TransactionsRepository';

import Category from '../models/Category';

interface Request {
  importFilename: string;
}

interface ImportTransactionCSV {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute({ importFilename }: Request): Promise<Transaction[]> {
    const categoriesRepository = getRepository(Category);
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const csvFilePath = path.join(uploadConfig.directory, importFilename);

    const readCSVStream = fs.createReadStream(csvFilePath);

    const parseStream = csvParse({
      columns: true,
      ltrim: true,
      rtrim: true,
      cast: true,
    });

    const importedData: ImportTransactionCSV[] = [];
    // const importedTransactions: Transaction[] = [];

    const parseCSV = readCSVStream.pipe(parseStream);

    parseCSV.on('data', line => {
      const { title, type, value, category } = line;

      if (!title || !type || !value) return;

      importedData.push({
        title,
        value,
        type,
        category,
      });
    });

    await new Promise(resolve => parseCSV.on('end', resolve));

    const categories = importedData
      .map(({ category }) => category)
      .filter((value, index, self) => self.indexOf(value) === index);

    const existentsCategories = await categoriesRepository.find({
      where: { title: In(categories) },
    });

    const existentsCategoriesTitle = existentsCategories.map(
      (category: Category) => category.title,
    );

    const addCategories = categories.filter(
      category => !existentsCategoriesTitle.includes(category),
    );

    let newCategories: Category[] = [];
    if (addCategories.length > 0) {
      newCategories = categoriesRepository.create(
        addCategories.map(title => ({ title })),
      );

      await categoriesRepository.save(newCategories);
    }

    const finalCategories = [...existentsCategories, ...newCategories];

    const createdTransactions = transactionsRepository.create(
      importedData.map(transanction => ({
        title: transanction.title,
        type: transanction.type,
        value: transanction.value,
        category: finalCategories.find(
          category => category.title === transanction.category,
        ),
      })),
    );

    await transactionsRepository.save(createdTransactions);

    fs.promises.unlink(csvFilePath);

    return createdTransactions;

    // Estudo de chamada de um service em outro
    /* const createTransaction = new CreateTransactionService();

    importedData.forEach(async importedTransaction => {
      const { title } = importedTransaction;
      const { value } = importedTransaction;
      const { type } = importedTransaction;
      const { category } = importedTransaction;

      const transaction = await createTransaction.execute({
        title,
        value,
        type,
        category,
      });

      importedTransactions.push(transaction);
    });

    return importedData; */
  }
}

export default ImportTransactionsService;
