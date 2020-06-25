/* eslint-disable no-restricted-syntax */
import csvParse from 'csv-parse';
import fs from 'fs';
import path from 'path';
import uploadConfig from '../config/upload';

import Transaction from '../models/Transaction';
import CreateTransactionService from './CreateTransactionService';

interface Request {
  importFilename: string;
}

interface ImportTransactionCSV {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}
async function loadCSV(filePath: string): Promise<ImportTransactionCSV[]> {
  const csvFilePath = path.join(uploadConfig.directory, filePath);

  const readCSVStream = fs.createReadStream(csvFilePath);

  const parseStream = csvParse({
    columns: true,
    ltrim: true,
    rtrim: true,
    cast: true,
  });

  const importedData: ImportTransactionCSV[] = [];

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

  return importedData;
}

class ImportTransactionsService {
  async execute({ importFilename }: Request): Promise<Transaction[]> {
    const importedTransactions: Transaction[] = [];
    const data = await loadCSV(importFilename);

    const createTransaction = new CreateTransactionService();

    for (const importedTransaction of data) {
      const { title } = importedTransaction;
      const { value } = importedTransaction;
      const { type } = importedTransaction;
      const { category } = importedTransaction;

      // eslint-disable-next-line no-await-in-loop
      const transaction = await createTransaction.execute({
        title,
        value,
        type,
        category,
      });

      importedTransactions.push(transaction);
    }

    return importedTransactions;
  }
}

export default ImportTransactionsService;
