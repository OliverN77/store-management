import React, { useState, useEffect } from 'react';
import Header from '../../components/Layout/Header';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import { purchaseHeaderService, vendorService, paymentTermsService } from '../../services/dataService';
import './PurchaseHeaders.css';

const PurchaseHeaders = () => {
  const [purchaseHeaders, setPurchaseHeaders] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [paymentTerms, setPaymentTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalError, setModalError] = useState(null); // Error específico para la modal
  const [showForm, setShowForm] = useState(false);
  const [editingHeader, setEditingHeader] = useState(null);
  const [formData, setFormData] = useState({
    DocumentType: 1,
    No_: '',
    BuyfromVendorNo: '',
    PayToVendorNo: '',
    DocumentDate: new Date().toISOString().split('T')[0],
    PostingDate: new Date().toISOString().split('T')[0],
    DueDate: new Date().toISOString().split('T')[0],
    PaymentTermsCode: '',
    CurrencyCode: 'COP',
    Status: 'Activo',
    AmountIncludingVAT: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [headersResponse, vendorsResponse, paymentTermsResponse] = await Promise.all([
        purchaseHeaderService.getAll(),
        vendorService.getAll(),
        paymentTermsService.getAll()
      ]);
      
      console.log('Purchase Headers response:', headersResponse.data);
      setPurchaseHeaders(headersResponse.data);
      setVendors(vendorsResponse.data);
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
    console.log('PurchaseHeaders input change:', { name, value });
    
    // Limpiar error de la modal cuando el usuario cambie algún campo
    if (modalError) {
      setModalError(null);
    }
    
    // Actualizar PayToVendorNo automáticamente cuando cambia BuyfromVendorNo
    if (name === 'BuyfromVendorNo') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        PayToVendorNo: value // Auto-completar con el mismo proveedor
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
    
    // Limpiar errores previos
    setModalError(null);
    
    // Validación básica
    if (!formData.BuyfromVendorNo) {
      setModalError('Por favor seleccione un proveedor');
      return;
    }

    try {
      const dataToSend = {
        ...formData,
        DocumentType: parseInt(formData.DocumentType),
        AmountIncludingVAT: formData.AmountIncludingVAT === '' ? 0 : parseFloat(formData.AmountIncludingVAT),
        PayToVendorNo: formData.PayToVendorNo || formData.BuyfromVendorNo,
        // Si No_ está vacío, no enviarlo para que se genere automáticamente
        ...(formData.No_ && formData.No_.trim() !== '' && { No_: formData.No_ })
      };
      console.log('Enviando datos de la orden de compra:', dataToSend);
      
      if (editingHeader) {
        await purchaseHeaderService.update(editingHeader['No_'], dataToSend);
      } else {
        const response = await purchaseHeaderService.create(dataToSend);
        console.log('Documento creado con número:', response.data.documentNo);
      }
      
      await fetchData(); // Recargar datos después de crear/actualizar
      resetForm();
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error desconocido';
      
      // Mostrar error en la modal en lugar de en el banner principal
      setModalError(errorMessage);
      
      console.error('Error saving purchase header:', err);
      console.error('Error response:', err.response?.data);
    }
  };

  const handleEdit = (header) => {
    console.log('Editing header:', header);
    setEditingHeader(header);
    setModalError(null); // Limpiar errores al abrir para editar
    
    setFormData({
      DocumentType: header['Document Type'] || header.DocumentType || 1,
      No_: header['No_'] || '',
      BuyfromVendorNo: header['Buy-from Vendor No_'] || header.BuyfromVendorNo || '',
      PayToVendorNo: header['Pay-to Vendor No_'] || header.PayToVendorNo || '',
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
      Status: header.Status || 'Activo',
      AmountIncludingVAT: (header['Amount Including VAT'] || header.AmountIncludingVAT || '').toString()
    });
    setShowForm(true);
  };

  const handleDelete = async (headerNo) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta orden de compra?')) {
      try {
        await purchaseHeaderService.delete(headerNo);
        setPurchaseHeaders(purchaseHeaders.filter(ph => ph['No_'] !== headerNo));
        setError(null);
      } catch (err) {
        setError('Error al eliminar orden de compra');
        console.error('Error deleting purchase header:', err);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      DocumentType: 1,
      No_: '',
      BuyfromVendorNo: '',
      PayToVendorNo: '',
      DocumentDate: new Date().toISOString().split('T')[0],
      PostingDate: new Date().toISOString().split('T')[0],
      DueDate: new Date().toISOString().split('T')[0],
      PaymentTermsCode: '',
      CurrencyCode: 'COP',
      Status: 'Activo',
      AmountIncludingVAT: ''
    });
    setEditingHeader(null);
    setShowForm(false);
    setModalError(null); // Limpiar errores de la modal
  };

  if (loading) return <div className="loading">Cargando órdenes de compra...</div>;

  return (
    <div className="purchase-headers">
      <Header title="Órdenes de Compra" />
      
      <div className="purchase-headers-content">
        {error && <div className="error-banner">{error}</div>}
        
        {showForm && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>{editingHeader ? 'Editar Orden de Compra' : 'Nueva Orden de Compra'}</h3>
                <button onClick={resetForm} className="close-button">×</button>
              </div>

              {/* Error banner dentro de la modal */}
              {modalError && (
                <div className="modal-error-banner" style={{
                  backgroundColor: '#fee2e2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  padding: '12px 16px',
                  borderRadius: '6px',
                  margin: '0 24px 20px 24px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  {modalError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="purchase-header-form">
                <div className="form-grid">
                  <Input
                    label="Número de Orden"
                    name="No_"
                    value={formData.No_}
                    onChange={handleInputChange}
                    required={editingHeader} // Solo requerido al editar
                    disabled={editingHeader}
                    placeholder={editingHeader ? "Número fijo" : "Se generará automáticamente si se deja vacío"}
                  />
                  
                  <div className="input-group">
                    <label className="input-label">Proveedor (Comprar de) *</label>
                    <select
                      name="BuyfromVendorNo"
                      value={formData.BuyfromVendorNo}
                      onChange={handleInputChange}
                      className="input"
                      required
                    >
                      <option value="">Seleccionar proveedor</option>
                      {vendors.map(vendor => (
                        <option key={vendor['No_']} value={vendor['No_']}>
                          {vendor.Name} ({vendor['No_']})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="input-group">
                    <label className="input-label">Proveedor (Pagar a)</label>
                    <select
                      name="PayToVendorNo"
                      value={formData.PayToVendorNo}
                      onChange={handleInputChange}
                      className="input"
                    >
                      <option value="">Mismo proveedor</option>
                      {vendors.map(vendor => (
                        <option key={vendor['No_']} value={vendor['No_']}>
                          {vendor.Name} ({vendor['No_']})
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
                    <label className="input-label">Estado</label>
                    <select
                      name="Status"
                      value={formData.Status}
                      onChange={handleInputChange}
                      className="input"
                    >
                      <option value="Activo">Activo</option>
                      <option value="Pendiente">Pendiente</option>
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

        <div className="purchase-headers-header">
          <div className="purchase-headers-actions">
            <Button onClick={() => {
              setModalError(null); // Limpiar errores al abrir modal nueva
              setShowForm(true);
            }}>
              Nueva Orden de Compra
            </Button>
          </div>
        </div>

        <div className="purchase-headers-table">
          <table>
            <thead>
              <tr>
                <th>No.</th>
                <th>Proveedor</th>
                <th>Fecha Documento</th>
                <th>Fecha Vencimiento</th>
                <th>Monto</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {purchaseHeaders.map((header) => (
                <tr key={header['No_']}>
                  <td>{header['No_']}</td>
                  <td>{header['Buy-from Vendor No_'] || header.BuyfromVendorNo}</td>
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
                        onClick={() => handleDelete(header['No_'])}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PurchaseHeaders;
