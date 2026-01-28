import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard/Dashboard';
import Products from './pages/Products/Products';
import Customers from './pages/Customers/Customers';
import Vendors from './pages/Vendors/Vendors';
import PaymentTerms from './pages/PaymentTerms/PaymentTerms';
import SalesHeaders from './pages/SalesHeaders/SalesHeaders';
import SalesLines from './pages/SalesLines/SalesLines';
import PurchaseHeaders from './pages/PurchaseHeaders/PurchaseHeaders';
import PurchaseLines from './pages/PurchaseLines/PurchaseLines';
import ItemLedgerEntries from './pages/ItemLedgerEntries/ItemLedgerEntries';
import './styles/globals.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <ProtectedRoute>
          <Layout>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              
              {/* Maestros */}
              <Route path="/products" element={<Products />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/vendors" element={<Vendors />} />
              <Route path="/payment-terms" element={<PaymentTerms />} />
              
              {/* Operaciones */}
              <Route path="/sales-headers" element={<SalesHeaders />} />
              <Route path="/sales-lines" element={<SalesLines />} />
              <Route path="/purchase-headers" element={<PurchaseHeaders />} />
              <Route path="/purchase-lines" element={<PurchaseLines />} />
              
              {/* Inventario */}
              <Route path="/item-ledger-entries" element={<ItemLedgerEntries />} />
            </Routes>
          </Layout>
        </ProtectedRoute>
      </Router>
    </AuthProvider>
  );
}

export default App;
