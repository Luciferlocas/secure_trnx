import AppController from "./controllers/app";
import TransactionController from "./controllers/transaction";
// this is to only show case and use them directly. But the best way to use them is 
// to create a instance in the project in which it need to be used to get maximum flexibility.

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL as string;

const config = {
  app: new AppController(backendUrl),
  transaction: new TransactionController(backendUrl),
};

export const AppService = config.app;
export const TnxService = config.transaction;
