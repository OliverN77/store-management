const express = require('express');
const dotenv = require('dotenv');
const helmet = require('helmet');
const cors = require('cors');
dotenv.config();
const app = express();
app.use(express.json());
app.use(helmet());
app.use(cors());

// Importar rutas
const authRoutes = require('./src/routes/authRoutes');
const customerRoutes = require('./src/routes/customerRoutes');
const vendorRoutes = require('./src/routes/vendorRoutes');
const itemRoutes = require('./src/routes/itemRoutes');
const salesHeaderRoutes = require('./src/routes/salesHeaderRoutes');
const salesLineRoutes = require('./src/routes/salesLineRoutes');
const purchaseHeaderRoutes = require('./src/routes/purchaseHeaderRoutes');
const purchaseLineRoutes = require('./src/routes/purchaseLineRoutes');
const itemLedgerEntryRoutes = require('./src/routes/itemLedgerEntryRoutes');
const paymentTermsRoutes = require('./src/routes/paymentTermsRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const userRoutes = require('./src/routes/userRoutes');

// Usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/sales-headers', salesHeaderRoutes);
app.use('/api/sales-lines', salesLineRoutes);
app.use('/api/purchase-headers', purchaseHeaderRoutes);
app.use('/api/purchase-lines', purchaseLineRoutes);
app.use('/api/item-ledger-entries', itemLedgerEntryRoutes);
app.use('/api/payment-terms', paymentTermsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);

// Health endpoint
app.get('/health', (req, res) => {
	res.json({ status: 'ok', uptime: process.uptime() });
});

// Optional root
app.get('/', (req, res) => {
	res.send('Store Management API');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));