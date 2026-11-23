import mongoose from 'mongoose';
import dns from 'node:dns';

// Ensure rock-solid public DNS servers to prevent Windows querySrv EREFUSED / ECONNREFUSED
try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (_) {}

// Ensure IPv4 is prioritized for Atlas cluster SRV records
try {
    if (dns.setDefaultResultOrder) {
        dns.setDefaultResultOrder('ipv4first');
    }
} catch (_) {}

let cachedPromise = null;

const fallbackUri = 'mongodb+srv://ruthralekhaantigraviity_db_user:bPtyhG4yQzSPcGgR@cluster0.3vd0qmf.mongodb.net/test?retryWrites=true&w=majority';
const uri = process.env.MONGO_URI || fallbackUri;

const connectDB = async () => {
    // 1: Connected
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    // 2: Connecting - return the in-flight promise
    if (mongoose.connection.readyState === 2 && cachedPromise) {
        try {
            return await cachedPromise;
        } catch (_) {
            cachedPromise = null;
        }
    }

    if (cachedPromise) {
        try {
            const conn = await cachedPromise;
            if (mongoose.connection.readyState === 1) {
                return conn;
            }
        } catch (_) {
            cachedPromise = null;
        }
    }

    cachedPromise = (async () => {
        try {
            const conn = await mongoose.connect(uri, {
                serverSelectionTimeoutMS: 15000,
                connectTimeoutMS: 20000,
                socketTimeoutMS: 45000,
                maxPoolSize: 20,
            });
            console.log(`MongoDB Connected: ${conn.connection.host}`);
            return conn.connection;
        } catch (error) {
            cachedPromise = null;
            console.error(`MongoDB Connection Error: ${error.message}`);
            throw error;
        }
    })();

    return cachedPromise;
};

export default connectDB;
