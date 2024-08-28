import { initDatabase } from '../database';

let dbOps: Awaited<ReturnType<typeof initDatabase>> | null = null;

const ensureDbInitialized = async () => {
    if (!dbOps) {
        dbOps = await initDatabase();
    }
};

export const storeData = async (key: string, data: string): Promise<string> => {
    await ensureDbInitialized();
    await dbOps!.setData(key, data);
    console.log(`Stored data with key: ${key}`);
    return key;
};

export const retrieveData = async (key: string): Promise<string | undefined> => {
    await ensureDbInitialized();
    return await dbOps!.getData(key);
};

//TODO: add pagination
export const getAllData = async (): Promise<Array<{ key: string; value: string }>> => {
    await ensureDbInitialized();
    return await dbOps!.getAllData();
};

//TODO: add pagination
export const getAllMetadata = async (): Promise<Array<{ key: string; value: string }>> => {
    await ensureDbInitialized();
    return await dbOps!.getAllMetadata();
};

export const storeTransactionResult = async (key: string, data: string): Promise<string> => {
    await ensureDbInitialized();
    await dbOps!.setTransactionResult(key, data);
    console.log(`Stored transaction result with key: ${key}`);
    return key;
};

export const retrieveTransactionResult = async (key: string): Promise<string | undefined> => {
    await ensureDbInitialized();
    return await dbOps!.getTransactionResult(key);
};

//TODO: add pagination
export const getAllTransactionResults = async (): Promise<Array<{ key: string; value: string }>> => {
    await ensureDbInitialized();
    return await dbOps!.getAllTransactionResults();
};
