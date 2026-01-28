import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext'; // Agregar useAuth
import Header from '../../components/Layout/Header';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import { salesHeaderService, customerService, paymentTermsService } from '../../services/dataService';
import './SalesHeaders.css';

const SalesHeaders = () => {
  const { user } = useAuth(); // Obtener usuario autenticado
  const [salesHeaders, setSalesHeaders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [paymentTerms, setPaymentTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingHeader, setEditingHeader] = useState(null);
  const [formData, setFormData] = useState({
    DocumentType: 1,
    No_: '',
    SellToCustomerNo: '',
    BillToCustomerNo: '',
    DocumentDate: new Date().toISOString().split('T')[0],
    PostingDate: new Date().toISOString().split('T')[0],
    DueDate: new Date().toISOString().split('T')[0],
    PaymentTermsCode: '',
    CurrencyCode: 'COP',
    PricesIncludingVAT: 0,
    Status: 'Open',
    AmountIncludingVAT: ''
  });

  // Debug: log formData cuando cambie
  useEffect(() => {
    console.log('SalesHeaders formData:', formData);
  }, [formData]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [headersResponse, customersResponse, paymentTermsResponse] = await Promise.all([
        salesHeaderService.getAll(),
        customerService.getAll(),
        paymentTermsService.getAll()
      ]);
      
      console.log(`Sales Headers para usuario ${user.id}:`, headersResponse.data.length);
      console.log('Sales Headers response:', headersResponse.data);
      setSalesHeaders(headersResponse.data);
      setCustomers(customersResponse.data);
      setPaymentTerms(paymentTermsResponse.data);
    } catch (err) {
      setError('Error al cargar datos');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log('SalesHeaders input change:', { name, value });
    
    // Actualizar BillToCustomerNo automáticamente cuando cambia SellToCustomerNo
    if (name === 'SellToCustomerNo') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        BillToCustomerNo: value // Auto-completar con el mismo cliente
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación básica
    if (!formData.No_ || !formData.SellToCustomerNo) {
      setError('Por favor complete todos los campos requeridos');
      return;
    }

    try {
      const dataToSend = {
        ...formData,
        DocumentType: parseInt(formData.DocumentType),
        PricesIncludingVAT: parseInt(formData.PricesIncludingVAT),
        AmountIncludingVAT: formData.AmountIncludingVAT === '' ? 0 : parseFloat(formData.AmountIncludingVAT),
        BillToCustomerNo: formData.BillToCustomerNo || formData.SellToCustomerNo // Usar SellToCustomerNo si BillToCustomerNo está vacío
      };
      
      console.log(`Enviando datos de orden de venta para usuario ${user.id}:`, dataToSend);
      
      if (editingHeader) {
        await salesHeaderService.update(editingHeader['No_'] || editingHeader.No_, dataToSend);
        console.log(`Sales header ${editingHeader['No_'] || editingHeader.No_} actualizado para usuario ${user.id}`);
      } else {
        await salesHeaderService.create(dataToSend);
        console.log(`Sales header ${formData.No_} creado para usuario ${user.id}`);
      }
      
      await fetchData(); // Recargar datos después de crear/actualizar
      resetForm();
      setError(null); // Limpiar error si todo sale bien
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error desconocido';
      setError(`Error al guardar orden de venta: ${errorMessage}`);
      console.error('Error saving sales header:', err);
      console.error('Error response:', err.response?.data);
    }
  };

  const handleEdit = (header) => {
    console.log('Editing header:', header);
    setEditingHeader(header);
    setFormData({
      DocumentType: header['Document Type'] || header.DocumentType || 1,
      No_: header['No_'] || header.No_ || '',
      SellToCustomerNo: header['Sell-to Customer No_'] || header.SellToCustomerNo || '',
      BillToCustomerNo: header['Bill-to Customer No_'] || header.BillToCustomerNo || '',
      DocumentDate: header['Document Date'] 
        ? header['Document Date'].split('T')[0] 
        : header.DocumentDate 
        ? header.DocumentDate.split('T')[0] 
        : new Date().toISOString().split('T')[0],
      PostingDate: header['Posting Date'] 
        ? header['Posting Date'].split('T')[0] 
        : header.PostingDate 
        ? header.PostingDate.split('T')[0] 
        : new Date().toISOString().split('T')[0],
      DueDate: header['Due Date'] 
        ? header['Due Date'].split('T')[0] 
        : header.DueDate 
        ? header.DueDate.split('T')[0] 
        : new Date().toISOString().split('T')[0],
      PaymentTermsCode: header['Payment Terms Code'] || header.PaymentTermsCode || '',
      CurrencyCode: header['Currency Code'] || header.CurrencyCode || 'COP',
      PricesIncludingVAT: header['Prices Including VAT'] || header.PricesIncludingVAT || 0,
      Status: header.Status || 'Open',
      AmountIncludingVAT: (header['Amount Including VAT'] || header.AmountIncludingVAT || '').toString()
    });
    setShowForm(true);
  };

  const handleDelete = async (headerNo) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta orden de venta?')) {
      try {
        await salesHeaderService.delete(headerNo);
        setSalesHeaders(salesHeaders.filter(sh => (sh['No_'] || sh.No_) !== headerNo));
        console.log(`Sales header ${headerNo} eliminado para usuario ${user.id}`);
        setError(null);
      } catch (err) {
        setError(`Error al eliminar orden de venta: ${err.response?.data?.message || err.message}`);
        console.error('Error deleting sales header:', err);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      DocumentType: 1,
      No_: '',
      SellToCustomerNo: '',
      BillToCustomerNo: '',
      DocumentDate: new Date().toISOString().split('T')[0],
      PostingDate: new Date().toISOString().split('T')[0],
      DueDate: new Date().toISOString().split('T')[0],
      PaymentTermsCode: '',
      CurrencyCode: 'COP',
      PricesIncludingVAT: 0,
      Status: 'Abierto', // Cambiar el valor por defecto
      AmountIncludingVAT: ''
    });
    setEditingHeader(null);
    setShowForm(false);
    setError(null);
  };

  if (loading) return <div className="loading">Cargando órdenes de venta...</div>;

  return (
    <div className="sales-headers">
      <Header title={`Órdenes de Venta - ${user?.firstName || 'Usuario'}`} />
      
      <div className="sales-headers-content">
        {error && <div className="error-banner">{error}</div>}
        
        {showForm && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>{editingHeader ? 'Editar Orden de Venta' : 'Nueva Orden de Venta'}</h3>
                <button onClick={resetForm} className="close-button">×</button>
              </div>

              <form onSubmit={handleSubmit} className="sales-header-form">
                <div className="form-grid">
                  <Input
                    label="Número de Orden"
                    name="No_"
                    value={formData.No_}
                    onChange={handleInputChange}
                    required
                    disabled={editingHeader}
                    placeholder="Ingrese el número de orden"
                  />
                  
                  <div className="input-group">
                    <label className="input-label">Cliente (Vender a) *</label>
                    <select
                      name="SellToCustomerNo"
                      value={formData.SellToCustomerNo}
                      onChange={handleInputChange}
                      className="input"
                      required
                    >
                      <option value="">Seleccionar cliente</option>
                      {customers.map(customer => (
                        <option key={customer['No_'] || customer.No_} value={customer['No_'] || customer.No_}>
                          {customer.Name} ({customer['No_'] || customer.No_})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="input-group">
                    <label className="input-label">Cliente (Facturar a)</label>
                    <select
                      name="BillToCustomerNo"
                      value={formData.BillToCustomerNo}
                      onChange={handleInputChange}
                      className="input"
                    >
                      <option value="">Seleccionar cliente (opcional)</option>
                      {customers.map(customer => (
                        <option key={customer['No_'] || customer.No_} value={customer['No_'] || customer.No_}>
                          {customer.Name} ({customer['No_'] || customer.No_})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <Input
                    label="Fecha de Documento"
                    name="DocumentDate"
                    type="date"
                    value={formData.DocumentDate}
                    onChange={handleInputChange}
                    required
                  />
                  
                  <Input
                    label="Fecha de Contabilización"
                    name="PostingDate"
                    type="date"
                    value={formData.PostingDate}
                    onChange={handleInputChange}
                    required
                  />
                  
                  <Input
                    label="Fecha de Vencimiento"
                    name="DueDate"
                    type="date"
                    value={formData.DueDate}
                    onChange={handleInputChange}
                  />
                  
                  <div className="input-group">
                    <label className="input-label">Términos de Pago</label>
                    <select
                      name="PaymentTermsCode"
                      value={formData.PaymentTermsCode}
                      onChange={handleInputChange}
                      className="input"
                    >
                      <option value="">Seleccionar términos</option>
                      {paymentTerms.map(term => (
                        <option key={term.Code} value={term.Code}>
                          {term.Description} ({term.Code})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <Input
                    label="Moneda"
                    name="CurrencyCode"
                    value={formData.CurrencyCode}
                    onChange={handleInputChange}
                    placeholder="COP"
                  />
                  
                  <div className="input-group">
                    <label className="input-label">Precios Incluyen IVA</label>
                    <select
                      name="PricesIncludingVAT"
                      value={formData.PricesIncludingVAT}
                      onChange={handleInputChange}
                      className="input"
                    >
                      <option value={0}>No</option>
                      <option value={1}>Sí</option>
                    </select>
                  </div>
                  
                  <Input
                    label="Monto Incluyendo IVA"
                    name="AmountIncludingVAT"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.AmountIncludingVAT}
                    onChange={handleInputChange}
                    placeholder="0.00"
                  />
                  
                  <div className="input-group">
                    <label className="input-label">Estado</label>
                    <select
                      name="Status"
                      value={formData.Status}
                      onChange={handleInputChange}
                      className="input"
                    >
                      <option value="Abierto">Abierto</option>
                      <option value="Cerrado">Cerrado</option>
                      <option value="Pendiente">Pendiente</option>
                    </select>
                  </div>
                </div>

                <div className="form-actions">
                  <Button type="button" variant="secondary" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingHeader ? 'Actualizar' : 'Crear'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="sales-headers-header">
          <div className="sales-headers-actions">
            <Button onClick={() => setShowForm(true)}>
              Nueva Orden de Venta
            </Button>
          </div>
        </div>

        <div className="sales-headers-table">
          <table>
            <thead>
              <tr>
                <th>No.</th>
                <th>Cliente</th>
                <th>Fecha Documento</th>
                <th>Fecha Vencimiento</th>
                <th>Monto</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {salesHeaders.map((header) => (
                <tr key={header['No_'] || header.No_}>
                  <td>{header['No_'] || header.No_}</td>
                  <td>{header['Sell-to Customer No_'] || header.SellToCustomerNo}</td>
                  <td>{header['Document Date'] ? new Date(header['Document Date']).toLocaleDateString() : header.DocumentDate ? new Date(header.DocumentDate).toLocaleDateString() : ''}</td>
                  <td>{header['Due Date'] ? new Date(header['Due Date']).toLocaleDateString() : header.DueDate ? new Date(header.DueDate).toLocaleDateString() : ''}</td>
                  <td>${Number(header['Amount Including VAT'] || header.AmountIncludingVAT || 0).toLocaleString()}</td>
                  <td>
                    <span className={`status-badge status-${(header.Status || '').toLowerCase().replace(' ', '-')}`}>
                      {header.Status}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <Button 
                        size="small" 
                        variant="secondary"
                        onClick={() => handleEdit(header)}
                      >
                        Editar
                      </Button>
                      <Button 
                        size="small" 
                        variant="danger"
                        onClick={() => handleDelete(header['No_'] || header.No_)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {salesHeaders.length === 0 && (
            <div className="empty-state">
              <p>No tienes órdenes de venta registradas</p>
              <Button onClick={() => setShowForm(true)}>+ Crear primera orden de venta</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesHeaders;
