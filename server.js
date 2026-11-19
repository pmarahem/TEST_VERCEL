const express = require('express');
require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit'); 
// PDF branding: use the transparent PNG, with legacy JPG support.
function getPdfLogoPath() {
    const candidates = ['logo.png', 'logo.jpg', 'logo.jpeg'];
    for (const name of candidates) {
        const candidate = path.join(__dirname, 'public', name);
        if (fs.existsSync(candidate)) return candidate;
    }
    return path.join(__dirname, 'public', 'logo.png');
}

const app = express();

// 🎯 Assigned dynamic platform routing port
const HTTP_PORT = process.env.PORT || 8000; 

//=======================================================
// 🛢️ MONGO DB ATLAS CONNECTION CONFIGURATION
//=======================================================
// One connection/pool per warm Vercel instance; concurrent cold requests share it.
let client;
let db;
let connectionPromise;
let cacheRefreshPromise;
let cachesLoadedAt = 0;
const CACHE_TTL_MS = 15 * 60 * 1000;

async function connectDB() {
    if (!connectionPromise) {
        connectionPromise = (async () => {
            const uri = process.env.MONGODB_URI;
            if (!uri) throw new Error('MONGODB_URI is not configured.');
            if (!client) client = new MongoClient(uri, {
                maxPoolSize: 5,
                minPoolSize: 0,
                serverSelectionTimeoutMS: 8000
            });
            await client.connect();
            db = process.env.MONGODB_DB ? client.db(process.env.MONGODB_DB) : client.db();
            return db;
        })().catch(error => {
            connectionPromise = undefined;
            db = undefined;
            throw error;
        });
    }
    return connectionPromise;
}

async function refreshCachesIfNeeded() {
    if (cachesLoadedAt && Date.now() - cachesLoadedAt < CACHE_TTL_MS) return;
    if (!cacheRefreshPromise) {
        cacheRefreshPromise = Promise.all([loadCustomersToCache(), loadProductsToCache()])
            .then(() => { cachesLoadedAt = Date.now(); })
            .finally(() => { cacheRefreshPromise = undefined; });
    }
    return cacheRefreshPromise;
}

const formatLocalYYYYMMDD = (dateObj) => {
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

function formatToDdMMMyyyy(dateString) {
  if (!dateString || String(dateString).trim() === "" || dateString === "null") {
    return "";
  }
  const dateObj = new Date(dateString);
  if (isNaN(dateObj.getTime()) || dateObj.getFullYear() === 1970) {
    return "";
  }
  const day = String(dateObj.getDate()).padStart(2, "0");
  const yy = String(dateObj.getFullYear()).slice(-2);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return day + "-" + months[dateObj.getMonth()] + "-" + yy;
}

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));

// Vercel serves public/ through its CDN; this middleware also supports npm start locally.
app.use(express.static(path.join(__dirname, 'public')));

// Requests wait for the shared database connection and initial autocomplete caches.
app.use('/api', async (req, res, next) => {
    try {
        await connectDB();
        await refreshCachesIfNeeded();
        next();
    } catch (error) {
        console.error('Database initialization failed:', error.name || 'Error');
        res.status(503).json({ success: false, error: 'Database unavailable. Check the server environment and Atlas network access.' });
    }
});

app.get('/api/health', async (req, res) => {
    try {
        await db.command({ ping: 1 });
        res.json({ success: true, database: 'connected' });
    } catch {
        res.status(503).json({ success: false, database: 'unavailable' });
    }
});

let cachedCustomers = [];
let cachedProducts = [];
// Preserve existing extensionless ledger URLs.
app.get('/invoices', (req, res) => res.redirect(302, '/invoices.html'));
app.get('/creditnotes', (req, res) => res.redirect(302, '/creditnotes.html'));
app.get('/quotations', (req, res) => res.redirect(302, '/quotations.html'));
app.get('/deliveryorders', (req, res) => res.redirect(302, '/deliveryorders.html'));
app.get('/purchaseorders', (req, res) => res.redirect(302, '/purchaseorders.html'));
app.get('/customerorders', (req, res) => res.redirect(302, '/customerorders.html'));
app.get('/customers', (req, res) => res.redirect(302, '/customers.html'));
app.get('/products', (req, res) => res.redirect(302, '/products.html'));
app.get('/purchases', (req, res) => res.redirect(302, '/purchases.html'));
app.get('/expenses', (req, res) => res.redirect(302, '/expenses.html'));

// 2. LOAD CUSTOMERS FOR AUTOCOMPLETE INTO MEMORY CACHE
async function loadCustomersToCache() {
try {
if (!db) return;
// 🛠️ Pulled customer collection straight out of MongoDB Atlas
const result = await db.collection('customer').find({}).toArray();
cachedCustomers = result.map(c => ({
name: c.custname,
postbox: c.postbox,
emirates: c.emirate,
address: c.custaddress,
vatid: c.VatID,
contact: c.contact,
phone: c.phone,
paymentterm: c.paymentterm
}));
console.log(`Success: Cached ${cachedCustomers.length} customers from MongoDB Atlas.`);
} catch (err) {
console.error('Failure caching customer collection:', err.message);
}
}
// 4. AUTOCOMPLETE SEARCH: CUSTOMER NAME SEARCH
app.get('/api/customers/search', (req, res) => {
const queryText = (req.query.q || '').trim().toLowerCase();
if (!queryText || queryText.length < 1) return res.json([]);
const matches = cachedCustomers.filter(customer =>
customer.name && customer.name.toLowerCase().startsWith(queryText)
);
res.json(matches.slice(0, 100));
});

// LOAD PRODUCTS FOR AUTOCOMPLETE INTO MEMORY CACHE
async function loadProductsToCache() {
    try {
        if (!db) return;

        const result = await db.collection('products')
            .find({})
            .toArray();

        cachedProducts = result.map(p => {
            const hasLegacyID =
                p.ID !== undefined &&
                p.ID !== null &&
                String(p.ID).trim() !== '';

            return {
                _id: p._id.toString(),
                item: p.item,

                // Existing products: legacy ID.
                // New products: MongoDB _id string.
                ID: hasLegacyID ? p.ID : p._id.toString(),

                price: p.price,
                pid: p.pid,
                cost: p.cost,
                stock: p.stock,
                Iunit: p.Iunit,
                IRAL: p.IRAL,
                Isize: p.Isize
            };
        });

        console.log(
            `Success: Cached ${cachedProducts.length} products from MongoDB Atlas.`
        );
    } catch (err) {
        console.error(
            'Failure caching product collection:',
            err.message
        );
    }
}
// AUTOCOMPLETE API FOR PRODUCTS
app.get('/api/products/search', (req, res) => {
    const queryText = typeof req.query.q === 'string'
        ? req.query.q.trim().toLowerCase()
        : '';

    if (!queryText) {
        return res.json([]);
    }

    const matches = cachedProducts.filter(product =>
        typeof product.item === 'string' &&
        product.item.toLowerCase().startsWith(queryText)
    );

    return res.json(matches.slice(0, 100));
});

// FETCH INVOICES LEDGER
app.post('/api/invoices-ledger', async (req, res) => {
    try {
        if (!db) {
            return res.status(500).json({
                success: false,
                error: "Database engine offline."
            });
        }

        const { searchQuery, Status, startDate, endDate, timeRange } = req.body;

        const queryFilter = {};
        const now = new Date();

        const formatToSQLDateString = dateObj => {
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');

            return `${year}-${month}-${day}`;
        };

        const escapeRegex = value =>
            String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        let pickerFromDate = "";
        let pickerToDate = "";

        // 1. Status filters.
        if (Status && Status !== 'ALL' && Status !== '') {
            if (Status === 'PDC-DUE') {
                queryFilter.Status = 'PDC';
                queryFilter.Receiveddate = {
                    $lte: formatToSQLDateString(now)
                };
            } else {
                queryFilter.Status = {
                    $regex: `^${escapeRegex(Status)}$`,
                    $options: 'i'
                };
            }
        }

        // 2. Customer name OR invoice-number prefix search.
        if (searchQuery && String(searchQuery).trim() !== '') {
            const cleanedQuery = escapeRegex(
                String(searchQuery).trim()
            );

            queryFilter.$or = [
                {
                    Customer: {
                        $regex: `^${cleanedQuery}`,
                        $options: 'i'
                    }
                },
                {
                    $expr: {
                        $regexMatch: {
                            input: {
                                $convert: {
                                    input: '$InvoiceNo',
                                    to: 'string',
                                    onError: '',
                                    onNull: ''
                                }
                            },
                            regex: `^${cleanedQuery}`,
                            options: 'i'
                        }
                    }
                }
            ];
        }

        // 3. Manual dates take priority.
        if (startDate || endDate) {
            queryFilter.InvoiceDate = {};

            if (startDate) {
                queryFilter.InvoiceDate.$gte = startDate;
                pickerFromDate = startDate;
            }

            if (endDate) {
                queryFilter.InvoiceDate.$lte = endDate;
                pickerToDate = endDate;
            }
        } else if (timeRange && timeRange !== 'FULL') {
            let rangeStart;
            let rangeEnd = now;

            switch (timeRange) {
                case '3MONTH':
                    rangeStart = new Date(
                        now.getFullYear(),
                        now.getMonth() - 2,
                        1
                    );
                    break;

                case 'CURRENT_MONTH':
                    rangeStart = new Date(
                        now.getFullYear(),
                        now.getMonth(),
                        1
                    );
                    break;

                case 'LAST_MONTH':
                    rangeStart = new Date(
                        now.getFullYear(),
                        now.getMonth() - 1,
                        1
                    );
                    rangeEnd = new Date(
                        now.getFullYear(),
                        now.getMonth(),
                        0
                    );
                    break;

                case '2MONTH':
                    rangeStart = new Date(
                        now.getFullYear(),
                        now.getMonth() - 1,
                        1
                    );
                    break;

                case '6MONTH':
                    rangeStart = new Date(
                        now.getFullYear(),
                        now.getMonth() - 5,
                        1
                    );
                    break;

                case 'CURRENT_YEAR':
                    rangeStart = new Date(now.getFullYear(), 0, 1);
                    break;
            }

            if (rangeStart) {
                pickerFromDate = formatToSQLDateString(rangeStart);
                pickerToDate = formatToSQLDateString(rangeEnd);

                queryFilter.InvoiceDate = {
                    $gte: pickerFromDate,
                    $lte: pickerToDate
                };
            }
        }

        // 4. Fetch invoice documents.
        const invoiceDocuments = await db.collection('invoicemain')
            .find(queryFilter)
            .sort({ InvoiceDate: -1, InvoiceNo: -1 })
            .toArray();

        // 5. Keep legacy ID, or expose _id as ID when empty.
        const invoices = invoiceDocuments.map(invoice => {
            const hasLegacyID =
                invoice.ID !== undefined &&
                invoice.ID !== null &&
                String(invoice.ID).trim() !== '';

            return {
                ...invoice,
                ID: hasLegacyID
                    ? invoice.ID
                    : invoice._id.toString()
            };
        });

        return res.status(200).json({
            success: true,
            invoices,
            computedDates: {
                from: pickerFromDate,
                to: pickerToDate
            }
        });

    } catch (err) {
        console.error(
            "MongoDB Atlas Ledger Fetch Operation Failed:",
            err
        );

        return res.status(500).json({
            success: false,
            error: err.message,
            invoices: []
        });
    }
});

// FETCH CREDIT NOTE LEDGER
app.post('/api/creditnotes', async (req, res) => {
    try {
        if (!db) {
            return res.status(500).json({
                success: false,
                error: "Database engine offline."
            });
        }
        const { searchQuery, Status, startDate, endDate, timeRange } = req.body;
        // const {
        //     CNNumber,
        //     Customer,
        //     Status,
        //     startDate,
        //     endDate,
        //     timeRange
        // } = req.body;

        const queryFilter = {};
        const now = new Date();
         // Local helper to format dates as YYYY-MM-DD strings
        const formatToSQLDateString = (dateObj) => {
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const formatDate = date => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');

            return `${year}-${month}-${day}`;
        };

        // Escape user input so searches treat special characters literally.
        const escapeRegex = value =>
            String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Shift months, clamping dates such as May 31 to February 28/29.
        const monthsAgo = count => {
            const date = new Date(
                now.getFullYear(),
                now.getMonth() - count,
                1
            );

            const lastDay = new Date(
                date.getFullYear(),
                date.getMonth() + 1,
                0
            ).getDate();

            date.setDate(Math.min(now.getDate(), lastDay));

            return date;
        };
         let pickerFromDate = "";
        let pickerToDate = "";

        // --- Single Input Unified Search (Customer OR InvoiceNo) ---
        if (searchQuery && searchQuery.trim() !== '') {
         const cleanedQuery = searchQuery.trim();

        queryFilter.$or = [
        // Condition 1: Case-insensitive match on the Customer Name string
        { Customer: { $regex: new RegExp(`^${cleanedQuery}`, 'i') } },
        
        // Condition 2: Match the start of the numeric CNNumber integer field
        {
            $expr: {
                $regexMatch: {
                    input: { $toString: "$CNNumber" }, // Convert Int32 to string dynamically
                    regex: `^${cleanedQuery}`,
                    options: "i"
                }
            }
        }
            ];
            }

        if (Status && Status !== 'ALL' && String(Status).trim() !== '') {
            queryFilter.Status = {
                $regex: `^${escapeRegex(String(Status).trim())}$`,
                $options: 'i'
            };
        }
                // 3. Manual dates take priority.
        if (startDate || endDate) {
            queryFilter.CreditDate = {};

            if (startDate) {
                queryFilter.CreditDate.$gte = startDate;
                pickerFromDate = startDate;
            }

            if (endDate) {
                queryFilter.CreditDate.$lte = endDate;
                pickerToDate = endDate;
            }
        } else if (timeRange && timeRange !== 'FULL') {
            let rangeStart;
            let rangeEnd = now;

            switch (timeRange) {
                case '3MONTH':
                    rangeStart = new Date(
                        now.getFullYear(),
                        now.getMonth() - 2,
                        1
                    );
                    break;

                case 'CURRENT_MONTH':
                    rangeStart = new Date(
                        now.getFullYear(),
                        now.getMonth(),
                        1
                    );
                    break;

                case 'LAST_MONTH':
                    rangeStart = new Date(
                        now.getFullYear(),
                        now.getMonth() - 1,
                        1
                    );
                    rangeEnd = new Date(
                        now.getFullYear(),
                        now.getMonth(),
                        0
                    );
                    break;

                case '2MONTH':
                    rangeStart = new Date(
                        now.getFullYear(),
                        now.getMonth() - 1,
                        1
                    );
                    break;

                case '6MONTH':
                    rangeStart = new Date(
                        now.getFullYear(),
                        now.getMonth() - 5,
                        1
                    );
                    break;

                case 'CURRENT_YEAR':
                    rangeStart = new Date(now.getFullYear(), 0, 1);
                    break;
            }

            if (rangeStart) {
                pickerFromDate = formatToSQLDateString(rangeStart);
                pickerToDate = formatToSQLDateString(rangeEnd);

                queryFilter.CreditDate = {
                    $gte: pickerFromDate,
                    $lte: pickerToDate
                };
            }
        }


        const creditnotes = await db.collection('creditnoteMain')
            .find(queryFilter, {
                // Ledger needs only the master fields.
                projection: { CreditNotes: 0 }
            })
            .sort({ CreditDate: -1, CNNumber: -1 })
            .toArray();

        // return res.status(200).json({
        //     success: true,
        //     creditnotes
        // });
        res.status(200).json({ 
            success: true, 
            creditnotes: creditnotes,
            computedDates: {
                from: pickerFromDate,
                to: pickerToDate
            }
        });

    } catch (err) {
        console.error("MongoDB Credit Note Ledger Fetch Failed:", err);

        return res.status(500).json({
            success: false,
            error: err.message,
            creditnotes: []
        });
    }
});

// FETCH QUOTATIONS LEDGER
app.post('/api/quotations', async (req, res) => {
    try {
        if (!db) {
            return res.status(500).json({ success: false, error: "Database engine offline." });
        }

        // const { QuotationNo, Customer, startDate, endDate, timeRange } = req.body;
        const { searchQuery, startDate, endDate, timeRange } = req.body;
        let queryFilter = {};
        const now = new Date();

        // Local helper to format dates as YYYY-MM-DD strings
        const formatToSQLDateString = (dateObj) => {
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        let pickerFromDate = "";
        let pickerToDate = "";

        // --- Single Input Unified Search (Customer OR InvoiceNo) ---
        if (searchQuery && searchQuery.trim() !== '') {
         const cleanedQuery = searchQuery.trim();

        queryFilter.$or = [
        // Condition 1: Case-insensitive match on the Customer Name string
        { Customer: { $regex: new RegExp(`^${cleanedQuery}`, 'i') } },
        
        // Condition 2: Match the start of the numeric QuotationNo integer field
        {
            $expr: {
                $regexMatch: {
                    input: { $toString: "$QuotationNo" }, // Convert Int32 to string dynamically
                    regex: `^${cleanedQuery}`,
                    options: "i"
                }
            }
        }
            ];
            }
       
        // --- 3. Date & Time Range Matrix Rule (With Override Layer) ---
        if (startDate || endDate) {
            queryFilter.QuotationDate = {};
            if (startDate) {
                queryFilter.QuotationDate.$gte = startDate;
                pickerFromDate = startDate;
            }
            if (endDate) {
                queryFilter.QuotationDate.$lte = endDate;
                pickerToDate = endDate;
            }
        } 
        else if (timeRange && timeRange !== 'FULL' && timeRange !== '') {
            queryFilter.QuotationDate = {};

            if (timeRange === '3MONTH') {
                const startOfTargetMonth = new Date(now.getFullYear(), now.getMonth() - 2, 1);
                pickerFromDate = formatToSQLDateString(startOfTargetMonth);
                pickerToDate = formatToSQLDateString(now);
                queryFilter.QuotationDate = { $gte: pickerFromDate, $lte: pickerToDate };
            } else if (timeRange === 'CURRENT_MONTH') {
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                pickerFromDate = formatToSQLDateString(startOfMonth);
                pickerToDate = formatToSQLDateString(now);
                queryFilter.QuotationDate = { $gte: pickerFromDate, $lte: pickerToDate };
            } else if (timeRange === 'LAST_MONTH') {
                const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
                pickerFromDate = formatToSQLDateString(startOfLastMonth);
                pickerToDate = formatToSQLDateString(endOfLastMonth);
                queryFilter.QuotationDate = { $gte: pickerFromDate, $lte: pickerToDate };
            } else if (timeRange === '2MONTH') {
                const startOfTwoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                pickerFromDate = formatToSQLDateString(startOfTwoMonthsAgo);
                pickerToDate = formatToSQLDateString(now);
                queryFilter.QuotationDate = { $gte: pickerFromDate, $lte: pickerToDate };
            } else if (timeRange === '6MONTH') {
                const startOfSixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
                pickerFromDate = formatToSQLDateString(startOfSixMonthsAgo);
                pickerToDate = formatToSQLDateString(now);
                queryFilter.QuotationDate = { $gte: pickerFromDate, $lte: pickerToDate };
            } else if (timeRange === 'CURRENT_YEAR') {
                const startOfYear = new Date(now.getFullYear(), 0, 1);
                pickerFromDate = formatToSQLDateString(startOfYear);
                pickerToDate = formatToSQLDateString(now);
                queryFilter.QuotationDate = { $gte: pickerFromDate, $lte: pickerToDate };
            }
        }

        // --- 4. Query Execution on quotemain collection ---
        const quotations = await db.collection('quotmain')
            .find(queryFilter)
            .sort({ QuotationDate: -1, QuotationNo: -1 })
            .toArray();

        res.status(200).json({ 
            success: true, 
            quotations: quotations,
            computedDates: {
                from: pickerFromDate,
                to: pickerToDate
            }
        });

    } catch (err) {
        console.error("MongoDB Quotations Ledger Fetch Operation Failed:", err);
        res.status(500).json({ success: false, error: err.message, quotations: [] });
    }
});

// FETCH DELIVERY ORDERS LEDGER
app.post('/api/deliveryorders', async (req, res) => {
    try {
        if (!db) {
            return res.status(500).json({ success: false, error: "Database engine offline." });
        }

        const { searchQuery, startDate, endDate, timeRange } = req.body;
        let queryFilter = {};
        const now = new Date();

        // Local helper to format dates as YYYY-MM-DD strings to match your string-based dataset fields
        const formatToSQLDateString = (dateObj) => {
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        let pickerFromDate = "";
        let pickerToDate = "";

        // --- Single Input Unified Search (Customer OR DONo) ---
        if (searchQuery && searchQuery.trim() !== '') {
         const cleanedQuery = searchQuery.trim();

        queryFilter.$or = [
        // Condition 1: Case-insensitive match on the Customer Name string
        { Customer: { $regex: new RegExp(`^${cleanedQuery}`, 'i') } },
        
        // Condition 2: Match the start of the numeric DONo integer field
        {
            $expr: {
                $regexMatch: {
                    input: { $toString: "$DONo" }, // Convert Int32 to string dynamically
                    regex: `^${cleanedQuery}`,
                    options: "i"
                }
            }
        }
            ];
            }

        // // --- 1. Alphanumeric/Numeric Safe Partial Search for DONo (Int32 Safe Mapping) ---
        // if (DONo && String(DONo).trim() !== '') {
        //     const searchString = String(DONo).trim();
        //     queryFilter.$expr = {
        //         $regexMatch: {
        //             input: { $toString: "$DONo" }, // Converts integer DONo to string on the fly for regex tracking
        //             regex: `^${searchString}`,
        //             options: "i"
        //         }
        //     };
        // }

        // // --- 2. Case-Insensitive Text Wildcard for Customer ---
        // if (Customer && Customer.trim() !== '') {
        //     queryFilter.Customer = { $regex: new RegExp(`^${Customer.trim()}`, 'i') };
        // }

        // --- 3. Date & Time Range Matrix Rule (With Priority Override Layer) ---
        // Priority A: If custom manual date components exist, bind them first
        if (startDate || endDate) {
            queryFilter.DODate = {};
            if (startDate) {
                queryFilter.DODate.$gte = startDate;
                pickerFromDate = startDate;
            }
            if (endDate) {
                queryFilter.DODate.$lte = endDate;
                pickerToDate = endDate;
            }
        } 
        // Priority B: Process select list relative boundaries (Defaulting to Calendar Last 3 Months)
        else if (timeRange && timeRange !== 'FULL' && timeRange !== '') {
            queryFilter.DODate = {};

            if (timeRange === '3MONTH') {
                const startOfTargetMonth = new Date(now.getFullYear(), now.getMonth() - 2, 1);
                pickerFromDate = formatToSQLDateString(startOfTargetMonth);
                pickerToDate = formatToSQLDateString(now);
                queryFilter.DODate = { $gte: pickerFromDate, $lte: pickerToDate };
            } else if (timeRange === 'CURRENT_MONTH') {
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                pickerFromDate = formatToSQLDateString(startOfMonth);
                pickerToDate = formatToSQLDateString(now);
                queryFilter.DODate = { $gte: pickerFromDate, $lte: pickerToDate };
            } else if (timeRange === 'LAST_MONTH') {
                const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
                pickerFromDate = formatToSQLDateString(startOfLastMonth);
                pickerToDate = formatToSQLDateString(endOfLastMonth);
                queryFilter.DODate = { $gte: pickerFromDate, $lte: pickerToDate };
            } else if (timeRange === '2MONTH') {
                const startOfTwoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                pickerFromDate = formatToSQLDateString(startOfTwoMonthsAgo);
                pickerToDate = formatToSQLDateString(now);
                queryFilter.DODate = { $gte: pickerFromDate, $lte: pickerToDate };
            } else if (timeRange === '6MONTH') {
                const startOfSixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
                pickerFromDate = formatToSQLDateString(startOfSixMonthsAgo);
                pickerToDate = formatToSQLDateString(now);
                queryFilter.DODate = { $gte: pickerFromDate, $lte: pickerToDate };
            } else if (timeRange === 'CURRENT_YEAR') {
                const startOfYear = new Date(now.getFullYear(), 0, 1);
                pickerFromDate = formatToSQLDateString(startOfYear);
                pickerToDate = formatToSQLDateString(now);
                queryFilter.DODate = { $gte: pickerFromDate, $lte: pickerToDate };
            }
        }

        // --- 4. Query Execution Layer targeting ordermain ---
        const deliveryOrders = await db.collection('ordermain')
            .find(queryFilter)
            .sort({ DONo: -1 }) // Sorts matching documents descending by order tracking identity
            .toArray();

        // Return clean payload layer back to the frontend
        res.status(200).json({ 
            success: true, 
            deliveryorders: deliveryOrders,
            computedDates: {
                from: pickerFromDate,
                to: pickerToDate
            }
        });

    } catch (err) {
        console.error("MongoDB Delivery Orders Ledger Fetch Operation Failed:", err);
        res.status(500).json({ success: false, error: err.message, deliveryorders: [] });
    }
});

// FETCH PURCHASE ORDERS LEDGER
app.post('/api/purchaseorders', async (req, res) => {
    try {
        // 1. Safety check to verify MongoDB driver availability
        if (!db) {
            return res.status(500).json({ success: false, error: "Database engine offline." });
        }

        // const { LPONumber, Customer, startDate, endDate, timeRange } = req.body;
        const { searchQuery, startDate, endDate, timeRange } = req.body;
        let queryFilter = {};
        const now = new Date();

        // Helper function to format date objects to match your string-based "YYYY-MM-DD" dataset structure
        const formatToSQLDateString = (dateObj) => {
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };
        let pickerFromDate = "";
        let pickerToDate = "";

         // --- Single Input Unified Search (Customer OR InvoiceNo) ---
        if (searchQuery && searchQuery.trim() !== '') {
         const cleanedQuery = searchQuery.trim();

        queryFilter.$or = [
        // Condition 1: Case-insensitive match on the Customer Name string
        { Customer: { $regex: new RegExp(`^${cleanedQuery}`, 'i') } },
        
        // Condition 2: Match the start of the numeric LPONumber integer field
        {
            $expr: {
                $regexMatch: {
                    input: { $toString: "$LPONumber" }, // Convert Int32 to string dynamically
                    regex: `^${cleanedQuery}`,
                    options: "i"
                }
            }
        }
            ];
            }

        // // --- 1. Alphanumeric / Numeric Partial Filtering ---
        // if (LPONumber && String(LPONumber).trim() !== '') {
        //     const cleanedLPO = String(LPONumber).trim();
        //     // Supports partial number searches matching from the beginning of the string (case-insensitive)
        //     queryFilter.LPONumber = { $regex: new RegExp(`^${cleanedLPO}`, 'i') };
        // }

        // if (Customer && Customer.trim() !== '') {
        //     queryFilter.Customer = { $regex: new RegExp(`^${Customer.trim()}`, 'i') };
        // }

        // --- 2. Date & Time-Range Grid Matrix Rules ---
        // Priority A: Process custom manual date pickers if they are provided
        // if (startDate || endDate) {
        //     queryFilter.LPODate = {};
        //     if (startDate) queryFilter.LPODate.$gte = startDate;
        //     if (endDate) queryFilter.LPODate.$lte = endDate;
        // } 
        if (startDate || endDate) {
            queryFilter.LPODate = {};
            if (startDate) {
                queryFilter.LPODate.$gte = startDate;
                pickerFromDate = startDate;
            }
            if (endDate) {
                queryFilter.LPODate.$lte = endDate;
                pickerToDate = endDate;
            }
        } 
        else if (timeRange && timeRange !== 'FULL' && timeRange !== '') {
            queryFilter.LPODate = {};

            if (timeRange === '3MONTH') {
                const startOfTargetMonth = new Date(now.getFullYear(), now.getMonth() - 2, 1);
                pickerFromDate = formatToSQLDateString(startOfTargetMonth);
                pickerToDate = formatToSQLDateString(now);
                queryFilter.LPODate = { $gte: pickerFromDate, $lte: pickerToDate };
            } else if (timeRange === 'CURRENT_MONTH') {
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                pickerFromDate = formatToSQLDateString(startOfMonth);
                pickerToDate = formatToSQLDateString(now);
                queryFilter.LPODate = { $gte: pickerFromDate, $lte: pickerToDate };
            } else if (timeRange === 'LAST_MONTH') {
                const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
                pickerFromDate = formatToSQLDateString(startOfLastMonth);
                pickerToDate = formatToSQLDateString(endOfLastMonth);
                queryFilter.LPODate = { $gte: pickerFromDate, $lte: pickerToDate };
            } else if (timeRange === '2MONTH') {
                const startOfTwoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                pickerFromDate = formatToSQLDateString(startOfTwoMonthsAgo);
                pickerToDate = formatToSQLDateString(now);
                queryFilter.LPODate = { $gte: pickerFromDate, $lte: pickerToDate };
            } else if (timeRange === '6MONTH') {
                const startOfSixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
                pickerFromDate = formatToSQLDateString(startOfSixMonthsAgo);
                pickerToDate = formatToSQLDateString(now);
                queryFilter.LPODate = { $gte: pickerFromDate, $lte: pickerToDate };
            } else if (timeRange === 'CURRENT_YEAR') {
                const startOfYear = new Date(now.getFullYear(), 0, 1);
                pickerFromDate = formatToSQLDateString(startOfYear);
                pickerToDate = formatToSQLDateString(now);
                queryFilter.LPODate = { $gte: pickerFromDate, $lte: pickerToDate };
            }
        }
        // Priority B: Dropdown conditional ranges
        // else if (timeRange && timeRange !== 'FULL' && timeRange !== '') {
        //     queryFilter.LPODate = {};

        //     if (timeRange === '3MONTH') {
        //         const startOfTargetMonth = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        //         queryFilter.LPODate = { 
        //             $gte: formatToSQLDateString(startOfTargetMonth), 
        //             $lte: formatToSQLDateString(now) 
        //         };
        //     } else if (timeRange === 'CURRENT_MONTH') {
        //         const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        //         queryFilter.LPODate = { 
        //             $gte: formatToSQLDateString(startOfMonth), 
        //             $lte: formatToSQLDateString(now) 
        //         };
        //     } else if (timeRange === 'LAST_MONTH') {
        //         const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        //         const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        //         queryFilter.LPODate = { 
        //             $gte: formatToSQLDateString(startOfLastMonth), 
        //             $lte: formatToSQLDateString(endOfLastMonth) 
        //         };
        //     } else if (timeRange === '2MONTH') {
        //         const startOfTwoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        //         queryFilter.LPODate = { 
        //             $gte: formatToSQLDateString(startOfTwoMonthsAgo), 
        //             $lte: formatToSQLDateString(now) 
        //         };
        //     } else if (timeRange === '6MONTH') {
        //         const startOfSixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        //         queryFilter.LPODate = { 
        //             $gte: formatToSQLDateString(startOfSixMonthsAgo), 
        //             $lte: formatToSQLDateString(now) 
        //         };
        //     } else if (timeRange === 'CURRENT_YEAR') {
        //         const startOfYear = new Date(now.getFullYear(), 0, 1);
        //         queryFilter.LPODate = { 
        //             $gte: formatToSQLDateString(startOfYear), 
        //             $lte: formatToSQLDateString(now) 
        //         };
        //     }
        // }

        // 3. Cloud execution layer targeting your 'lpomain' collection
        const purchaseorders = await db.collection('lpomain')
            .find(queryFilter)
            .sort({ LPODate: -1, LPONumber: -1 }) // Sorts descending by date, then by LPO number secondary bounds
            .toArray();

            res.status(200).json({ 
            success: true, 
            purchaseorders: purchaseorders,
            computedDates: {
                from: pickerFromDate,
                to: pickerToDate
            }
        });

        // 4. Return clean data package exactly in your expected frontend key layout
        // res.status(200).json({ success: true, purchaseorders: purchaseorders });

    } catch (err) {
        console.error("MongoDB LPO Ledger Fetch Operation Failed:", err);
        res.status(500).json({ success: false, error: err.message, purchaseorders: [] });
    }
});

// FETCH CUSTOMER ORDERS LEDGER
app.post('/api/customerorders', async (req, res) => {
    try {
        // 1. Safety check to verify MongoDB driver availability
        if (!db) {
            return res.status(500).json({ success: false, error: "Database engine offline." });
        }

        // const { CONo, Customer, Status, startDate, endDate, timeRange } = req.body;
        const { searchQuery, Status, startDate, endDate, timeRange } = req.body;

        let queryFilter = {};
        const now = new Date();

        // Helper function to format date objects to match your string-based "YYYY-MM-DD" dataset structure
        const formatToSQLDateString = (dateObj) => {
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };
        let pickerFromDate = "";
        let pickerToDate = "";
            const escapeRegex = value =>
            String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
       
                // 2. Customer name OR invoice-number prefix search.
        if (searchQuery && String(searchQuery).trim() !== '') {
            const cleanedQuery = escapeRegex(
                String(searchQuery).trim()
            );

            queryFilter.$or = [
                {
                    Customer: {
                        $regex: `^${cleanedQuery}`,
                        $options: 'i'
                    }
                },
                {
                    $expr: {
                        $regexMatch: {
                            input: {
                                $convert: {
                                    input: '$CONo',
                                    to: 'string',
                                    onError: '',
                                    onNull: ''
                                }
                            },
                            regex: `^${cleanedQuery}`,
                            options: 'i'
                        }
                    }
                }
            ];
        }

        if (Status && Status !== 'ALL' && Status.trim() !== '') {
            queryFilter.Status = { $regex: new RegExp(`^${Status.trim()}$`, 'i') };
        }

       
                // 3. Manual dates take priority.
        if (startDate || endDate) {
            queryFilter.CODate = {};

            if (startDate) {
                queryFilter.CODate.$gte = startDate;
                pickerFromDate = startDate;
            }

            if (endDate) {
                queryFilter.CODate.$lte = endDate;
                pickerToDate = endDate;
            }
        } else if (timeRange && timeRange !== 'FULL') {
            let rangeStart;
            let rangeEnd = now;

            switch (timeRange) {
                case '3MONTH':
                    rangeStart = new Date(
                        now.getFullYear(),
                        now.getMonth() - 2,
                        1
                    );
                    break;

                case 'CURRENT_MONTH':
                    rangeStart = new Date(
                        now.getFullYear(),
                        now.getMonth(),
                        1
                    );
                    break;

                case 'LAST_MONTH':
                    rangeStart = new Date(
                        now.getFullYear(),
                        now.getMonth() - 1,
                        1
                    );
                    rangeEnd = new Date(
                        now.getFullYear(),
                        now.getMonth(),
                        0
                    );
                    break;

                case '2MONTH':
                    rangeStart = new Date(
                        now.getFullYear(),
                        now.getMonth() - 1,
                        1
                    );
                    break;

                case '6MONTH':
                    rangeStart = new Date(
                        now.getFullYear(),
                        now.getMonth() - 5,
                        1
                    );
                    break;

                case 'CURRENT_YEAR':
                    rangeStart = new Date(now.getFullYear(), 0, 1);
                    break;
            }

            if (rangeStart) {
                pickerFromDate = formatToSQLDateString(rangeStart);
                pickerToDate = formatToSQLDateString(rangeEnd);

                queryFilter.CODate = {
                    $gte: pickerFromDate,
                    $lte: pickerToDate
                };
            }
        }


        // 3. Execution layer targeting your cloud 'cordermain' collection
        const customerorders = await db.collection('cordermain')
            .find(queryFilter)
            .sort({ CODate: -1, CONo: -1 }) // Sort descending by order date, then descending by tracking number 
            .toArray();

            return res.status(200).json({
            success: true,
            customerorders,
            computedDates: {
                from: pickerFromDate,
                to: pickerToDate
            }
        });

        // 4. Return clean data package exactly in your expected frontend key layout
        // res.status(200).json({ success: true, customerorders: customerorders });

    } catch (err) {
        console.error("MongoDB Customer Orders Ledger Fetch Operation Failed:", err);
        res.status(500).json({ success: false, error: err.message, customerorders: [] });
    }
});

// FETCH CUSTOMERS LEDGER
app.post('/api/customers', async (req, res) => {
    try {
        // 1. Safety check to verify MongoDB driver availability
        if (!db) {
            return res.status(500).json({ success: false, error: "Database engine offline." });
        }

        const { searchQuery } = req.body;
        const queryFilter = {};

        const escapeRegex = value =>
            String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        const searchText = String(searchQuery ?? '').trim();

        if (searchText) {
            const pattern = escapeRegex(searchText);

            queryFilter.$or = [
                { custname: { $regex: pattern, $options: 'i' } },
                { emirate: { $regex: pattern, $options: 'i' } }
            ];
        }
     
        // 2. Cloud execution layer targeting your 'customer' collection
        const customers = await db.collection('customer')
            .find(queryFilter)
            .sort({ custname: 1 }) // Sorts alphabetically (A to Z) ascending matching your previous ORDER BY rules
            .toArray();

        // 3. Return payload structure back into your precise frontend state array key
        res.status(200).json({ success: true, customers: customers });

    } catch (err) {
        console.error("MongoDB Customers Ledger Fetch Operation Failed:", err);
        res.status(500).json({ success: false, error: err.message, customers: [] });
    }
});

// FETCH PRODUCTS LEDGER
app.post('/api/products', async (req, res) => {
    try {
        // 1. Safety check to verify MongoDB driver availability
        if (!db) {
            return res.status(500).json({ success: false, error: "Database engine offline." });
        }

        const { searchQuery, Status, Range } = req.body;
        // const { searchQuery } = req.body;
        const queryFilter = {};

        // let queryFilter = {};

        // --- 1. Range Filtering (Alphabet Grouping e.g. A-E) ---
        if (Range && (!searchQuery || searchQuery.trim() === '')) {
            const [start, end] = Range.split('-');
            if (start && end) {
                // Translates SQL's `item LIKE '[A-E]%'` into MongoDB regex `^[A-E]` (case-insensitive)
                queryFilter.item = { $regex: new RegExp(`^[${start.trim()}-${end.trim()}]`, 'i') };
            }
        }

        // --- 2. Anchor Wildcard Text Filters ---
            
            const escapeRegex = value =>
                String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            const searchText = String(searchQuery ?? '').trim();

            if (searchText) {
                const pattern = escapeRegex(searchText);

                queryFilter.$or = [
                    { item: { $regex: pattern, $options: 'i' } },
                    { pid: { $regex: pattern, $options: 'i' } }
                ];

                // ID is stored as a number: match it exactly.
                const numericID = Number(searchText);

                if (Number.isSafeInteger(numericID)) {
                    queryFilter.$or.push({ ID: numericID });
                }
            }

        // --- 3. Inventory Stock Level Conditions ---
        if (Status && Status !== 'ALL') {
            if (Status === "0") {
                // Out of stock
                queryFilter.stock = 0;
            } else if (Status === "1") {
                // In stock / Available
                queryFilter.stock = { $gt: 0 };
            }
        }

        // 2. Cloud execution layer targeting your 'products' collection
        const products = await db.collection('products')
            .find(queryFilter)
            .sort({ item: 1 }) // Sorts alphabetically (A to Z) ascending matching your previous ORDER BY rules
            .toArray();

        // 3. Return payload structure back into your precise frontend grid array key
        res.status(200).json({ success: true, products: products });

    } catch (err) {
        console.error("MongoDB Products Catalog Fetch Operation Failed:", err);
        res.status(500).json({ success: false, error: err.message, products: [] });
    }
});

// FETCH PURCHASES LEDGER
app.post('/api/purchases', async (req, res) => {
    try {
        // 1. Safety check to verify MongoDB driver availability
        if (!db) {
            return res.status(500).json({ success: false, error: "Database engine offline." });
        }

        const { BillNumber, searchQuery, Status, startDate, endDate, timeRange } = req.body;
        let queryFilter = {};
        const now = new Date();

        // Helper function to format date objects to match your string-based "YYYY-MM-DD" dataset structure
        const formatToSQLDateString = (dateObj) => {
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        if (BillNumber && String(BillNumber).trim() !== '') {
            const cleanedBillNum = String(BillNumber).trim();
            queryFilter.BillNumber = { $regex: new RegExp(`^${cleanedBillNum}`, 'i') };
        }
                let pickerFromDate = "";
                let pickerToDate = "";
            const escapeRegex = value =>
            String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
       
                // 2. Customer name OR invoice-number prefix search.
        if (searchQuery && String(searchQuery).trim() !== '') {
            const cleanedQuery = escapeRegex(
                String(searchQuery).trim()
            );

            queryFilter.$or = [
                {
                    Company: {
                        $regex: `^${cleanedQuery}`,
                        $options: 'i'
                    }
                },
                {
                    $expr: {
                        $regexMatch: {
                            input: {
                                $convert: {
                                    input: '$PNumber',
                                    to: 'string',
                                    onError: '',
                                    onNull: ''
                                }
                            },
                            regex: `^${cleanedQuery}`,
                            options: 'i'
                        }
                    }
                }
            ];
        }


        if (Status && Status !== 'ALL' && Status.trim() !== '') {
            queryFilter.Status = { $regex: new RegExp(`^${Status.trim()}$`, 'i') };
        }

        if (startDate || endDate) {
            queryFilter.BillDate = {};
            if (startDate) {
                queryFilter.BillDate.$gte = startDate;
                pickerFromDate = startDate;
            }
            if (endDate) {
                queryFilter.BillDate.$lte = endDate;
                pickerToDate = endDate;
            }
        } 
        else if (timeRange && timeRange !== 'FULL' && timeRange !== '') {
            queryFilter.BillDate = {};

            if (timeRange === '3MONTH') {
                const startOfTargetMonth = new Date(now.getFullYear(), now.getMonth() - 2, 1);
                pickerFromDate = formatToSQLDateString(startOfTargetMonth);
                pickerToDate = formatToSQLDateString(now);
                queryFilter.BillDate = { $gte: pickerFromDate, $lte: pickerToDate };
            } else if (timeRange === 'CURRENT_MONTH') {
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                pickerFromDate = formatToSQLDateString(startOfMonth);
                pickerToDate = formatToSQLDateString(now);
                queryFilter.BillDate = { $gte: pickerFromDate, $lte: pickerToDate };
            } else if (timeRange === 'LAST_MONTH') {
                const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
                pickerFromDate = formatToSQLDateString(startOfLastMonth);
                pickerToDate = formatToSQLDateString(endOfLastMonth);
                queryFilter.BillDate = { $gte: pickerFromDate, $lte: pickerToDate };
            } else if (timeRange === '2MONTH') {
                const startOfTwoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                pickerFromDate = formatToSQLDateString(startOfTwoMonthsAgo);
                pickerToDate = formatToSQLDateString(now);
                queryFilter.BillDate = { $gte: pickerFromDate, $lte: pickerToDate };
            } else if (timeRange === '6MONTH') {
                const startOfSixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
                pickerFromDate = formatToSQLDateString(startOfSixMonthsAgo);
                pickerToDate = formatToSQLDateString(now);
                queryFilter.BillDate = { $gte: pickerFromDate, $lte: pickerToDate };
            } else if (timeRange === 'CURRENT_YEAR') {
                const startOfYear = new Date(now.getFullYear(), 0, 1);
                pickerFromDate = formatToSQLDateString(startOfYear);
                pickerToDate = formatToSQLDateString(now);
                queryFilter.BillDate = { $gte: pickerFromDate, $lte: pickerToDate };
            }
        }

        // 3. Execution layer targeting your cloud 'purchases' collection
        const purchases = await db.collection('purchases')
            .find(queryFilter)
            .sort({ PNumber: -1 }) // Sorts descending by purchase registry index sequence bounds
            .toArray();

            res.status(200).json({ 
            success: true, 
            purchases: purchases,
            computedDates: {
                from: pickerFromDate,
                to: pickerToDate
            }
        });


        // 4. Return clean data package exactly in your expected frontend key layout
        // res.status(200).json({ success: true, purchases: purchases });

    } catch (err) {
        console.error("MongoDB Purchases Ledger Fetch Operation Failed:", err);
        res.status(500).json({ success: false, error: err.message, purchases: [] });
    }
});

// FETCH EXPENSES LEDGER
app.post('/api/expenses', async (req, res) => {
    try {
        // 1. Safety check to verify MongoDB driver availability
        if (!db) {
            return res.status(500).json({ success: false, error: "Database engine offline." });
        }

        const { searchQuery, Status, startDate, endDate, timeRange } = req.body;
        let queryFilter = {};
        const now = new Date();

        // Helper function to format date objects to match your string-based "YYYY-MM-DD" dataset structure
        const formatToSQLDateString = (dateObj) => {
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };
                let pickerFromDate = "";
                let pickerToDate = "";
            const escapeRegex = value =>
            String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // // --- 1. Alphanumeric Partial Searching & Status Filtering ---
        // if (ExpNumber && String(ExpNumber).trim() !== '') {
        //     const cleanedExpNum = String(ExpNumber).trim();
        //     // Case-insensitive anchor search mimicking standard SQL LIKE 'ExpNumber%'
        //     queryFilter.ExpNumber = { $regex: new RegExp(`^${cleanedExpNum}`, 'i') };
        // }
                // 2. Customer name OR invoice-number prefix search.
        if (searchQuery && String(searchQuery).trim() !== '') {
            const cleanedQuery = escapeRegex(
                String(searchQuery).trim()
            );

            queryFilter.$or = [
                {
                    Type: {
                        $regex: `^${cleanedQuery}`,
                        $options: 'i'
                    }
                },
                {
                    $expr: {
                        $regexMatch: {
                            input: {
                                $convert: {
                                    input: '$ExpNumber',
                                    to: 'string',
                                    onError: '',
                                    onNull: ''
                                }
                            },
                            regex: `^${cleanedQuery}`,
                            options: 'i'
                        }
                    }
                }
            ];
        }


        if (Status && Status !== 'ALL' && Status.trim() !== '') {
            queryFilter.Status = { $regex: new RegExp(`^${Status.trim()}$`, 'i') };
        }

         if (startDate || endDate) {
            queryFilter.ExpDate = {};
            if (startDate) {
                queryFilter.ExpDate.$gte = startDate;
                pickerFromDate = startDate;
            }
            if (endDate) {
                queryFilter.ExpDate.$lte = endDate;
                pickerToDate = endDate;
            }
        } 
        else if (timeRange && timeRange !== 'FULL' && timeRange !== '') {
            queryFilter.ExpDate = {};

            if (timeRange === '3MONTH') {
                const startOfTargetMonth = new Date(now.getFullYear(), now.getMonth() - 2, 1);
                pickerFromDate = formatToSQLDateString(startOfTargetMonth);
                pickerToDate = formatToSQLDateString(now);
                queryFilter.ExpDate = { $gte: pickerFromDate, $lte: pickerToDate };
            } else if (timeRange === 'CURRENT_MONTH') {
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                pickerFromDate = formatToSQLDateString(startOfMonth);
                pickerToDate = formatToSQLDateString(now);
                queryFilter.ExpDate = { $gte: pickerFromDate, $lte: pickerToDate };
            } else if (timeRange === 'LAST_MONTH') {
                const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
                pickerFromDate = formatToSQLDateString(startOfLastMonth);
                pickerToDate = formatToSQLDateString(endOfLastMonth);
                queryFilter.ExpDate = { $gte: pickerFromDate, $lte: pickerToDate };
            } else if (timeRange === '2MONTH') {
                const startOfTwoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                pickerFromDate = formatToSQLDateString(startOfTwoMonthsAgo);
                pickerToDate = formatToSQLDateString(now);
                queryFilter.ExpDate = { $gte: pickerFromDate, $lte: pickerToDate };
            } else if (timeRange === '6MONTH') {
                const startOfSixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
                pickerFromDate = formatToSQLDateString(startOfSixMonthsAgo);
                pickerToDate = formatToSQLDateString(now);
                queryFilter.ExpDate = { $gte: pickerFromDate, $lte: pickerToDate };
            } else if (timeRange === 'CURRENT_YEAR') {
                const startOfYear = new Date(now.getFullYear(), 0, 1);
                pickerFromDate = formatToSQLDateString(startOfYear);
                pickerToDate = formatToSQLDateString(now);
                queryFilter.ExpDate = { $gte: pickerFromDate, $lte: pickerToDate };
            }
        }

        // 3. Execution layer targeting your cloud 'expenses' collection
        const expenses = await db.collection('expenses')
            .find(queryFilter)
            .sort({ ExpNumber: -1 }) // Sorts descending by expense transaction index sequence bounds
            .toArray();

            res.status(200).json({ 
            success: true, 
            expenses: expenses,
            computedDates: {
                from: pickerFromDate,
                to: pickerToDate
            }
        });

        // 4. Return clean data package exactly in your expected frontend key layout
        // res.status(200).json({ success: true, expenses: expenses });

    } catch (err) {
        console.error("MongoDB Expenses Ledger Fetch Operation Failed:", err);
        res.status(500).json({ success: false, error: err.message, expenses: [] });
    }
});

// FETCH INVOICES PDC OVERDUE
app.post('/api/pdc-overdue', async (req, res) => {
    try {
        // 1. Safety check to verify MongoDB driver availability
        if (!db) {
            return res.status(500).json({ success: false, error: "Database engine offline." });
        }

        const { Customer } = req.body;
        const now = new Date();
        
        // Formats your dynamic runtime threshold marker into your string schema pattern: "YYYY-MM-DD"
        const toDay = formatLocalYYYYMMDD(now);
       
        // 2. Initialize the query layout matching your historical column rules
        let queryFilter = {
            Status: { $regex: /^PDC$/i }, // Matches 'PDC', 'pdc', etc.
            Receiveddate: { $lte: toDay }   // Cheque maturity date is on or before today
        };

        // If a specific customer constraint parameter is sent, filter down into their tree boundaries
        if (Customer && Customer.trim() !== '') {
            queryFilter.Customer = { $regex: new RegExp(`^${Customer.trim()}`, 'i') };
        }

        // 3. Query Execution on invoicemain collection
        const records = await db.collection('invoicemain')
            .find(queryFilter)
            .sort({ Receiveddate: -1 }) // Ordered descending by check maturity date
            .toArray();

        // 4. Map query response records into your expected layout schema payload
        const pdcOverdue = records.map(row => {
            return {
                customer: row.Customer,
                emirate: row.Emirate,
                invNumber: row.InvoiceNo,
                // Clean dates out of standard ISO structures down into display fragments safely
                invoiceDate: row.InvoiceDate ? String(row.InvoiceDate).split('T')[0] : "",
                ChqNo: row.ChqNo,
                issueDate: row.Receiveddate ? String(row.Receiveddate).split('T')[0] : "",
                GrandTotal: row.GrandTotal
            };
        });

        // 5. Send payload package cleanly back to your frontend grid interface
        res.status(200).json({
            pdcOverdue: pdcOverdue
        });

    } catch (err) {
        console.error("MongoDB PDC Overdue Extraction Failed:", err);
        res.status(500).json({ success: false, error: err.message, pdcOverdue: [] });
    }
});

// FETCH INVOICES DETAILS FOR EDIT
app.get('/api/get-invoice-details', async (req, res) => {
    try {
        if (!db) {
            return res.status(500).json({
                success: false,
                error: "Database offline."
            });
        }

        const invoiceNumberKey = req.query.InvoiceNo;

        if (
            typeof invoiceNumberKey !== 'string' ||
            invoiceNumberKey.trim() === ''
        ) {
            return res.status(400).json({
                success: false,
                error: "Missing InvoiceNo search query parameter."
            });
        }

        const invoiceNo = invoiceNumberKey.trim();
        const invoiceValues = [invoiceNo];
        const numericInvoiceNo = Number(invoiceNo);

        if (Number.isSafeInteger(numericInvoiceNo)) {
            invoiceValues.push(numericInvoiceNo);
        }

        const invoice = await db.collection('invoicemain').findOne({
            InvoiceNo: { $in: invoiceValues }
        });

        if (!invoice) {
            return res.status(404).json({
                success: false,
                error: "Invoice not found inside invoicemain ledger."
            });
        }

        // Separate invoice metadata from its embedded items.
        const { invoices, ...master } = invoice;

        if (!Array.isArray(invoices)) {
            console.error(
                "Expected invoices array for invoice:",
                invoiceNo
            );

            return res.status(500).json({
                success: false,
                error: "Invoice invoices field is missing or is not an array."
            });
        }

        const items = await db.collection('invoicemain')
            .aggregate([
                {
                    $match: {
                        _id: invoice._id
                    }
                },
                {
                    $unwind: '$invoices'
                },
                {
                    $replaceRoot: {
                        newRoot: '$invoices'
                    }
                },
                {
                    // Preserve legacy ID; otherwise expose item _id as ID.
                    $set: {
                        ID: {
                            $cond: {
                                if: {
                                    $eq: [
                                        {
                                            $trim: {
                                                input: {
                                                    $convert: {
                                                        input: '$ID',
                                                        to: 'string',
                                                        onError: '',
                                                        onNull: ''
                                                    }
                                                }
                                            }
                                        },
                                        ''
                                    ]
                                },
                                then: {
                                    $convert: {
                                        input: '$_id',
                                        to: 'string',
                                        onError: null,
                                        onNull: null
                                    }
                                },
                                else: '$ID'
                            }
                        }
                    }
                },
                {
                    $lookup: {
                        from: 'products',
                        let: {
                            // Legacy numeric/string product reference.
                            legacyPID: {
                                $convert: {
                                    input: '$PID',
                                    to: 'string',
                                    onError: null,
                                    onNull: null
                                }
                            },

                            // New ObjectId or ObjectId-string reference.
                            productObjectId: {
                                $convert: {
                                    input: '$PID',
                                    to: 'objectId',
                                    onError: null,
                                    onNull: null
                                }
                            }
                        },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $or: [
                                            {
                                                $and: [
                                                    {
                                                        $ne: [
                                                            '$$legacyPID',
                                                            null
                                                        ]
                                                    },
                                                    {
                                                        $eq: [
                                                            {
                                                                $convert: {
                                                                    input: '$ID',
                                                                    to: 'string',
                                                                    onError: null,
                                                                    onNull: null
                                                                }
                                                            },
                                                            '$$legacyPID'
                                                        ]
                                                    }
                                                ]
                                            },
                                            {
                                                $and: [
                                                    {
                                                        $ne: [
                                                            '$$productObjectId',
                                                            null
                                                        ]
                                                    },
                                                    {
                                                        $eq: [
                                                            '$_id',
                                                            '$$productObjectId'
                                                        ]
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                }
                            }
                        ],
                        as: 'matchedProduct'
                    }
                },
                {
                    // Keep invoice items even without a matching product.
                    $set: {
                        LiveStockCount: {
                            $ifNull: [
                                {
                                    $arrayElemAt: [
                                        '$matchedProduct.stock',
                                        0
                                    ]
                                },
                                null
                            ]
                        },
                        LiveCost: {
                            $ifNull: [
                                {
                                    $arrayElemAt: [
                                        '$matchedProduct.cost',
                                        0
                                    ]
                                },
                                null
                            ]
                        }
                    }
                },
                {
                    $sort: {
                        SrNo: 1
                    }
                },
                {
                    $project: {
                        matchedProduct: 0
                    }
                }
            ])
            .toArray();

        return res.status(200).json({
            success: true,
            master,
            items
        });

    } catch (err) {
        console.error("Failed to fetch MongoDB invoice details:", err);

        return res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

// FETCH QUOTATION DETAILS FOR EDIT
app.get('/api/get-quotation-details', async (req, res) => {
    try {
        if (!db) return res.status(500).json({ success: false, error: 'Database offline.' });
        if (typeof req.query.QuotationNo !== 'string' || !req.query.QuotationNo.trim()) {
            return res.status(400).json({ success: false, error: 'Missing QuotationNo search query parameter.' });
        }
        const key = req.query.QuotationNo.trim();
        const values = [key];
        if (Number.isSafeInteger(Number(key))) values.push(Number(key));
        const collection = db.collection('quotmain');
        const quote = await collection.findOne({ QuotationNo: { $in: values } });
        if (!quote) return res.status(404).json({ success: false, error: 'Quotation not found inside quotmain ledger.' });
        const { quotations, ...master } = quote;
        if (!Array.isArray(quotations)) {
            return res.status(500).json({ success: false, error: 'Quotation quotations field is missing or is not an array.' });
        }
        const items = await collection.aggregate([
            { $match: { _id: quote._id } },
            { $unwind: '$quotations' },
            { $replaceRoot: { newRoot: '$quotations' } },
            { $set: { ID: { $cond: [
                { $eq: [{ $trim: { input: { $convert: { input: '$ID', to: 'string', onError: '', onNull: '' } } } }, ''] },
                { $convert: { input: '$_id', to: 'string', onError: null, onNull: null } }, '$ID'
            ] } } },
            { $lookup: {
                from: 'products',
                let: {
                    legacyPID: { $convert: { input: '$PID', to: 'string', onError: null, onNull: null } },
                    productObjectId: { $convert: { input: '$PID', to: 'objectId', onError: null, onNull: null } }
                },
                pipeline: [{ $match: { $expr: { $or: [
                    { $and: [ { $ne: ['$$legacyPID', null] }, { $ne: ['$$legacyPID', ''] },
                        { $eq: [{ $convert: { input: '$ID', to: 'string', onError: null, onNull: null } }, '$$legacyPID'] } ] },
                    { $and: [ { $ne: ['$$productObjectId', null] }, { $eq: ['$_id', '$$productObjectId'] } ] }
                ] } } }],
                as: 'matchedProduct'
            } },
            { $set: {
                LiveStockCount: { $ifNull: [{ $arrayElemAt: ['$matchedProduct.stock', 0] }, null] },
                LiveCost: { $ifNull: [{ $arrayElemAt: ['$matchedProduct.cost', 0] }, null] },
                numericSrNo: { $convert: { input: '$SrNo', to: 'double', onError: 0, onNull: 0 } }
            } },
            { $sort: { numericSrNo: 1 } },
            { $project: { matchedProduct: 0, numericSrNo: 0 } }
        ]).toArray();
        return res.status(200).json({ success: true, master, items });
    } catch (error) {
        console.error('Failed to fetch MongoDB quotation details:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
});

// FETCH CO DETAILS FOR EDIT
app.get('/api/get-co-details', async (req, res) => {
    try {
        if(!db)return res.status(500).json({success:false,error:'Database offline.'});
        if(typeof req.query.CONo!=='string'||!req.query.CONo.trim())return res.status(400).json({success:false,error:'CONo is required.'});
        const key=req.query.CONo.trim(),values=[key];if(Number.isSafeInteger(Number(key)))values.push(Number(key));
        const order=await db.collection('cordermain').findOne({CONo:{$in:values}});
        if(!order)return res.status(404).json({success:false,error:'Customer Order not found.'});
        const {corderlist,...master}=order;
        if(!Array.isArray(corderlist))return res.status(500).json({success:false,error:'Stored corderlist is missing or invalid.'});
        const items=[];
        for(const item of [...corderlist].sort((a,b)=>Number(a.SrNo)-Number(b.SrNo))){
            const pid=String(item.PID??'').trim(),conditions=[];
            if(pid){const ids=[pid];if(Number.isSafeInteger(Number(pid)))ids.push(Number(pid));conditions.push({ID:{$in:ids}});if(/^[a-fA-F0-9]{24}$/.test(pid))conditions.push({_id:new ObjectId(pid)});}
            const products=conditions.length?await db.collection('products').find({$or:conditions}).limit(2).toArray():[];
            // Preserve unmatched rows, as with Edit Invoice/Quotation.
            const product=products.length===1?products[0]:null;
            const quantity=Number(item.Quantity)||0,delivered=Number(item.DQuantity??(quantity-Number(item.PQuantity??quantity)))||0;
            items.push({...item,ID:item.ID??item._id??null,
                Status:item.Status|| (delivered===0?'Pending':delivered===quantity?'Delivered':'Partial'),
                LiveStockCount:product?.stock??null,LiveCost:product?.cost??null});
        }
        return res.json({success:true,master,items});
    }catch(error){console.error('Failed to fetch Customer Order details:',error);return res.status(500).json({success:false,error:error.message});}
});



// FETCH NEW DO FROM INVOICES
app.get('/api/do-invoice-details', async (req, res) => {
    try {
        if (!db) {
            return res.status(500).json({
                success: false,
                error: "Database offline."
            });
        }

        const invoiceNumberKey = req.query.InvoiceNo;

        if (
            typeof invoiceNumberKey !== 'string' ||
            invoiceNumberKey.trim() === ''
        ) {
            return res.status(400).json({
                success: false,
                error: "Missing InvoiceNo search query parameter."
            });
        }

        // Support legacy numeric and string invoice numbers.
        const invoiceNo = invoiceNumberKey.trim();
        const invoiceValues = [invoiceNo];
        const numericInvoiceNo = Number(invoiceNo);

        if (Number.isSafeInteger(numericInvoiceNo)) {
            invoiceValues.push(numericInvoiceNo);
        }

        const invoice = await db.collection('invoicemain').findOne({
            InvoiceNo: { $in: invoiceValues }
        });

        if (!invoice) {
            return res.status(404).json({
                success: false,
                error: "Invoice not found inside invoicemain ledger."
            });
        }

        const { invoices, ...master } = invoice;

        if (!Array.isArray(invoices)) {
            return res.status(500).json({
                success: false,
                error: "Invoice invoices field is missing or is not an array."
            });
        }

        // Case-insensitive status matching and numeric SrNo ordering.
        const items = invoices
            .filter(item =>
                typeof item.Status === 'string' &&
                item.Status.toLowerCase() === 'delivered' || item.Status === ''
            )
            .sort((a, b) => Number(a.SrNo) - Number(b.SrNo));

            if (items.length === 0) {
    return res.status(200).json({
        success: false,
        message: "There are no items to deliver.",
        master,
        items: []
    });
}

        return res.status(200).json({
            success: true,
            master,
            items
        });

    } catch (err) {
        console.error("Failed to fetch invoice delivery details:", err);

        return res.status(500).json({
            success: false,
            error: err.message
        });
    }
});



// LOAD DASHBOARD METRICS
app.post('/api/dashboard-metrics', async (req, res) => {
    try {
        if (!db) {
            return res.status(500).json({ error: "Database engine offline." });
        }

        const { timeRange } = req.body;
        const now = new Date();

        // Local helper to format dates as YYYY-MM-DD strings
        const formatLocalYYYYMMDD = (dateObj) => {
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const toDay = formatLocalYYYYMMDD(now);
        let filterStartDate = '1970-01-01';
        let filterEndDate = toDay;

        // --- 1. Date Range Boundaries Mapping ---
        if (timeRange === 'CURRENT_MONTH') {
            filterStartDate = formatLocalYYYYMMDD(new Date(now.getFullYear(), now.getMonth(), 1));
        } else if (timeRange === 'LAST_MONTH') {
            filterStartDate = formatLocalYYYYMMDD(new Date(now.getFullYear(), now.getMonth() - 1, 1));
            filterEndDate = formatLocalYYYYMMDD(new Date(now.getFullYear(), now.getMonth(), 0));
        } else if (timeRange === '2MONTH') {
            const pastDate = new Date();
            pastDate.setMonth(now.getMonth() - 2);
            filterStartDate = formatLocalYYYYMMDD(pastDate);
        } else if (timeRange === '3MONTH') {
            const pastDate = new Date();
            pastDate.setMonth(now.getMonth() - 3);
            filterStartDate = formatLocalYYYYMMDD(pastDate);
        } else if (timeRange === '6MONTH') {
            const pastDate = new Date();
            pastDate.setMonth(now.getMonth() - 6);
            filterStartDate = formatLocalYYYYMMDD(pastDate);
        } else if (timeRange === 'CURRENT_YEAR') {
            filterStartDate = formatLocalYYYYMMDD(new Date(now.getFullYear(), 0, 1));
        } else if (timeRange === 'LAST_YEAR') {
            filterStartDate = formatLocalYYYYMMDD(new Date(now.getFullYear() - 1, 0, 1));
            filterEndDate = formatLocalYYYYMMDD(new Date(now.getFullYear() - 1, 11, 31));
        }

        // Helper function for quick collection summation pipelines
        const getSumPipeline = (dateField, amountField) => [
            { $match: { [dateField]: { $gte: filterStartDate, $lte: filterEndDate } } },
            { $group: { _id: null, total: { $sum: { $toDouble: `$${amountField}` } } } }
        ];

        // --- 2. Parallel Processing Cloud Execution Layer ---
        const [salesAgg, expenseAgg, purchaseAgg, outOfStockCount, pdcTransactions] = await Promise.all([
            // [0] Invoices Totals, Min & Max Date Bounds
            db.collection('invoicemain').aggregate([
                { $match: { InvoiceDate: { $gte: filterStartDate, $lte: filterEndDate } } },
                { 
                    $group: { 
                        _id: null, 
                        TotalSales: { $sum: { $toDouble: "$GrandTotal" } },
                        FirstInvoiceDate: { $min: "$InvoiceDate" },
                        LastInvoiceDate: { $max: "$InvoiceDate" }
                    } 
                }
            ]).toArray(),

            // [1] Expenses Totals (using lowercase collection name)
            db.collection('expenses').aggregate(getSumPipeline('ExpDate', 'Amount')).toArray(),

            // [2] Purchases Totals (using lowercase collection name)
            db.collection('purchases').aggregate(getSumPipeline('BillDate', 'Amount')).toArray(),

            // [3] Out of Stock Counter (Check exact casing of "stock" field in your collection)
            db.collection('products').countDocuments({ stock: 0 }),

            // [4] PDC checks to deposit 
            db.collection('invoicemain').find({
                Status: { $regex: /^PDC$/i },
                Receiveddate: { $lte: toDay }
            }).sort({ Receiveddate: -1 }).toArray()
        ]);

        // --- 3. Extract & Format Payload Values Safely ---
        const totalSales = salesAgg[0]?.TotalSales || 0;
        const startInvoiceDate = salesAgg[0]?.FirstInvoiceDate || filterStartDate;
        const endInvoiceDate = salesAgg[0]?.LastInvoiceDate || filterEndDate;
        
        const totalExpenses = expenseAgg[0]?.total || 0;
        const totalPurchases = purchaseAgg[0]?.total || 0;
        
        const totalCost = totalExpenses + totalPurchases;
        const netLiquidity = totalSales - totalCost;

        // Map recent PDC array rows into your specific UI properties layout
        const latestTransactions = pdcTransactions.map(row => ({
            customer: row.Customer,
            invNumber: row.InvoiceNo,
            ChqNo: row.ChqNo,
            issueDate: row.Receiveddate ? row.Receiveddate.split('T')[0] : "", 
            GrandTotal: row.GrandTotal
        }));

        // Send everything back in your precise UI formatting specification
        res.status(200).json({
            totalReceivables: totalSales.toLocaleString('en-AE', { minimumFractionDigits: 2 }),
            expensesTotal: totalExpenses.toLocaleString('en-AE', { minimumFractionDigits: 2 }),
            procurementCost: totalPurchases.toLocaleString('en-AE', { minimumFractionDigits: 2 }),
            netLiquidity: netLiquidity.toLocaleString('en-AE', { minimumFractionDigits: 2 }),
            fromDate: startInvoiceDate,
            toDate: endInvoiceDate,
            outOfStock: outOfStockCount,
            latestTransactions: latestTransactions
        });

    } catch (err) {
        console.error("MongoDB Dashboard Metrics Extraction Failed:", err);
        res.status(500).json({ error: err.message });
    }
});

// LOAD MONTHLY DATA FOR DASHBOARD
app.get('/api/monthly-financials', async (req, res) => {
    try {
        if (!db) {
            return res.status(500).json({ error: "Database engine offline." });
        }

        // 1. Capture selected year, default to current year
        const selectedYear = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();
        const yearStr = String(selectedYear);

        // Calendar array mapping structure matching SQL CHOOSE()
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        // 2. Build individual aggregation blueprints for the 3 collections
        const pipelineTemplate = (dateField, amountField) => [
            {
                $project: {
                    // Extract year and month string values directly via substring slices
                    year: { $substr: [`$${dateField}`, 0, 4] },
                    monthNum: { $toInt: { $substr: [`$${dateField}`, 5, 2] } },
                    amount: { $toDouble: `$${amountField}` }
                }
            },
            { 
                $match: { 
                    year: yearStr,
                    monthNum: { $gte: 1, $lte: 12 }
                } 
            },
            {
                $group: {
                    _id: "$monthNum",
                    total: { $sum: "$amount" }
                }
            }
        ];

        // 3. Execute all 3 database scans in parallel at the exact same millisecond
        const [salesData, expenseData, purchaseData] = await Promise.all([
            db.collection('invoicemain').aggregate(pipelineTemplate('InvoiceDate', 'GrandTotal')).toArray(),
            db.collection('expenses').aggregate(pipelineTemplate('ExpDate', 'Amount')).toArray(),
            db.collection('purchases').aggregate(pipelineTemplate('BillDate', 'Amount')).toArray()
        ]);

        // 4. Initialize an empty 12-month summary calendar bucket structure
        const monthlyMap = {};
        for (let m = 1; m <= 12; m++) {
            monthlyMap[m] = { month: monthNames[m - 1], sales: 0, compExpense: 0, purchase: 0 };
        }

        // 5. Populate values into our local array layer buckets
        salesData.forEach(item => { if (monthlyMap[item._id]) monthlyMap[item._id].sales = item.total; });
        expenseData.forEach(item => { if (monthlyMap[item._id]) monthlyMap[item._id].compExpense = item.total; });
        purchaseData.forEach(item => { if (monthlyMap[item._id]) monthlyMap[item._id].purchase = item.total; });

        // Flatten the map object down into a clean index array sorted from Jan to Dec
        const finalChartSet = Object.keys(monthlyMap)
            .sort((a, b) => parseInt(a) - parseInt(b))
            .map(key => monthlyMap[key]);

        res.json(finalChartSet);

    } catch (err) {
        console.error("MongoDB Dashboard Aggregation Error: ", err);
        res.status(500).json({ error: "Internal Server database lookup failure" });
    }
});

// LOAD ALL YEAR PRESENT IN DB
app.get('/api/financial-years', async (req, res) => {
    try {
        if (!db) {
            return res.status(500).json({ error: "Database engine offline." });
        }

        // 1. Run 3 distinct queries in parallel at the exact same millisecond
        const [invoiceDates, expenseDates, purchaseDates] = await Promise.all([
            db.collection('invoicemain').distinct('InvoiceDate'),
            db.collection('Expenses').distinct('ExpDate'),
            db.collection('Purchases').distinct('BillDate')
        ]);

        // Helper function to cleanly extract years from your string arrays ("YYYY-MM-DD")
        const extractYears = (dateArray) => {
            const yearsSet = new Set();
            dateArray.forEach(date => {
                if (date) {
                    const year = new Date(date).getFullYear();
                    if (!isNaN(year)) yearsSet.add(year);
                }
            });
            return Array.from(yearsSet);
        };

        // 2. Combine all unique years from the 3 collections
        const allYears = Array.from(new Set([
            ...extractYears(invoiceDates),
            ...extractYears(expenseDates),
            ...extractYears(purchaseDates)
        ])).sort((a, b) => b - a); // Order by Year DESC (latest year first)

        // 3. Fallback: If database is completely brand new and empty, default to current year
        if (allYears.length === 0) {
            allYears.push(new Date().getFullYear());
        }

        res.json(allYears);
    } catch (err) {
        console.error("MongoDB Year Fetch Error: ", err);
        res.status(500).json({ error: "Internal Server failed to fetch available chart years" });
    }
});
// ===========================================================================//
// ============ALL SAVING AND UPDATING API START FROM HERE ==================//
// LOAD PAYMENT MULTI INVOICE
app.post('/api/multi-invoice-payment', async (req, res) => {
    try {
        if (!db) {
            return res.status(500).json({
                error: "Database engine offline."
            });
        }

        const { Customer } = req.body;

        if (
            typeof Customer !== 'string' ||
            Customer.trim() === ''
        ) {
            return res.status(400).json({
                error: "Customer is required."
            });
        }

        const escapeRegex = value =>
            String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        const formatDate = value => {
            if (
                value === undefined ||
                value === null ||
                value === ''
            ) {
                return '';
            }

            // Preserve YYYY-MM-DD strings without timezone shifts.
            if (
                typeof value === 'string' &&
                /^\d{4}-\d{2}-\d{2}$/.test(value)
            ) {
                const date = new Date(`${value}T00:00:00Z`);

                return (
                    !Number.isNaN(date.getTime()) &&
                    date.toISOString().slice(0, 10) === value
                ) ? value : '';
            }

            const date = new Date(value);

            if (Number.isNaN(date.getTime())) {
                return '';
            }

            const parts = new Intl.DateTimeFormat('en-GB', {
                timeZone: 'Asia/Dubai',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }).formatToParts(date);

            const part = name =>
                parts.find(entry => entry.type === name)?.value ?? '';

            return `${part('year')}-${part('month')}-${part('day')}`;
        };

        const rows = await db.collection('invoicemain')
            .find(
                {
                    Status: {
                        $regex: '^Pending$',
                        $options: 'i'
                    },
                    Customer: {
                        $regex: `^${escapeRegex(Customer.trim())}$`,
                        $options: 'i'
                    }
                },
                {
                    projection: {
                        _id: 1,
                        ID: 1,
                        Customer: 1,
                        Emirate: 1,
                        InvoiceNo: 1,
                        InvoiceDate: 1,
                        LPONo: 1,
                        GrandTotal: 1,
                        CreditDate: 1,
                        CNAmount: 1,
                        CNNumber: 1,
                        CNStatus: 1,
                        CNPaid: 1,
                        PaymentType: 1
                    }
                }
            )
            .sort({ InvoiceDate: -1, InvoiceNo: -1 })
            .toArray();

        const multiInvoice = rows.map(row => {
            const hasLegacyID =
                row.ID !== undefined &&
                row.ID !== null &&
                String(row.ID).trim() !== '';

            return {
                _id: row._id.toString(),
                ID: hasLegacyID ? row.ID : row._id.toString(),
                Customer: row.Customer,
                Emirate: row.Emirate,
                InvoiceNo: row.InvoiceNo,
                InvoiceDate: formatDate(row.InvoiceDate),
                LPONo: row.LPONo,
                CreditDate: formatDate(row.CreditDate),
                GrandTotal: row.GrandTotal,
                CNAmount: row.CNAmount,
                CNNumber: row.CNNumber,
                CNStatus: row.CNStatus,
                CNPaid: row.CNPaid,
                PaymentType: row.PaymentType
            };
        });

        return res.status(200).json({
            multiInvoice
        });

    } catch (err) {
        console.error("MongoDB multi-invoice payment fetch failed:", err);

        return res.status(500).json({
            error: err.message
        });
    }
});

// UPDATE MULTI PAYMENT
app.post('/api/update-multipayment-status', async (req, res) => {
    if (!db) {
        return res.status(500).json({
            success: false,
            error: "Database offline."
        });
    }

    let session;

    try {
        const {
            selectedItems,
            Status,
            Receiveddate,
            Mode,
            ChqNo
        } = req.body;

        const fail = (message, statusCode = 400) => {
            const error = new Error(message);
            error.statusCode = statusCode;
            throw error;
        };

        const moneyValue = (value, field) => {
            if (
                !['string', 'number'].includes(typeof value) ||
                String(value).trim() === ''
            ) {
                fail(`Missing or invalid ${field}.`);
            }

            const amount = Number(value);
            const fils = Math.round(amount * 100);

            if (
                !Number.isFinite(amount) ||
                !Number.isSafeInteger(fils)
            ) {
                fail(`Invalid monetary value for ${field}.`);
            }

            return fils / 100;
        };

        const invoiceValues = value => {
            if (
                !['string', 'number'].includes(typeof value) ||
                String(value).trim() === '' ||
                (
                    typeof value === 'number' &&
                    !Number.isSafeInteger(value)
                )
            ) {
                fail("A valid InvoiceNo is required for every item.");
            }

            const text = String(value)
                .replace(/<[^>]*>/g, '')
                .trim();

            if (!text) {
                fail("InvoiceNo cannot be empty.");
            }

            const values = [text];
            const numericValue = Number(text);

            if (Number.isSafeInteger(numericValue)) {
                values.push(numericValue);
            }

            return { text, values };
        };

        if (!Array.isArray(selectedItems) || selectedItems.length === 0) {
            fail("No invoice IDs provided.");
        }

        if (typeof Status !== 'string' || !Status.trim()) {
            fail("Status is required.");
        }

        if (typeof Mode !== 'string' || !Mode.trim()) {
            fail("Payment mode is required.");
        }

        if (
            typeof Receiveddate !== 'string' ||
            !/^\d{4}-\d{2}-\d{2}$/.test(Receiveddate)
        ) {
            fail("Receiveddate must be in YYYY-MM-DD format.");
        }

        const paymentDate = new Date(`${Receiveddate}T00:00:00Z`);

        if (
            Number.isNaN(paymentDate.getTime()) ||
            paymentDate.toISOString().slice(0, 10) !== Receiveddate
        ) {
            fail("Invalid Receiveddate.");
        }

        if (
            ChqNo !== undefined &&
            ChqNo !== null &&
            !['string', 'number'].includes(typeof ChqNo)
        ) {
            fail("Invalid cheque reference.");
        }

        const preparedItems = selectedItems.map((item, index) => {
            if (!item || typeof item !== 'object') {
                fail(`Invalid selected item at position ${index + 1}.`);
            }

            const reference = invoiceValues(item.InvoiceNo);
            const received = moneyValue(
                item.Received,
                `Received for invoice ${reference.text}`
            );

            if (received < 0) {
                fail("Received amount cannot be negative.");
            }

            return {
                invoiceNo: reference.text,
                values: reference.values,
                received
            };
        });

        const invoicesCollection = db.collection('invoicemain');

        // Use the exact collection name used by your credit-note APIs.
        const creditNotesCollection = db.collection('creditnotemain');

        session = db.client.startSession();

        await session.withTransaction(async () => {
            // Reset on every automatic transaction retry.
            const processedInvoiceIds = new Set();

            for (const item of preparedItems) {
                const invoiceMatches = await invoicesCollection
                    .find(
                        {
                            InvoiceNo: { $in: item.values }
                        },
                        { session }
                    )
                    .limit(2)
                    .toArray();

                if (invoiceMatches.length === 0) {
                    fail(
                        `Invoice "${item.invoiceNo}" not found.`,
                        404
                    );
                }

                if (invoiceMatches.length > 1) {
                    fail(
                        `Multiple invoices match InvoiceNo "${item.invoiceNo}".`,
                        409
                    );
                }

                const invoice = invoiceMatches[0];
                const documentId = String(invoice._id);

                if (processedInvoiceIds.has(documentId)) {
                    fail(
                        `Invoice "${item.invoiceNo}" was selected more than once.`
                    );
                }

                processedInvoiceIds.add(documentId);

                const updateFields = {
                    Status: Status.trim(),
                    Mode: Mode.trim(),
                    Receiveddate,
                    ChqNo: String(ChqNo ?? '').trim() || null,

                    // Preserve the original SQL settlement behavior.
                    Received: item.received,
                    Balance: 0
                };

                const hasUnpaidCredit =
                    String(invoice.CNStatus ?? '')
                        .trim()
                        .toLowerCase() === 'credit';

                if (hasUnpaidCredit) {
                    updateFields.CNPaid = moneyValue(
                        invoice.CNAmount ?? 0,
                        `CNAmount for invoice ${item.invoiceNo}`
                    );
                    updateFields.CNStatus = 'Paid';
                    updateFields.PaymentType = 'Invoice';
                }

                await invoicesCollection.updateOne(
                    { _id: invoice._id },
                    {
                        $set: updateFields
                    },
                    { session }
                );

                // Match the SQL behavior: settle every corresponding
                // credit note whose current status is Credit.
                const creditNotes = await creditNotesCollection
                    .find(
                        {
                            InvoiceNo: { $in: item.values },
                            Status: {
                                $regex: '^Credit$',
                                $options: 'i'
                            }
                        },
                        { session }
                    )
                    .toArray();

                for (const creditNote of creditNotes) {
                    await creditNotesCollection.updateOne(
                        { _id: creditNote._id },
                        {
                            $set: {
                                Status: 'Paid',
                                PaidInvNumber: invoice.InvoiceNo,
                                PaidInvDate: Receiveddate,
                                PaymentType: 'Against Invoice',
                                Paid: moneyValue(
                                    creditNote.GrandTotal ?? 0,
                                    `Credit note ${creditNote.CNNumber} GrandTotal`
                                ),
                                Balance: 0
                            }
                        },
                        { session }
                    );
                }
            }
        }, {
            readConcern: { level: 'snapshot' },
            writeConcern: { w: 'majority' },
            readPreference: 'primary'
        });

        const invoiceListString = preparedItems
            .map(item => item.invoiceNo)
            .join(', ');

        return res.status(200).json({
            success: true,
            message:
                `Payment of Invoices - ${invoiceListString} - successfully updated.`
        });

    } catch (err) {
        console.error("MongoDB multi-payment update failed:", err);

        return res.status(err.statusCode || 500).json({
            success: false,
            message: err.message
        });

    } finally {
        if (session) {
            await session.endSession();
        }
    }
});

// SAVE PAYMENT SINGLE
app.post('/api/receive-payment', async (req, res) => {
    if (!db) {
        return res.status(500).json({
            success: false,
            error: "Database offline."
        });
    }

    let session;

    try {
        const {
            InvoiceNo,
            AmountPaid,
            Mode,
            Receiveddate,
            ChqNo
        } = req.body;

        const fail = (message, statusCode = 400) => {
            const error = new Error(message);
            error.statusCode = statusCode;
            throw error;
        };

        if (
            !['string', 'number'].includes(typeof InvoiceNo) ||
            (
                typeof InvoiceNo === 'number' &&
                !Number.isSafeInteger(InvoiceNo)
            )
        ) {
            fail("A valid InvoiceNo is required.");
        }

        const sanitizedInvoiceNo = String(InvoiceNo)
            .replace(/<[^>]*>/g, '')
            .trim();

        if (!sanitizedInvoiceNo) {
            fail("InvoiceNo is required.");
        }

        if (
            !['string', 'number'].includes(typeof AmountPaid) ||
            String(AmountPaid).trim() === ''
        ) {
            fail("AmountPaid is required.");
        }

        // Calculate monetary values in fils to avoid floating-point drift.
        const toFils = (value, field) => {
            const amount = Number(value);

            if (!Number.isFinite(amount)) {
                fail(`Invalid ${field}.`);
            }

            const fils = Math.round(amount * 100);

            if (!Number.isSafeInteger(fils)) {
                fail(`${field} exceeds the supported range.`);
            }

            return fils;
        };

        const paymentFils = toFils(AmountPaid, 'AmountPaid');

        if (paymentFils <= 0) {
            fail("AmountPaid must be at least AED 0.01.");
        }

        if (typeof Mode !== 'string' || !Mode.trim()) {
            fail("Payment mode is required.");
        }

        const paymentMode = Mode.trim();

        // Preserve the existing YYYY-MM-DD date storage.
        if (
            typeof Receiveddate !== 'string' ||
            !/^\d{4}-\d{2}-\d{2}$/.test(Receiveddate)
        ) {
            fail("Receiveddate must be in YYYY-MM-DD format.");
        }

        const paymentDate = new Date(`${Receiveddate}T00:00:00Z`);

        if (
            Number.isNaN(paymentDate.getTime()) ||
            paymentDate.toISOString().slice(0, 10) !== Receiveddate
        ) {
            fail("Invalid Receiveddate.");
        }

        if (
            ChqNo !== undefined &&
            ChqNo !== null &&
            !['string', 'number'].includes(typeof ChqNo)
        ) {
            fail("Invalid cheque reference.");
        }

        const invoiceValues = [sanitizedInvoiceNo];
        const numericInvoiceNo = Number(sanitizedInvoiceNo);

        if (Number.isSafeInteger(numericInvoiceNo)) {
            invoiceValues.push(numericInvoiceNo);
        }

        session = db.client.startSession();

        let newlyCalculatedBalance;
        let evaluatedStatus;

        await session.withTransaction(async () => {
            const invoiceData = await db.collection('invoicemain')
                .findOne(
                    {
                        InvoiceNo: { $in: invoiceValues }
                    },
                    { session }
                );

            if (!invoiceData) {
                fail(
                    `Invoice Number "${sanitizedInvoiceNo}" not found inside database registry.`,
                    404
                );
            }

            const oldReceivedFils = toFils(
                invoiceData.Received ?? 0,
                'database Received'
            );

            const grandTotalFils = toFils(
                invoiceData.GrandTotal ?? 0,
                'database GrandTotal'
            );

            const newReceivedFils = oldReceivedFils + paymentFils;
            const newBalanceFils = grandTotalFils - newReceivedFils;

            if (
                !Number.isSafeInteger(newReceivedFils) ||
                !Number.isSafeInteger(newBalanceFils)
            ) {
                fail("Calculated payment exceeds the supported range.");
            }

            if (paymentMode.toUpperCase() === 'PDC') {
                evaluatedStatus = 'PDC';
            } else if (newBalanceFils <= 0) {
                evaluatedStatus = 'Paid';
            } else if (newReceivedFils > 0) {
                evaluatedStatus = 'Adv.Paid';
            } else {
                evaluatedStatus = 'Pending';
            }

            newlyCalculatedBalance = newBalanceFils / 100;

            await db.collection('invoicemain').updateOne(
                { _id: invoiceData._id },
                {
                    $set: {
                        Received: newReceivedFils / 100,
                        Balance: newlyCalculatedBalance,
                        Status: evaluatedStatus,
                        Mode: paymentMode.toUpperCase() === 'PDC'
                            ? 'PDC'
                            : paymentMode,
                        Receiveddate,
                        ChqNo: String(ChqNo ?? '').trim() || null
                    }
                },
                { session }
            );

        }, {
            readConcern: { level: 'snapshot' },
            writeConcern: { w: 'majority' },
            readPreference: 'primary'
        });

        console.log(
            `[TRANSACTION SUCCESS] Invoice ${sanitizedInvoiceNo} ` +
            `status allocated as: ${evaluatedStatus}`
        );

        return res.status(200).json({
            success: true,
            newBalance: newlyCalculatedBalance
        });

    } catch (err) {
        console.error("MongoDB payment update failed:", err);

        return res.status(err.statusCode || 500).json({
            success: false,
            error: err.message
        });

    } finally {
        if (session) {
            await session.endSession();
        }
    }
});

// UPDATE PDC STATUS
app.post('/api/update-pdc-status', async (req, res) => {
    try {
        if (!db) {
            return res.status(500).json({
                success: false,
                error: "Database offline."
            });
        }

        const { invoiceIds, status } = req.body;

        if (!Array.isArray(invoiceIds) || invoiceIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: "No invoice IDs provided."
            });
        }

        if (
            typeof status !== 'string' ||
            status.trim() === ''
        ) {
            return res.status(400).json({
                success: false,
                error: "Status is required."
            });
        }

        const invoiceNumbers = [];

        for (const id of invoiceIds) {
            if (
                !['string', 'number'].includes(typeof id) ||
                String(id).trim() === '' ||
                (typeof id === 'number' && !Number.isSafeInteger(id))
            ) {
                return res.status(400).json({
                    success: false,
                    error: "Invalid invoice number provided."
                });
            }

            const stringValue = String(id).trim();
            invoiceNumbers.push(stringValue);

            const numericValue = Number(stringValue);

            if (Number.isSafeInteger(numericValue)) {
                invoiceNumbers.push(numericValue);
            }
        }

        await db.collection('invoicemain').updateMany(
            {
                InvoiceNo: {
                    $in: [...new Set(invoiceNumbers)]
                }
            },
            {
                $set: {
                    Status: status.trim()
                }
            }
        );

        return res.status(200).json({
            success: true
        });

    } catch (err) {
        console.error("MongoDB PDC status update failed:", err);

        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

// SAVE NEW INVOICE
app.post('/api/save-newinvoice', async (req, res) => {
    if (!db) {
        return res.status(500).json({
            success: false,
            error: "Database engine offline."
        });
    }

    let session;

    try {
        const { main, items, sourceCO } = req.body;

        const fail = (message, statusCode = 400) => {
            const error = new Error(message);
            error.statusCode = statusCode;
            throw error;
        };

        const numberValue = (value, field, integer = false) => {
            if (
                !['string', 'number'].includes(typeof value) ||
                String(value).trim() === ''
            ) {
                fail(`Missing or invalid ${field}.`);
            }

            const number = Number(value);

            if (
                !Number.isFinite(number) ||
                (integer && !Number.isSafeInteger(number))
            ) {
                fail(`Invalid numeric value for ${field}.`);
            }

            return number;
        };

        // Support both legacy products.ID and MongoDB products._id.
        const productFilter = pid => {
            const value = String(pid ?? '').trim();

            if (!value) {
                fail("Product PID is required.");
            }

            const legacyValues = [value];
            const numericID = Number(value);

            if (Number.isSafeInteger(numericID)) {
                legacyValues.push(numericID);
            }

            const conditions = [
                { ID: { $in: legacyValues } }
            ];

            if (/^[a-fA-F0-9]{24}$/.test(value)) {
                conditions.push({
                    _id: new ObjectId(value)
                });
            }

            return { $or: conditions };
        };

        if (!main || !Array.isArray(items) || items.length === 0) {
            fail("main and a non-empty items array are required.");
        }

        const masterFields = {
            Customer: main.Customer ?? '',
            PostBox: main.PostBox ?? '',
            Emirate: main.Emirate ?? '',
            Address: main.Address ?? '',
            VatID: main.VatID ?? '',
            InvoiceDate: main.InvoiceDate ?? null,
            LPONo: main.LPONo ?? '',
            CONo: main.CONo ?? '',
            Description: main.Description ?? '',
            PaymentTerms: main.PaymentTerms ?? '',
            DeliveryDate: main.DeliveryDate ?? null,
            CustContact: main.CustContact ?? '',
            CustConNumber: main.CustConNumber ?? '',
            ProjectName: main.ProjectName ?? '',
            OurContact: main.OurContact ?? '',
            OurNumber: main.OurNumber ?? '',

            SubTotal: numberValue(main.SubTotal, 'SubTotal'),
            VatTotal: numberValue(main.VatTotal, 'VatTotal'),
            GrandTotal: numberValue(main.GrandTotal, 'GrandTotal'),
            Received: 0,
            Balance: numberValue(main.GrandTotal, 'Balance'),
            InvCost: numberValue(main.InvCost, 'InvCost'),
            InvMargin: numberValue(main.InvMargin, 'InvMargin'),

            Status: 'Pending',
            InWords: main.InWords ?? '',
            VatNo: '104652045600003'
        };

        // Generate stable item IDs before transaction retries.
        // Frontend stock and tcost are intentionally not used.
        const preparedItems = items.map((item, index) => {
            const quantity = numberValue(
                item.Quantity,
                `items[${index}].Quantity`,
                true
            );

            if (quantity <= 0) {
                fail(
                    `Quantity must be greater than zero for item ${index + 1}.`
                );
            }

            const cnQty = item.CNQty === undefined ? quantity : numberValue(item.CNQty, `items[${index}].CNQty`, true);
            if (cnQty !== quantity) fail(`CNQty must equal the actual quantity for new invoice item ${index + 1}.`);

            return {
                filter: productFilter(item.PID),
                source: {SrNo:item.SourceCOSrNo, ID:String(item.SourceCOItemID??''), PID:String(item.PID??'')},

                line: {
                    _id: new ObjectId(),
                    SrNo: numberValue(item.SrNo, 'SrNo', true),
                    Item: item.Item ?? '',
                    Quantity: quantity,
                    CNQty: cnQty,
                    IUnit: item.Iunit ?? item.IUnit ?? '',
                    IRAL: item.IRAL ?? '',
                    ISize: item.Isize ?? item.ISize ?? '',
                    UnitPrice: numberValue(item.UnitPrice, 'UnitPrice'),
                    Discount: numberValue(item.Discount, 'Discount'),
                    VatPer: numberValue(item.VatPer, 'VatPer'),
                    Taxable: numberValue(item.Taxable, 'Taxable'),
                    VatTotal: numberValue(item.VatTotal, 'VatTotal'),
                    UnitTotal: numberValue(item.UnitTotal, 'UnitTotal'),
                    Icost: numberValue(item.Icost, 'Icost'),
                    Ucost: numberValue(item.Ucost, 'Ucost'),
                    Umargin: numberValue(item.Umargin, 'Umargin'),
                    Status: 'Delivered'
                }
            };
        });

        const serialNumbers = preparedItems.map(item => item.line.SrNo);

        if (new Set(serialNumbers).size !== serialNumbers.length) {
            fail("Each invoice item must have a unique SrNo.");
        }

        const invoicesCollection = db.collection('invoicemain');
        const productsCollection = db.collection('products');
        const counters = db.collection('counters');

        // Ensure the shared invoice-save lock document exists.
        try {
            await counters.updateOne(
                { _id: 'invoice_number' },
                {
                    $setOnInsert: {
                        lockVersion: 0
                    }
                },
                { upsert: true }
            );
        } catch (error) {
            // Another request may have created it simultaneously.
            if (error.code !== 11000) {
                throw error;
            }
        }

        session = db.client.startSession();

        let allocatedInvNumber;

        await session.withTransaction(async () => {
            // Acquire the shared lock before allocating the invoice number.
            const lockResult = await counters.updateOne(
                { _id: 'invoice_number' },
                {
                    $inc: {
                        lockVersion: 1
                    }
                },
                { session }
            );

            if (lockResult.matchedCount !== 1) {
                fail("Invoice numbering lock is unavailable.", 409);
            }

            // A source token makes retries of this CO invoice idempotent under the invoice lock.
            let sourceOrder=null;
            if(sourceCO){
                if(typeof sourceCO.CONo!=='string'&&typeof sourceCO.CONo!=='number')fail('Invalid source CO number.');
                if(typeof sourceCO.requestId!=='string'||!sourceCO.requestId.trim()||sourceCO.requestId.length>160)fail('A source CO request ID is required.');
                const previous=await invoicesCollection.findOne({SourceCORequestId:sourceCO.requestId},{session});
                if(previous){
                    if(String(previous.SourceCONo)!==String(sourceCO.CONo))fail('Source request ID belongs to another CO.',409);
                    allocatedInvNumber=previous.InvoiceNo;return;
                }
                const key=String(sourceCO.CONo).trim(),keys=[key];if(Number.isSafeInteger(Number(key)))keys.push(Number(key));
                sourceOrder=await db.collection('cordermain').findOne({CONo:{$in:keys}},{session});
                if(!sourceOrder||!Array.isArray(sourceOrder.corderlist))fail('Source Customer Order not found.',404);
                // Work on copies: transaction retries must always start from freshly read quantities.
                const coLines=sourceOrder.corderlist.map(row=>({...row}));let linked=0;
                for(const prepared of preparedItems){
                    const ref=prepared.source;if(ref.SrNo===undefined&& !ref.ID)continue;
                    const matches=coLines.filter(row=>ref.ID?String(row.ID??row._id??'')===ref.ID:Number(row.SrNo)===Number(ref.SrNo));
                    if(matches.length!==1)fail('Cannot uniquely identify source CO item.',409);
                    const row=matches[0],ordered=numberValue(row.Quantity,'CO Order Qty',true),delivered=numberValue(row.DQuantity??0,'CO Deliver Qty',true);
                    if(String(row.PID)!==ref.PID)fail('Invoice product does not match source CO item.',409);
                    if(ordered<=0||delivered<0||delivered>ordered)fail('Invalid source CO quantities.',409);
                    if(!['pending','partial'].includes(String(row.Status??'').trim().toLowerCase()))fail('Source CO item is no longer pending.',409);
                    if(prepared.line.Quantity>ordered-delivered)fail('Invoice quantity exceeds the current pending CO quantity. Reopen Create Invoice.',409);
                    row.DQuantity=delivered+prepared.line.Quantity;row.PQuantity=ordered-row.DQuantity;linked++;
                    prepared.line.SourceCONo=sourceOrder.CONo;prepared.line.SourceCOSrNo=row.SrNo;
                    prepared.line.SourceCOItemID=String(row.ID??row._id??'');
                }
                if(!linked)fail('At least one pending CO item is required.');
                const round=value=>Math.round((value+Number.EPSILON)*100)/100;
                const pending=[],deliveredTotals=[];
                for(const row of coLines){
                    const qty=numberValue(row.Quantity,'CO Quantity',true),dqty=numberValue(row.DQuantity??0,'CO DQuantity',true);
                    const net=numberValue(row.UnitPrice,'CO UnitPrice')*(1-numberValue(row.Discount??0,'CO Discount')/100),vat=numberValue(row.VatPer??0,'CO VAT');
                    row.PQuantity=qty-dqty;row.Status=dqty===0?'Pending':dqty===qty?'Delivered':'Partial';
                    row.Taxable=round(net*qty);row.VatTotal=round(row.Taxable*vat/100);row.UnitTotal=round(row.Taxable+row.VatTotal);
                    row.DTotal=round(net*dqty);row.PTotal=round(row.Taxable-row.DTotal);
                    const dv=round(row.DTotal*vat/100),pv=round(row.VatTotal-dv);
                    pending.push({tax:row.PTotal,vat:pv,total:round(row.PTotal+pv)});deliveredTotals.push({tax:row.DTotal,vat:dv,total:round(row.DTotal+dv)});
                }
                const sum=(rows,key)=>round(rows.reduce((total,row)=>total+row[key],0));
                const Status=coLines.every(row=>row.Status==='Delivered')?'Delivered':coLines.every(row=>row.Status==='Pending')?'Pending':'Partial';
                await db.collection('cordermain').updateOne({_id:sourceOrder._id},{$set:{corderlist:coLines,Status,
                    SubTotal:sum(coLines,'Taxable'),VatTotal:sum(coLines,'VatTotal'),GrandTotal:sum(coLines,'UnitTotal'),
                    PendingTotal:sum(pending,'tax'),VatPending:sum(pending,'vat'),TotalPending:sum(pending,'total'),
                    DeliveredTotal:sum(deliveredTotals,'tax'),VatDeliver:sum(deliveredTotals,'vat'),TotalDeliver:sum(deliveredTotals,'total')}},{session});
            }

            // Find the highest existing invoice number.
            // Gaps are never filled.
            const [maximum] = await invoicesCollection.aggregate([
                {
                    $group: {
                        _id: null,
                        maxNumber: {
                            $max: {
                                $convert: {
                                    input: '$InvoiceNo',
                                    to: 'double',
                                    onError: null,
                                    onNull: null
                                }
                            }
                        }
                    }
                }
            ], { session }).toArray();

            const lastInvoiceNumber = maximum?.maxNumber ?? 7000;

            if (
                !Number.isSafeInteger(lastInvoiceNumber) ||
                !Number.isSafeInteger(lastInvoiceNumber + 1)
            ) {
                fail("Invalid or unsupported invoice number.", 409);
            }

            allocatedInvNumber = lastInvoiceNumber + 1;

            const invoiceLines = [];

            // Keep operations sequential inside the transaction.
            for (const prepared of preparedItems) {
                const matches = await productsCollection
                    .find(prepared.filter, { session })
                    .limit(2)
                    .toArray();

                if (matches.length === 0) {
                    fail(
                        `Product not found for item SrNo ${prepared.line.SrNo}.`,
                        404
                    );
                }

                if (matches.length > 1) {
                    fail(
                        `Multiple products match item SrNo ${prepared.line.SrNo}.`,
                        409
                    );
                }

                const product = matches[0];

                const currentStock = numberValue(
                    product.stock,
                    `Database stock for ${prepared.line.Item}`,
                    true
                );

                const currentCost = numberValue(
                    product.cost,
                    `Database cost for ${prepared.line.Item}`
                );

                // Save the invoice even when stock is insufficient.
                // Product stock never becomes negative.
                const remainingStock = Math.max(
                    0,
                    currentStock - prepared.line.Quantity
                );

                // Assumes product.cost is the current cost per unit.
                const remainingStockValue =
                    Math.round(remainingStock * currentCost * 100) / 100;

                if (!Number.isFinite(remainingStockValue)) {
                    fail(
                        `Invalid stock value for ${prepared.line.Item}.`,
                        409
                    );
                }

                await productsCollection.updateOne(
                    { _id: product._id },
                    {
                        $set: {
                            stock: remainingStock,
                            tcost: remainingStockValue
                        }
                    },
                    { session }
                );

                    const hasLegacyID =
                    product.ID !== undefined &&
                    product.ID !== null &&
                    String(product.ID).trim() !== '';

                invoiceLines.push({
                    ...prepared.line,
                    InvoiceNo: allocatedInvNumber,

                    // Old products: save legacy ID.
                    // New products: save MongoDB _id.
                    PID: hasLegacyID ? product.ID : product._id,

                    stock: remainingStock
                });
            }

            await invoicesCollection.insertOne({
                ...masterFields,
                InvoiceNo: allocatedInvNumber,
                ...(sourceCO?{SourceCONo:sourceCO.CONo,SourceCORequestId:sourceCO.requestId}:{}),
                invoices: invoiceLines
            }, { session });

        }, {
            readConcern: { level: 'snapshot' },
            writeConcern: { w: 'majority' },
            readPreference: 'primary'
        });

        // Refresh caches only after the transaction commits.
        try {
            await loadCustomersToCache();
            await loadProductsToCache();
        } catch (cacheError) {
            console.error(
                "Failed to refresh database cache:",
                cacheError
            );
        }

        return res.status(200).json({
            success: true,
            message:
                `New Invoice -${allocatedInvNumber}- and Stock Saved successfully.`,
            allocatedNumber: allocatedInvNumber
        });

    } catch (error) {
        console.error(
            "MongoDB new invoice transaction failed:",
            error
        );

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.statusCode
                ? error.message
                : "Database insertion failure. Transaction rolled back safely."
        });

    } finally {
        if (session) {
            await session.endSession();
        }
    }
});
// UPDATE INVOICE
app.post('/api/update-invoice', async (req, res) => {
    if (!db) {
        return res.status(500).json({
            success: false,
            error: "Database engine offline."
        });
    }

    let session;

    try {
        const { main, items, deletedItem } = req.body;

        const fail = (message, statusCode = 400) => {
            const error = new Error(message);
            error.statusCode = statusCode;
            throw error;
        };

        if (!main || !Array.isArray(items)) {
            fail("main and items array are required.");
        }

        // Validate numeric input instead of saving NaN.
        const numberValue = (value, field, integer = false) => {
            if (
                value === undefined ||
                value === null ||
                (typeof value === 'string' && value.trim() === '') ||
                !['string', 'number'].includes(typeof value)
            ) {
                fail(`Missing or invalid ${field}.`);
            }

            const number = Number(value);

            if (
                !Number.isFinite(number) ||
                (integer && !Number.isSafeInteger(number))
            ) {
                fail(`Invalid numeric value for ${field}.`);
            }

            return number;
        };

        // Match legacy numeric/string IDs and new ObjectId references.
        const productFilter = (pid) => {
            if (
                pid === undefined ||
                pid === null ||
                String(pid).trim() === ''
            ) {
                fail("Product PID is missing.");
            }

            const text = String(pid).trim();
            const legacyValues = [text];
            const numericID = Number(text);

            if (Number.isSafeInteger(numericID)) {
                legacyValues.push(numericID);
            }

            const conditions = [
                { ID: { $in: legacyValues } }
            ];

            if (/^[a-fA-F0-9]{24}$/.test(text)) {
                conditions.push({
                    _id: new ObjectId(text)
                });
            }

            return { $or: conditions };
        };

        const invoiceNo = String(main.invoiceNo ?? '').trim();

        if (!invoiceNo) {
            fail("InvoiceNo is required.");
        }

        const invoiceValues = [invoiceNo];
        const numericInvoiceNo = Number(invoiceNo);

        if (Number.isSafeInteger(numericInvoiceNo)) {
            invoiceValues.push(numericInvoiceNo);
        }

        const masterUpdate = {
            Customer: main.customer,
            PostBox: main.postbox,
            Emirate: main.emirate,
            Address: main.address,
            VatID: main.vatID,
            InvoiceDate: main.invoiceDate,
            LPONo: main.lpoNo,
            CONo: main.coNo,
            PaymentTerms: main.paymentTerms,
            CustContact: main.contactPerson,
            CustConNumber: main.contactNumber,
            ProjectName: main.projectName,
            DeliveryDate: main.deliveryDate,
            OurContact: main.ourContact,
            OurNumber: main.ourNumber,
            Description: main.notes,
            SubTotal: numberValue(main.subTotal, 'SubTotal'),
            VatTotal: numberValue(main.vatTotal, 'VatTotal'),
            GrandTotal: numberValue(main.grandTotal, 'GrandTotal'),
            InvCost: numberValue(main.invCost, 'InvCost'),
            InvMargin: numberValue(main.invMargin, 'InvMargin'),
            Balance: numberValue(main.Balance, 'Balance'),
            Status: main.Status || 'PENDING',
            InWords: main.inWords
        };

        // Preserve existing fields when optional inputs are omitted.
        for (const key of Object.keys(masterUpdate)) {
            if (masterUpdate[key] === undefined) {
                delete masterUpdate[key];
            }
        }

        // Prepare and validate invoice lines before starting writes.
        const lineItems = items.map((item, index) => {
            // Also validates that a usable PID was supplied.
            productFilter(item.pid);

            return {
                SrNo: numberValue(
                    item.sr_no,
                    `items[${index}].sr_no`,
                    true
                ),
                Item: item.item ?? '',
                Quantity: numberValue(item.qty, 'Quantity', true),
                IUnit: item.iunit ?? '',
                IRAL: item.iral ?? '',
                ISize: item.isize ?? '',
                UnitPrice: numberValue(item.unitprice, 'UnitPrice'),
                Discount: numberValue(item.discper, 'Discount'),
                VatPer: numberValue(item.vatper, 'VatPer'),
                Taxable: numberValue(item.taxable, 'Taxable'),
                VatTotal: numberValue(item.vattotal, 'VatTotal'),
                UnitTotal: numberValue(item.unittotal, 'UnitTotal'),

                // Keep legacy numbers or new ObjectId strings.
                PID: typeof item.pid === 'string'
                    ? item.pid.trim()
                    : item.pid,

                stock: numberValue(item.astock, 'stock', true),
                Icost: numberValue(item.icost, 'Icost'),
                Ucost: numberValue(item.ucost, 'Ucost'),
                Umargin: numberValue(item.umargin, 'Umargin'),
                Status: item.status ?? null
            };
        });

        const stockUpdates = items.map(item => ({
            pid: item.pid,
            stock: numberValue(item.astock, 'stock', true),
            cost: numberValue(item.icost, 'cost'),
            tcost: numberValue(item.svalue, 'tcost')
        }));

        // Support either one deleted item or an array of deleted items.
        const deletedItems = Array.isArray(deletedItem)
            ? deletedItem
            : deletedItem
                ? [deletedItem]
                : [];

        for (const deleted of deletedItems) {
            productFilter(deleted.SelectedPid);

            stockUpdates.push({
                pid: deleted.SelectedPid,
                stock: numberValue(
                    deleted.realStock,
                    'deletedItem.realStock',
                    true
                ),
                cost: numberValue(
                    deleted.SelectedIcost,
                    'deletedItem.SelectedIcost'
                ),
                tcost: numberValue(
                    deleted.realValue,
                    'deletedItem.realValue'
                )
            });
        }

        // db.client is the MongoClient associated with your db.
        session = db.client.startSession();

        await session.withTransaction(async () => {
            const invoice = await db.collection('invoicemain').findOne(
                { InvoiceNo: { $in: invoiceValues } },
                { session }
            );

            if (!invoice) {
                fail("Invoice not found.", 404);
            }

            // Replace the embedded lines, keeping the stored invoice number.
            await db.collection('invoicemain').updateOne(
                { _id: invoice._id },
                {
                    $set: {
                        ...masterUpdate,
                        invoices: lineItems.map(item => ({
                            ...item,
                            InvoiceNo: invoice.InvoiceNo
                        }))
                    }
                },
                { session }
            );

            // Apply the same stock/cost values as your original SQL API.
            for (const update of stockUpdates) {
                const matches = await db.collection('products')
                    .find(productFilter(update.pid), { session })
                    .limit(2)
                    .toArray();

                if (matches.length === 0) {
                    fail(`Product not found for PID: ${update.pid}`, 404);
                }

                if (matches.length > 1) {
                    fail(
                        `Multiple products match PID: ${update.pid}. ` +
                        "Check duplicate legacy IDs.",
                        409
                    );
                }

                await db.collection('products').updateOne(
                    { _id: matches[0]._id },
                    {
                        $set: {
                            stock: update.stock,
                            cost: update.cost,
                            tcost: update.tcost
                        }
                    },
                    { session }
                );
            }
        }, {
            readConcern: { level: 'snapshot' },
            writeConcern: { w: 'majority' },
            readPreference: 'primary'
        });

        // Refresh caches only after the transaction commits.
        try {
            await loadCustomersToCache();
            await loadProductsToCache();
        } catch (cacheErr) {
            console.error("Failed to refresh database cache:", cacheErr);
        }

        return res.status(200).json({
            success: true,
            message: "Invoice data transactions successfully committed."
        });

    } catch (err) {
        // withTransaction automatically aborts failed transactions.
        console.error("MongoDB Invoice Update Failed:", err);

        return res.status(err.statusCode || 500).json({
            success: false,
            error: err.message
        });

    } finally {
        if (session) {
            await session.endSession();
        }
    }
});

// SAVE NEW QUOTATION
app.post('/api/save-newquotation', async (req, res) => {
    if (!db) return res.status(500).json({ success: false, message: 'Database engine offline.' });
    let session;
    try {
        const fail = (message, statusCode = 400) => {
            const error = new Error(message);
            error.statusCode = statusCode;
            throw error;
        };
        const numeric = (value, name) => {
            if (!['number', 'string'].includes(typeof value) || String(value).trim() === '' || !Number.isFinite(Number(value))) {
                fail(`Missing or invalid ${name}.`);
            }
            return Number(value);
        };
        const money = value => {
            const rounded = Math.round((value + Number.EPSILON) * 100) / 100;
            if (!Number.isFinite(rounded) || Math.abs(rounded) > Number.MAX_SAFE_INTEGER / 100) fail('Amount exceeds supported precision.');
            return rounded;
        };
        const text = value => String(value ?? '').trim();
        const { main, items } = req.body || {};
        if (!main || typeof main !== 'object' || Array.isArray(main) || !Array.isArray(items) || !items.length) {
            fail('main and a non-empty items array are required.');
        }
        if (!text(main.Customer)) fail('Customer is required.');
        const date = text(main.QuotationDate);
        const parsedDate = new Date(date + 'T00:00:00.000Z');
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
            fail('A valid quotation date is required.');
        }
        const master = {};
        for (const name of ['Customer', 'Postbox', 'Address', 'Emirate', 'VatNo', 'Notes', 'InWords', 'Validity',
            'PaymentTerms', 'QuoteType', 'RefNo', 'CustContact', 'ContactNo', 'Subject', 'DeliveryTerms',
            'OurContact', 'OurNumber', 'ProjectName', 'CurrencyType']) master[name] = text(main[name]);
        master.QuotationDate = date;
        // Prefer the authenticated user when your login system supplies one.
        master.User_name = text(req.user?.username ?? req.user?.User_name ?? req.session?.user?.username ?? 'user');
        const prepared = items.map((item, index) => {
            if (!item || typeof item !== 'object') fail(`Invalid item ${index + 1}.`);
            const pid = text(item.PID);
            if (!pid) fail(`Product PID is required for item ${index + 1}.`);
            const legacyIDs = [pid];
            if (Number.isSafeInteger(Number(pid))) legacyIDs.push(Number(pid));
            const conditions = [{ ID: { $in: legacyIDs } }];
            if (/^[a-fA-F0-9]{24}$/.test(pid)) conditions.push({ _id: new ObjectId(pid) });
            const Quantity = numeric(item.Quantity, 'Quantity');
            const UnitPrice = numeric(item.UnitPrice, 'UnitPrice');
            const LessDiscount = numeric(item.LessDiscount, 'LessDiscount');
            const VatPer = numeric(item.VatPer, 'VatPer');
            if (Quantity <= 0 || UnitPrice <= 0) fail(`Quantity and unit price must be greater than zero for item ${index + 1}.`);
            if (LessDiscount < 0 || LessDiscount > 100 || VatPer < 0) fail(`Invalid discount or VAT for item ${index + 1}.`);
            if (!text(item.Item)) fail(`Description is required for item ${index + 1}.`);
            return {
                filter: { $or: conditions },
                line: { _id: new ObjectId(), SrNo: index + 1, Item: text(item.Item), Quantity, UnitPrice,
                    LessDiscount, VatPer, ISize: text(item.ISize), IRAL: text(item.IRAL), IUnit: text(item.IUnit) }
            };
        });
        const quotes = db.collection('quotmain');
        const products = db.collection('products');
        const counters = db.collection('counters');
        try {
            await counters.updateOne({ _id: 'quotation_number' }, { $setOnInsert: { lockVersion: 0 } }, { upsert: true });
        } catch (error) { if (error.code !== 11000) throw error; }
        session = db.client.startSession();
        let allocatedNumber;
        let savedTotals;
        await session.withTransaction(async () => {
            const lock = await counters.updateOne({ _id: 'quotation_number' }, { $inc: { lockVersion: 1 } }, { session });
            if (lock.matchedCount !== 1) fail('Quotation numbering lock is unavailable.', 409);
            const [maximum] = await quotes.aggregate([
                { $group: { _id: null, maxNumber: { $max: { $convert: {
                    input: '$QuotationNo', to: 'double', onError: null, onNull: null
                } } } } }
            ], { session }).toArray();
            const last = maximum?.maxNumber ?? 0;
            if (!Number.isSafeInteger(last) || !Number.isSafeInteger(last + 1)) fail('Invalid quotation number.', 409);
            allocatedNumber = last + 1;
            const lines = [];
            for (const preparedItem of prepared) {
                const matches = await products.find(preparedItem.filter, { session }).limit(2).toArray();
                if (!matches.length) fail(`Product not found for item ${preparedItem.line.SrNo}.`, 404);
                if (matches.length > 1) fail(`Multiple products match item ${preparedItem.line.SrNo}.`, 409);
                const product = matches[0];
                const line = preparedItem.line;
                const Icost = numeric(product.cost, `Database cost for ${line.Item}`);
                const openStock = numeric(product.stock, `Database stock for ${line.Item}`);
                if (Icost < 0) fail(`Invalid database cost for ${line.Item}.`, 409);
                const UnitTaxable = money(line.Quantity * line.UnitPrice * (1 - line.LessDiscount / 100));
                const VatTotal = money(UnitTaxable * line.VatPer / 100);
                const Ucost = money(Icost * line.Quantity);
                const hasLegacyID = product.ID !== undefined && product.ID !== null && text(product.ID) !== '';
                lines.push({ ...line, QNumber: allocatedNumber,
                    PID: hasLegacyID ? product.ID : product._id,
                    UnitTaxable, VatTotal, TotalPrice: money(UnitTaxable + VatTotal),
                    Stock: Math.max(0, openStock - line.Quantity), Icost, Ucost, Umargin: money(UnitTaxable - Ucost) });
            }
            const sum = name => money(lines.reduce((total, line) => total + line[name], 0));
            savedTotals = { SubTotal: sum('UnitTaxable'), VatTotal: sum('VatTotal'), GrandTotal: sum('TotalPrice'),
                InvCost: sum('Ucost'), InvMargin: sum('Umargin') };
            await quotes.insertOne({ ...master, ...savedTotals, QuotationNo: allocatedNumber, quotations: lines }, { session });
        }, { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' }, readPreference: 'primary' });
        return res.status(200).json({ success: true, allocatedNumber, totals: savedTotals,
            message: `Quotation ${allocatedNumber} saved successfully.` });
    } catch (error) {
        console.error('MongoDB new quotation transaction failed:', error);
        return res.status(error.statusCode || 500).json({ success: false,
            message: error.statusCode ? error.message : 'Quotation save failed. Transaction rolled back safely.' });
    } finally {
        if (session) await session.endSession();
    }
});
// UPDATE QUOTATION
app.post('/api/update-quotation', async (req, res) => {
    if (!db) return res.status(500).json({ success: false, error: 'Database engine offline.' });
    let session;
    try {
        const fail = (message, statusCode = 400) => { const error = new Error(message); error.statusCode = statusCode; throw error; };
        const text = value => String(value ?? '').trim();
        const numeric = (value, name) => {
            if (!['number', 'string'].includes(typeof value) || text(value) === '' || !Number.isFinite(Number(value))) fail(`Missing or invalid ${name}.`);
            return Number(value);
        };
        const money = value => {
            const result = Math.round((value + Number.EPSILON) * 100) / 100;
            if (!Number.isFinite(result) || Math.abs(result) > Number.MAX_SAFE_INTEGER / 100) fail('Amount exceeds supported precision.');
            return result;
        };
        const { main, items } = req.body || {};
        if (!main || typeof main !== 'object' || Array.isArray(main) || !Array.isArray(items) || !items.length) fail('main and a non-empty items array are required.');
        const key = text(main.QuotationNo);
        if (!key) fail('QuotationNo is required.');
        const quoteNumbers = [key];
        if (Number.isSafeInteger(Number(key))) quoteNumbers.push(Number(key));
        if (!text(main.Customer)) fail('Customer is required.');
        const date = text(main.QuotationDate);
        const parsed = new Date(date + 'T00:00:00.000Z');
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) fail('A valid quotation date is required.');
        const masterUpdate = { QuotationDate: date };
        for (const name of ['Customer', 'Postbox', 'Address', 'Emirate', 'VatNo', 'Notes', 'InWords', 'Validity', 'PaymentTerms',
            'QuoteType', 'RefNo', 'CustContact', 'ContactNo', 'Subject', 'DeliveryTerms', 'OurContact', 'OurNumber', 'ProjectName', 'CurrencyType']) {
            if (main[name] !== undefined) masterUpdate[name] = text(main[name]);
        }
        const prepared = items.map((item, index) => {
            if (!item || typeof item !== 'object') fail(`Invalid item ${index + 1}.`);
            const Quantity = numeric(item.Quantity, 'Quantity');
            const UnitPrice = numeric(item.UnitPrice, 'UnitPrice');
            const LessDiscount = numeric(item.LessDiscount, 'LessDiscount');
            const VatPer = numeric(item.VatPer, 'VatPer');
            const Icost = numeric(item.Icost, 'Icost');
            const Stock = numeric(item.Stock, 'Stock');
            if (Quantity <= 0 || UnitPrice <= 0 || Icost < 0 || Stock < 0 || LessDiscount < 0 || LessDiscount > 100 || VatPer < 0) fail(`Invalid quantity, price, discount, VAT, cost or stock for item ${index + 1}.`);
            if (!text(item.PID) || !text(item.Item)) fail(`Product and PID are required for item ${index + 1}.`);
            const UnitTaxable = money(Quantity * UnitPrice * (1 - LessDiscount / 100));
            const VatTotal = money(UnitTaxable * VatPer / 100);
            const Ucost = money(Icost * Quantity);
            return { identity: text(item.ID), line: { SrNo: index + 1, Item: text(item.Item), Quantity, UnitPrice, LessDiscount, VatPer,
                ISize: text(item.ISize), IRAL: text(item.IRAL), IUnit: text(item.IUnit), PID: item.PID,
                Stock, Icost, Ucost, Umargin: money(UnitTaxable - Ucost), UnitTaxable, VatTotal, TotalPrice: money(UnitTaxable + VatTotal) } };
        });
        const identities = prepared.filter(item => item.identity).map(item => item.identity);
        if (new Set(identities).size !== identities.length) fail('Each quotation item must have a unique ID.');
        const collection = db.collection('quotmain');
        session = db.client.startSession();
        let quotationNo;
        let totals;
        await session.withTransaction(async () => {
            const quote = await collection.findOne({ QuotationNo: { $in: quoteNumbers } }, { session });
            if (!quote) fail('Quotation not found.', 404);
            if (!Array.isArray(quote.quotations)) fail('Stored quotation items are invalid.', 409);
            quotationNo = quote.QuotationNo;
            const lines = prepared.map(preparedItem => {
                const matches = preparedItem.identity ? quote.quotations.filter(line => (text(line.ID) || text(line._id)) === preparedItem.identity) : [];
                if (preparedItem.identity && matches.length !== 1) fail(`Cannot uniquely identify quotation item ${preparedItem.identity}. Reload the quotation.`, 409);
                const previous = matches[0];
                const line = { ...(previous || { _id: new ObjectId() }), ...preparedItem.line, QNumber: quote.QuotationNo };
                // Keep the exact legacy ID/ObjectId representation for unchanged product references.
                if (previous && text(previous.PID) === text(line.PID)) line.PID = previous.PID;
                return line;
            });
            const sum = name => money(lines.reduce((total, line) => total + line[name], 0));
            totals = { SubTotal: sum('UnitTaxable'), VatTotal: sum('VatTotal'), GrandTotal: sum('TotalPrice'), InvCost: sum('Ucost'), InvMargin: sum('Umargin') };
            const result = await collection.updateOne({ _id: quote._id }, { $set: { ...masterUpdate, ...totals, quotations: lines } }, { session });
            if (result.matchedCount !== 1) fail('Quotation update failed.', 409);
        }, { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' }, readPreference: 'primary' });
        return res.status(200).json({ success: true, quotationNo, totals, message: 'Quotation updated successfully.' });
    } catch (error) {
        console.error('MongoDB quotation update failed:', error);
        return res.status(error.statusCode || 500).json({ success: false, error: error.message });
    } finally {
        if (session) await session.endSession();
    }
});

// SAVE NEW DELIVERY ORDER
app.post('/api/save-delivery-order', async (req, res) => {
    if (!db) {
        return res.status(500).json({
            success: false,
            error: "Database engine offline."
        });
    }

    let session;

    try {
        const { main, items } = req.body;

        const fail = (message, statusCode = 400) => {
            const error = new Error(message);
            error.statusCode = statusCode;
            throw error;
        };

        const integerValue = (value, field) => {
            if (
                !['string', 'number'].includes(typeof value) ||
                String(value).trim() === ''
            ) {
                fail(`Missing or invalid ${field}.`);
            }

            const number = Number(value);

            if (!Number.isSafeInteger(number)) {
                fail(`Invalid integer value for ${field}.`);
            }

            return number;
        };

        if (!main || !Array.isArray(items) || items.length === 0) {
            fail("main and a non-empty items array are required.");
        }

        const invoiceNo = String(main.InvoiceNo ?? '').trim();

        if (!invoiceNo) {
            fail("InvoiceNo is required.");
        }

        const invoiceValues = [invoiceNo];
        const numericInvoiceNo = Number(invoiceNo);

        if (Number.isSafeInteger(numericInvoiceNo)) {
            invoiceValues.push(numericInvoiceNo);
        }

        const lineItems = items.map((item, index) => {
            const quantity = integerValue(
                item.Quantity,
                `items[${index}].Quantity`
            );

            if (quantity <= 0) {
                fail(`Quantity must be greater than zero for item ${index + 1}.`);
            }

            return {
                SrNo: integerValue(item.SrNo, `items[${index}].SrNo`),
                Item: item.Item ?? '',
                Quantity: quantity,

                // Supports your original frontend field names
                // and the field names returned by the invoice API.
                IUnit: item.Iunit ?? item.IUnit ?? '',
                IRAL: item.IRAL ?? '',
                ISize: item.Isize ?? item.ISize ?? ''
            };
        });

        const orders = db.collection('ordermain');
        const counters = db.collection('counters');

        // Initialize the counter from existing migrated delivery orders.
        const [maximum] = await orders.aggregate([
            {
                $group: {
                    _id: null,
                    maxNumber: {
                        $max: {
                            $convert: {
                                input: '$DONo',
                                to: 'double',
                                onError: null,
                                onNull: null
                            }
                        }
                    }
                }
            }
        ]).toArray();

        const highestNumber = maximum?.maxNumber ?? 7000;

        if (!Number.isSafeInteger(highestNumber)) {
            fail("Existing DONo is not a valid integer.", 409);
        }

        const seed = Math.max(7000, highestNumber);

        try {
            await counters.updateOne(
                { _id: 'delivery_order_number' },
                { $max: { sequence: seed } },
                { upsert: true }
            );
        } catch (error) {
            // Handle simultaneous first-time counter creation.
            if (error.code !== 11000) {
                throw error;
            }

            await counters.updateOne(
                { _id: 'delivery_order_number' },
                { $max: { sequence: seed } }
            );
        }

        session = db.client.startSession();

        let allocatedDONumber;

        await session.withTransaction(async () => {
            const invoice = await db.collection('invoicemain').findOne(
                { InvoiceNo: { $in: invoiceValues } },
                {
                    session,
                    projection: { _id: 1, InvoiceNo: 1 }
                }
            );

            if (!invoice) {
                fail("Invoice not found.", 404);
            }

            // Allocate a number safely for concurrent requests.
            await counters.updateOne(
                { _id: 'delivery_order_number' },
                { $inc: { sequence: 1 } },
                { session }
            );

            const counter = await counters.findOne(
                { _id: 'delivery_order_number' },
                { session }
            );

            allocatedDONumber = counter.sequence;

            if (!Number.isSafeInteger(allocatedDONumber)) {
                fail("Delivery order number exceeds the supported range.", 409);
            }

            await orders.insertOne({
                InvoiceNo: invoice.InvoiceNo,
                DONo: allocatedDONumber,
                Customer: main.Customer ?? '',
                PostBox: main.PostBox ?? '',
                Emirate: main.Emirate ?? '',
                Address: main.Address ?? '',
                VatID: main.VatID ?? '',
                DODate: main.DODate ?? null,
                LPONo: main.LPONo ?? '',
                Description: main.Description ?? '',
                PaymentTerms: main.PaymentTerms ?? '',
                DeliveryDate: main.DeliveryDate ?? null,
                CustContact: main.CustContact ?? '',
                CustConNumber: main.CustConNumber ?? '',
                DeliveryPlace: main.DeliveryPlace ?? '',
                OurContact: main.OurContact ?? '',
                OurNumber: main.OurNumber ?? '',
                User_name: 'user',

                deliveryorder: lineItems.map(item => ({
                    ...item,
                    DONo: allocatedDONumber
                }))
            }, { session });

        }, {
            readConcern: { level: 'snapshot' },
            writeConcern: { w: 'majority' },
            readPreference: 'primary'
        });

        return res.status(200).json({
            success: true,
            message:
                `New Delivery Order -${allocatedDONumber}- Saved successfully.`,
            allocatedNumber: allocatedDONumber
        });

    } catch (error) {
        console.error("MongoDB delivery order save failed:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.statusCode
                ? error.message
                : "Database insertion failure. Transaction rolled back safely."
        });

    } finally {
        if (session) {
            await session.endSession();
        }
    }
});

// SAVE NEW CO
app.post('/api/save-newco', async (req, res) => {
    if (!db) return res.status(500).json({success:false,message:'Database engine offline.'});
    let session;
    try {
        const fail=(message,statusCode=400)=>{const error=new Error(message);error.statusCode=statusCode;throw error;};
        const text=value=>String(value??'').trim();
        const number=(value,name)=>{
            if(!['string','number'].includes(typeof value)||text(value)===''||!Number.isFinite(Number(value)))fail(`Missing or invalid ${name}.`);
            return Number(value);
        };
        const money=value=>{const result=Math.round((value+Number.EPSILON)*100)/100;if(!Number.isFinite(result)||Math.abs(result)>Number.MAX_SAFE_INTEGER/100)fail('Amount exceeds supported precision.');return result;};
        const dateValue=(value,name,required=false)=>{
            const date=text(value);if(!date&&!required)return null;
            const parsed=new Date(date+'T00:00:00.000Z');
            if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==date)fail(`A valid ${name} is required.`);
            return date;
        };
        const productFilter=value=>{
            const pid=text(value);if(!pid)fail('Every item requires a product PID.');
            const ids=[pid];if(Number.isSafeInteger(Number(pid)))ids.push(Number(pid));
            const conditions=[{ID:{$in:ids}}];if(/^[a-fA-F0-9]{24}$/.test(pid))conditions.push({_id:new ObjectId(pid)});
            return {$or:conditions};
        };
        const {main,items,requestId}=req.body||{};
        if(!main||typeof main!=='object'||Array.isArray(main)||!Array.isArray(items)||!items.length)fail('Customer Order details and at least one item are required.');
        for(const field of ['Customer','Emirate','Address'])if(!text(main[field]))fail(`${field} is required.`);
        const CODate=dateValue(main.CODate,'CO date',true),DeliveryDate=dateValue(main.DeliveryDate,'delivery date');
        const token=text(requestId);if(token.length>160)fail('Invalid save request ID.');
        // Stable item identities are created before transaction retries.
        const prepared=items.map((item,index)=>{
            if(!item||typeof item!=='object')fail(`Invalid item ${index+1}.`);
            const Quantity=number(item.Quantity,`item ${index+1} Order Qty`),DQuantity=number(item.DQuantity,`item ${index+1} Deliver Qty`);
            const UnitPrice=number(item.UnitPrice,'UnitPrice'),Discount=number(item.Discount,'Discount'),VatPer=number(item.VatPer,'VatPer');
            if(!Number.isSafeInteger(Quantity)||Quantity<=0)fail(`Order Qty must be a positive whole number for item ${index+1}.`);
            if(!Number.isSafeInteger(DQuantity)||DQuantity<0||DQuantity>Quantity)fail(`Deliver Qty must be between 0 and Order Qty for item ${index+1}.`);
            if(UnitPrice<=0||Discount<0||Discount>100||VatPer<0)fail(`Invalid unit price, discount or VAT for item ${index+1}.`);
            if(!text(item.Item))fail(`Product description is required for item ${index+1}.`);
            const id=new ObjectId();
            return {filter:productFilter(item.PID),id,Quantity,DQuantity,UnitPrice,Discount,VatPer,Item:text(item.Item),IUnit:text(item.IUnit),IRAL:text(item.IRAL),ISize:text(item.ISize)};
        });
        const orders=db.collection('cordermain'),products=db.collection('products'),counters=db.collection('counters');
        try{await counters.updateOne({_id:'customer_order_number'},{$setOnInsert:{lockVersion:0}},{upsert:true});}
        catch(error){if(error.code!==11000)throw error;}
        session=db.client.startSession();let allocatedNumber,allocatedID,savedTotals,replayed=false;
        await session.withTransaction(async()=>{
            replayed=false;
            const lock=await counters.updateOne({_id:'customer_order_number'},{$inc:{lockVersion:1}},{session});
            if(lock.matchedCount!==1)fail('Customer Order numbering lock is unavailable.',409);
            if(token){
                const previous=await orders.findOne({SaveRequestId:token},{session});
                if(previous){allocatedNumber=previous.CONo;allocatedID=previous.ID;replayed=true;return;}
            }
            const [maximum]=await orders.aggregate([{$group:{_id:null,
                maxNumber:{$max:{$convert:{input:'$CONo',to:'double',onError:null,onNull:null}}},
                maxID:{$max:{$convert:{input:'$ID',to:'double',onError:null,onNull:null}}}
            }}],{session}).toArray();
            const previousNumber=maximum?.maxNumber??7000,previousID=maximum?.maxID??0;
            if(!Number.isSafeInteger(previousNumber)||!Number.isSafeInteger(previousNumber+1)||!Number.isSafeInteger(previousID)||!Number.isSafeInteger(previousID+1))fail('Invalid existing CO number or ID.',409);
            allocatedNumber=previousNumber+1;allocatedID=previousID+1;
            const corderlist=[],pending=[],delivered=[];
            // Read authoritative product information; deliberately perform no stock writes.
            for(const [index,item]of prepared.entries()){
                const matches=await products.find(item.filter,{session}).limit(2).toArray();
                if(matches.length!==1)fail(`Cannot uniquely identify product for item ${index+1}.`,409);
                const product=matches[0],Stock=number(product.stock,'Database stock'),Icost=number(product.cost,'Database cost');
                if(Icost<0)fail('Database product cost cannot be negative.',409);
                const net=item.UnitPrice*(1-item.Discount/100),Taxable=money(net*item.Quantity),VatTotal=money(Taxable*item.VatPer/100),UnitTotal=money(Taxable+VatTotal);
                const DTotal=money(net*item.DQuantity),deliveredVAT=money(DTotal*item.VatPer/100),deliveredGrand=money(DTotal+deliveredVAT);
                const PTotal=money(Taxable-DTotal),pendingVAT=money(VatTotal-deliveredVAT),pendingGrand=money(UnitTotal-deliveredGrand);
                const Ucost=money(Icost*item.Quantity);
                const hasLegacyID=product.ID!==undefined&&product.ID!==null&&text(product.ID)!=='';
                corderlist.push({_id:item.id,ID:item.id,SrNo:index+1,CONo:allocatedNumber,VatPer:item.VatPer,Item:item.Item,
                    Quantity:item.Quantity,DQuantity:item.DQuantity,PQuantity:item.Quantity-item.DQuantity,
                    Status:item.DQuantity===0?'Pending':item.DQuantity===item.Quantity?'Delivered':'Partial',
                    UnitPrice:item.UnitPrice,Discount:item.Discount,
                    Taxable,UnitTotal,VatTotal,IUnit:item.IUnit,IRAL:item.IRAL,ISize:item.ISize,DTotal,PTotal,Stock,
                    PID:hasLegacyID?product.ID:product._id,Icost,Ucost,Umargin:money(Taxable-Ucost)});
                pending.push({taxable:PTotal,vat:pendingVAT,total:pendingGrand});delivered.push({taxable:DTotal,vat:deliveredVAT,total:deliveredGrand});
            }
            const sum=(array,key)=>money(array.reduce((total,line)=>total+line[key],0));
            savedTotals={SubTotal:sum(corderlist,'Taxable'),VatTotal:sum(corderlist,'VatTotal'),GrandTotal:sum(corderlist,'UnitTotal'),
                PendingTotal:sum(pending,'taxable'),VatPending:sum(pending,'vat'),TotalPending:sum(pending,'total'),
                DeliveredTotal:sum(delivered,'taxable'),VatDeliver:sum(delivered,'vat'),TotalDeliver:sum(delivered,'total'),
                InvCost:sum(corderlist,'Ucost'),InvMargin:sum(corderlist,'Umargin')};
            const Status=corderlist.every(line=>line.DQuantity===line.Quantity)?'Delivered':corderlist.every(line=>line.DQuantity===0)?'Pending':'Partial';
            const master={};for(const field of ['Customer','Emirate','Address','PostBox','LPONo','VatID','CustContact','CustConNumber','Description','InWords','ProjectName','OurContact','OurNumber','PaymentTerms'])master[field]=text(main[field]);
            await orders.insertOne({...master,...savedTotals,ID:allocatedID,CONo:allocatedNumber,CODate,DeliveryDate,Status,VatNo:'104652045600003',
                User_name:text(req.user?.username??req.user?.User_name??req.session?.user?.username??'user'),
                ...(token?{SaveRequestId:token}:{}),corderlist},{session});
        },{readConcern:{level:'snapshot'},writeConcern:{w:'majority'},readPreference:'primary'});
        return res.status(200).json({success:true,allocatedNumber,ID:allocatedID,totals:savedTotals,
            message:replayed?`Customer Order ${allocatedNumber} was already saved.`:`Customer Order ${allocatedNumber} saved successfully.`});
    }catch(error){console.error('MongoDB new Customer Order save failed:',error);return res.status(error.statusCode||500).json({success:false,message:error.statusCode?error.message:'Customer Order save failed. Transaction rolled back safely.'});}
    finally{if(session)await session.endSession();}
});
// UPDATE EDITED CO
app.post('/api/update-co', async (req, res) => {
    if (!db) return res.status(500).json({success:false,message:'Database engine offline.'});
    let session;
    try {
        const fail=(message,statusCode=400)=>{const error=new Error(message);error.statusCode=statusCode;throw error;};
        const text=value=>String(value??'').trim();
        const number=(value,name)=>{
            if(!['string','number'].includes(typeof value)||text(value)===''||!Number.isFinite(Number(value)))fail(`Missing or invalid ${name}.`);
            return Number(value);
        };
        const money=value=>{const result=Math.round((value+Number.EPSILON)*100)/100;if(!Number.isFinite(result)||Math.abs(result)>Number.MAX_SAFE_INTEGER/100)fail('Amount exceeds supported precision.');return result;};
        const dateValue=(value,name,required=false)=>{
            const date=text(value);if(!date&&!required)return null;
            const parsed=new Date(date+'T00:00:00.000Z');
            if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==date)fail(`A valid ${name} is required.`);
            return date;
        };
        const productFilter=value=>{
            const pid=text(value);if(!pid)fail('Every item requires a product PID.');
            const ids=[pid];if(Number.isSafeInteger(Number(pid)))ids.push(Number(pid));
            const conditions=[{ID:{$in:ids}}];if(/^[a-fA-F0-9]{24}$/.test(pid))conditions.push({_id:new ObjectId(pid)});
            return {$or:conditions};
        };
        const {main,items}=req.body||{};
        if(!main||typeof main!=='object'||Array.isArray(main)||!Array.isArray(items)||!items.length)fail('Customer Order details and at least one item are required.');
        for(const field of ['Customer','Emirate','Address'])if(!text(main[field]))fail(`${field} is required.`);
        const CODate=dateValue(main.CODate,'CO date',true),DeliveryDate=dateValue(main.DeliveryDate,'delivery date');
        const coNo=text(main.CONo);if(!coNo)fail('CO Number is required.');
        const coValues=[coNo];if(Number.isSafeInteger(Number(coNo)))coValues.push(Number(coNo));
        // Stable item identities are created before transaction retries.
        const prepared=items.map((item,index)=>{
            if(!item||typeof item!=='object')fail(`Invalid item ${index+1}.`);
            const Quantity=number(item.Quantity,`item ${index+1} Order Qty`),DQuantity=number(item.DQuantity,`item ${index+1} Deliver Qty`);
            const UnitPrice=number(item.UnitPrice,'UnitPrice'),Discount=number(item.Discount,'Discount'),VatPer=number(item.VatPer,'VatPer');
            if(!Number.isSafeInteger(Quantity)||Quantity<=0)fail(`Order Qty must be a positive whole number for item ${index+1}.`);
            if(!Number.isSafeInteger(DQuantity)||DQuantity<0||DQuantity>Quantity)fail(`Deliver Qty must be between 0 and Order Qty for item ${index+1}.`);
            if(UnitPrice<=0||Discount<0||Discount>100||VatPer<0)fail(`Invalid unit price, discount or VAT for item ${index+1}.`);
            if(!text(item.Item))fail(`Product description is required for item ${index+1}.`);
            const id=new ObjectId();
            return {existingID:text(item.ID),filter:productFilter(item.PID),id,Quantity,DQuantity,UnitPrice,Discount,VatPer,Item:text(item.Item),IUnit:text(item.IUnit),IRAL:text(item.IRAL),ISize:text(item.ISize)};
        });
        const orders=db.collection('cordermain'),products=db.collection('products');
        session=db.client.startSession();let allocatedNumber,savedTotals;
        await session.withTransaction(async()=>{
            const existing=await orders.findOne({CONo:{$in:coValues}},{session});
            if(!existing)fail('Customer Order not found.',404);
            allocatedNumber=existing.CONo;
            const oldItems=Array.isArray(existing.corderlist)?existing.corderlist:[];
            const usedIDs=new Set();
            const corderlist=[],pending=[],delivered=[];
            // Read authoritative product information; deliberately perform no stock writes.
            for(const [index,item]of prepared.entries()){
                const matches=await products.find(item.filter,{session}).limit(2).toArray();
                if(matches.length!==1)fail(`Cannot uniquely identify product for item ${index+1}.`,409);
                const product=matches[0],Stock=number(product.stock,'Database stock'),Icost=number(product.cost,'Database cost');
                if(Icost<0)fail('Database product cost cannot be negative.',409);
                const net=item.UnitPrice*(1-item.Discount/100),Taxable=money(net*item.Quantity),VatTotal=money(Taxable*item.VatPer/100),UnitTotal=money(Taxable+VatTotal);
                const DTotal=money(net*item.DQuantity),deliveredVAT=money(DTotal*item.VatPer/100),deliveredGrand=money(DTotal+deliveredVAT);
                const PTotal=money(Taxable-DTotal),pendingVAT=money(VatTotal-deliveredVAT),pendingGrand=money(UnitTotal-deliveredGrand);
                const Ucost=money(Icost*item.Quantity);
                const hasLegacyID=product.ID!==undefined&&product.ID!==null&&text(product.ID)!=='';
                const previous=item.existingID?oldItems.find(row=>text(row.ID??row._id)===item.existingID):null;
                if(item.existingID&&!previous)fail('An item identity does not belong to this Customer Order.',409);
                if(previous&&usedIDs.has(item.existingID))fail('Duplicate item identity.',409);
                if(previous)usedIDs.add(item.existingID);
                corderlist.push({...previous,_id:previous?._id??item.id,ID:previous?.ID??previous?._id??item.id,SrNo:index+1,CONo:allocatedNumber,VatPer:item.VatPer,Item:item.Item,
                    Quantity:item.Quantity,DQuantity:item.DQuantity,PQuantity:item.Quantity-item.DQuantity,
                    Status:item.DQuantity===0?'Pending':item.DQuantity===item.Quantity?'Delivered':'Partial',
                    UnitPrice:item.UnitPrice,Discount:item.Discount,
                    Taxable,UnitTotal,VatTotal,IUnit:item.IUnit,IRAL:item.IRAL,ISize:item.ISize,DTotal,PTotal,Stock,
                    PID:hasLegacyID?product.ID:product._id,Icost,Ucost,Umargin:money(Taxable-Ucost)});
                pending.push({taxable:PTotal,vat:pendingVAT,total:pendingGrand});delivered.push({taxable:DTotal,vat:deliveredVAT,total:deliveredGrand});
            }
            const sum=(array,key)=>money(array.reduce((total,line)=>total+line[key],0));
            savedTotals={SubTotal:sum(corderlist,'Taxable'),VatTotal:sum(corderlist,'VatTotal'),GrandTotal:sum(corderlist,'UnitTotal'),
                PendingTotal:sum(pending,'taxable'),VatPending:sum(pending,'vat'),TotalPending:sum(pending,'total'),
                DeliveredTotal:sum(delivered,'taxable'),VatDeliver:sum(delivered,'vat'),TotalDeliver:sum(delivered,'total'),
                InvCost:sum(corderlist,'Ucost'),InvMargin:sum(corderlist,'Umargin')};
            const Status=corderlist.every(line=>line.DQuantity===line.Quantity)?'Delivered':corderlist.every(line=>line.DQuantity===0)?'Pending':'Partial';
            const master={};for(const field of ['Customer','Emirate','Address','PostBox','LPONo','VatID','CustContact','CustConNumber','Description','InWords','ProjectName','OurContact','OurNumber','PaymentTerms'])if(main[field]!==undefined)master[field]=text(main[field]);
            await orders.updateOne({_id:existing._id},{$set:{...master,...savedTotals,CODate,DeliveryDate,Status,corderlist}},{session});
        },{readConcern:{level:'snapshot'},writeConcern:{w:'majority'},readPreference:'primary'});
        return res.status(200).json({success:true,CONo:allocatedNumber,totals:savedTotals,message:`Customer Order ${allocatedNumber} updated successfully.`});
    }catch(error){console.error('MongoDB Customer Order update failed:',error);return res.status(error.statusCode||500).json({success:false,message:error.statusCode?error.message:'Customer Order update failed. Transaction rolled back safely.'});}
    finally{if(session)await session.endSession();}
});

// DELETE CO
app.post('/api/delete-co', async (req, res) => {
    try {
        if (!db) return res.status(500).json({success:false,error:'Database engine offline.'});
        const value=req.body?.CONo;
        if(!['string','number'].includes(typeof value)||!String(value).trim()||(typeof value==='number'&&!Number.isFinite(value))) {
            return res.status(400).json({success:false,error:'CO Number is required.'});
        }
        const key=String(value).trim(),values=[key],numeric=Number(key);
        if(Number.isSafeInteger(numeric))values.push(numeric);
        const orders=db.collection('cordermain');
        const matches=await orders.find({CONo:{$in:values}}).limit(2).toArray();
        if(!matches.length)return res.status(404).json({success:false,error:'Customer Order not found. Refresh the ledger.'});
        if(matches.length!==1)return res.status(409).json({success:false,error:'Multiple Customer Orders have this number. Resolve the duplicate before deleting.'});
        const result=await orders.deleteOne({_id:matches[0]._id});
        if(result.deletedCount!==1)return res.status(404).json({success:false,error:'Customer Order was already deleted. Refresh the ledger.'});
        return res.status(200).json({success:true,CONo:matches[0].CONo,message:`Customer Order ${matches[0].CONo} deleted successfully.`});
    } catch(error) {
        console.error('Customer Order delete failed:',error);
        return res.status(500).json({success:false,error:'Could not delete Customer Order.'});
    }
});

// SAVE NEW CUSTOMER
app.post('/api/save-newcustomer', async(req,res)=>{
 if(!db)return res.status(500).json({success:false,error:'Database engine offline.'});
 let session;
 try{
  const input=req.body||{},record={};
  for(const key of ['custname','postbox','custaddress','emirate','email','VatID','contact','phone','mobile','paymentterm']){
   const value=input[key];if(value!=null&&typeof value!=='string')return res.status(400).json({success:false,error:`Invalid ${key}.`});
   record[key]=String(value??'').trim();
  }
  for(const key of ['custname','custaddress','emirate'])if(!record[key])return res.status(400).json({success:false,error:`${key} is required.`});
  for(const key of Object.keys(record))if(!record[key])record[key]='N/A';
  const customers=db.collection('customer'),counters=db.collection('counters');
  try{await counters.updateOne({_id:'customer_id'},{$setOnInsert:{lockVersion:0}},{upsert:true});}catch(error){if(error.code!==11000)throw error;}
  session=db.client.startSession();let ID;
  await session.withTransaction(async()=>{
   const lock=await counters.updateOne({_id:'customer_id'},{$inc:{lockVersion:1}},{session});if(lock.matchedCount!==1)throw Error('Customer ID lock unavailable.');
   const [maximum]=await customers.aggregate([{$group:{_id:null,maxID:{$max:{$convert:{input:'$ID',to:'double',onError:null,onNull:null}}}}}],{session}).toArray();
   const current=maximum?.maxID??0;if(!Number.isSafeInteger(current)||!Number.isSafeInteger(current+1))throw Error('Invalid customer ID sequence.');ID=current+1;
   await customers.insertOne({ID,...record},{session});
  },{readConcern:{level:'snapshot'},writeConcern:{w:'majority'},readPreference:'primary'});
  try{if(typeof loadCustomersToCache==='function')await loadCustomersToCache();}catch(error){console.error('Customer saved, cache refresh failed:',error);}
  return res.status(200).json({success:true,ID,message:`Customer ${record.custname} saved successfully.`});
 }catch(error){console.error('New customer save failed:',error);return res.status(500).json({success:false,error:'Could not save customer.'});}
 finally{if(session)await session.endSession();}
});

// CUSTOMER ID and _ id SELECTION
function customerEditFilter(value){
 const key=String(value??'').trim();if(!key)return null;
 const ids=[key];if(Number.isSafeInteger(Number(key)))ids.push(Number(key));
 const conditions=[{ID:{$in:ids}}];if(/^[a-fA-F0-9]{24}$/.test(key))conditions.push({_id:new ObjectId(key)});
 return {$or:conditions};
}

// FETCH CUSTOMER FOR EDIT
app.get('/api/get-customer-details',async(req,res)=>{
 try{
  if(!db)return res.status(500).json({success:false,error:'Database engine offline.'});
  const filter=customerEditFilter(req.query.id);if(!filter)return res.status(400).json({success:false,error:'Customer ID is required.'});
  const matches=await db.collection('customer').find(filter).limit(2).toArray();
  if(matches.length!==1)return res.status(matches.length?409:404).json({success:false,error:matches.length?'Customer ID is not unique.':'Customer not found.'});
  return res.json({success:true,customer:matches[0]});
 }catch(error){console.error('Fetch customer edit failed:',error);return res.status(500).json({success:false,error:'Could not load customer.'});}
});
// UPDATE CUSTOMER
app.post('/api/update-customer',async(req,res)=>{
 try{
  if(!db)return res.status(500).json({success:false,error:'Database engine offline.'});
  const input=req.body||{},key=String(input.customerId??'').trim();if(!/^[a-fA-F0-9]{24}$/.test(key))return res.status(400).json({success:false,error:'Invalid customer identity. Reopen Edit Customer.'});
  const update={};for(const field of ['custname','postbox','custaddress','emirate','email','VatID','contact','phone','mobile','paymentterm']){
   if(input[field]!=null&&typeof input[field]!=='string')return res.status(400).json({success:false,error:`Invalid ${field}.`});update[field]=String(input[field]??'').trim();
  }
  for(const field of ['custname','custaddress','emirate'])if(!update[field])return res.status(400).json({success:false,error:`${field} is required.`});
  for(const field of Object.keys(update))if(!update[field])update[field]='N/A';
  const result=await db.collection('customer').updateOne({_id:new ObjectId(key)},{$set:update});
  if(result.matchedCount!==1)return res.status(404).json({success:false,error:'Customer not found.'});
  try{if(typeof loadCustomersToCache==='function')await loadCustomersToCache();}catch(error){console.error('Customer updated, cache refresh failed:',error);}
  return res.json({success:true,message:'Customer updated successfully.'});
 }catch(error){console.error('Update customer failed:',error);return res.status(500).json({success:false,error:'Could not update customer.'});}
});

// SAVE NEW PRODUCT.
app.post('/api/save-newproduct',async(req,res)=>{
 if(!db)return res.status(500).json({success:false,error:'Database engine offline.'});let session;
 try{
  const fail=(message,code=400)=>{const error=new Error(message);error.statusCode=code;throw error;};
  const input=req.body||{},text=(key,required=false)=>{if(input[key]!=null&&typeof input[key]!=='string')fail(`Invalid ${key}.`);const value=String(input[key]??'').trim();if(required&&!value)fail(`${key} is required.`);return value||'-';};
  const num=(key,integer=false)=>{const value=input[key];if(!['string','number'].includes(typeof value)||String(value).trim()===''||!Number.isFinite(Number(value))||(integer&&!Number.isSafeInteger(Number(value))))fail(`Invalid ${key}.`);return Number(value);};
  const pid=text('pid',true).toUpperCase(),item=text('item',true).toUpperCase(),price=num('price'),cost=num('cost'),Ostock=num('Ostock',true),addStock=num('addStock',true),margin=num('margin');
  if(price<0||cost<0||Ostock<0||addStock<0)fail('Price, cost and stock cannot be negative.');
  const stock=Ostock+addStock;if(!Number.isSafeInteger(stock))fail('Stock exceeds supported range.');const tcost=Math.round((stock*cost+Number.EPSILON)*100)/100;if(!Number.isFinite(tcost)||Math.abs(tcost)>Number.MAX_SAFE_INTEGER/100)fail('Stock value exceeds supported range.');
  const record={pid,item,price,cost,stock,margin,Iunit:text('Iunit'),IRAL:text('IRAL'),Isize:text('Isize'),tcost,Ostock};
  const products=db.collection('products'),counters=db.collection('counters');
  try{await counters.updateOne({_id:'product_id'},{$setOnInsert:{lockVersion:0}},{upsert:true});}catch(error){if(error.code!==11000)throw error;}
  session=db.client.startSession();let ID;
  await session.withTransaction(async()=>{
   const lock=await counters.updateOne({_id:'product_id'},{$inc:{lockVersion:1}},{session});if(lock.matchedCount!==1)fail('Product numbering lock unavailable.',409);
   const escaped=pid.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
   if(await products.findOne({pid:{$regex:'^'+escaped+'$',$options:'i'}},{session}))fail('This product code already exists. Use Edit Product to update it.',409);
   const [maximum]=await products.aggregate([{$group:{_id:null,maxID:{$max:{$convert:{input:'$ID',to:'double',onError:null,onNull:null}}}}}],{session}).toArray();const current=maximum?.maxID??0;
   if(!Number.isSafeInteger(current)||!Number.isSafeInteger(current+1))fail('Invalid existing product ID sequence.',409);ID=current+1;
   await products.insertOne({ID,...record},{session});
  },{readConcern:{level:'snapshot'},writeConcern:{w:'majority'},readPreference:'primary'});
  try{if(typeof loadProductsToCache==='function')await loadProductsToCache();}catch(error){console.error('Product saved, cache refresh failed:',error);}
  return res.json({success:true,ID,message:`Product ${pid} saved successfully.`});
 }catch(error){console.error('New product save failed:',error);return res.status(error.statusCode||500).json({success:false,error:error.statusCode?error.message:'Could not save product.'});}
 finally{if(session)await session.endSession();}
});

// FETCH PRODUCT FOR EDIT.
app.get('/api/get-product-details',async(req,res)=>{
 try{
  if(!db)return res.status(500).json({success:false,error:'Database engine offline.'});const key=String(req.query.id??'').trim();if(!key)return res.status(400).json({success:false,error:'Product ID is required.'});
  const ids=[key];if(Number.isSafeInteger(Number(key)))ids.push(Number(key));const conditions=[{ID:{$in:ids}}];if(/^[a-fA-F0-9]{24}$/.test(key))conditions.push({_id:new ObjectId(key)});
  const matches=await db.collection('products').find({$or:conditions}).limit(2).toArray();if(matches.length!==1)return res.status(matches.length?409:404).json({success:false,error:matches.length?'Product identity is not unique.':'Product not found.'});
  return res.json({success:true,product:matches[0]});
 }catch(error){console.error('Fetch product edit failed:',error);return res.status(500).json({success:false,error:'Could not load product.'});}
});
// UPDATE  PRODUCT.
app.post('/api/update-product',async(req,res)=>{
 if(!db)return res.status(500).json({success:false,error:'Database engine offline.'});let session;
 try{
  const fail=(message,statusCode=400)=>{const error=new Error(message);error.statusCode=statusCode;throw error;};const input=req.body||{};
  const key=String(input.productId??'');if(!/^[a-fA-F0-9]{24}$/.test(key))fail('Invalid product identity. Reopen Edit Product.');
  const num=(name,integer=false)=>{const v=input[name];if(!['string','number'].includes(typeof v)||String(v).trim()===''||!Number.isFinite(Number(v))||(integer&&!Number.isSafeInteger(Number(v))))fail(`Invalid ${name}.`);return Number(v);};
  const text=(name,required=false)=>{if(input[name]!=null&&typeof input[name]!=='string')fail(`Invalid ${name}.`);const v=String(input[name]??'').trim();if(required&&!v)fail(`${name} is required.`);return v||'-';};
  const pid=text('pid',true).toUpperCase(),item=text('item',true).toUpperCase(),price=num('price'),cost=num('cost'),Ostock=num('Ostock',true),addStock=num('addStock',true),margin=num('margin'),expectedStock=num('expectedStock',true);
  if(price<0||cost<0||Ostock<0||addStock<0)fail('Price, cost and stock cannot be negative.');const stock=Ostock+addStock,tcost=Math.round((stock*cost+Number.EPSILON)*100)/100;if(!Number.isSafeInteger(stock)||!Number.isFinite(tcost)||Math.abs(tcost)>Number.MAX_SAFE_INTEGER/100)fail('Stock or value exceeds supported range.');
  const update={pid,item,price,cost,stock,margin,Iunit:text('Iunit'),IRAL:text('IRAL'),Isize:text('Isize'),tcost,Ostock},products=db.collection('products'),counters=db.collection('counters');
  try{await counters.updateOne({_id:'product_id'},{$setOnInsert:{lockVersion:0}},{upsert:true});}catch(error){if(error.code!==11000)throw error;}
  session=db.client.startSession();await session.withTransaction(async()=>{
   const lock=await counters.updateOne({_id:'product_id'},{$inc:{lockVersion:1}},{session});if(lock.matchedCount!==1)fail('Product update lock unavailable.',409);
   const product=await products.findOne({_id:new ObjectId(key)},{session});if(!product)fail('Product not found.',404);if(Number(product.stock??0)!==expectedStock)fail('Product stock changed since opening this modal. Reopen Edit Product before updating.',409);
   const escaped=pid.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');if(await products.findOne({_id:{$ne:product._id},pid:{$regex:'^'+escaped+'$',$options:'i'}},{session}))fail('This product code belongs to another product.',409);
   await products.updateOne({_id:product._id},{$set:update},{session});
  },{readConcern:{level:'snapshot'},writeConcern:{w:'majority'},readPreference:'primary'});
  try{if(typeof loadProductsToCache==='function')await loadProductsToCache();}catch(error){console.error('Product updated, cache refresh failed:',error);}
  return res.json({success:true,message:'Product updated successfully.'});
 }catch(error){console.error('Product update failed:',error);return res.status(error.statusCode||500).json({success:false,error:error.statusCode?error.message:'Could not update product.'});}
 finally{if(session)await session.endSession();}
});










// SAVE NEW CREDIT NOTE
app.post('/api/save-credit-note', async (req, res) => {
    if (!db) return res.status(500).json({success:false,error:'Database engine offline.'});
    let session;
    try {
        const fail=(message,statusCode=400)=>{const error=new Error(message);error.statusCode=statusCode;throw error;};
        const text=value=>String(value??'').trim();
        const num=(value,name)=>{if(!['string','number'].includes(typeof value)||text(value)===''||!Number.isFinite(Number(value)))fail(`Missing or invalid ${name}.`);return Number(value);};
        const money=value=>{const result=Math.round((value+Number.EPSILON)*100)/100;if(!Number.isFinite(result)||Math.abs(result)>Number.MAX_SAFE_INTEGER/100)fail('Amount exceeds supported precision.');return result;};
        const values=value=>{const key=text(value);if(!key)fail('Missing reference ID.');const list=[key];if(Number.isSafeInteger(Number(key)))list.push(Number(key));return list;};
        const productFilter=pid=>{const conditions=[{ID:{$in:values(pid)}}];if(/^[a-fA-F0-9]{24}$/.test(text(pid)))conditions.push({_id:new ObjectId(text(pid))});return {$or:conditions};};
        const {main,items,requestId}=req.body||{};
        if(!main||!Array.isArray(items)||!items.length)fail('main and a non-empty items array are required.');
        const invoiceValues=values(main.InvoiceNo);
        const date=text(main.CreditDate),parsed=new Date(date+'T00:00:00.000Z');
        if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==date)fail('A valid credit date is required.');
        const token=text(requestId);if(token.length>160)fail('Invalid request ID.');
        const requests=items.map((item,index)=>{
            const quantity=num(item.CNQty??item.qty,`items[${index}].CNQty`);
            if(quantity<=0||!Number.isSafeInteger(quantity))fail('CN Qty must be a positive whole number.');
            return {id:text(item.itemID),sr:num(item.SrNo,'SrNo'),pid:text(item.PID),quantity};
        });
        const creditNotes=db.collection('creditnoteMain'),invoices=db.collection('invoicemain'),products=db.collection('products'),counters=db.collection('counters');
        const [maximum]=await creditNotes.aggregate([{$group:{_id:null,maxNumber:{$max:{$convert:{input:'$CNNumber',to:'double',onError:null,onNull:null}}}}}]).toArray();
        const highest=maximum?.maxNumber??7000;if(!Number.isSafeInteger(highest))fail('Invalid existing CN number.',409);
        try{await counters.updateOne({_id:'credit_note_number'},{$max:{sequence:Math.max(7000,highest)}},{upsert:true});}
        catch(error){if(error.code!==11000)throw error;await counters.updateOne({_id:'credit_note_number'},{$max:{sequence:Math.max(7000,highest)}});}
        // Build amount in words from cumulative server totals, including subsequent credits.
        function words(value){
            const small=['Zero','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
            const tens=['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
            function integer(n){if(n<20)return small[n];if(n<100)return tens[Math.floor(n/10)]+(n%10?' '+small[n%10]:'');if(n<1000)return small[Math.floor(n/100)]+' Hundred'+(n%100?' '+integer(n%100):'');for(const [size,label]of [[1e12,'Trillion'],[1e9,'Billion'],[1e6,'Million'],[1000,'Thousand']])if(n>=size)return integer(Math.floor(n/size))+' '+label+(n%size?' '+integer(n%size):'');}
            const cents=Math.round(value*100);return `${integer(Math.floor(cents/100))} Dirhams and ${integer(cents%100)} Fils Only`;
        }
        const lineID=line=>text(line.ID)||text(line._id);
        session=db.client.startSession();let allocatedNumber,isExisting,replayed=false;
        await session.withTransaction(async()=>{
            replayed=false;
            // Write the common lock first. Conflicting saves retry with fresh invoice/stock data.
            await counters.updateOne({_id:'credit_note_number'},{$inc:{lockVersion:1}},{session});
            const invoice=await invoices.findOne({InvoiceNo:{$in:invoiceValues}},{session});
            if(!invoice)fail('Invoice not found.',404);
            if(!Array.isArray(invoice.invoices))fail('Stored invoice items are invalid.',409);
            const notes=await creditNotes.find({InvoiceNo:{$in:invoiceValues}},{session}).limit(2).toArray();
            if(notes.length>1)fail('Multiple credit notes exist for this invoice.',409);
            const existing=notes[0];isExisting=Boolean(existing);
            if(token&&existing?.appliedRequestIds?.includes(token)){allocatedNumber=existing.CNNumber;replayed=true;return;}
            // Handle both arrays used by the previous API, including migrated records.
            for(const key of ['CreditNotes','invoices'])if(existing?.[key]!==undefined&&!Array.isArray(existing[key]))fail(`Stored credit-note ${key} is invalid.`,409);
            const creditLines=[],signatures=new Set();
            for(const line of [...(existing?.CreditNotes||[]),...(existing?.invoices||[])]){
                const signature=JSON.stringify([text(line.ItemID),text(line.SrNo),text(line.PID),line.Quantity,line.Taxable,line.VatTotal,line.UnitTotal]);
                if(!signatures.has(signature)){creditLines.push({...line});signatures.add(signature);}
            }
            if(existing)allocatedNumber=existing.CNNumber;
            else{
                await counters.updateOne({_id:'credit_note_number'},{$inc:{sequence:1}},{session});
                allocatedNumber=(await counters.findOne({_id:'credit_note_number'},{session})).sequence;
                if(!Number.isSafeInteger(allocatedNumber))fail('Invalid allocated CN number.',409);
            }
            const updatedLines=invoice.invoices.map(line=>({...line})),selected=new Set();let addedTotal=0;
            for(const request of requests){
                let matches=updatedLines.map((line,index)=>({line,index})).filter(({line})=>request.id&&(text(line.ID)===request.id||text(line._id)===request.id));
                if(!matches.length)matches=updatedLines.map((line,index)=>({line,index})).filter(({line})=>Number(line.SrNo)===request.sr);
                if(matches.length!==1)fail(`Cannot uniquely identify invoice item SrNo ${request.sr}.`,409);
                const {line,index}=matches[0];if(selected.has(index))fail('The same invoice item was submitted twice.');selected.add(index);
                const quantity=num(line.Quantity,'Stored invoice Quantity');const status=text(line.Status).toLowerCase();
                if(quantity<=0||!Number.isSafeInteger(quantity))fail('Invalid stored invoice quantity.',409);
                if(status==='credit')fail(`Item ${line.SrNo} is already fully credited.`,409);
                if(!['delivered','partial',''].includes(status))fail(`Item ${line.SrNo} is not eligible for credit.`,409);
                const sourceID=lineID(line);
                const sameSource=creditLine=>text(creditLine.ItemID)&&sourceID?text(creditLine.ItemID)===sourceID:
                    Number(creditLine.SrNo)===Number(line.SrNo)&&text(creditLine.PID)===text(line.PID);
                const previous=creditLines.filter(sameSource);
                const previousQuantity=previous.reduce((sum,creditLine)=>sum+num(creditLine.Quantity,'Stored CN Quantity'),0);
                const remaining=line.CNQty!==undefined&&line.CNQty!==null?num(line.CNQty,'Stored CNQty'):quantity-previousQuantity;
                if(!Number.isSafeInteger(remaining)||remaining<0||remaining>quantity)fail(`Invalid remaining quantity for item ${line.SrNo}.`,409);
                if(previousQuantity+remaining!==quantity)fail(`Credit history and remaining quantity do not match for item ${line.SrNo}.`,409);
                if(request.quantity>remaining)fail(`CN Qty for item ${line.SrNo} exceeds the remaining ${remaining}.`,409);
                const found=await products.find(productFilter(line.PID),{session}).limit(2).toArray();
                if(found.length!==1)fail(`Cannot uniquely identify product for item ${line.SrNo}.`,409);
                const product=found[0];
                const submitted=await products.find(productFilter(request.pid),{session}).limit(2).toArray();
                if(submitted.length!==1||text(submitted[0]._id)!==text(product._id))fail('Product reference mismatch.',409);
                const price=num(line.UnitPrice,'Stored UnitPrice'),discount=num(line.Discount??0,'Stored Discount'),vat=num(line.VatPer??0,'Stored VatPer');
                if(price<0||discount<0||discount>100||vat<0)fail('Invalid stored invoice pricing.',409);
                const currentStock=num(product.stock,'Database stock'),cost=num(product.cost,'Database cost');
                if(currentStock<0||cost<0)fail('Invalid database stock or cost.',409);
                const newStock=currentStock+request.quantity;
                if(!Number.isSafeInteger(newStock))fail('Invalid resulting stock.',409);
                let taxable=money(request.quantity*price*(1-discount/100)),vatTotal=money(taxable*vat/100),total=money(taxable+vatTotal);
                // On the final credit, clear any cent-rounding difference from previous partial credits.
                if(request.quantity===remaining){
                    const oldSum=key=>money(previous.reduce((sum,creditLine)=>sum+num(creditLine[key]??0,key),0));
                    taxable=money(num(line.Taxable??money(quantity*price*(1-discount/100)),'Invoice Taxable')-oldSum('Taxable'));
                    vatTotal=money(num(line.VatTotal??money(quantity*price*(1-discount/100)*vat/100),'Invoice VAT')-oldSum('VatTotal'));
                    total=money(num(line.UnitTotal??money(taxable+vatTotal+oldSum('UnitTotal')),'Invoice Total')-oldSum('UnitTotal'));
                    if(taxable<0||vatTotal<0||total<0)fail('Existing CN amounts exceed invoice amounts.',409);
                }
                const oldSum=key=>money(previous.reduce((sum,creditLine)=>sum+num(creditLine[key]??0,key),0));
                const cumulativeQuantity=previousQuantity+request.quantity;
                const merged={...(previous[0]||{_id:new ObjectId()}),CNNumber:allocatedNumber,ItemID:sourceID?(text(line.ID)?line.ID:line._id):null,
                    SrNo:line.SrNo,Item:line.Item??'',Quantity:cumulativeQuantity,CNQty:cumulativeQuantity,UnitPrice:price,Discount:discount,VatPer:vat,
                    Taxable:money(oldSum('Taxable')+taxable),VatTotal:money(oldSum('VatTotal')+vatTotal),UnitTotal:money(oldSum('UnitTotal')+total),
                    PID:line.PID,Stock:newStock,Icost:cost,Ucost:money(cost*cumulativeQuantity)};
                for(let i=creditLines.length-1;i>=0;i--)if(sameSource(creditLines[i]))creditLines.splice(i,1);
                creditLines.push(merged);addedTotal=money(addedTotal+total);
                await products.updateOne({_id:product._id},{$set:{stock:newStock,tcost:money(newStock*cost)}},{session});
                line.CNQty=remaining-request.quantity;line.Status=line.CNQty===0?'Credit':'Partial';
            }
            const sum=key=>money(creditLines.reduce((total,line)=>total+num(line[key]??0,key),0));
            const grandTotal=sum('UnitTotal'),paid=num(existing?.Paid??main.Paid??0,'Paid');
            const master={Customer:invoice.Customer??main.Customer??'',PostBox:invoice.PostBox??main.PostBox??'',Emirate:invoice.Emirate??main.Emirate??'',
                Address:invoice.Address??main.Address??'',TRN:invoice.VatID??main.TRN??'',InvoiceDate:invoice.InvoiceDate,LPONo:invoice.LPONo??'',CONo:invoice.CONo??'',
                Description:main.Description??existing?.Description??'',CreditDate:date,CNNumber:allocatedNumber,InvoiceNo:invoice.InvoiceNo,
                SubTotal:sum('Taxable'),VatTotal:sum('VatTotal'),GrandTotal:grandTotal,Paid:paid,Balance:money(grandTotal-paid),Status:'Credit',InWords:words(grandTotal),CreditNotes:creditLines};
            if(token)master.appliedRequestIds=[...(existing?.appliedRequestIds||[]),token];
            if(existing){if(Array.isArray(existing.invoices))master.invoices=creditLines;await creditNotes.updateOne({_id:existing._id},{$set:master},{session});}
            else await creditNotes.insertOne(master,{session});
            const stillAvailable=updatedLines.some(line=>text(line.Status).toLowerCase()!=='credit'&&Number(line.CNQty??line.Quantity)>0);
            await invoices.updateOne({_id:invoice._id},{$set:{invoices:updatedLines,CNStatus:stillAvailable?'Partial':'Credit',CNNumber:allocatedNumber,CreditDate:date,
                CNAmount:money(num(invoice.CNAmount??0,'CNAmount')+addedTotal)}},{session});
        },{readConcern:{level:'snapshot'},writeConcern:{w:'majority'},readPreference:'primary'});
        try{await loadProductsToCache();}catch(error){console.error('Product cache refresh failed:',error);}
        return res.status(200).json({success:true,allocatedNumber,message:replayed?`Credit Note ${allocatedNumber} was already saved.`:
            isExisting?`Credit Note ${allocatedNumber} updated successfully.`:`New Credit Note ${allocatedNumber} saved successfully.`});
    }catch(error){console.error('MongoDB credit-note transaction failed:',error);return res.status(error.statusCode||500).json({success:false,message:error.statusCode?error.message:'Credit-note save failed. Transaction rolled back safely.'});}
    finally{if(session)await session.endSession();}
});

// UPDATE, PRINT, DELETE CREDIT NOTE
(() => {
 const cryptoCN=require('crypto');
 const text=v=>String(v??'').trim();
 const fail=(message,statusCode=400)=>{const e=new Error(message);e.statusCode=statusCode;throw e;};
 const num=(v,name)=>{if(!['number','string'].includes(typeof v)||text(v)===''||!Number.isFinite(Number(v)))fail(`Invalid ${name}.`);return Number(v);};
 const money=v=>{const n=Math.round((v+Number.EPSILON)*100)/100;if(!Number.isFinite(n)||Math.abs(n)>Number.MAX_SAFE_INTEGER/100)fail('Invalid amount.');return n;};
 const vals=v=>{if(!text(v))fail('Missing reference number.');const a=[text(v)];if(Number.isSafeInteger(Number(v)))a.push(Number(v));return a;};
 const revision=note=>cryptoCN.createHash('sha256').update(JSON.stringify(note)).digest('hex');
 const sourceKey=(line,index)=>text(line.ID)||text(line._id)||`index:${index}:sr:${line.SrNo}:pid:${line.PID}`;
 function noteLines(note){
  for(const key of ['CreditNotes','invoices'])if(note[key]!==undefined&&!Array.isArray(note[key]))fail(`Invalid CN ${key} array.`,409);
  const seen=new Set(),lines=[];
  for(const line of [...(note.CreditNotes||[]),...(note.invoices||[])]){const key=JSON.stringify([text(line.ItemID),line.SrNo,text(line.PID),line.Quantity,line.Taxable,line.VatTotal,line.UnitTotal]);if(!seen.has(key)){seen.add(key);lines.push({...line});}}
  return lines;
 }
 function mapLines(note,invoice){
  if(!Array.isArray(invoice.invoices))fail('Invalid invoice items.',409);
  const mapped=new Map();
  for(const line of noteLines(note)){
   let found=invoice.invoices.map((source,index)=>({source,index})).filter(({source})=>text(line.ItemID)&&(text(source.ID)===text(line.ItemID)||text(source._id)===text(line.ItemID)));
   if(!found.length)found=invoice.invoices.map((source,index)=>({source,index})).filter(({source})=>Number(source.SrNo)===Number(line.SrNo)&&text(source.PID)===text(line.PID));
   if(found.length!==1)fail(`Cannot uniquely match CN item ${line.SrNo} to its invoice.`,409);
   const {source,index}=found[0],key=sourceKey(source,index),previous=mapped.get(key);
   if(previous){for(const field of ['Quantity','Taxable','VatTotal','UnitTotal'])previous.line[field]=money(num(previous.line[field]??0,field)+num(line[field]??0,field));}
   else mapped.set(key,{source,index,line:{...line},key});
  }
  return mapped;
 }
 const productFilter=pid=>{const a=[{ID:{$in:vals(pid)}}];if(/^[a-fA-F0-9]{24}$/.test(text(pid)))a.push({_id:new ObjectId(text(pid))});return {$or:a};};
 async function readNote(number,session){
  const notes=await db.collection('creditnoteMain').find({CNNumber:{$in:vals(number)}},{session}).limit(2).toArray();
  if(notes.length!==1)fail(notes.length?'Duplicate CN numbers found.':'Credit note not found.',notes.length?409:404);return notes[0];
 }
 async function readInvoice(note,session){const invoice=await db.collection('invoicemain').findOne({InvoiceNo:{$in:vals(note.InvoiceNo)}},{session});if(!invoice)fail('Linked invoice not found.',404);return invoice;}
 function errorResponse(res,e){console.error('Credit-note maintenance failed:',e);return res.status(e.statusCode||500).json({success:false,message:e.message});}
 app.get('/api/get-credit-note-details',async(req,res)=>{
  try{
   if(!db)fail('Database offline.',500);const note=await readNote(req.query.CNNumber);const invoice=await readInvoice(note);const mapped=mapLines(note,invoice);
   const {CreditNotes,invoices,...master}=note;
   const items=Array.from(mapped.values()).map(({line,source,key})=>{
    const original=num(source.Quantity,'Invoice Quantity'),oldQty=num(line.Quantity,'CN Quantity');
    const remaining=source.CNQty===undefined||source.CNQty===null?original-oldQty:num(source.CNQty,'Invoice CNQty');
    if(remaining<0||oldQty+remaining!==original)fail('Invoice/CN quantity history is inconsistent.',409);
    return {...line,sourceKey:key,ReferenceQty:original,MaximumQty:remaining+oldQty};
   });
   for(const item of items){
    const matches=await db.collection('products').find(productFilter(item.PID)).limit(2).toArray();
    if(matches.length===1){item.LiveStock=matches[0].stock;item.LiveCost=matches[0].cost;}
   }
   return res.json({success:true,master,items,revision:revision(note)});
  }catch(e){return errorResponse(res,e);}
 });
 async function changeCreditNote(req,res,deleting){
  let session;
  try{
   if(!db)fail('Database offline.',500);const {main={},items=[],revision:expected}=req.body||{};
   const key=main.CNNumber??req.body.CNNumber;if(!text(expected))fail('Please reopen the credit note before updating.');
   if(!deleting&&(!Array.isArray(items)||!items.length))fail('Keep at least one item, or use Delete CN to delete the whole credit note.');
   const counters=db.collection('counters');try{await counters.updateOne({_id:'credit_note_number'},{$setOnInsert:{lockVersion:0}},{upsert:true});}catch(e){if(e.code!==11000)throw e;}
   session=db.client.startSession();let cnNumber;
   await session.withTransaction(async()=>{
    await counters.updateOne({_id:'credit_note_number'},{$inc:{lockVersion:1}},{session});
    const note=await readNote(key,session);cnNumber=note.CNNumber;
    if(revision(note)!==expected)fail('This CN changed after it was opened. Reopen it and try again.',409);
    const invoice=await readInvoice(note,session);
    const notes=await db.collection('creditnoteMain').find({InvoiceNo:{$in:vals(invoice.InvoiceNo)}},{session}).limit(2).toArray();
    if(notes.length!==1)fail('Multiple credit notes exist for the invoice; reconcile them before editing.',409);
    const original=mapLines(note,invoice),requested=new Map();
    if(!deleting)for(const item of items){if(!original.has(text(item.sourceKey)))fail('Unknown CN item. Reopen the document.',409);if(requested.has(text(item.sourceKey)))fail('Duplicate CN item.');requested.set(text(item.sourceKey),item);}
    const invoiceLines=invoice.invoices.map(line=>({...line})),newLines=[];
    for(const [sourceID,old]of original){
     const desired=requested.get(sourceID),oldQty=num(old.line.Quantity,'Old CN Qty'),invoiceQty=num(old.source.Quantity,'Invoice Qty');
     const newQty=desired?num(desired.Quantity,'CN Qty'):0;
     if(!Number.isSafeInteger(newQty)||newQty<0)fail('CN Qty must be a non-negative whole number.');
     const oldRemaining=old.source.CNQty===undefined||old.source.CNQty===null?invoiceQty-oldQty:num(old.source.CNQty,'Invoice CNQty');
     if(oldRemaining<0||oldQty+oldRemaining!==invoiceQty)fail('Invoice/CN quantity history is inconsistent.',409);
     const remaining=oldRemaining+oldQty-newQty;if(remaining<0||remaining>invoiceQty)fail(`CN Qty for ${old.source.Item} exceeds the invoice quantity.`,409);
     const found=await db.collection('products').find(productFilter(old.source.PID),{session}).limit(2).toArray();
     if(found.length!==1)fail('Cannot uniquely identify product for '+old.source.Item,409);
     const product=found[0],cost=num(product.cost,'Product cost'),stock=num(product.stock,'Product stock')+newQty-oldQty;
     if(stock<0)fail(`Insufficient stock to reverse the credited quantity for ${old.source.Item}.`,409);
     if(!Number.isSafeInteger(stock)||cost<0)fail('Invalid database stock/cost.',409);
     if(newQty!==oldQty)await db.collection('products').updateOne({_id:product._id},{$set:{stock,tcost:money(stock*cost)}},{session});
     invoiceLines[old.index].CNQty=remaining;invoiceLines[old.index].Status=remaining===0?'Credit':remaining===invoiceQty?'Delivered':'Partial';
     if(newQty>0){
      const price=num(desired.UnitPrice,'Unit price'),discount=num(desired.Discount,'Discount'),vat=num(desired.VatPer,'VAT');
      if(price<0||discount<0||discount>100||vat<0)fail('Invalid item price, discount or VAT.');
      const taxable=money(newQty*price*(1-discount/100)),vatTotal=money(taxable*vat/100);
      newLines.push({...old.line,Item:text(desired.Item)||old.line.Item,Quantity:newQty,CNQty:newQty,UnitPrice:price,Discount:discount,VatPer:vat,
       Taxable:taxable,VatTotal:vatTotal,UnitTotal:money(taxable+vatTotal),Stock:stock,Icost:cost,Ucost:money(newQty*cost),PID:old.source.PID});
     }
    }
    if(!deleting&&!newLines.length)fail('Keep at least one item, or use Delete CN.');
    const sum=k=>money(newLines.reduce((total,line)=>total+num(line[k]??0,k),0));const grand=sum('UnitTotal');
    const oldGrand=num(note.GrandTotal,'Stored CN total');
    if(deleting)await db.collection('creditnoteMain').deleteOne({_id:note._id},{session});
    else{
     const date=text(main.CreditDate),parsed=new Date(date+'T00:00:00.000Z');if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==date)fail('Invalid credit date.');
     const update={};for(const field of ['Customer','PostBox','Emirate','Address','TRN','LPONo','CONo','Description','InvoiceDate','Status','Mode','PaymentDate','ChqNo','PaidInvoiceNo'])if(main[field]!==undefined)update[field]=text(main[field]);
     const paid=num(main.Paid??note.Paid??0,'Paid');if(paid<0)fail('Paid cannot be negative.');
     Object.assign(update,{CreditDate:date,SubTotal:sum('Taxable'),VatTotal:sum('VatTotal'),GrandTotal:grand,Paid:paid,Balance:money(grand-paid),InWords:text(main.InWords),CreditNotes:newLines});
     if(Array.isArray(note.invoices))update.invoices=newLines;
     await db.collection('creditnoteMain').updateOne({_id:note._id},{$set:update},{session});
    }
    const invoiceAmount=money(num(invoice.CNAmount??oldGrand,'Invoice CNAmount')-oldGrand+grand);
    if(invoiceAmount<0)fail('Invoice CNAmount is inconsistent with this CN.',409);
    await db.collection('invoicemain').updateOne({_id:invoice._id},{$set:{invoices:invoiceLines,CNAmount:invoiceAmount,
     CNStatus:deleting?'':invoiceLines.every(line=>text(line.Status).toLowerCase()==='credit')?'Credit':'Partial',CNNumber:deleting?null:note.CNNumber,CreditDate:deleting?null:main.CreditDate}},{session});
   },{readConcern:{level:'snapshot'},writeConcern:{w:'majority'},readPreference:'primary'});
   try{await loadProductsToCache();}catch(e){console.error('Product cache refresh failed:',e);}
   return res.json({success:true,message:`Credit Note ${cnNumber} ${deleting?'deleted':'updated'} successfully.`});
  }catch(e){return errorResponse(res,e);}finally{if(session)await session.endSession();}
 }
 app.post('/api/update-credit-note',(req,res)=>changeCreditNote(req,res,false));
 app.post('/api/delete-credit-note',(req,res)=>changeCreditNote(req,res,true));
 app.get('/api/print-credit-note/:cnNumber',async(req,res)=>{
  let doc;
  try{
   if(!db)fail('Database offline.',500);const note=await readNote(req.params.cnNumber),invoice=await readInvoice(note);
   const lines=Array.from(mapLines(note,invoice).values()).map(entry=>entry.line).sort((a,b)=>Number(a.SrNo)-Number(b.SrNo));
   const CreditNotePDFDocument = require('pdfkit');
   doc=new CreditNotePDFDocument({size:'A4',margin:40});const chunks=[];const ready=new Promise((resolve,reject)=>{doc.on('data',c=>chunks.push(c));doc.on('end',()=>resolve(Buffer.concat(chunks)));doc.on('error',reject)});ready.catch(()=>{});
   const logo=getPdfLogoPath();if(fs.existsSync(logo))doc.image(logo,40,35,{fit:[290,43]});else doc.font('Helvetica-Bold').fontSize(14).text('CENTRAL AIRTECH A/C SYSTEMS',40,40,{width:310});
   doc.fontSize(17).text('CREDIT NOTE',350,40,{width:205,align:'right'});doc.font('Helvetica').fontSize(9).text(`CN No: ${note.CNNumber} | Date: ${text(note.CreditDate).split('T')[0]}`,300,76,{width:255,align:'right'});
   doc.text(`Invoice No: ${note.InvoiceNo}`,300,91,{width:255,align:'right'});
   doc.font('Helvetica-Bold').fontSize(10).text(text(note.Customer),40,125,{width:280});let y=doc.y+8;
   doc.font('Helvetica').fontSize(9).text(`PO Box: ${note.PostBox||'-'} | ${note.Emirate||''}\n${note.Address||''}\nTRN: ${note.TRN||'-'}`,40,y,{width:300});y=doc.y+18;
   const widths=[23,172,34,49,33,30,60,49,65],titles=['Sr#','Item Description','CN Qty','Unit Price','Disc%','VAT%','Taxable','VAT Total','Unit Total'];
   function header(){doc.rect(40,y,515,25).fill('#035372');let x=40;doc.font('Helvetica-Bold').fontSize(7).fillColor('white');titles.forEach((title,i)=>{doc.text(title,x+3,y+6,{width:widths[i]-6,align:'center'});x+=widths[i]});y+=27;}
   header();for(const [index,line]of lines.entries()){
    const values=[index+1,line.Item,line.Quantity,Number(line.UnitPrice).toFixed(2),line.Discount,line.VatPer,Number(line.Taxable).toFixed(2),Number(line.VatTotal).toFixed(2),Number(line.UnitTotal).toFixed(2)].map(String);
    doc.font('Helvetica').fontSize(8);const height=Math.max(22,...values.map((v,i)=>doc.heightOfString(v,{width:widths[i]-6})+8));if(height>650)fail('CN item is too long for one page.');
    if(y+height>710){doc.addPage();y=50;header();}doc.rect(40,y,515,height).fill(index%2?'#fff':'#f1f5fa');let x=40;doc.fillColor('#222').font('Helvetica').fontSize(8);values.forEach((v,i)=>{doc.text(v,x+3,y+4,{width:widths[i]-6,align:i===1?'left':'right'});x+=widths[i]});y+=height;
   }
   doc.font('Helvetica').fontSize(9);const notes=`Notes: ${note.Description||'-'}\n\nAmount in words: ${note.InWords||'-'}`;const height=Math.max(85,doc.heightOfString(notes,{width:290})+20);if(y+height>740){doc.addPage();y=50;}y+=15;
   doc.text(notes,40,y,{width:290});for(const [i,[label,key]]of [['Taxable:','SubTotal'],['VAT:','VatTotal'],['CN Total:','GrandTotal']].entries()){doc.font(i===2?'Helvetica-Bold':'Helvetica').text(label,360,y+i*21,{width:90});doc.text(Number(note[key]||0).toFixed(2),450,y+i*21,{width:100,align:'right'});}
   doc.font('Helvetica').fontSize(9).text('Authorised Signatory',410,785,{width:145,align:'right'});doc.end();const buffer=await ready;
   const filename=`CN-${note.CNNumber}-${note.Customer||''}`.replace(/[^a-zA-Z0-9._ -]/g,'_').slice(0,140);
   res.setHeader('Content-Type','application/pdf');res.setHeader('Content-Disposition',`attachment; filename="${filename}.pdf"`);return res.send(buffer);
  }catch(e){
   console.error('Credit note PDF generation failed:', e);
   // Preserve the original error even if this PDF stream lacks destroy().
   try { if(doc && typeof doc.destroy === 'function' && !doc.destroyed) doc.destroy(); }
   catch(cleanupError) { console.error('Credit note PDF cleanup failed:', cleanupError); }
   if(!res.headersSent)return res.status(e.statusCode||500).send('Failed to generate credit note PDF: '+e.message);
   res.end();
  }
 });
})();



//============ALL PDF CREATION CODES HERE==============//

// PRINT INVOICE
app.get('/api/print-invoice/:invoiceNo', async (req, res) => {
    let doc;

    try {
        if (!db) {
            return res.status(500).send("Database engine offline.");
        }

        const invoiceNo = String(req.params.invoiceNo ?? '').trim();

        if (!invoiceNo) {
            return res.status(400).send("Invoice number is required.");
        }

        // Support numeric and string invoice numbers.
        const invoiceValues = [invoiceNo];
        const numericInvoiceNo = Number(invoiceNo);

        if (Number.isSafeInteger(numericInvoiceNo)) {
            invoiceValues.push(numericInvoiceNo);
        }

        const invMaster = await db.collection('invoicemain').findOne({
            InvoiceNo: { $in: invoiceValues }
        });

        if (!invMaster) {
            return res.status(404).send("Invoice number not found.");
        }

        if (!Array.isArray(invMaster.invoices)) {
            return res.status(500).send(
                "Invoice invoices field is missing or is not an array."
            );
        }

        const invItems = [...invMaster.invoices].sort(
            (a, b) => Number(a.SrNo) - Number(b.SrNo)
        );

        const number = value => {
            const result = Number(value ?? 0);
            return Number.isFinite(result) ? result : 0;
        };

        const money = value => number(value).toFixed(2);

        const displayDate = value => {
            if (!value) return '-';

            // Avoid timezone shifts for YYYY-MM-DD strings.
            const match = String(value).match(
                /^(\d{4})-(\d{2})-(\d{2})$/
            );

            if (match) {
                return `${match[3]}/${match[2]}/${match[1]}`;
            }

            const date = new Date(value);

            return Number.isNaN(date.getTime())
                ? '-'
                : date.toLocaleDateString('en-GB');
        };

        doc = new PDFDocument({
            size: 'A4',
            margins: {
                top: 36,
                bottom: 36,
                left: 62,
                right: 36
            }
        });

        // Collect the complete PDF before sending the response.
        const chunks = [];

        const pdfReady = new Promise((resolve, reject) => {
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);
        });

        // Attach a handler immediately for asynchronous stream errors.
        pdfReady.catch(() => {});

        // ==========================================
        // COMPANY HEADER
        // ==========================================
        const renderTextFallbackHeader = () => {
            doc.fillColor('#252e3d')
                .font('Helvetica-Bold')
                .fontSize(14)
                .text('AL FAJAR ERP SYSTEMS', 40, 40, {
                    width: 300
                });

            doc.font('Helvetica')
                .fontSize(9)
                .fillColor('#050505')
                .text(
                    'Musafah 34, Abu Dhabi, United Arab Emirates',
                    40,
                    65,
                    { width: 330 }
                )
                .text(
                    'www.centralairtechac.com | Email: admin@centralairtechac.com',
                    40,
                    80,
                    { width: 350 }
                );
        };

        const localLogoPath = getPdfLogoPath();

        const logoPath = fs.existsSync(localLogoPath)
            ? localLogoPath
            : getPdfLogoPath();

        if (fs.existsSync(logoPath)) {
            try {
                doc.image(fs.readFileSync(logoPath), 40, 35, {
                    fit: [300, 43]
                });

                doc.fillColor('#050505')
                    .fontSize(9)
                    .font('Helvetica')
                    .text(
                        'Musafah 34, Abu Dhabi, United Arab Emirates',
                        40,
                        85,
                        { width: 350 }
                    )
                    .text(
                        'www.centralairtechac.com | Email: admin@centralairtechac.com',
                        40,
                        97,
                        { width: 350 }
                    );
            } catch (imageError) {
                console.error("Failed to load invoice logo:", imageError);
                renderTextFallbackHeader();
            }
        } else {
            renderTextFallbackHeader();
        }

        doc.fillColor('#050505')
            .font('Helvetica-Bold')
            .fontSize(18)
            .text('TAX INVOICE', 365, 40, {
                width: 190,
                align: 'right'
            });

        doc.font('Helvetica')
            .fontSize(9)
            .text(
                `TRN ${invMaster.VatNo || '104652045600003'}`,
                365,
                62,
                { width: 190, align: 'right' }
            );

        doc.moveTo(40, 115)
            .lineTo(555, 115)
            .lineWidth(1)
            .stroke('#0d1b2a');

        doc.fillColor('#0d1b2a')
            .font('Helvetica-Bold')
            .fontSize(10)
            .text('BILLED TO:', 40, 130, { width: 230 });

        doc.font('Helvetica')
            .fillColor('#333333')
            .text(
                String(invMaster.Customer || 'CASH CUSTOMER'),
                40,
                145,
                { width: 230 }
            );

        const customerBottom = doc.y;

        // INVOICE DETAILS — aligned to the table's right edge
        const detailsX = 355;
        const detailsWidth = 200;
        const detailsOptions = {
            width: detailsWidth,
            align: 'right'
        };

        doc.fillColor('#0d1b2a')
            .font('Helvetica-Bold')
            .fontSize(10)
            .text('INVOICE DETAILS', detailsX, 130, detailsOptions);

        doc.font('Helvetica')
            .fillColor('#333333')
            .text(
                `Invoice No: ${invMaster.InvoiceNo}`,
                detailsX,
                145,
                detailsOptions
            )
            .text(
                `Date: ${displayDate(invMaster.InvoiceDate)}`,
                detailsX,
                160,
                detailsOptions
            )
            .text(
                `Payment Mode: ${invMaster.Mode || 'Cash'}`,
                detailsX,
                175,
                detailsOptions
            );

        let yPos = Math.max(210, customerBottom + 20, doc.y + 20);

        // ==========================================
        // TABLE CONFIGURATION
        // ==========================================
        const tableStartX = 40;
        const tableWidth = 515;
        const contentBottom = 730;

        const columns = [
            { title: 'Sr', width: 17, align: 'center' },
            { title: 'Product Item Description', width: 150, align: 'left' },
            { title: 'Qty', width: 25, align: 'center' },
            { title: 'Size', width: 44, align: 'center' },
            { title: 'RAL', width: 38, align: 'center' },
            { title: 'Unit', width: 36, align: 'center' },
            { title: 'Unit Rate', width: 37, align: 'right' },
            { title: 'Disc%', width: 28, align: 'center' },
            { title: 'VAT%', width: 25, align: 'center' },
            { title: 'Taxable', width: 40, align: 'right' },
            { title: 'Unit VAT', width: 35, align: 'right' },
            { title: 'Unit Total', width: 40, align: 'right' }
        ];

        const renderTableHeaders = currentY => {
            doc.rect(tableStartX, currentY, tableWidth, 24)
                .fill('#035372');

            doc.font('Helvetica-Bold')
                .fontSize(7)
                .fillColor('#ffffff');

            let x = tableStartX;

            columns.forEach((column, index) => {
                if (index > 0) {
                    doc.moveTo(x, currentY)
                        .lineTo(x, currentY + 24)
                        .lineWidth(0.5)
                        .stroke('#ffffff');
                }

                doc.text(column.title, x + 2, currentY + 5, {
                    width: column.width - 4,
                    align: 'center'
                });

                x += column.width;
            });

            doc.font('Helvetica').fontSize(7);
        };

        if (yPos + 50 > contentBottom) {
            doc.addPage();
            yPos = 50;
        }

        renderTableHeaders(yPos);
        yPos += 26;

        let subtotalTaxable = 0;
        let subtotalVat = 0;

        // ==========================================
        // INVOICE ROWS
        // ==========================================
        invItems.forEach((item, index) => {
            const values = [
                String(index + 1),
                String(item.Item ?? 'N/A'),
                String(item.Quantity ?? 0),
                String(item.ISize ?? ''),
                String(item.IRAL ?? ''),
                String(item.IUnit ?? ''),
                money(item.UnitPrice),
                money(item.Discount),
                money(item.VatPer),
                money(item.Taxable),
                money(item.VatTotal),
                money(item.UnitTotal)
            ];

            doc.font('Helvetica').fontSize(7);

            const rowHeight = Math.max(
                20,
                ...values.map((value, columnIndex) =>
                    doc.heightOfString(value, {
                        width: columns[columnIndex].width - 4,
                        align: columns[columnIndex].align
                    }) + 10
                )
            );

            if (rowHeight > contentBottom - 76) {
                throw new Error(
                    `Invoice item ${index + 1} is too long for one PDF page.`
                );
            }

            // Check BEFORE drawing the row.
            if (yPos + rowHeight > contentBottom) {
                doc.addPage();
                yPos = 50;
                renderTableHeaders(yPos);
                yPos += 26;
            }

            doc.rect(tableStartX, yPos, tableWidth, rowHeight)
                .fill(index % 2 === 0 ? '#f8f9fa' : '#ffffff');

            doc.font('Helvetica')
                .fontSize(7)
                .fillColor('#000000');

            let x = tableStartX;

            values.forEach((value, columnIndex) => {
                const column = columns[columnIndex];

                doc.text(value, x + 2, yPos + 5, {
                    width: column.width - 4,
                    align: column.align
                });

                x += column.width;
            });

            subtotalTaxable += number(
                item.Taxable ?? item.UnitTotal ?? 0
            );

            subtotalVat += number(item.VatTotal);

            yPos += rowHeight;
        });

        // ==========================================
        // TOTALS
        // ==========================================
        yPos += 15;

        if (yPos + 85 > contentBottom) {
            doc.addPage();
            yPos = 50;
        }

        doc.moveTo(40, yPos)
            .lineTo(555, yPos)
            .lineWidth(1)
            .stroke('#0d1b2a');

        yPos += 8;

        doc.font('Helvetica')
            .fontSize(8)
            .fillColor('#415a77')
            .text('Gross Taxable Amount:', 340, yPos, {
                width: 125
            });

        doc.fillColor('#333333')
            .text(money(subtotalTaxable), 470, yPos, {
                width: 80,
                align: 'right'
            });

        yPos += 15;

        doc.fillColor('#415a77')
            .text('Total VAT Amount:', 340, yPos, {
                width: 125
            });

        doc.fillColor('#333333')
            .text(money(subtotalVat), 470, yPos, {
                width: 80,
                align: 'right'
            });

        yPos += 20;

        doc.rect(340, yPos - 4, 215, 26).fill('#f1f3f5');

        doc.fillColor('#0d1b2a')
            .font('Helvetica-Bold')
            .fontSize(9)
            .text('Grand Total (inc VAT):', 345, yPos + 2, {
                width: 115
            });

        doc.text(
            `${money(invMaster.GrandTotal)} AED`,
            465,
            yPos + 2,
            { width: 85, align: 'right' }
        );

        
            // ==========================================
            // DECLARATION AND SIGNATURE — LAST PAGE BOTTOM
            // ==========================================

            // Allow footer content below the normal document bottom margin.
            doc.page.margins.bottom = 15;

            const pageBottom = doc.page.height;
            const footerBottom = pageBottom - 18;

            const declaration =
                'Declaration: We declare that this invoice shows the actual price ' +
                'of the goods described and that all particulars are true and correct.';

            doc.font('Helvetica')
                .fontSize(8)
                .fillColor('#777777');

            const declarationWidth = 300;
            const declarationHeight = doc.heightOfString(declaration, {
                width: declarationWidth
            });

            // Align the declaration's bottom near the page bottom.
            doc.text(
                declaration,
                40,
                footerBottom - declarationHeight,
                { width: declarationWidth }
            );

            // Signature label aligned near the same bottom edge.
            const signatureLabel = 'Authorized Signatory';
            const signatureWidth = 125;

            const signatureHeight = doc.heightOfString(signatureLabel, {
                width: signatureWidth,
                align: 'center'
            });

            const signatureY = footerBottom - signatureHeight;

            doc.moveTo(425, signatureY - 8)
                .lineTo(550, signatureY - 8)
                .lineWidth(0.5)
                .stroke('#333333');

            doc.text(signatureLabel, 425, signatureY, {
                width: signatureWidth,
                align: 'center'
            });

        doc.end();

        const pdfBuffer = await pdfReady;

        // Sanitize the download filename.
        const safeFilename = (
            `${invMaster.InvoiceNo}-${invMaster.Customer || 'Invoice'}`
        )
            .replace(/[^a-zA-Z0-9._ -]/g, '_')
            .slice(0, 150);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${safeFilename}.pdf"`
        );

        return res.send(pdfBuffer);

    } catch (error) {
        if (doc && !doc.destroyed) {
            doc.destroy();
        }

        console.error("MongoDB invoice PDF generation failed:", error);

        if (!res.headersSent) {
            return res.status(500).send(
                "Failed to generate invoice PDF."
            );
        }

        res.end();
    }
});

// PRINT PRO-FORMA INVOICE
app.get('/api/print-co-proforma/:coNo', async (req, res) => {
    let doc;

    try {
        if (!db) {
            return res.status(500).send("Database engine offline.");
        }

        const quotationNo = String(req.params.coNo ?? '').trim();

        if (!quotationNo) {
            return res.status(400).send("Customer Order number is required.");
        }

        // Support numeric and string quotation numbers.
        const quotationValues = [quotationNo];
        const numericQuotationNo = Number(quotationNo);

        if (Number.isSafeInteger(numericQuotationNo)) {
            quotationValues.push(numericQuotationNo);
        }

        const quoteMaster = await db.collection('cordermain').findOne({
            CONo: { $in: quotationValues }
        });

        if (!quoteMaster) {
            return res.status(404).send("Customer Order number not found.");
        }

        if (!Array.isArray(quoteMaster.corderlist)) {
            return res.status(500).send(
                "Customer Order corderlist field is missing or is not an array."
            );
        }

        const round=value=>Math.round((value+Number.EPSILON)*100)/100;
        const quoteItems = [...quoteMaster.corderlist].sort((a,b)=>Number(a.SrNo)-Number(b.SrNo)).map(item=>{
            const numeric=value=>{const n=Number(value??0);if(!Number.isFinite(n))throw new Error('Invalid numeric CO item field.');return n;};
            const Taxable=round(numeric(item.Quantity)*numeric(item.UnitPrice)*(1-numeric(item.Discount)/100));
            const VatTotal=round(Taxable*numeric(item.VatPer)/100);
            return {...item,Taxable,VatTotal,UnitTotal:round(Taxable+VatTotal)};
        });
        if(!quoteItems.length)return res.status(400).send('This Customer Order has no items.');
        quoteMaster.GrandTotal=round(quoteItems.reduce((total,item)=>total+item.UnitTotal,0));

        const number = value => {
            const result = Number(value ?? 0);
            return Number.isFinite(result) ? result : 0;
        };

        const money = value => number(value).toFixed(2);

        const displayDate = value => {
            if (!value) return '-';

            // Avoid timezone shifts for YYYY-MM-DD strings.
            const match = String(value).match(
                /^(\d{4})-(\d{2})-(\d{2})$/
            );

            if (match) {
                return `${match[3]}/${match[2]}/${match[1]}`;
            }

            const date = new Date(value);

            return Number.isNaN(date.getTime())
                ? '-'
                : date.toLocaleDateString('en-GB');
        };

        doc = new PDFDocument({
            size: 'A4',
            margins: {
                top: 36,
                bottom: 36,
                left: 40,
                right: 36
            }
        });

        // Collect the complete PDF before sending the response.
        const chunks = [];

        const pdfReady = new Promise((resolve, reject) => {
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);
        });

        // Attach a handler immediately for asynchronous stream errors.
        pdfReady.catch(() => {});

        // ==========================================
        // COMPANY HEADER
        // ==========================================
        function renderCompanyHeader() {
        const renderTextFallbackHeader = () => {
            doc.fillColor('#252e3d')
                .font('Helvetica-Bold')
                .fontSize(14)
                .text('CENTRAL AIRTECH A/C SYSTEMS', 40, 40, {
                    width: 300
                });

            doc.font('Helvetica')
                .fontSize(9)
                .fillColor('#050505')
                .text(
                    'Musafah 34, Abu Dhabi, United Arab Emirates',
                    40,
                    65,
                    { width: 330 }
                )
                .text(
                    'www.centralairtechac.com | Email: admin@centralairtechac.com',
                    40,
                    80,
                    { width: 350 }
                );
        };

        const localLogoPath = getPdfLogoPath();

        const logoPath = fs.existsSync(localLogoPath)
            ? localLogoPath
            : getPdfLogoPath();

        if (fs.existsSync(logoPath)) {
            try {
                doc.image(fs.readFileSync(logoPath), 40, 35, {
                    fit: [300, 43]
                });

                doc.fillColor('#050505')
                    .fontSize(9)
                    .font('Helvetica')
                    .text(
                        'Musafah 34, Abu Dhabi, United Arab Emirates',
                        40,
                        85,
                        { width: 350 }
                    )
                    .text(
                        'www.centralairtechac.com | Email: admin@centralairtechac.com',
                        40,
                        97,
                        { width: 350 }
                    );
            } catch (imageError) {
                console.error("Failed to load quotation logo:", imageError);
                renderTextFallbackHeader();
            }
        } else {
            renderTextFallbackHeader();
        }

        doc.fillColor('#050505')
            .font('Helvetica-Bold')
            .fontSize(18)
            .text('PRO-FORMA INVOICE', 365, 40, {
                width: 190,
                align: 'right'
            });

        doc.font('Helvetica')
            .fontSize(9)
            .text(
                'Not a Tax Invoice',
                365,
                62,
                { width: 190, align: 'right' }
            );

        doc.moveTo(40, 115)
            .lineTo(555, 115)
            .lineWidth(1)
            .stroke('#0d1b2a');

        }

        renderCompanyHeader();

        doc.fillColor('#0d1b2a')
            .font('Helvetica-Bold')
            .fontSize(10)
            .text('BILLED TO:', 40, 130, { width: 257.5 });

        doc.font('Helvetica')
            .fillColor('#333333')
            .text(
                String(quoteMaster.Customer || 'CASH CUSTOMER'),
                40,
                145,
                { width: 257.5 }
            );

        let customerBottom = doc.y + 5;
        doc.font('Helvetica').fontSize(8);
        for (const line of [
            `PO Box: ${quoteMaster.PostBox || '-'} | Emirate: ${quoteMaster.Emirate || '-'}`,
            `Address: ${quoteMaster.Address || '-'}`,
            `TRN: ${quoteMaster.VatID || '-'}`,
            `Attn: ${quoteMaster.CustContact || '-'} | Contact: ${quoteMaster.CustConNumber || '-'}`
        ]) {
            doc.text(line, 40, customerBottom, { width: 260 });
            customerBottom = doc.y + 4;
        }
        let detailsY = 130;
        doc.font('Helvetica-Bold').fontSize(10).text('PRO-FORMA INVOICE', 315, detailsY, {width:240, align:'right'});
        detailsY += 16;
        doc.font('Helvetica').fontSize(8);
        for (const line of [
            `PI No: ${("PI-" + quoteMaster.CONo)} | Date: ${displayDate(quoteMaster.CODate)}`,
            `Project: ${quoteMaster.ProjectName || '-'}`,
            `CO No: ${quoteMaster.CONo} | LPO: ${quoteMaster.LPONo || '-'}`,
            `Delivery Date: ${displayDate(quoteMaster.DeliveryDate)}`,
            `Payment: ${quoteMaster.PaymentTerms || '-'}`,
            `Our Contact: ${quoteMaster.OurContact || '-'} | ${quoteMaster.OurNumber || '-'}`
        ]) {
            doc.text(line, 315, detailsY, {width:240, align:'right'});
            detailsY = doc.y + 4;
        }
        let yPos = Math.max(customerBottom, detailsY) + 10;

        // ==========================================
        // TABLE CONFIGURATION
        // ==========================================
        const tableStartX = 40;
        const tableWidth = 515;
        const contentBottom = 705;

        const columns = [
            { title: 'Sr#', width: 19, align: 'center' },
            { title: 'Item Description', width: 139, align: 'left' },
            { title: 'Qty', width: 26, align: 'center' },
            { title: 'Size', width: 43, align: 'center' },
            { title: 'RAL', width: 28, align: 'center' },
            { title: 'Unit', width: 29, align: 'center' },
            { title: 'Unit Price', width: 41, align: 'right' },
            { title: 'Disc%', width: 27, align: 'center' },
            { title: 'VAT%', width: 25, align: 'center' },
            { title: 'Taxable', width: 47, align: 'right' },
            { title: 'VAT Total', width: 43, align: 'right' },
            { title: 'Unit Total', width: 48, align: 'right' }
        ];

        const renderTableHeaders = currentY => {
            doc.rect(tableStartX, currentY, tableWidth, 24)
                .fill('#035372');

            doc.font('Helvetica-Bold')
                .fontSize(7)
                .fillColor('#ffffff');

            let x = tableStartX;

            columns.forEach((column, index) => {
                if (index > 0) {
                    doc.moveTo(x, currentY)
                        .lineTo(x, currentY + 24)
                        .lineWidth(0.5)
                        .stroke('#ffffff');
                }

                doc.text(column.title, x + 2, currentY + 5, {
                    width: column.width - 4,
                    align: 'center'
                });

                x += column.width;
            });

            doc.font('Helvetica').fontSize(7);
        };

        if (yPos + 50 > contentBottom) {
            doc.addPage();
            yPos = 50;
        }

        renderTableHeaders(yPos);
        yPos += 26;

        let subtotalTaxable = 0;
        let subtotalVat = 0;

        // ==========================================
        // INVOICE ROWS
        // ==========================================
        quoteItems.forEach((item, index) => {
            const values = [
                String(index + 1),
                String(item.Item ?? 'N/A'),
                String(item.Quantity ?? 0),
                String(item.ISize ?? ''),
                String(item.IRAL ?? ''),
                String(item.IUnit ?? ''),
                money(item.UnitPrice),
                money(item.Discount),
                money(item.VatPer),
                money(item.Taxable),
                money(item.VatTotal),
                money(item.UnitTotal)
            ];

            doc.font('Helvetica').fontSize(7);

            const rowHeight = Math.max(
                20,
                ...values.map((value, columnIndex) =>
                    doc.heightOfString(value, {
                        width: columns[columnIndex].width - 4,
                        align: columns[columnIndex].align
                    }) + 10
                )
            );

            if (rowHeight > contentBottom - 76) {
                throw new Error(
                    `Quotation item ${index + 1} is too long for one PDF page.`
                );
            }

            // Check BEFORE drawing the row.
            if (yPos + rowHeight > contentBottom) {
                doc.addPage();
                yPos = 50;
                renderTableHeaders(yPos);
                yPos += 26;
            }

            doc.rect(tableStartX, yPos, tableWidth, rowHeight)
                .fill(index % 2 === 0 ? '#f8f9fa' : '#ffffff');

            doc.font('Helvetica')
                .fontSize(7)
                .fillColor('#000000');

            let x = tableStartX;

            values.forEach((value, columnIndex) => {
                const column = columns[columnIndex];

                doc.text(value, x + 2, yPos + 5, {
                    width: column.width - 4,
                    align: column.align
                });

                x += column.width;
            });

            subtotalTaxable += number(
                item.Taxable ?? item.UnitTotal ?? 0
            );

            subtotalVat += number(item.VatTotal);

            yPos += rowHeight;
        });

        // Totals and notes stay together and move to the next page when necessary.
        const notes = `Notes: ${quoteMaster.Description || '-'}`;
        const inWords = `Amount in words: ${quoteMaster.InWords || '-'}`;
        doc.font('Helvetica').fontSize(8);
        const leftHeight = doc.heightOfString(notes, {width:285}) + doc.heightOfString(inWords, {width:285}) + 18;
        const summaryHeight = Math.max(78, leftHeight);
        if (summaryHeight > contentBottom - 60) throw new Error('Quotation notes are too long for the summary page.');
        if (yPos + summaryHeight + 12 > contentBottom) { doc.addPage(); yPos = 50; }
        yPos += 10;
        doc.moveTo(40, yPos).lineTo(555, yPos).lineWidth(0.6).stroke('#777777');
        yPos += 8;
        doc.font('Helvetica').fontSize(8).fillColor('#333333').text(notes, 40, yPos, {width:285});
        const wordsY = doc.y + 8;
        doc.font('Helvetica-Bold').text(inWords, 40, wordsY, {width:285});
        const summaryRows = [
            ['Taxable Amount:', money(subtotalTaxable)],
            ['Total VAT:', money(subtotalVat)],
            ['Pro-Forma Total:', money(quoteMaster.GrandTotal)]
        ];
        summaryRows.forEach(([label, value], index) => {
            const y = yPos + index * 20;
            if (index === 2) doc.rect(340, y - 4, 215, 23).fill('#f1f3f5');
            doc.font(index === 2 ? 'Helvetica-Bold' : 'Helvetica').fontSize(9).fillColor('#0d1b2a');
            doc.text(label, 345, y, {width:120});
            doc.text(value, 467, y, {width:83, align:'right'});
        });
        // Authorised signature on the final page.
        const signatureBaseY = Math.max(730, yPos + summaryHeight + 12);
        doc.font('Helvetica').fontSize(8).text('For CENTRAL AIR TECH', 395, signatureBaseY + 10, {width:160, align:'right'});
        doc.moveTo(425, signatureBaseY + 50).lineTo(555, signatureBaseY + 50).lineWidth(0.5).stroke('#777777');
        doc.text('Authorised Signatory', 395, signatureBaseY + 55, {width:160, align:'right'});

        doc.end();

        const pdfBuffer = await pdfReady;

        // Sanitize the download filename.
        const safeFilename = (
            `${("PI-" + quoteMaster.CONo)}-${quoteMaster.Customer || 'Quotation'}`
        )
            .replace(/[^a-zA-Z0-9._ -]/g, '_')
            .slice(0, 150);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${safeFilename}.pdf"`
        );

        return res.send(pdfBuffer);

    } catch (error) {
        if (doc && !doc.destroyed) {
            if (typeof doc.destroy === 'function') doc.destroy();
        }

        console.error("MongoDB pro-forma invoice PDF generation failed:", error);

        if (!res.headersSent) {
            return res.status(500).send(
                "Failed to generate pro-forma invoice PDF."
            );
        }

        res.end();
    }
});

// PRINT CO REPORTS
app.post(['/api/co-report-full','/api/co-report-single'], async (req, res) => {
    let doc;
    try {
        if (!db) return res.status(500).json({success:false,error:'Database engine offline.'});
        const fail=message=>{const error=new Error(message);error.statusCode=400;throw error;};
        const single=req.path==='/api/co-report-single';
        const input=req.body||{},type=String(input.type||'ALL').toUpperCase();
        if(!['ALL','DELIVERED','PENDING'].includes(type))fail('Invalid report type.');
        const date=value=>{
            const s=String(value??'').trim();if(!s)return '';
            const d=new Date(s+'T00:00:00Z');
            if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==s)fail('Invalid report date.');return s;
        };
        let from=date(input.startDate),to=date(input.endDate);
        // Dubai calendar dates, including when the server runs in a different timezone.
        const now=new Date(Date.now()+4*3600000),today=now.toISOString().slice(0,10);
        const monthStart=offset=>new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()+offset,1)).toISOString().slice(0,10);
        const range=String(input.timeRange||'3MONTH');
        if(!from&&!to){
            if(range==='CURRENT_MONTH'){from=monthStart(0);to=today;}
            else if(range==='LAST_MONTH'){from=monthStart(-1);to=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),0)).toISOString().slice(0,10);}
            else if(['2MONTH','3MONTH','6MONTH'].includes(range)){from=monthStart(1-Number(range.replace('MONTH','')));to=today;}
            else if(range==='CURRENT_YEAR'){from=`${now.getUTCFullYear()}-01-01`;to=today;}
            else if(range!=='FULL')fail('Select dates or a valid date range.');
        }
        if(from&&to&&from>to)fail('From Date must not be after To Date.');
        const filter={};const customer=String(input.customer??'').trim();
        if(single&&!customer)fail('Customer is required for a single-customer report.');
        if(single)filter.Customer={$regex:'^'+customer.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$',$options:'i'};
        if(from||to){filter.CODate={};if(from)filter.CODate.$gte=from;if(to)filter.CODate.$lte=to;}
        const masters=await db.collection('cordermain').find(filter).sort({CODate:-1,CONo:-1}).toArray();
        const n=value=>{const v=Number(value??0);return Number.isFinite(v)?v:0;};
        const round=v=>Math.round((v+Number.EPSILON)*100)/100,money=v=>n(v).toFixed(2);
        const orders=masters.map(master=>{
            const items=(Array.isArray(master.corderlist)?master.corderlist:[]).map(item=>{
                const qty=n(item.Quantity),delivered=Math.min(qty,Math.max(0,n(item.DQuantity))),pending=qty-delivered;
                const net=n(item.UnitPrice)*(1-n(item.Discount)/100),tax=round(qty*net),vat=round(tax*n(item.VatPer)/100),total=round(tax+vat);
                const dTax=round(delivered*net),dTotal=round(dTax+round(dTax*n(item.VatPer)/100));
                return {...item,qty,delivered,pending,tax,total,dTotal,pTotal:round(total-dTotal)};
            }).sort((a,b)=>n(a.SrNo)-n(b.SrNo));
            const sum=key=>round(items.reduce((v,item)=>v+item[key],0));
            const status=items.length?(items.every(i=>i.pending===0)?'Delivered':items.every(i=>i.delivered===0)?'Pending':'Partial'):String(master.Status||'Pending');
            return {master,items,status,total:sum('total'),delivered:sum('dTotal'),pending:sum('pTotal')};
        }).filter(order=>type==='ALL'||(type==='DELIVERED'?order.status.toLowerCase()==='delivered':['pending','partial'].includes(order.status.toLowerCase())));
        if(!orders.length)return res.status(404).json({success:false,error:'No Customer Orders match the selected type and dates.'});
        doc=new PDFDocument({size:'A4',layout:'portrait',margins:{top:36,bottom:36,left:40,right:40},bufferPages:true});
        const chunks=[];const ready=new Promise((resolve,reject)=>{doc.on('data',c=>chunks.push(c));doc.on('end',()=>resolve(Buffer.concat(chunks)));doc.on('error',reject);});ready.catch(()=>{});
        const left=40,width=doc.page.width-80,bottom=doc.page.height-42;
        const formatDate=value=>{const s=String(value||'').slice(0,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return '-';const [y,m,d]=s.split('-');return `${d}-${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][Number(m)-1]}-${y.slice(-2)}`;};
        const period=from||to?`${from?formatDate(from):'Beginning'} - ${to?formatDate(to):'Latest'}`:'All History';
        const columns=[['Sr#',19],['Products Description',158],['Order\nQty',28],['Deliver\nQty',28],['Pending\nQty',34],['Unit Price',40],['Less\nDisc.%',30],['Taxable',40],['Unit Total',40],['Delivered\nTotal',49],['Pending\nTotal',49]];
        // Make the final column absorb rounding so the table fills exactly the printable width.
        columns[columns.length-1][1]+=width-columns.reduce((v,c)=>v+c[1],0);
        let y=0;
        function pageHeader(){
        const renderTextFallbackHeader = () => {
            doc.fillColor('#252e3d')
                .font('Helvetica-Bold')
                .fontSize(14)
                .text('AL FAJAR ERP SYSTEMS', 40, 40, {
                    width: 300
                });

            doc.font('Helvetica')
                .fontSize(9)
                .fillColor('#050505')
                .text(
                    'Musafah 34, Abu Dhabi, United Arab Emirates',
                    40,
                    65,
                    { width: 330 }
                )
                .text(
                    'www.centralairtechac.com | Email: admin@centralairtechac.com',
                    40,
                    80,
                    { width: 350 }
                );
        };

        const localLogoPath = getPdfLogoPath();

        const logoPath = fs.existsSync(localLogoPath)
            ? localLogoPath
            : getPdfLogoPath();

        if (fs.existsSync(logoPath)) {
            try {
                doc.image(fs.readFileSync(logoPath), 40, 35, {
                    fit: [300, 43]
                });

                doc.fillColor('#050505')
                    .fontSize(9)
                    .font('Helvetica')
                    .text(
                        'Musafah 34, Abu Dhabi, United Arab Emirates',
                        40,
                        85,
                        { width: 350 }
                    )
                    .text(
                        'www.centralairtechac.com | Email: admin@centralairtechac.com',
                        40,
                        97,
                        { width: 350 }
                    );
            } catch (imageError) {
                console.error("Failed to load invoice logo:", imageError);
                renderTextFallbackHeader();
            }
        } else {
            renderTextFallbackHeader();
        }

            doc.moveTo(left,115).lineTo(left+width,115).lineWidth(.7).stroke('#93a8b8');
            doc.font('Helvetica-Bold').fontSize(11).fillColor('#17628c').text(`CUSTOMER ORDERS-${type} (${period})`,left,126,{width,align:'right'});
            doc.font('Helvetica').fontSize(7).fillColor('#526373').text(single?`Customer: ${customer}`:'Pending includes partially delivered orders',left,145,{width});y=Math.max(164,doc.y+12);
        }

        function newPage(){doc.addPage();pageHeader();}
        function orderHeader(order,continued=false){
            const m=order.master,bar=`${m.Customer||'-'}  |  ${m.Emirate||'-'}`;
            doc.font('Helvetica-Bold').fontSize(9);
            const barHeight=Math.max(25,doc.heightOfString(bar,{width:width-100})+12);
            doc.rect(left,y,width,barHeight).fill('#35414d');doc.fillColor('white').text(bar,left+7,y+6,{width:width-110});
            doc.text(order.status,left+width-93,y+6,{width:86,align:'right'});y+=barHeight;
            doc.rect(left,y,width,55).lineWidth(.5).stroke('#9eabb6');
            const labels=[`CO Date: ${formatDate(m.CODate)}`,`CO Number: ${m.CONo}${continued?' (continued)':''}`,`LPO No: ${m.LPONo||'-'}`];
            labels.forEach((text,i)=>doc.font('Helvetica').fontSize(8).fillColor('#172633').text(text,left+7,y+6+i*15,{width:width-270}));
            [`Order Total: ${money(order.total)}`,`Delivered Total: ${money(order.delivered)}`,`Pending Total: ${money(order.pending)}`].forEach((text,i)=>doc.font('Helvetica-Bold').fontSize(8).text(text,left+width-255,y+6+i*15,{width:248,align:'right'}));y+=60;
        }
        function tableHeader(){let x=left;columns.forEach(([title,w])=>{doc.rect(x,y,w,29).fillAndStroke('#e8eef3','#aab6c1');doc.font('Helvetica-Bold').fontSize(6.5).fillColor('#243746').text(title,x+3,y+5,{width:w-6,align:'center'});x+=w;});y+=29;}
        pageHeader();
        for(const order of orders){
            doc.font('Helvetica-Bold').fontSize(9);
            const headerHeight=Math.max(25,doc.heightOfString(`${order.master.Customer||'-'}  |  ${order.master.Emirate||'-'}`,{width:width-100})+12)+60+29;
            if(y+headerHeight+32>bottom)newPage();
            orderHeader(order);tableHeader();
            for(const [index,item]of order.items.entries()){
                const values=[String(index+1),String(item.Item||'-'),String(item.qty),String(item.delivered),String(item.pending),money(item.UnitPrice),money(item.Discount),money(item.tax),money(item.total),money(item.dTotal),money(item.pTotal)];
                doc.font('Helvetica').fontSize(6.5);
                const height=Math.max(16,...values.map((value,i)=>doc.heightOfString(value,{width:columns[i][1]-8})+6));
                if(height>bottom-290)throw new Error('A product description is too long for one report page.');
                if(y+height>bottom){newPage();orderHeader(order,true);tableHeader();}
                let x=left;
                values.forEach((value,i)=>{const w=columns[i][1];doc.rect(x,y,w,height).fillAndStroke(index%2?'#f5f8fa':'white','#c4cdd5');doc.font('Helvetica').fontSize(6.5).fillColor('#172633').text(value,x+4,y+3,{width:w-8,align:i===1?'left':i>=5?'right':'center'});x+=w;});y+=height;
            }
            if(!order.items.length){doc.font('Helvetica').fontSize(8).fillColor('#526373').text('No items recorded.',left+8,y+8,{width});y+=28;}
            y+=16;
        }
        if(y+48>bottom)newPage();
        const sum=key=>orders.reduce((v,order)=>v+order[key],0);
        doc.rect(left,y,width,38).fill('#e8eef3');doc.font('Helvetica-Bold').fontSize(9).fillColor('#17628c').text(`Orders: ${orders.length}     Order Total: ${money(sum('total'))}     Delivered: ${money(sum('delivered'))}     Pending: ${money(sum('pending'))}`,left+8,y+12,{width:width-16,align:'right'});
        const pages=doc.bufferedPageRange();for(let p=pages.start;p<pages.start+pages.count;p++){doc.switchToPage(p);const footerMargin=doc.page.margins.bottom;doc.page.margins.bottom=0;doc.font('Helvetica').fontSize(8).fillColor('#687b8a').text(`Page ${p+1} of ${pages.count}`,left,doc.page.height-35,{width,align:'right',lineBreak:false});doc.page.margins.bottom=footerMargin;}
        doc.end();const pdf=await ready;
        res.setHeader('Content-Type','application/pdf');res.setHeader('Content-Disposition',`attachment; filename="CO-Report-${type}-${from||'ALL'}-${to||'ALL'}.pdf"`);return res.send(pdf);
    }catch(error){
        if(doc&&typeof doc.destroy==='function'&&!doc.destroyed)doc.destroy();
        console.error('CO Full Report PDF failed:',error);
        if(!res.headersSent)return res.status(error.statusCode||500).json({success:false,error:error.statusCode?error.message:'Could not generate the Customer Order report.'});
        res.end();
    }
});





// PRINT QUOTATION SIMPLE
app.get('/api/print-quotation/:quotationNo', async (req, res) => {
    let doc;

    try {
        if (!db) {
            return res.status(500).send("Database engine offline.");
        }

        const quotationNo = String(req.params.quotationNo ?? '').trim();

        if (!quotationNo) {
            return res.status(400).send("Quotation number is required.");
        }

        // Support numeric and string quotation numbers.
        const quotationValues = [quotationNo];
        const numericQuotationNo = Number(quotationNo);

        if (Number.isSafeInteger(numericQuotationNo)) {
            quotationValues.push(numericQuotationNo);
        }

        const quoteMaster = await db.collection('quotmain').findOne({
            QuotationNo: { $in: quotationValues }
        });

        if (!quoteMaster) {
            return res.status(404).send("Quotation number not found.");
        }

        if (!Array.isArray(quoteMaster.quotations)) {
            return res.status(500).send(
                "Quotation quotations field is missing or is not an array."
            );
        }

        const quoteItems = [...quoteMaster.quotations].sort(
            (a, b) => Number(a.SrNo) - Number(b.SrNo)
        );

        const number = value => {
            const result = Number(value ?? 0);
            return Number.isFinite(result) ? result : 0;
        };

        const money = value => number(value).toFixed(2);

        const displayDate = value => {
            if (!value) return '-';

            // Avoid timezone shifts for YYYY-MM-DD strings.
            const match = String(value).match(
                /^(\d{4})-(\d{2})-(\d{2})$/
            );

            if (match) {
                return `${match[3]}/${match[2]}/${match[1]}`;
            }

            const date = new Date(value);

            return Number.isNaN(date.getTime())
                ? '-'
                : date.toLocaleDateString('en-GB');
        };

        doc = new PDFDocument({
            size: 'A4',
            margins: {
                top: 36,
                bottom: 36,
                left: 40,
                right: 36
            }
        });

        // Collect the complete PDF before sending the response.
        const chunks = [];

        const pdfReady = new Promise((resolve, reject) => {
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);
        });

        // Attach a handler immediately for asynchronous stream errors.
        pdfReady.catch(() => {});

        // ==========================================
        // COMPANY HEADER
        // ==========================================
        function renderCompanyHeader() {
        const renderTextFallbackHeader = () => {
            doc.fillColor('#252e3d')
                .font('Helvetica-Bold')
                .fontSize(14)
                .text('CENTRAL AIRTECH A/C SYSTEMS', 40, 40, {
                    width: 300
                });

            doc.font('Helvetica')
                .fontSize(9)
                .fillColor('#050505')
                .text(
                    'Musafah 34, Abu Dhabi, United Arab Emirates',
                    40,
                    65,
                    { width: 330 }
                )
                .text(
                    'www.centralairtechac.com | Email: admin@centralairtechac.com',
                    40,
                    80,
                    { width: 350 }
                );
        };

        const localLogoPath = getPdfLogoPath();

        const logoPath = fs.existsSync(localLogoPath)
            ? localLogoPath
            : getPdfLogoPath();

        if (fs.existsSync(logoPath)) {
            try {
                doc.image(fs.readFileSync(logoPath), 40, 35, {
                    fit: [300, 43]
                });

                doc.fillColor('#050505')
                    .fontSize(9)
                    .font('Helvetica')
                    .text(
                        'Musafah 34, Abu Dhabi, United Arab Emirates',
                        40,
                        85,
                        { width: 350 }
                    )
                    .text(
                        'www.centralairtechac.com | Email: admin@centralairtechac.com',
                        40,
                        97,
                        { width: 350 }
                    );
            } catch (imageError) {
                console.error("Failed to load quotation logo:", imageError);
                renderTextFallbackHeader();
            }
        } else {
            renderTextFallbackHeader();
        }

        doc.fillColor('#050505')
            .font('Helvetica-Bold')
            .fontSize(18)
            .text('QUOTATION', 365, 40, {
                width: 190,
                align: 'right'
            });

        doc.font('Helvetica')
            .fontSize(9)
            .text(
                'TRN 104652045600003',
                365,
                62,
                { width: 190, align: 'right' }
            );

        doc.moveTo(40, 115)
            .lineTo(555, 115)
            .lineWidth(1)
            .stroke('#0d1b2a');

        }

        renderCompanyHeader();

        doc.fillColor('#0d1b2a')
            .font('Helvetica-Bold')
            .fontSize(10)
            .text('BILLED TO:', 40, 130, { width: 257.5 });

        doc.font('Helvetica')
            .fillColor('#333333')
            .text(
                String(quoteMaster.Customer || 'CASH CUSTOMER'),
                40,
                145,
                { width: 257.5 }
            );

        let customerBottom = doc.y + 5;
        doc.font('Helvetica').fontSize(8);
        for (const line of [
            `PO Box: ${quoteMaster.Postbox || '-'} | Emirate: ${quoteMaster.Emirate || '-'}`,
            `Address: ${quoteMaster.Address || '-'}`,
            `TRN: ${quoteMaster.VatNo || '-'}`,
            `Attn: ${quoteMaster.CustContact || '-'} | Contact: ${quoteMaster.ContactNo || '-'}`
        ]) {
            doc.text(line, 40, customerBottom, { width: 260 });
            customerBottom = doc.y + 4;
        }
        let detailsY = 130;
        doc.font('Helvetica-Bold').fontSize(10).text('QUOTATION DETAILS', 315, detailsY, {width:240, align:'right'});
        detailsY += 16;
        doc.font('Helvetica').fontSize(8);
        for (const line of [
            `Quote No: ${quoteMaster.QuotationNo} | Date: ${displayDate(quoteMaster.QuotationDate)}`,
            `Project: ${quoteMaster.ProjectName || '-'}`,
            `Our Ref: ${quoteMaster.RefNo || '-'} | Validity: ${quoteMaster.Validity || '-'}`,
            `Delivery: ${quoteMaster.DeliveryTerms || '-'}`,
            `Payment: ${quoteMaster.PaymentTerms || '-'}`,
            `Our Contact: ${quoteMaster.OurContact || '-'} | ${quoteMaster.OurNumber || '-'}`
        ]) {
            doc.text(line, 315, detailsY, {width:240, align:'right'});
            detailsY = doc.y + 4;
        }
        // let yPos = Math.max(customerBottom, detailsY) + 10;
        // doc.font('Helvetica-Bold').fontSize(8).text(`Subject: ${quoteMaster.Subject || '-'}`, 40, yPos, {width:515});
        yPos = doc.y + 10;

        // ==========================================
        // TABLE CONFIGURATION
        // ==========================================
        const tableStartX = 40;
        const tableWidth = 515;
        const contentBottom = 780;

        const columns = [
            { title: 'Sr#', width: 19, align: 'center' },
            { title: 'Item Description', width: 141, align: 'left' },
            { title: 'Qty', width: 26, align: 'center' },
            { title: 'Size', width: 46, align: 'center' },
            { title: 'RAL', width: 28, align: 'center' },
            { title: 'Unit', width: 34, align: 'center' },
            { title: 'Unit Price', width: 40, align: 'right' },
            { title: 'Disc%', width: 27, align: 'center' },
            { title: 'VAT%', width: 25, align: 'center' },
            { title: 'Taxable', width: 40, align: 'right' },
            { title: 'VAT Total', width: 38, align: 'right' },
            { title: 'Unit Total', width: 41, align: 'right' }
        ];

        const renderTableHeaders = currentY => {
            doc.rect(tableStartX, currentY, tableWidth, 24)
                .fill('#035372');

            doc.font('Helvetica-Bold')
                .fontSize(7)
                .fillColor('#ffffff');

            let x = tableStartX;

            columns.forEach((column, index) => {
                if (index > 0) {
                    doc.moveTo(x, currentY)
                        .lineTo(x, currentY + 24)
                        .lineWidth(0.5)
                        .stroke('#ffffff');
                }

                doc.text(column.title, x + 2, currentY + 5, {
                    width: column.width - 4,
                    align: 'center'
                });

                x += column.width;
            });

            doc.font('Helvetica').fontSize(7);
        };

        if (yPos + 50 > contentBottom) {
            doc.addPage();
            yPos = 50;
        }

        renderTableHeaders(yPos);
        yPos += 26;

        let subtotalTaxable = 0;
        let subtotalVat = 0;

        // ==========================================
        // INVOICE ROWS
        // ==========================================
        quoteItems.forEach((item, index) => {
            const values = [
                String(index + 1),
                String(item.Item ?? 'N/A'),
                String(item.Quantity ?? 0),
                String(item.ISize ?? ''),
                String(item.IRAL ?? ''),
                String(item.IUnit ?? ''),
                money(item.UnitPrice),
                money(item.LessDiscount),
                money(item.VatPer),
                money(item.UnitTaxable),
                money(item.VatTotal),
                money(item.TotalPrice)
            ];

            doc.font('Helvetica').fontSize(7);

            const rowHeight = Math.max(
                20,
                ...values.map((value, columnIndex) =>
                    doc.heightOfString(value, {
                        width: columns[columnIndex].width - 4,
                        align: columns[columnIndex].align
                    }) + 10
                )
            );

            if (rowHeight > contentBottom - 76) {
                throw new Error(
                    `Quotation item ${index + 1} is too long for one PDF page.`
                );
            }

            // Check BEFORE drawing the row.
            if (yPos + rowHeight > contentBottom) {
                doc.addPage();
                yPos = 50;
                renderTableHeaders(yPos);
                yPos += 26;
            }

            doc.rect(tableStartX, yPos, tableWidth, rowHeight)
                .fill(index % 2 === 0 ? '#f8f9fa' : '#ffffff');

            doc.font('Helvetica')
                .fontSize(7)
                .fillColor('#000000');

            let x = tableStartX;

            values.forEach((value, columnIndex) => {
                const column = columns[columnIndex];

                doc.text(value, x + 2, yPos + 5, {
                    width: column.width - 4,
                    align: column.align
                });

                x += column.width;
            });

            subtotalTaxable += number(
                item.UnitTaxable ?? item.TotalPrice ?? 0
            );

            subtotalVat += number(item.VatTotal);

            yPos += rowHeight;
        });

        // Totals and notes stay together and move to the next page when necessary.
        const notes = `Notes: ${quoteMaster.Notes || '-'}`;
        const inWords = `Amount in words: ${quoteMaster.InWords || '-'}`;
        doc.font('Helvetica').fontSize(8);
        const leftHeight = doc.heightOfString(notes, {width:285}) + doc.heightOfString(inWords, {width:285}) + 18;
        const summaryHeight = Math.max(78, leftHeight);
        if (summaryHeight > contentBottom - 60) throw new Error('Quotation notes are too long for the summary page.');
        if (yPos + summaryHeight + 12 > contentBottom) { doc.addPage(); yPos = 50; }
        yPos += 10;
        doc.moveTo(40, yPos).lineTo(555, yPos).lineWidth(0.6).stroke('#777777');
        yPos += 8;
        doc.font('Helvetica').fontSize(8).fillColor('#333333').text(notes, 40, yPos, {width:285});
        const wordsY = doc.y + 8;
        doc.font('Helvetica-Bold').text(inWords, 40, wordsY, {width:285});
        const summaryRows = [
            ['Taxable Amount:', money(subtotalTaxable)],
            ['Total VAT:', money(subtotalVat)],
            ['Quotation Total:', money(quoteMaster.GrandTotal)]
        ];
        summaryRows.forEach(([label, value], index) => {
            const y = yPos + index * 20;
            if (index === 2) doc.rect(340, y - 4, 215, 23).fill('#f1f3f5');
            doc.font(index === 2 ? 'Helvetica-Bold' : 'Helvetica').fontSize(9).fillColor('#0d1b2a');
            doc.text(label, 345, y, {width:120});
            doc.text(value, 467, y, {width:83, align:'right'});
        });
        // Authorised signature on the final page.
        const signatureBaseY = Math.max(730, yPos + summaryHeight + 12);
        doc.font('Helvetica').fontSize(8).text('For CENTRAL AIR TECH', 395, signatureBaseY + 10, {width:160, align:'right'});
        doc.moveTo(425, signatureBaseY + 50).lineTo(555, signatureBaseY + 50).lineWidth(0.5).stroke('#777777');
        doc.text('Authorised Signatory', 395, signatureBaseY + 55, {width:160, align:'right'});

        doc.end();

        const pdfBuffer = await pdfReady;

        // Sanitize the download filename.
        const safeFilename = (
            `${quoteMaster.QuotationNo}-${quoteMaster.Customer || 'Quotation'}`
        )
            .replace(/[^a-zA-Z0-9._ -]/g, '_')
            .slice(0, 150);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${safeFilename}.pdf"`
        );

        return res.send(pdfBuffer);

    } catch (error) {
        if (doc && !doc.destroyed) {
            doc.destroy();
        }

        console.error("MongoDB quotation PDF generation failed:", error);

        if (!res.headersSent) {
            return res.status(500).send(
                "Failed to generate quotation PDF."
            );
        }

        res.end();
    }
});

// PRINT QUOTATION COVERING
app.get('/api/print-quotation-cover/:quotationNo', async (req, res) => {
    let doc;

    try {
        if (!db) {
            return res.status(500).send("Database engine offline.");
        }

        const quotationNo = String(req.params.quotationNo ?? '').trim();

        if (!quotationNo) {
            return res.status(400).send("Quotation number is required.");
        }

        // Support numeric and string quotation numbers.
        const quotationValues = [quotationNo];
        const numericQuotationNo = Number(quotationNo);

        if (Number.isSafeInteger(numericQuotationNo)) {
            quotationValues.push(numericQuotationNo);
        }

        const quoteMaster = await db.collection('quotmain').findOne({
            QuotationNo: { $in: quotationValues }
        });

        if (!quoteMaster) {
            return res.status(404).send("Quotation number not found.");
        }

        if (!Array.isArray(quoteMaster.quotations)) {
            return res.status(500).send(
                "Quotation quotations field is missing or is not an array."
            );
        }

        const quoteItems = [...quoteMaster.quotations].sort(
            (a, b) => Number(a.SrNo) - Number(b.SrNo)
        );

        const number = value => {
            const result = Number(value ?? 0);
            return Number.isFinite(result) ? result : 0;
        };

        const money = value => number(value).toFixed(2);

        const displayDate = value => {
            if (!value) return '-';

            // Avoid timezone shifts for YYYY-MM-DD strings.
            const match = String(value).match(
                /^(\d{4})-(\d{2})-(\d{2})$/
            );

            if (match) {
                return `${match[3]}/${match[2]}/${match[1]}`;
            }

            const date = new Date(value);

            return Number.isNaN(date.getTime())
                ? '-'
                : date.toLocaleDateString('en-GB');
        };

        doc = new PDFDocument({
            size: 'A4',
            margins: {
                top: 36,
                bottom: 36,
                left: 40,
                right: 36
            }
        });

        // Collect the complete PDF before sending the response.
        const chunks = [];

        const pdfReady = new Promise((resolve, reject) => {
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);
        });

        // Attach a handler immediately for asynchronous stream errors.
        pdfReady.catch(() => {});

        // ==========================================
        // COMPANY HEADER
        // ==========================================
        function renderCompanyHeader() {
        const renderTextFallbackHeader = () => {
            doc.fillColor('#252e3d')
                .font('Helvetica-Bold')
                .fontSize(14)
                .text('CENTRAL AIRTECH A/C SYSTEMS', 40, 40, {
                    width: 300
                });

            doc.font('Helvetica')
                .fontSize(9)
                .fillColor('#050505')
                .text(
                    'Musafah 34, Abu Dhabi, United Arab Emirates',
                    40,
                    65,
                    { width: 330 }
                )
                .text(
                    'www.centralairtechac.com | Email: admin@centralairtechac.com',
                    40,
                    80,
                    { width: 350 }
                );
        };

        const localLogoPath = getPdfLogoPath();

        const logoPath = fs.existsSync(localLogoPath)
            ? localLogoPath
            : getPdfLogoPath();

        if (fs.existsSync(logoPath)) {
            try {
                doc.image(fs.readFileSync(logoPath), 40, 35, {
                    fit: [300, 43]
                });

                doc.fillColor('#050505')
                    .fontSize(9)
                    .font('Helvetica')
                    .text(
                        'Musafah 34, Abu Dhabi, United Arab Emirates',
                        40,
                        85,
                        { width: 350 }
                    )
                    .text(
                        'www.centralairtechac.com | Email: admin@centralairtechac.com',
                        40,
                        97,
                        { width: 350 }
                    );
            } catch (imageError) {
                console.error("Failed to load quotation logo:", imageError);
                renderTextFallbackHeader();
            }
        } else {
            renderTextFallbackHeader();
        }

        doc.fillColor('#050505')
            .font('Helvetica-Bold')
            .fontSize(18)
            .text('QUOTATION', 365, 40, {
                width: 190,
                align: 'right'
            });

        doc.font('Helvetica')
            .fontSize(9)
            .text(
                'TRN 104652045600003',
                365,
                62,
                { width: 190, align: 'right' }
            );

        doc.moveTo(40, 115)
            .lineTo(555, 115)
            .lineWidth(1)
            .stroke('#0d1b2a');

        }

        // Covering letter first, then the quotation on a new page.
            renderCompanyHeader();
            let coverY = 140;
            doc.font('Helvetica-Bold').fontSize(10).fillColor('#222222');
            doc.text(`Quotation No: ${quoteMaster.QuotationNo}`, 40, coverY, {width:250});
            doc.text(`Quotation Date: ${displayDate(quoteMaster.QuotationDate)}`, 305, coverY, {width:250, align:'right'});
            coverY += 30;
            // Measure every block so longer customer and subject values wrap safely.
            function ensureCoverSpace(height) {
                if (height > 590) throw new Error('Cover letter field is too long for one page.');
                if (coverY + height > 755) {
                    doc.addPage();
                    renderCompanyHeader();
                    coverY = 140;
                }
            }
            function coverField(label, value) {
                const content = String(value ?? '-');
                doc.font('Helvetica').fontSize(10);
                const height = Math.max(15, doc.heightOfString(content, {width:395}) + 7);
                ensureCoverSpace(height);
                doc.font('Helvetica-Bold').text(label, 40, coverY, {width:115});
                doc.font('Helvetica').text(content, 160, coverY, {width:395});
                coverY += height;
            }
            coverField('Client Name:', quoteMaster.Customer);
            coverField('Address:', `PO Box: ${quoteMaster.Postbox || '-'}, ${quoteMaster.Address || quoteMaster.Emirate || '-'}`);
            coverField('ATTN:', quoteMaster.CustContact || '-');
            coverField('Subject:', quoteMaster.Subject || '-');
            coverField('Project Name:', quoteMaster.ProjectName || '-');
            doc.moveTo(40, coverY).lineTo(555, coverY).lineWidth(0.5).stroke('#777777');
            coverY += 28;
            function coverParagraph(value, gap = 14) {
                doc.font('Helvetica').fontSize(10);
                const height = doc.heightOfString(value, {width:515, lineGap:3});
                ensureCoverSpace(height + gap);
                doc.text(value, 40, coverY, {width:515, lineGap:3});
                coverY += height + gap;
            }
            coverParagraph('Dear Sir/Madam,', 8);
            coverParagraph('Further to our discussion, please find below our best quotation for the supply of the above.', 22);
            const currency = quoteMaster.CurrencyType || 'UAE Dirhams';
            coverField('PRICES:', `Are in ${currency}`);
            coverField('VALIDITY:', `The offer is valid for a period of ${quoteMaster.Validity || '-'}`);
            coverField('DELIVERY TERMS:', quoteMaster.DeliveryTerms || '-');
            coverField('PAYMENT TERMS:', quoteMaster.PaymentTerms || '-');
            coverField('OUR REF:', `${quoteMaster.QuotationNo}/${quoteMaster.RefNo || '-'}`);
            coverY += 18;
            coverParagraph('We believe that our offer meets your requirements. Should you need any clarification, please feel free to contact the undersigned. We look forward to your valuable order.', 32);
            const localSignaturePath = path.join(__dirname, 'public', 'signature.jpg');
            const signaturePath = fs.existsSync(localSignaturePath)
                ? localSignaturePath
                : path.join(__dirname, 'public', 'signature.jpg');
            const hasSignature = fs.existsSync(signaturePath);
            ensureCoverSpace(hasSignature ? 185 : 85);
            doc.font('Helvetica').fontSize(9).fillColor('#245582').text('Thanks & Regards,', 40, coverY, {width:300});
            coverY += 21;
            doc.font('Helvetica-Bold').fontSize(14).text(String(quoteMaster.OurContact || 'Sales Team'), 40, coverY, {width:515});
            coverY = doc.y + 8;
            if (hasSignature) {
                try {
                    doc.image(fs.readFileSync(signaturePath), 40, coverY, {
                        fit: [220, 90],
                        align: 'left',
                        valign: 'center'
                    });
                    coverY += 98;
                } catch (signatureError) {
                    console.error('Failed to load covering-letter signature:', signatureError);
                }
            }
            // doc.font('Helvetica').fontSize(9).fillColor('#333333').text(
            //     `CENTRAL AIRTECH A/C SYSTEMS\nContact: ${quoteMaster.OurNumber || '-'}\nadmin@centralairtechac.com | www.centralairtechac.com`,
            //     40, coverY, {width:515, lineGap:3}
            // );
            doc.addPage();
        renderCompanyHeader();

        doc.fillColor('#0d1b2a')
            .font('Helvetica-Bold')
            .fontSize(10)
            .text('CUSTOMER NAME:', 40, 130, { width: 257.5 });

        doc.font('Helvetica')
            .fillColor('#333333')
            .text(
                String(quoteMaster.Customer || 'CASH CUSTOMER'),
                40,
                145,
                { width: 257.5 }
            );

        let customerBottom = doc.y + 5;
        doc.font('Helvetica').fontSize(8);
        for (const line of [
            `PO Box: ${quoteMaster.Postbox || '-'} | Emirate: ${quoteMaster.Emirate || '-'}`,
            `Address: ${quoteMaster.Address || '-'}`,
            `TRN: ${quoteMaster.VatNo || '-'}`,
            `Attn: ${quoteMaster.CustContact || '-'} | Contact: ${quoteMaster.ContactNo || '-'}`
        ]) {
            doc.text(line, 40, customerBottom, { width: 260 });
            customerBottom = doc.y + 4;
        }
        let detailsY = 130;
        doc.font('Helvetica-Bold').fontSize(10).text('QUOTATION DETAILS', 315, detailsY, {width:240, align:'right'});
        detailsY += 16;
        doc.font('Helvetica').fontSize(8);
        for (const line of [
            `Quote No: ${quoteMaster.QuotationNo} | Date: ${displayDate(quoteMaster.QuotationDate)}`,
            `Project: ${quoteMaster.ProjectName || '-'}`,
            `Our Ref: ${quoteMaster.RefNo || '-'} | Validity: ${quoteMaster.Validity || '-'}`,
            `Delivery: ${quoteMaster.DeliveryTerms || '-'}`,
            `Payment: ${quoteMaster.PaymentTerms || '-'}`,
            `Our Contact: ${quoteMaster.OurContact || '-'} | ${quoteMaster.OurNumber || '-'}`
        ]) {
            doc.text(line, 315, detailsY, {width:240, align:'right'});
            detailsY = doc.y + 4;
        }
        // let yPos = Math.max(customerBottom, detailsY) + 10;
        // doc.font('Helvetica-Bold').fontSize(8).text(`Subject: ${quoteMaster.Subject || '-'}`, 40, yPos, {width:515});
        yPos = doc.y + 10;

        // ==========================================
        // TABLE CONFIGURATION
        // ==========================================
        const tableStartX = 40;
        const tableWidth = 515;
        const contentBottom = 780;

        const columns = [
            { title: 'Sr#', width: 19, align: 'center' },
            { title: 'Item Description', width: 141, align: 'left' },
            { title: 'Qty', width: 26, align: 'center' },
            { title: 'Size', width: 46, align: 'center' },
            { title: 'RAL', width: 28, align: 'center' },
            { title: 'Unit', width: 34, align: 'center' },
            { title: 'Unit Price', width: 40, align: 'right' },
            { title: 'Disc%', width: 27, align: 'center' },
            { title: 'VAT%', width: 25, align: 'center' },
            { title: 'Taxable', width: 40, align: 'right' },
            { title: 'VAT Total', width: 38, align: 'right' },
            { title: 'Unit Total', width: 41, align: 'right' }
        ];

        const renderTableHeaders = currentY => {
            doc.rect(tableStartX, currentY, tableWidth, 24)
                .fill('#035372');

            doc.font('Helvetica-Bold')
                .fontSize(7)
                .fillColor('#ffffff');

            let x = tableStartX;

            columns.forEach((column, index) => {
                if (index > 0) {
                    doc.moveTo(x, currentY)
                        .lineTo(x, currentY + 24)
                        .lineWidth(0.5)
                        .stroke('#ffffff');
                }

                doc.text(column.title, x + 2, currentY + 5, {
                    width: column.width - 4,
                    align: 'center'
                });

                x += column.width;
            });

            doc.font('Helvetica').fontSize(7);
        };

        if (yPos + 50 > contentBottom) {
            doc.addPage();
            yPos = 50;
        }

        renderTableHeaders(yPos);
        yPos += 26;

        let subtotalTaxable = 0;
        let subtotalVat = 0;

        // ==========================================
        // INVOICE ROWS
        // ==========================================
        quoteItems.forEach((item, index) => {
            const values = [
                String(index + 1),
                String(item.Item ?? 'N/A'),
                String(item.Quantity ?? 0),
                String(item.ISize ?? ''),
                String(item.IRAL ?? ''),
                String(item.IUnit ?? ''),
                money(item.UnitPrice),
                money(item.LessDiscount),
                money(item.VatPer),
                money(item.UnitTaxable),
                money(item.VatTotal),
                money(item.TotalPrice)
            ];

            doc.font('Helvetica').fontSize(7);

            const rowHeight = Math.max(
                20,
                ...values.map((value, columnIndex) =>
                    doc.heightOfString(value, {
                        width: columns[columnIndex].width - 4,
                        align: columns[columnIndex].align
                    }) + 10
                )
            );

            if (rowHeight > contentBottom - 76) {
                throw new Error(
                    `Quotation item ${index + 1} is too long for one PDF page.`
                );
            }

            // Check BEFORE drawing the row.
            if (yPos + rowHeight > contentBottom) {
                doc.addPage();
                yPos = 50;
                renderTableHeaders(yPos);
                yPos += 26;
            }

            doc.rect(tableStartX, yPos, tableWidth, rowHeight)
                .fill(index % 2 === 0 ? '#f8f9fa' : '#ffffff');

            doc.font('Helvetica')
                .fontSize(7)
                .fillColor('#000000');

            let x = tableStartX;

            values.forEach((value, columnIndex) => {
                const column = columns[columnIndex];

                doc.text(value, x + 2, yPos + 5, {
                    width: column.width - 4,
                    align: column.align
                });

                x += column.width;
            });

            subtotalTaxable += number(
                item.UnitTaxable ?? item.TotalPrice ?? 0
            );

            subtotalVat += number(item.VatTotal);

            yPos += rowHeight;
        });

        // Totals and notes stay together and move to the next page when necessary.
        const notes = `Notes: ${quoteMaster.Notes || '-'}`;
        const inWords = `Amount in words: ${quoteMaster.InWords || '-'}`;
        doc.font('Helvetica').fontSize(8);
        const leftHeight = doc.heightOfString(notes, {width:285}) + doc.heightOfString(inWords, {width:285}) + 18;
        const summaryHeight = Math.max(78, leftHeight);
        if (summaryHeight > contentBottom - 60) throw new Error('Quotation notes are too long for the summary page.');
        if (yPos + summaryHeight + 12 > contentBottom) { doc.addPage(); yPos = 50; }
        yPos += 10;
        doc.moveTo(40, yPos).lineTo(555, yPos).lineWidth(0.6).stroke('#777777');
        yPos += 8;
        doc.font('Helvetica').fontSize(8).fillColor('#333333').text(notes, 40, yPos, {width:285});
        const wordsY = doc.y + 8;
        doc.font('Helvetica-Bold').text(inWords, 40, wordsY, {width:285});
        const summaryRows = [
            ['Taxable Amount:', money(subtotalTaxable)],
            ['Total VAT:', money(subtotalVat)],
            ['Quotation Total:', money(quoteMaster.GrandTotal)]
        ];
        summaryRows.forEach(([label, value], index) => {
            const y = yPos + index * 20;
            if (index === 2) doc.rect(340, y - 4, 215, 23).fill('#f1f3f5');
            doc.font(index === 2 ? 'Helvetica-Bold' : 'Helvetica').fontSize(9).fillColor('#0d1b2a');
            doc.text(label, 345, y, {width:120});
            doc.text(value, 467, y, {width:83, align:'right'});
        });
        // Authorised signature on the final page.
        const signatureBaseY = Math.max(730, yPos + summaryHeight + 12);
        doc.font('Helvetica').fontSize(8).text('For CENTRAL AIR TECH', 395, signatureBaseY + 10, {width:160, align:'right'});
        doc.moveTo(425, signatureBaseY + 50).lineTo(555, signatureBaseY + 50).lineWidth(0.5).stroke('#777777');
        doc.text('Authorised Signatory', 395, signatureBaseY + 55, {width:160, align:'right'});

        doc.end();

        const pdfBuffer = await pdfReady;

        // Sanitize the download filename.
        const safeFilename = (
            `${quoteMaster.QuotationNo}-${quoteMaster.Customer || 'Quotation'}`
        )
            .replace(/[^a-zA-Z0-9._ -]/g, '_')
            .slice(0, 150);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${safeFilename}.pdf"`
        );

        return res.send(pdfBuffer);

    } catch (error) {
        if (doc && !doc.destroyed) {
            doc.destroy();
        }

        console.error("MongoDB quotation PDF generation failed:", error);

        if (!res.headersSent) {
            return res.status(500).send(
                "Failed to generate quotation PDF."
            );
        }

        res.end();
    }
});

// PRINT DELIVERY ORDER
app.get('/api/print-deliveryorder/:DONo', async (req, res) => {
    let doc;

    try {
        if (!db) {
            return res.status(500).send("Database engine offline.");
        }

        const DONo = String(req.params.DONo ?? '').trim();

        if (!DONo) {
            return res.status(400).send("DONo number is required.");
        }

        const doValues = [DONo];
        const numericDONo = Number(DONo);

        if (Number.isSafeInteger(numericDONo)) {
            doValues.push(numericDONo);
        }

        const doMaster = await db.collection('ordermain').findOne({
            DONo: { $in: doValues }
        });

        if (!doMaster) {
            return res.status(404).send("Delivery order not found.");
        }

        if (!Array.isArray(doMaster.deliveryorder)) {
            return res.status(500).send(
                "Delivery order deliveryorder field is missing or is not an array."
            );
        }

        const doItems = [...doMaster.deliveryorder].sort(
            (a, b) => Number(a.SrNo) - Number(b.SrNo)
        );

        const totalItems = doItems.length;

        const totalQuantity = doItems.reduce((total, item) => {
            const quantity = Number(item.Quantity ?? 0);

            if (!Number.isFinite(quantity)) {
                throw new Error(`Invalid quantity for item ${item.SrNo}.`);
            }

            return total + quantity;
        }, 0);

        const displayQuantity = value =>
            new Intl.NumberFormat('en-GB', {
                maximumFractionDigits: 6
            }).format(value);

        const displayDate = value => {
            if (!value) return '-';

            const match = String(value).match(
                /^(\d{4})-(\d{2})-(\d{2})$/
            );

            if (match) {
                return `${match[3]}/${match[2]}/${match[1]}`;
            }

            const date = new Date(value);

            return Number.isNaN(date.getTime())
                ? '-'
                : date.toLocaleDateString('en-GB', {
                    timeZone: 'Asia/Dubai'
                });
        };

        doc = new PDFDocument({
            size: 'A4',
            margins: {
                top: 36,
                bottom: 36,
                left: 40,
                right: 40
            }
        });

        const chunks = [];

        const pdfReady = new Promise((resolve, reject) => {
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);
        });

        pdfReady.catch(() => {});

        // ==========================================
        // COMPANY HEADER
        // ==========================================
        const localLogoPath = getPdfLogoPath();

        const logoPath = fs.existsSync(localLogoPath)
            ? localLogoPath
            : getPdfLogoPath();

        const fallbackHeader = () => {
            doc.fillColor('#252e3d')
                .font('Helvetica-Bold')
                .fontSize(14)
                .text('AL FAJAR ERP SYSTEMS', 40, 40, {
                    width: 300
                });
        };

        if (fs.existsSync(logoPath)) {
            try {
                doc.image(fs.readFileSync(logoPath), 40, 35, {
                    fit: [300, 43]
                });
            } catch (imageError) {
                console.error("Failed to load DO logo:", imageError);
                fallbackHeader();
            }
        } else {
            fallbackHeader();
        }

        doc.fillColor('#050505')
            .font('Helvetica')
            .fontSize(9)
            .text(
                'Musafah 34, Abu Dhabi, United Arab Emirates',
                40, 85,
                { width: 350 }
            )
            .text(
                'www.centralairtechac.com | Email: admin@centralairtechac.com',
                40, 97,
                { width: 350 }
            );

        doc.font('Helvetica-Bold')
            .fontSize(18)
            .text('DELIVERY ORDER', 355, 40, {
                width: 200,
                align: 'right'
            });

        doc.font('Helvetica')
            .fontSize(9)
            .text(
                `TRN ${doMaster.VatNo || '104652045600003'}`,
                355, 65,
                { width: 200, align: 'right' }
            );

        doc.moveTo(40, 115)
            .lineTo(555, 115)
            .lineWidth(1)
            .stroke('#0d1b2a');

        doc.fillColor('#0d1b2a')
            .font('Helvetica-Bold')
            .fontSize(10)
            .text('BILLED TO:', 40, 130, { width: 230 });

        doc.font('Helvetica')
            .fillColor('#333333')
            .text(
                String(doMaster.Customer || 'CASH CUSTOMER'),
                40, 145,
                { width: 230 }
            );

        const customerBottom = doc.y;
        const detailsOptions = { width: 200, align: 'right' };

        doc.fillColor('#0d1b2a')
            .font('Helvetica-Bold')
            .text('DO DETAILS', 355, 130, detailsOptions);

        doc.font('Helvetica')
            .fillColor('#333333')
            .text(
                `DO No: ${doMaster.DONo}`,
                355, 145,
                detailsOptions
            )
            .text(
                `Date: ${displayDate(doMaster.DODate)}`,
                355, 160,
                detailsOptions
            )
            .text(
                `Inv. Number: ${doMaster.InvoiceNo ?? ''}`,
                355, 175,
                detailsOptions
            );

        let yPos = Math.max(210, customerBottom + 20, doc.y + 20);

        // ==========================================
        // FULL-WIDTH TABLE — 515 POINTS
        // ==========================================
        const tableStartX = 40;
        const tableWidth = 515;
        const tableEndX = tableStartX + tableWidth;
        const contentBottom = 730;
        const headerHeight = 26;
        const cellPadding = 5;
        const rowFontSize = 9;

        const columns = [
            { title: 'Sr', width: 30, align: 'center' },
            {
                title: 'Product Item Description',
                width: 250,
                align: 'left'
            },
            { title: 'Qty', width: 50, align: 'center' },
            { title: 'Size', width: 75, align: 'center' },
            { title: 'RAL', width: 60, align: 'center' },
            { title: 'Unit', width: 50, align: 'center' }
        ];

        const renderTableHeaders = currentY => {
            doc.rect(
                tableStartX, currentY, tableWidth, headerHeight
            ).fill('#035372');

            doc.font('Helvetica-Bold')
                .fontSize(9)
                .fillColor('#ffffff');

            let x = tableStartX;

            columns.forEach((column, index) => {
                if (index > 0) {
                    doc.moveTo(x, currentY)
                        .lineTo(x, currentY + headerHeight)
                        .lineWidth(0.5)
                        .stroke('#ffffff');
                }

                doc.text(
                    column.title,
                    x + cellPadding,
                    currentY + 7,
                    {
                        width: column.width - cellPadding * 2,
                        align: 'center'
                    }
                );

                x += column.width;
            });

            doc.font('Helvetica').fontSize(rowFontSize);
        };

        const addTablePage = () => {
            doc.addPage();
            yPos = 50;
            renderTableHeaders(yPos);
            yPos += headerHeight;
        };

        if (yPos + headerHeight + 24 > contentBottom) {
            addTablePage();
        } else {
            renderTableHeaders(yPos);
            yPos += headerHeight;
        }

        // ==========================================
        // DELIVERY ORDER ROWS
        // ==========================================
        doItems.forEach((item, index) => {
            const values = [
                String(index + 1),
                String(item.Item ?? 'N/A'),
                displayQuantity(Number(item.Quantity ?? 0)),
                String(item.ISize ?? item.Isize ?? ''),
                String(item.IRAL ?? ''),
                String(item.IUnit ?? item.Iunit ?? '')
            ];

            doc.font('Helvetica').fontSize(rowFontSize);

            const rowHeight = Math.max(
                18,
                ...values.map((value, columnIndex) =>
                    doc.heightOfString(value, {
                        width: columns[columnIndex].width - cellPadding * 2,
                        align: columns[columnIndex].align
                    }) + 6
                )
            );

            if (rowHeight > contentBottom - 50 - headerHeight) {
                throw new Error(
                    `DO item ${index + 1} is too long for one PDF page.`
                );
            }

            // Add a new page before drawing an overflowing row.
            if (yPos + rowHeight > contentBottom) {
                addTablePage();
            }

            doc.rect(tableStartX, yPos, tableWidth, rowHeight)
                .fill(index % 2 === 0 ? '#f8f9fa' : '#ffffff');

            doc.font('Helvetica')
                .fontSize(rowFontSize)
                .fillColor('#000000');

            let x = tableStartX;

            values.forEach((value, columnIndex) => {
                const column = columns[columnIndex];

                doc.text(value, x + cellPadding, yPos + 3, {
                    width: column.width - cellPadding * 2,
                    align: column.align
                });

                x += column.width;
            });

            doc.moveTo(tableStartX, yPos + rowHeight)
                .lineTo(tableEndX, yPos + rowHeight)
                .lineWidth(0.3)
                .stroke('#e2e8f0');

            yPos += rowHeight;
        });

        // ==========================================
        // TOTAL ITEMS AND TOTAL QUANTITY
        // ==========================================
        const summaryHeight = 34;

        if (yPos + 15 + summaryHeight > contentBottom) {
            addTablePage();
        }

        yPos += 15;

        doc.rect(tableStartX, yPos, tableWidth, summaryHeight)
            .fill('#edf2f7');

        doc.fillColor('#0d1b2a')
            .font('Helvetica-Bold')
            .fontSize(10)
            .text(
                `Total Items: ${totalItems}`,
                tableStartX + 10,
                yPos + 11,
                { width: 220 }
            )
            .text(
                `Total Quantity: ${displayQuantity(totalQuantity)}`,
                tableStartX + 240,
                yPos + 11,
                {
                    width: tableWidth - 250,
                    align: 'right'
                }
            );

        // ==========================================
        // DECLARATION AND SIGNATURE — LAST PAGE BOTTOM
        // ==========================================
        doc.page.margins.bottom = 15;

        const footerBottom = doc.page.height - 18;

        const declaration =
            'Declaration: We declare that the goods described in this ' +
            'delivery order and all particulars are true and correct.';

        doc.font('Helvetica')
            .fontSize(8)
            .fillColor('#777777');

        const declarationWidth = 300;
        const declarationHeight = doc.heightOfString(declaration, {
            width: declarationWidth
        });

        doc.text(
            declaration,
            40,
            footerBottom - declarationHeight,
            { width: declarationWidth }
        );

        const signatureLabel = 'Authorized Signatory';
        const signatureWidth = 125;

        const signatureHeight = doc.heightOfString(signatureLabel, {
            width: signatureWidth,
            align: 'center'
        });

        const signatureY = footerBottom - signatureHeight;

        doc.moveTo(425, signatureY - 8)
            .lineTo(550, signatureY - 8)
            .lineWidth(0.5)
            .stroke('#333333');

        doc.text(signatureLabel, 425, signatureY, {
            width: signatureWidth,
            align: 'center'
        });

        doc.end();

        const pdfBuffer = await pdfReady;

        const safeFilename = (
            `${doMaster.DONo}-${doMaster.Customer || 'Delivery Order'}`
        )
            .replace(/[^a-zA-Z0-9._ -]/g, '_')
            .slice(0, 150);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${safeFilename}.pdf"`
        );

        return res.send(pdfBuffer);

    } catch (error) {
        if (doc && !doc.destroyed) {
            doc.destroy();
        }

        console.error("Delivery order PDF generation failed:", error);

        if (!res.headersSent) {
            return res.status(500).send(
                "Failed to generate delivery order PDF."
            );
        }

        res.end();
    }
});

// PRINT INVOICE STATEMENT
app.post('/api/generate-statement', async (req, res) => {
    let doc;

    try {
        if (!db) {
            return res.status(500).send("Database engine offline.");
        }

        const {
            customer,
            type = 'All',
            fromDate,
            toDate,
            createDate
        } = req.body;

        if (
            typeof customer !== 'string' ||
            !customer.trim() ||
            !fromDate ||
            !toDate ||
            typeof type !== 'string'
        ) {
            return res.status(400).send(
                "Missing or invalid filtration fields."
            );
        }

        // Validate YYYY-MM-DD dates.
        const validDate = value => {
            if (
                typeof value !== 'string' ||
                !/^\d{4}-\d{2}-\d{2}$/.test(value)
            ) {
                return false;
            }

            const date = new Date(`${value}T00:00:00Z`);

            return (
                !Number.isNaN(date.getTime()) &&
                date.toISOString().slice(0, 10) === value
            );
        };

        if (
            !validDate(fromDate) ||
            !validDate(toDate) ||
            fromDate > toDate
        ) {
            return res.status(400).send(
                "Provide a valid date range in YYYY-MM-DD format."
            );
        }

        const escapeRegex = value =>
            String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        const customerName = customer.trim();
        const statementType = type.trim() || 'All';

        const exactMatch = value => ({
            $regex: `^${escapeRegex(value)}$`,
            $options: 'i'
        });

        // Dates follow your existing YYYY-MM-DD string storage.
        const queryFilter = {
            Customer: exactMatch(customerName),
            InvoiceDate: {
                $gte: fromDate,
                $lte: toDate
            }
        };

        if (statementType.toUpperCase() === 'PDC') {
            queryFilter.$or = [
                { Mode: exactMatch('PDC') },
                { Status: exactMatch('PDC') }
            ];
        } else if (statementType.toUpperCase() !== 'ALL') {
            queryFilter.Status = exactMatch(statementType);
        }

        const rows = await db.collection('invoicemain')
            .find(queryFilter, {
                projection: {
                    InvoiceNo: 1,
                    InvoiceDate: 1,
                    LPONo: 1,
                    GrandTotal: 1,
                    Received: 1,
                    CNAmount: 1,
                    Balance: 1,
                    Status: 1,
                    Mode: 1,
                    ChqNo: 1,
                    ReceivedDate: 1,
                    Receiveddate: 1
                }
            })
            .sort({ InvoiceDate: 1, InvoiceNo: 1 })
            .toArray();

        const numberValue = value => {
            const number = Number(value ?? 0);
            return Number.isFinite(number) ? number : 0;
        };

        const money = value => numberValue(value).toFixed(2);

        const formatDate = value => {
            if (!value) return '-';

            const months = [
                'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
            ];

            // Preserve date-only strings without timezone shifts.
            if (validDate(value)) {
                const [year, month, day] = value.split('-');

                return `${day}-${months[Number(month) - 1]}-${year}`;
            }

            const date = new Date(value);

            if (Number.isNaN(date.getTime())) {
                return '-';
            }

            // Use UAE dates when the value includes a timestamp.
            const parts = new Intl.DateTimeFormat('en-GB', {
                timeZone: 'Asia/Dubai',
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            }).formatToParts(date);

            const part = name =>
                parts.find(entry => entry.type === name)?.value ?? '';

            return `${part('day')}-${part('month')}-${part('year')}`;
        };

        doc = new PDFDocument({
            size: 'A4',
            margin: 40
        });

        // Build the PDF before sending download headers.
        const chunks = [];

        const pdfReady = new Promise((resolve, reject) => {
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);
        });

        pdfReady.catch(() => {});

        // ==========================================
        // COMPANY HEADER
        // ==========================================
        const renderTextFallbackHeader = () => {
            doc.fillColor('#252e3d')
                .font('Helvetica-Bold')
                .fontSize(13)
                .text('CENTRAL AIRTECH AC SYSTEMS', 40, 30, {
                    width: 280
                });
        };

        const localLogoPath = getPdfLogoPath();
        const logoPath = fs.existsSync(localLogoPath)
            ? localLogoPath
            : getPdfLogoPath();

        if (fs.existsSync(logoPath)) {
            try {
                doc.image(fs.readFileSync(logoPath), 40, 30, {
                    fit: [265, 40]
                });
            } catch (imageError) {
                console.error("Statement logo load failed:", imageError);
                renderTextFallbackHeader();
            }
        } else {
            renderTextFallbackHeader();
        }

        doc.fillColor('#050505')
            .font('Helvetica')
            .fontSize(8)
            .text(
                'Musafah 34, Abu Dhabi, United Arab Emirates',
                40,
                75,
                { width: 300 }
            )
            .text(
                'www.centralairtechac.com | admin@centralairtechac.com',
                40,
                87,
                { width: 310 }
            );

        doc.fillColor('#434547')
            .font('Helvetica-Bold')
            .fontSize(9)
            .text(
                `STATEMENT OF INVOICES - ${statementType.toUpperCase()}`,
                320,
                35,
                { width: 235, align: 'right' }
            )
            .fontSize(8)
            .text(
                `From: ${formatDate(fromDate)} to ${formatDate(toDate)}`,
                320,
                Math.max(56, doc.y + 4),
                { width: 235, align: 'right' }
            );

        const titleBottom = doc.y;

        doc.font('Helvetica')
            .fontSize(10)
            .text(
                `Customer: ${customerName}`,
                40,
                Math.max(110, titleBottom + 15),
                { width: 515 }
            );

        const customerBottom = doc.y;

        doc.fontSize(9).text(
            `Generated on: ${formatDate(createDate || new Date())}`,
            40,
            customerBottom + 5,
            { width: 515 }
        );

        let y = Math.max(150, doc.y + 15);

        // ==========================================
        // TABLE COLUMNS — TOTAL WIDTH 515 POINTS
        // ==========================================
        const columns = [
            { key: 'sr', label: 'Sr#', width: 20, align: 'center' },
            { key: 'inv', label: 'Inv No', width: 35, align: 'center' },
            { key: 'date', label: 'Inv Date', width: 53, align: 'center' },
            { key: 'lpo', label: 'LPO No', width: 42, align: 'left' },
            { key: 'total', label: 'Amount', width: 49, align: 'right' },
            { key: 'received', label: 'Paid', width: 45, align: 'right' },
            { key: 'cn', label: 'CN Amt', width: 42, align: 'right' },
            { key: 'balance', label: 'Balance', width: 49, align: 'right' },
            { key: 'status', label: 'Status', width: 36, align: 'center' },
            { key: 'mode', label: 'Mode', width: 31, align: 'center' },
            { key: 'cheque', label: 'Chq No', width: 60, align: 'center' },
            { key: 'receivedDate', label: 'Rec Date', width: 53, align: 'center' }
        ];

        const tableX = 40;
        const tableWidth = 515;
        const headerHeight = 24;
        const pageBottom = doc.page.height - 45;

        const printTableHeader = targetY => {
            doc.rect(tableX, targetY, tableWidth, headerHeight)
                .fill('#ebf8ff');

            doc.fillColor('#2b6cb0')
                .font('Helvetica-Bold')
                .fontSize(7);

            let x = tableX;

            columns.forEach(column => {
                doc.text(column.label, x + 2, targetY + 7, {
                    width: column.width - 4,
                    align: column.align
                });

                x += column.width;
            });

            doc.font('Helvetica')
                .fontSize(7)
                .fillColor('#2d3748');
        };

        const addTablePage = () => {
            doc.addPage({ size: 'A4', margin: 40 });
            y = 40;
            printTableHeader(y);
            y += headerHeight;
        };

        if (y + headerHeight + 20 > pageBottom) {
            addTablePage();
        } else {
            printTableHeader(y);
            y += headerHeight;
        }

        let totalGrand = 0;
        let totalReceived = 0;
        let totalCN = 0;
        let totalBalance = 0;

        // ==========================================
        // STATEMENT ROWS
        // ==========================================
        rows.forEach((row, index) => {
            const grand = numberValue(row.GrandTotal);
            const received = numberValue(row.Received);
            const credit = numberValue(row.CNAmount);
            const balance = numberValue(row.Balance);

            const values = {
                sr: String(index + 1),
                inv: String(row.InvoiceNo ?? '-'),
                date: formatDate(row.InvoiceDate),
                lpo: String(row.LPONo || '-'),
                total: money(grand),
                received: money(received),
                cn: money(credit),
                balance: money(balance),
                status: String(row.Status || '-'),
                mode: String(row.Mode || '-'),
                cheque: String(row.ChqNo || '-'),
                receivedDate: formatDate(
                    row.ReceivedDate || row.Receiveddate
                )
            };

            doc.font('Helvetica').fontSize(7);

            const rowHeight = Math.max(
                20,
                ...columns.map(column =>
                    doc.heightOfString(values[column.key], {
                        width: column.width - 4,
                        align: column.align
                    }) + 8
                )
            );

            if (rowHeight > pageBottom - 40 - headerHeight) {
                throw new Error(
                    `Statement row ${index + 1} is too tall for one page.`
                );
            }

            if (y + rowHeight > pageBottom) {
                addTablePage();
            }

            doc.rect(tableX, y, tableWidth, rowHeight)
                .fill(index % 2 === 0 ? '#f7fafc' : '#ffffff');

            doc.fillColor('#2d3748')
                .font('Helvetica')
                .fontSize(7);

            let x = tableX;

            columns.forEach(column => {
                doc.text(values[column.key], x + 2, y + 4, {
                    width: column.width - 4,
                    align: column.align
                });

                x += column.width;
            });

            totalGrand += grand;
            totalReceived += received;
            totalCN += credit;
            totalBalance += balance;

            y += rowHeight;
        });

        if (rows.length === 0) {
            doc.font('Helvetica')
                .fontSize(9)
                .fillColor('#666666')
                .text(
                    'No invoices found for the selected filters.',
                    tableX,
                    y + 10,
                    { width: tableWidth, align: 'center' }
                );

            y = doc.y + 15;
        }

        // ==========================================
        // TOTALS
        // ==========================================
        const totals = {
            lpo: 'TOTALS',
            total: money(totalGrand),
            received: money(totalReceived),
            cn: money(totalCN),
            balance: money(totalBalance)
        };

        doc.font('Helvetica-Bold').fontSize(7);

        const totalsHeight = Math.max(
            24,
            ...columns
                .filter(column => totals[column.key] !== undefined)
                .map(column =>
                    doc.heightOfString(totals[column.key], {
                        width: column.width - 4,
                        align: column.align
                    }) + 10
                )
        );

        if (y + totalsHeight + 12 > pageBottom) {
            addTablePage();
        }

        y += 6;

        doc.moveTo(tableX, y)
            .lineTo(tableX + tableWidth, y)
            .lineWidth(0.8)
            .stroke('#718096');

        y += 6;

        doc.fillColor('#2d3748')
            .font('Helvetica-Bold')
            .fontSize(7);

        let totalX = tableX;

        columns.forEach(column => {
            if (totals[column.key] !== undefined) {
                doc.text(totals[column.key], totalX + 2, y, {
                    width: column.width - 4,
                    align: column.align
                });
            }

            totalX += column.width;
        });

        doc.end();

        const pdfBuffer = await pdfReady;

        const safeCustomerName = customerName
            .replace(/[^a-z0-9 _-]/gi, '_')
            .toUpperCase()
            .slice(0, 100);

        const safeType = statementType
            .replace(/[^a-z0-9 _-]/gi, '_')
            .toUpperCase()
            .slice(0, 30);

        const filename = `${safeCustomerName}_(${safeType}).pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${filename}"`
        );

        return res.send(pdfBuffer);

    } catch (err) {
        if (doc && !doc.destroyed) {
            doc.destroy();
        }

        console.error("MongoDB statement generator exception:", err);

        if (!res.headersSent) {
            return res.status(500).send(
                "Database processing or file generation error occurred."
            );
        }

        res.end();
    }
});

// PRINT CASH / CHEQUE / BANK RECEIPT — SINGLE INVOICE
app.get('/api/generate-receipt-pdf', async (req, res) => {
    let doc;

    try {
        // Read string query parameters safely.
        const queryText = name =>
            typeof req.query[name] === 'string'
                ? req.query[name].trim()
                : '';

        const customerName = queryText('customerName');
        const emirate = queryText('emirate');
        const invoiceNo = queryText('invoiceNo');
        const invoiceDate = queryText('invoiceDate');
        const receiptDate = queryText('receiptDate');
        const chqNo = queryText('chqNo');
        const chqDate = queryText('chqDate');
        const bankName = queryText('bankName');
        const inWords = queryText('inWords');
        const amountText = queryText('amount');

        const receiptTypes = {
            cash: 'Cash',
            cheque: 'Cheque',
            'bank transfer': 'Bank Transfer',
            'bank deposit': 'Bank Deposit'
        };

        const receiptType =
            receiptTypes[queryText('receiptType').toLowerCase()];

        if (
            !customerName ||
            !invoiceNo ||
            !invoiceDate ||
            !receiptDate ||
            !inWords ||
            !amountText ||
            !receiptType
        ) {
            return res.status(400).send(
                "Missing required receipt fields or invalid receipt type."
            );
        }

        const amount = Number(amountText);

        if (!Number.isFinite(amount) || amount <= 0) {
            return res.status(400).send(
                "Receipt amount must be greater than zero."
            );
        }

        if (
            receiptType === 'Cheque' &&
            (!chqNo || !chqDate || !bankName)
        ) {
            return res.status(400).send(
                "Cheque number, cheque date, and bank name are required."
            );
        }

        const formatDate = value => {
            if (!value) return '-';

            const months = [
                'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
            ];

            // Handle date-only values without timezone shifts.
            if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                const date = new Date(`${value}T00:00:00Z`);

                if (
                    Number.isNaN(date.getTime()) ||
                    date.toISOString().slice(0, 10) !== value
                ) {
                    return '-';
                }

                const [year, month, day] = value.split('-');

                return `${day}-${months[Number(month) - 1]}-${year}`;
            }

            const date = new Date(value);

            if (Number.isNaN(date.getTime())) {
                return '-';
            }

            const parts = new Intl.DateTimeFormat('en-GB', {
                timeZone: 'Asia/Dubai',
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            }).formatToParts(date);

            const part = name =>
                parts.find(entry => entry.type === name)?.value ?? '';

            return `${part('day')}-${part('month')}-${part('year')}`;
        };

        if (
            formatDate(invoiceDate) === '-' ||
            formatDate(receiptDate) === '-' ||
            (
                receiptType === 'Cheque' &&
                formatDate(chqDate) === '-'
            )
        ) {
            return res.status(400).send("Invalid receipt date fields.");
        }

        doc = new PDFDocument({
            size: 'A4',
            margin: 40
        });

        // Complete the PDF before sending the download response.
        const chunks = [];

        const pdfReady = new Promise((resolve, reject) => {
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);
        });

        pdfReady.catch(() => {});

        // ==========================================
        // COMPANY HEADER
        // ==========================================
        const renderTextFallbackHeader = () => {
            doc.fillColor('#252e3d')
                .fontSize(14)
                .font('Helvetica-Bold')
                .text('CENTRAL AIRTECH AC SYSTEMS', 40, 40, {
                    width: 515
                });
        };

        const localLogoPath = getPdfLogoPath();

        const logoPath = fs.existsSync(localLogoPath)
            ? localLogoPath
            : getPdfLogoPath();

        if (fs.existsSync(logoPath)) {
            try {
                doc.image(fs.readFileSync(logoPath), 40, 35, {
                    fit: [320, 43]
                });
            } catch (imageError) {
                console.error("Receipt logo load failed:", imageError);
                renderTextFallbackHeader();
            }
        } else {
            renderTextFallbackHeader();
        }

        doc.fillColor('#050505')
            .fontSize(9)
            .font('Helvetica')
            .text(
                'Musafah 34, Abu Dhabi, United Arab Emirates',
                40,
                85,
                { width: 515 }
            )
            .text(
                'www.centralairtechac.com | Email: admin@centralairtechac.com',
                40,
                97,
                { width: 515 }
            );

        doc.strokeColor('#d1d5db')
            .lineWidth(1)
            .moveTo(40, 115)
            .lineTo(555, 115)
            .stroke();

        doc.fontSize(14)
            .font('Helvetica-Bold')
            .fillColor('#1f2937')
            .text(
                `${receiptType.toUpperCase()} RECEIPT`,
                40,
                135,
                { width: 515, align: 'center' }
            );

        // ==========================================
        // RECEIPT BODY
        // ==========================================
        const segments = [
            {
                text: 'Received with thanks from ',
                bold: false
            },
            {
                text: [
                    customerName.toUpperCase(),
                    emirate.toUpperCase()
                ].filter(Boolean).join(', '),
                bold: true
            },
            {
                text: ' the Sum of AED: ',
                bold: false
            },
            {
                text: `${amount.toFixed(2)} (${inWords.toUpperCase()})`,
                bold: true
            }
        ];

        if (receiptType === 'Cash') {
            segments.push({
                text: ' by Cash',
                bold: false
            });
        } else if (receiptType === 'Cheque') {
            segments.push(
                { text: ' by Cheque Number: ', bold: false },
                { text: chqNo, bold: true },
                { text: ', dated: ', bold: false },
                { text: formatDate(chqDate), bold: true },
                { text: ', with Bank: ', bold: false },
                { text: bankName, bold: true }
            );
        } else {
            segments.push({
                text: ` by ${receiptType}`,
                bold: false
            });

            if (chqNo) {
                segments.push(
                    { text: ', Reference: ', bold: false },
                    { text: chqNo, bold: true }
                );
            }

            if (bankName) {
                segments.push(
                    { text: ', Bank: ', bold: false },
                    { text: bankName, bold: true }
                );
            }
        }

        segments.push(
            {
                text: ' towards Invoice Number: ',
                bold: false
            },
            {
                text: invoiceNo,
                bold: true
            },
            {
                text: ' dated ',
                bold: false
            },
            {
                text: `${formatDate(invoiceDate)}.`,
                bold: true
            }
        );

        doc.fillColor('#111827').fontSize(12);

        segments.forEach((segment, index) => {
            doc.font(
                segment.bold ? 'Helvetica-Bold' : 'Helvetica'
            );

            const options = {
                width: 475,
                lineGap: 10,
                continued: index < segments.length - 1
            };

            if (index === 0) {
                doc.text(segment.text, 60, 180, options);
            } else {
                doc.text(segment.text, options);
            }
        });

                // ==========================================
        // DATE AND SIGNATURE — LAST PAGE BOTTOM
        // ==========================================
        doc.page.margins.bottom = 15;

        const footerBottom = doc.page.height - 18;

        doc.font('Helvetica')
            .fontSize(10)
            .fillColor('#4b5563');

        const labelHeight = doc.heightOfString('Authorized Signature', {
            width: 160,
            align: 'center'
        });

        const labelY = footerBottom - labelHeight;
        const lineY = labelY - 8;

        doc.fillColor('#111827')
            .text(
                'For CENTRAL AIR TECH',
                380,
                lineY - 25,
                { width: 160, align: 'center' }
            );

        doc.strokeColor('#9ca3af')
            .lineWidth(0.5)
            .moveTo(40, lineY)
            .lineTo(540, lineY)
            .stroke();

        doc.fillColor('#4b5563')
            .text(
                `Receipt Date: ${formatDate(receiptDate)}`,
                40,
                labelY,
                { width: 300 }
            )
            .text(
                'Authorized Signature',
                380,
                labelY,
                { width: 160, align: 'center' }
            );

        doc.end();

        const pdfBuffer = await pdfReady;

        const safeInvoiceNo = invoiceNo
            .replace(/[^a-zA-Z0-9_-]/g, '-')
            .slice(0, 100);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="Receipt_${safeInvoiceNo}.pdf"`
        );

        return res.send(pdfBuffer);

    } catch (err) {
        if (doc && !doc.destroyed) {
            doc.destroy();
        }

        console.error("Receipt PDF generation failed:", err);

        if (!res.headersSent) {
            return res.status(500).send(
                "Error compiling receipt document."
            );
        }

        res.end();
    }
});

// LOAD MULTI RECEIPT MODAL
app.post('/api/multi-invoice-receipt', async (req, res) => {
    try {
        if (!db) {
            return res.status(500).json({
                error: "Database engine offline."
            });
        }

        const { Customer } = req.body;

        if (
            typeof Customer !== 'string' ||
            Customer.trim() === ''
        ) {
            return res.status(400).json({
                error: "Customer is required."
            });
        }

        const escapeRegex = value =>
            String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        const formatDate = value => {
            if (
                value === undefined ||
                value === null ||
                value === ''
            ) {
                return '';
            }

            // Preserve existing date-only strings.
            if (
                typeof value === 'string' &&
                /^\d{4}-\d{2}-\d{2}$/.test(value)
            ) {
                const date = new Date(`${value}T00:00:00Z`);

                return (
                    !Number.isNaN(date.getTime()) &&
                    date.toISOString().slice(0, 10) === value
                ) ? value : '';
            }

            const date = new Date(value);

            if (Number.isNaN(date.getTime())) {
                return '';
            }

            const parts = new Intl.DateTimeFormat('en-GB', {
                timeZone: 'Asia/Dubai',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }).formatToParts(date);

            const part = name =>
                parts.find(entry => entry.type === name)?.value ?? '';

            return `${part('year')}-${part('month')}-${part('day')}`;
        };

        const rows = await db.collection('invoicemain')
            .find(
                {
                    Customer: {
                        $regex: `^${escapeRegex(Customer.trim())}$`,
                        $options: 'i'
                    }
                },
                {
                    projection: {
                        _id: 1,
                        ID: 1,
                        Customer: 1,
                        Emirate: 1,
                        InvoiceNo: 1,
                        InvoiceDate: 1,
                        LPONo: 1,
                        GrandTotal: 1,
                        CreditDate: 1,
                        CNAmount: 1,
                        CNNumber: 1,
                        CNStatus: 1,
                        CNPaid: 1,
                        PaymentType: 1,
                        Status: 1
                    }
                }
            )
            .sort({ InvoiceDate: -1, InvoiceNo: -1 })
            .toArray();

        const multiInvoice = rows.map(row => {
            const hasLegacyID =
                row.ID !== undefined &&
                row.ID !== null &&
                String(row.ID).trim() !== '';

            return {
                _id: row._id.toString(),
                ID: hasLegacyID ? row.ID : row._id.toString(),
                Customer: row.Customer,
                Emirate: row.Emirate,
                InvoiceNo: row.InvoiceNo,
                InvoiceDate: formatDate(row.InvoiceDate),
                LPONo: row.LPONo,
                CreditDate: formatDate(row.CreditDate),
                GrandTotal: row.GrandTotal,
                CNAmount: row.CNAmount,
                CNNumber: row.CNNumber,
                CNStatus: row.CNStatus,
                CNPaid: row.CNPaid,
                PaymentType: row.PaymentType,
                Status: row.Status
            };
        });

        return res.status(200).json({
            multiInvoice
        });

    } catch (err) {
        console.error("MongoDB multi-invoice receipt fetch failed:", err);

        return res.status(500).json({
            error: err.message
        });
    }
});

//PRINT CASH-CHEQUE RECEIPT - MULTI INVOICE
app.post('/api/generate-multi-receipt-pdf/:filename', async (req, res) => {
   // 2. Read values from req.query instead of req.body
    try {
    const { multicustomerName, multiemirate, multiinvoiceCount, multireceiptDate,
            multichqNo, multireceiptType, multichqDate, multibankName, multiinWords, 
            multifinalAmount, multiselectedItems, filename } = req.body;
    const documentTitle = `${multireceiptType.toUpperCase()} RECEIPT`;
    const invoices = JSON.parse(multiselectedItems || '[]');
    const dynamicFilename = req.params.filename || 'Multi_Receipt.pdf';

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(dynamicFilename)}"`);


    const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        View: ['XYZ', null, null, 1] // Forces 100% viewer layout zoom metric metadata
    });
        doc.pipe(res);

        // --- START OF INTEGRATED HEADER LOGIC ---
        const logoPath = fs.existsSync(getPdfLogoPath()) 
          ? getPdfLogoPath() 
          : getPdfLogoPath();

        if (fs.existsSync(logoPath)) {
            try {
                const logoBuffer = fs.readFileSync(logoPath);
                doc.image(logoBuffer, 40, 35, { height: 43 });
                
                doc.fillColor('#050505').fontSize(9).font('Helvetica');
                doc.text('Musafah 34, Abu Dhabi, United Arab Emirates', 40, 85);
                doc.text('www.centralairtechac.com | Email: admin@centralairtechac.com', 40, 97);
            } catch (imgError) {
                console.error("[ERP IMAGE PARSING ERROR] Failed to load logo buffer:", imgError);
                renderTextFallbackHeader(doc);
            }
        } else {
            renderTextFallbackHeader(doc);
        }

        function renderTextFallbackHeader(pdfDoc) {
            pdfDoc.fillColor('#252e3d').fontSize(14).font('Helvetica-Bold').text('CENTRAL AIRTECH AC SYSTEMS', 40, 40);
            pdfDoc.fontSize(9).font('Helvetica').fillColor('#050505');
            pdfDoc.text('Musafah 34, Abu Dhabi, United Arab Emirates', 40, 58);
            pdfDoc.text('www.centralairtechac.com | Email: admin@centralairtechac.com', 40, 70);
        }
        // --- END OF INTEGRATED HEADER LOGIC ---

        // Draw a clean horizontal line right below the header area (Y: 120)
        doc.strokeColor("#d1d5db").lineWidth(1).moveTo(40, 110).lineTo(555, 110).stroke();

        // 3. Document Received from
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#1f2937').text(documentTitle, 40, 130, { align: 'center' });
        
        

        // Draw structural info card based on Receipt Type
        
        if(multireceiptType === "Cash"){
            // 1. Set up your base positioning and line spacing options
        const textOptions = { lineGap: 10, continued: true, align: 'justify',width: 510 };
        doc.fillColor('#111827')
        .fontSize(12)
        .font('Helvetica'); // Base regular font
        doc.text('Received with thanks from ', 42, 180, textOptions);
        doc.font('Helvetica-Bold').text(` ${multicustomerName.toUpperCase()}  ${multiemirate.toUpperCase()} `, textOptions);
        doc.font('Helvetica').text(' the Sum of AED: ', textOptions);
        doc.font('Helvetica-Bold').text(` ${parseFloat(multifinalAmount).toFixed(2)}  (${multiinWords.toUpperCase()}) `, textOptions);
        doc.font('Helvetica').text(` by Cash towards Invoices (${multiinvoiceCount})`, { lineGap: 10, continued: false});
        // doc.font('Helvetica-Bold').text(` ${invoiceNo} `, textOptions);
        // doc.font('Helvetica').text(' Dated ', textOptions);
        // doc.font('Helvetica-Bold').text(` ${formatToDdMMMyyyy(invoiceDate)}.`, { lineGap: 10 }); 

        }else if(multireceiptType === "Cheque"){
        const textOptions = { lineGap: 10, continued: true, align: 'justify', width: 510 };
        doc.fillColor('#111827')
        .fontSize(12)
        .font('Helvetica'); // Base regular font
        doc.text('Received with thanks from ', 42, 180, textOptions);
        doc.font('Helvetica-Bold').text(`${multicustomerName.toUpperCase()}  ${multiemirate.toUpperCase()} `, textOptions);
        doc.font('Helvetica').text('the Sum of AED: ', textOptions);
        doc.font('Helvetica-Bold').text(`${parseFloat(multifinalAmount).toFixed(2)}  (${multiinWords.toUpperCase()}) `, textOptions);
        doc.font('Helvetica').text('by Cheque with Number:', textOptions);
        doc.font('Helvetica-Bold').text(`${multichqNo} `, textOptions);
        doc.font('Helvetica').text('dated: ', textOptions);
        doc.font('Helvetica-Bold').text(`${formatToDdMMMyyyy(multichqDate)}, `, textOptions);
        doc.font('Helvetica').text('with Bank ', textOptions);
        doc.font('Helvetica-Bold').text(`${multibankName} `, textOptions);
        doc.font('Helvetica').text(`towards Invoices (${multiinvoiceCount})`, { lineGap: 10, continued: false});

        // doc.font('Helvetica-Bold').text(` ${invoiceNo} `, textOptions);
        // doc.font('Helvetica').text(' Dated ', textOptions);
        // doc.font('Helvetica-Bold').text(` ${formatToDdMMMyyyy(invoiceDate)}.`, { lineGap: 10 }); 

        }else if(multireceiptType === "Bank Transfer" || multireceiptType === "Bank Deposit" ){
        const textOptions = { lineGap: 10, continued: true, align: 'justify', width: 510 };
        doc.fillColor('#111827')
        .fontSize(12)
        .font('Helvetica'); // Base regular font
        doc.text('Received with thanks from ', 42, 180, textOptions);
        doc.font('Helvetica-Bold').text(` ${multicustomerName.toUpperCase()}  ${multiemirate.toUpperCase()} `, textOptions);
        doc.font('Helvetica').text(' the Sum of AED: ', textOptions);
        doc.font('Helvetica-Bold').text(` ${parseFloat(multifinalAmount).toFixed(2)}  (${multiinWords.toUpperCase()}) `, textOptions);
        doc.font('Helvetica').text(' by Bank Transfer/Deposit', textOptions);
        doc.font('Helvetica-Bold').text(` ${multichqNo} `, textOptions);
        doc.font('Helvetica').text(` towards Invoices (${multiinvoiceCount}) `, { lineGap: 10, continued: false});
        // doc.font('Helvetica-Bold').text(` ${invoiceNo} `, textOptions);
        // doc.font('Helvetica').text(' Dated ', textOptions);
        // doc.font('Helvetica-Bold').text(` ${formatToDdMMMyyyy(invoiceDate)}.`, { lineGap: 10 }); 

        }

        // yPos = 305;
        let yPos = Math.max(305, doc.y + 25);


// ==========================================
// 1. AUTO-WIDTH WITH 510 MAX CONSTRAINT
// ==========================================
            const MAX_TABLE_WIDTH = 510;
            const startX = 42; 

            let colWidths = {
                sr: 25,
                invoiceNo: 70, 
                invoiceDate: 70,
                lpoNo: 65,     
                amount: 60,
                cnAmount: 60,
                balance: 60
            };

            // Check data bounds to see if we need to expand columns
            invoices.forEach(item => {
                const invNoStr = String(item.InvoiceNo || "N/A");
                const lpoStr = String(item.LPONo || "-");

                doc.font('Helvetica').fontSize(10);
                const measuredInvWidth = doc.widthOfString(invNoStr) + 15; 
                const measuredLpoWidth = doc.widthOfString(lpoStr) + 15;

                if (measuredInvWidth > colWidths.invoiceNo) colWidths.invoiceNo = Math.ceil(measuredInvWidth);
                if (measuredLpoWidth > colWidths.lpoNo) colWidths.lpoNo = Math.ceil(measuredLpoWidth);
            });

            // Proportional Scaling Constraint logic to guarantee table doesn't exceed 510pt
            let currentTotalWidth = Object.values(colWidths).reduce((a, b) => a + b, 0);

            if (currentTotalWidth > MAX_TABLE_WIDTH) {
                const scaleFactor = MAX_TABLE_WIDTH / currentTotalWidth;
                Object.keys(colWidths).forEach(key => {
                    colWidths[key] = Math.floor(colWidths[key] * scaleFactor);
                });
            } else {
                const extraSpace = MAX_TABLE_WIDTH - currentTotalWidth;
                colWidths.invoiceNo += Math.floor(extraSpace * 0.6);
                colWidths.lpoNo += Math.ceil(extraSpace * 0.4);
            }

            // Map exact relative X positions inside the 510 boundary box
            let colX = {
                sr: startX,
                invoiceNo: startX,
                invoiceDate: startX,
                lpoNo: startX,
                amount: startX,
                cnAmount: startX,
                balance: startX
            };

            const keys = Object.keys(colWidths);
            for (let i = 1; i < keys.length; i++) {
                const prevKey = keys[i - 1];
                const currentKey = keys[i];
                colX[currentKey] = colX[prevKey] + colWidths[prevKey];
            }

            const endX = startX + MAX_TABLE_WIDTH;

            // ==========================================
            // 2. REUSABLE HEADER RENDERER FUNCTION
            // ==========================================
            function renderTableHeader(pdfDoc, currentY) {
                // Optional: Draw a dark clean background box for the headers
                pdfDoc.rect(startX, currentY, MAX_TABLE_WIDTH, 22).fill('#f1f5f9');
                
                pdfDoc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(10);
                pdfDoc.text('Sr', colX.sr, currentY + 6, { width: colWidths.sr, align: 'center' });
                pdfDoc.text('Invoice No', colX.invoiceNo, currentY + 6, { width: colWidths.invoiceNo, align: 'center' });
                pdfDoc.text('Invoice Date', colX.invoiceDate, currentY + 6, { width: colWidths.invoiceDate, align: 'center' });
                pdfDoc.text('LPO No', colX.lpoNo, currentY + 6, { width: colWidths.lpoNo, align: 'center' });
                pdfDoc.text('Amount', colX.amount, currentY + 6, { width: colWidths.amount, align: 'right' });
                pdfDoc.text('CN Amt', colX.cnAmount, currentY + 6, { width: colWidths.cnAmount, align: 'right' });
                pdfDoc.text('Balance', colX.balance, currentY + 6, { width: colWidths.balance, align: 'right' });
                
                // Draw a subtle line underneath the header cells
                pdfDoc.moveTo(startX, currentY + 22).lineTo(endX, currentY + 22).lineWidth(0.5).stroke('#cbd5e1');
            }

            // Render the initial header on the first page
            renderTableHeader(doc, yPos);
            yPos += 22; // Push rows down below the header line
            doc.font('Helvetica').fontSize(10);

            let subtotalTaxable = 0;

            // ==========================================
            // 3. DYNAMIC ROW PROCESSING LOOP
            // ==========================================
            invoices.forEach((item, index) => {
                const InvoiceNo = String(item.InvoiceNo || "N/A");
                
                // Dynamic height scaling inside column box width
                const textHeight = doc.heightOfString(InvoiceNo, { width: colWidths.invoiceNo });
                const rowHeight = Math.max(20, textHeight + 10);

                // Row Background Striping 
                if (index % 2 === 0) {
                    doc.rect(startX, yPos, MAX_TABLE_WIDTH, rowHeight).fill('#f8f9fa');
                } else {
                    doc.rect(startX, yPos, MAX_TABLE_WIDTH, rowHeight).fill('#ffffff');
                }

                subtotalTaxable += parseFloat(item.GrandTotal || 0);

                // Render Row Text
                doc.fillColor('#000000');
                doc.text(index + 1, colX.sr, yPos + 5, { width: colWidths.sr, align: 'center' });
                doc.text(InvoiceNo, colX.invoiceNo, yPos + 5, { width: colWidths.invoiceNo, align: 'center' });
                doc.text(item.InvoiceDate || '-', colX.invoiceDate, yPos + 5, { width: colWidths.invoiceDate, align: 'center' });
                doc.text(item.LPONo || '-', colX.lpoNo, yPos + 5, { width: colWidths.lpoNo, align: 'center' });
                doc.text(parseFloat(item.GrandTotal || 0).toFixed(2), colX.amount, yPos + 5, { width: colWidths.amount, align: 'right' });
                doc.text(parseFloat(item.CNAmount || 0).toFixed(2), colX.cnAmount, yPos + 5, { width: colWidths.cnAmount, align: 'right' });
                doc.text(parseFloat(item.Balance || 0).toFixed(2), colX.balance, yPos + 5, { width: colWidths.balance, align: 'right' });
                
                yPos += rowHeight;

                // Smart Multipage Pagination Logic
                if (yPos + rowHeight > 770) {
                    doc.addPage();
                    yPos = 50; // Top starting position on the fresh page
                    
                    // CRITICAL FIX: Redraw the headers cleanly at the top of the new page
                    renderTableHeader(doc, yPos);
                    yPos += 22; // Move yPos past the new header row
                    doc.font('Helvetica').fontSize(10); // Reset font states
                }
            });

            // ==========================================
            // 4. SUMMARY FOOTER BLOCK
            // ==========================================
            yPos += 15;
            if (yPos > 740) { 
                doc.addPage(); 
                yPos = 50; 
            }

            doc.moveTo(startX, yPos).lineTo(endX, yPos).lineWidth(1).stroke('#0d1b2a');
            yPos += 8;

            doc.fillColor('#415a77').font('Helvetica').text('Receipt Amount:', colX.cnAmount - 40, yPos, { width: colWidths.cnAmount + 40, align: 'right' });
            doc.fillColor('#333333').font('Helvetica-Bold').text(Number(multifinalAmount).toFixed(2), colX.balance, yPos, {
    width: colWidths.balance,
    align: 'right'
});

        

        const bottomY = 780;
        doc.fillColor('#111827').font('Helvetica').fontSize(10).text("For CENTRAL AIR TECH", 380, bottomY - 10, { width: 160, align: 'center' });
        
        // Date area
        doc.fontSize(10).font('Helvetica').fillColor('#4b5563');
        doc.text(`Receipt Date: ${formatToDdMMMyyyy(multireceiptDate)}`, 40, bottomY + 8);

        // 6. Signatures Area
        doc.strokeColor("#9ca3af").lineWidth(0.5).moveTo(40, bottomY).lineTo(540, bottomY).stroke();
        doc.fillColor('#4b5563').font('Helvetica').fontSize(10).text("Authorized Signature", 380, bottomY + 8, { width: 160, align: 'center' });

        // Finalize stream rendering pipeline
        doc.end();

    } catch (err) {
        console.error("PDF compiling error:", err);
        res.status(500).send("Error compiling receipt document.");
    }
});


// Vercel imports the app. npm start keeps local development available.
module.exports = app;
if (require.main === module && !process.env.VERCEL) {
    app.listen(HTTP_PORT, () => {
        console.log(`AlFajar ERP test server listening on port ${HTTP_PORT}`);
    });
}
