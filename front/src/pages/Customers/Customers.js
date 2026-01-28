import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext'; // Agregar useAuth
import Header from '../../components/Layout/Header';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import { customerService } from '../../services/dataService';
import './Customers.css';

const Customers = () => {
  const { user } = useAuth(); // Obtener usuario autenticado
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    No_: '',
    Name: '',
    SearchName: '',
    Name2: '',
    Address: '',
    Address2: '',
    City: '',
    PostCode: '',
    CountryRegionCode: 'CO',
    PhoneNo: '',
    Email: '',
    Contact: '',
    VATRegistrationNo: '',
    VATRegistrationType: 'NIT',
    CustomerPostingGroup: 'NACIONAL',
    PaymentTermsCode: 'CONTADO',
    CurrencyCode: 'COP',
    CreditLimitLCY: 0,
    BalanceLCY: 0,
    Blocked: 'No',
    CreatedAt: new Date().toISOString()
  });

  useEffect(() => {
    if (user) {
      fetchCustomers();
    }
  }, [user]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await customerService.getAll();
      console.log(`Clientes cargados para usuario ${user.id}:`, response.data.length);
      setCustomers(response.data);
    } catch (err) {
      setError('Error al cargar clientes');
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await customerService.update(editingCustomer['No_'], formData);
        setCustomers(customers.map(c => 
          c['No_'] === editingCustomer['No_'] ? { ...c, ...formData } : c
        ));
        console.log(`Cliente ${editingCustomer['No_']} actualizado para usuario ${user.id}`);
      } else {
        await customerService.create(formData);
        await fetchCustomers(); // Recargar la lista
        console.log(`Cliente ${formData.No_} creado para usuario ${user.id}`);
      }
      
      resetForm();
    } catch (err) {
      setError(`Error al guardar cliente: ${err.response?.data?.message || err.message}`);
      console.error('Error saving customer:', err);
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({ ...customer });
    setShowForm(true);
  };

  const handleDelete = async (customerId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
      try {
        await customerService.delete(customerId);
        setCustomers(customers.filter(c => c['No_'] !== customerId));
        console.log(`Cliente ${customerId} eliminado para usuario ${user.id}`);
      } catch (err) {
        setError(`Error al eliminar cliente: ${err.response?.data?.message || err.message}`);
        console.error('Error deleting customer:', err);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      No_: '',
      Name: '',
      SearchName: '',
      Name2: '',
      Address: '',
      Address2: '',
      City: '',
      PostCode: '',
      CountryRegionCode: 'CO',
      PhoneNo: '',
      Email: '',
      Contact: '',
      VATRegistrationNo: '',
      VATRegistrationType: 'NIT',
      CustomerPostingGroup: 'NACIONAL',
      PaymentTermsCode: 'CONTADO',
      CurrencyCode: 'COP',
      CreditLimitLCY: 0,
      BalanceLCY: 0,
      Blocked: 'No',
      CreatedAt: new Date().toISOString()
    });
    setEditingCustomer(null);
    setShowForm(false);
    setError(null);
  };

  if (loading) return <div className="loading">Cargando clientes...</div>;

  return (
    <div className="customers">
      <Header title={`Gestión de Clientes - ${user?.firstName || 'Usuario'}`} />
      
      {/* ✅ MOVER botón fuera del Header */}
      <div className="page-actions">
        <Button onClick={() => setShowForm(true)}>+ Nuevo Cliente</Button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
              <button onClick={resetForm} className="close-button">×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="customer-form">
              <div className="form-grid">
                <Input
                  label="Código"
                  name="No_"
                  value={formData.No_}
                  onChange={handleInputChange}
                  required
                  disabled={editingCustomer}
                />
                
                <Input
                  label="Nombre"
                  name="Name"
                  value={formData.Name}
                  onChange={handleInputChange}
                  required
                />
                
                <Input
                  label="Nombre de Búsqueda"
                  name="SearchName"
                  value={formData.SearchName}
                  onChange={handleInputChange}
                />
                
                <Input
                  label="Nombre 2"
                  name="Name2"
                  value={formData.Name2}
                  onChange={handleInputChange}
                />
                
                <Input
                  label="Dirección"
                  name="Address"
                  value={formData.Address}
                  onChange={handleInputChange}
                />
                
                <Input
                  label="Dirección 2"
                  name="Address2"
                  value={formData.Address2}
                  onChange={handleInputChange}
                />
                
                <Input
                  label="Ciudad"
                  name="City"
                  value={formData.City}
                  onChange={handleInputChange}
                />
                
                <Input
                  label="Código Postal"
                  name="PostCode"
                  value={formData.PostCode}
                  onChange={handleInputChange}
                />
                
                <Input
                  label="Teléfono"
                  name="PhoneNo"
                  value={formData.PhoneNo}
                  onChange={handleInputChange}
                />
                
                <Input
                  label="Email"
                  name="Email"
                  type="email"
                  value={formData.Email}
                  onChange={handleInputChange}
                />
                
                <Input
                  label="Contacto"
                  name="Contact"
                  value={formData.Contact}
                  onChange={handleInputChange}
                />
                
                <Input
                  label="NIT/RUT"
                  name="VATRegistrationNo"
                  value={formData.VATRegistrationNo}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-actions">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingCustomer ? 'Actualizar' : 'Crear'} Cliente
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="customers-table-container">
        <table className="customers-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Ciudad</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer['No_']}>
                <td className="customer-code">{customer['No_']}</td>
                <td>
                  <div className="customer-info">
                    <div className="customer-name">{customer.Name}</div>
                    {customer.Contact && (
                      <div className="customer-contact">Contacto: {customer.Contact}</div>
                    )}
                  </div>
                </td>
                <td>{customer.City || '-'}</td>
                <td>{customer['Phone No_'] || '-'}</td>
                <td>{customer['E-Mail'] || '-'}</td>
                <td>
                  <span className={`status ${customer.Blocked === 'No' ? 'active' : 'blocked'}`}>
                    {customer.Blocked === 'No' ? 'Activo' : 'Bloqueado'}
                  </span>
                </td>
                <td>
                  <div className="actions">
                    <Button 
                      variant="outline" 
                      size="small"
                      onClick={() => handleEdit(customer)}
                    >
                      Editar
                    </Button>
                    <Button 
                      variant="error" 
                      size="small"
                      onClick={() => handleDelete(customer['No_'])}
                    >
                      Eliminar
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {customers.length === 0 && (
          <div className="empty-state">
            <p>No tienes clientes registrados</p>
            <Button onClick={() => setShowForm(true)}>+ Agregar primer cliente</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Customers;
