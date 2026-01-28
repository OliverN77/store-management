import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../../components/Layout/Header';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import { paymentTermsService } from '../../services/dataService';
import './PaymentTerms.css';

const PaymentTerms = () => {
  const { user } = useAuth();
  const [paymentTerms, setPaymentTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTerm, setEditingTerm] = useState(null);
  const [formData, setFormData] = useState({
    Code: '',
    Description: '',
    DueDateCalculation: ''
  });

  useEffect(() => {
    console.log('PaymentTerms formData:', formData);
  }, [formData]);

  // CORREGIDO: useCallback para fetchPaymentTerms
  const fetchPaymentTerms = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await paymentTermsService.getAll();
      console.log(`Payment Terms cargados para usuario ${user.id}:`, response.data.length);
      setPaymentTerms(response.data);
    } catch (err) {
      setError('Error al cargar términos de pago');
      console.error('Error fetching payment terms:', err);
    } finally {
      setLoading(false);
    }
  }, [user.id]); // CORREGIDO: incluir user.id como dependencia

  // CORREGIDO: incluir fetchPaymentTerms como dependencia
  useEffect(() => {
    if (user) {
      fetchPaymentTerms();
    }
  }, [user, fetchPaymentTerms]); // CORREGIDO: incluir fetchPaymentTerms

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log('PaymentTerms input change:', { name, value });
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log(`Enviando datos del término de pago para usuario ${user.id}:`, formData);
      
      if (editingTerm) {
        await paymentTermsService.update(editingTerm.Code, formData);
        setPaymentTerms(paymentTerms.map(pt => 
          pt.Code === editingTerm.Code ? { ...pt, ...formData } : pt
        ));
        console.log(`Payment Term ${editingTerm.Code} actualizado para usuario ${user.id}`);
      } else {
        await paymentTermsService.create(formData);
        await fetchPaymentTerms();
        console.log(`Payment Term ${formData.Code} creado para usuario ${user.id}`);
      }
      
      resetForm();
    } catch (err) {
      setError(`Error al guardar término de pago: ${err.response?.data?.message || err.message}`);
      console.error('Error saving payment term:', err);
    }
  };

  const handleEdit = (term) => {
    console.log('Editing term:', term);
    setEditingTerm(term);
    setFormData({ 
      Code: term.Code || '',
      Description: term.Description || '',
      DueDateCalculation: term['Due Date Calculation'] || term.DueDateCalculation || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (termCode) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este término de pago?')) {
      try {
        await paymentTermsService.delete(termCode);
        setPaymentTerms(paymentTerms.filter(pt => pt.Code !== termCode));
        console.log(`Payment Term ${termCode} eliminado para usuario ${user.id}`);
      } catch (err) {
        setError('Error al eliminar término de pago');
        console.error('Error deleting payment term:', err);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      Code: '',
      Description: '',
      DueDateCalculation: ''
    });
    setEditingTerm(null);
    setShowForm(false);
    setError(null);
  };

  if (loading) return <div className="loading">Cargando términos de pago...</div>;

  return (
    <div className="payment-terms">
      <Header title={`Términos de Pago - ${user?.firstName || 'Usuario'}`} />
      
      <div className="payment-terms-content">
        {error && <div className="error-banner">{error}</div>}
        
        {showForm && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>{editingTerm ? 'Editar Término de Pago' : 'Nuevo Término de Pago'}</h3>
                <button onClick={resetForm} className="close-button">×</button>
              </div>

              <form onSubmit={handleSubmit} className="payment-term-form">
                <div className="form-grid">
                  <Input
                    label="Código"
                    name="Code"
                    value={formData.Code}
                    onChange={handleInputChange}
                    required
                    disabled={editingTerm}
                  />
                  
                  <Input
                    label="Descripción" 
                    name="Description"
                    value={formData.Description}
                    onChange={handleInputChange}
                    required
                  />
                  
                  <Input
                    label="Cálculo Fecha Vencimiento"
                    name="DueDateCalculation"
                    value={formData.DueDateCalculation}
                    onChange={handleInputChange}
                    placeholder="Ej: 30D, CM+30D, etc."
                  />
                </div>

                <div className="form-actions">
                  <Button type="button" variant="secondary" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingTerm ? 'Actualizar' : 'Crear'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="payment-terms-header">
          <div className="payment-terms-actions">
            <Button onClick={() => setShowForm(true)}>
              Nuevo Término de Pago
            </Button>
          </div>
        </div>

        <div className="payment-terms-table">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Descripción</th>
                <th>Cálculo Vencimiento</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paymentTerms.map((term) => (
                <tr key={term.Code}>
                  <td>{term.Code}</td>
                  <td>{term.Description}</td>
                  <td>{term['Due Date Calculation'] || term.DueDateCalculation || '-'}</td>
                  <td>
                    <div className="table-actions">
                      <Button 
                        size="small" 
                        variant="secondary"
                        onClick={() => handleEdit(term)}
                      >
                        Editar
                      </Button>
                      <Button 
                        size="small" 
                        variant="danger"
                        onClick={() => handleDelete(term.Code)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {paymentTerms.length === 0 && (
            <div className="empty-state">
              <p>No tienes términos de pago registrados</p>
              <Button onClick={() => setShowForm(true)}>+ Agregar primer término de pago</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentTerms;
